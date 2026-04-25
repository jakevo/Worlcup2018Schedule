// Web Push (RFC 8030 + RFC 8291 aes128gcm) for Cloudflare Workers.
// Pure Web Crypto, no Node deps. Encrypts payload, signs VAPID JWT,
// POSTs to the subscription endpoint.

// ---------- base64url helpers ----------

const enc = new TextEncoder();
const dec = new TextDecoder();

function base64urlEncode(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

// ---------- byte helpers ----------

function concat(...arrays) {
    let total = 0;
    for (const a of arrays) total += a.length;
    const out = new Uint8Array(total);
    let off = 0;
    for (const a of arrays) { out.set(a, off); off += a.length; }
    return out;
}

function uint32BE(n) {
    const b = new Uint8Array(4);
    b[0] = (n >>> 24) & 0xff;
    b[1] = (n >>> 16) & 0xff;
    b[2] = (n >>> 8) & 0xff;
    b[3] = n & 0xff;
    return b;
}

// ---------- HKDF (RFC 5869) ----------

async function hmacKey(keyBytes) {
    return crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
}

async function hkdfExtract(salt, ikm) {
    const k = await hmacKey(salt);
    const sig = await crypto.subtle.sign('HMAC', k, ikm);
    return new Uint8Array(sig);
}

async function hkdfExpand(prk, info, length) {
    const out = new Uint8Array(length);
    let prev = new Uint8Array(0);
    let written = 0;
    let counter = 1;
    const k = await hmacKey(prk);
    while (written < length) {
        const input = concat(prev, info, new Uint8Array([counter]));
        const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, input));
        const take = Math.min(sig.length, length - written);
        out.set(sig.subarray(0, take), written);
        written += take;
        prev = sig;
        counter++;
    }
    return out;
}

// ---------- VAPID ----------

// privateKeyB64 / publicKeyB64 are URL-safe base64 from
// `web-push generate-vapid-keys`. publicKey is 65 bytes (0x04 || x || y).
async function importVapidSigningKey(privateKeyB64, publicKeyB64) {
    const dBytes = base64urlDecode(privateKeyB64);
    const pubBytes = base64urlDecode(publicKeyB64);
    if (pubBytes.length !== 65 || pubBytes[0] !== 0x04) {
        throw new Error('VAPID public key must be 65-byte uncompressed P-256');
    }
    const x = pubBytes.subarray(1, 33);
    const y = pubBytes.subarray(33, 65);
    const jwk = {
        kty: 'EC',
        crv: 'P-256',
        d: base64urlEncode(dBytes),
        x: base64urlEncode(x),
        y: base64urlEncode(y),
        ext: true
    };
    return crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );
}

async function buildVapidAuth(endpoint, subject, publicKeyB64, privateKeyB64) {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const header = { typ: 'JWT', alg: 'ES256' };
    const claims = {
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject
    };
    const signingInput = `${base64urlEncode(enc.encode(JSON.stringify(header)))}.${base64urlEncode(enc.encode(JSON.stringify(claims)))}`;
    const key = await importVapidSigningKey(privateKeyB64, publicKeyB64);
    const sig = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        enc.encode(signingInput)
    );
    const jwt = `${signingInput}.${base64urlEncode(sig)}`;
    return `vapid t=${jwt}, k=${publicKeyB64}`;
}

// ---------- ECE aes128gcm encryption (RFC 8291) ----------

async function importClientP256dh(p256dhB64) {
    const raw = base64urlDecode(p256dhB64);
    if (raw.length !== 65 || raw[0] !== 0x04) {
        throw new Error('p256dh must be 65-byte uncompressed P-256');
    }
    return crypto.subtle.importKey(
        'raw',
        raw,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );
}

async function generateEphemeralEcdh() {
    return crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
    );
}

async function exportRawPoint(publicKey) {
    return new Uint8Array(await crypto.subtle.exportKey('raw', publicKey));
}

async function encryptPayload(payloadString, p256dhB64, authB64) {
    const payload = enc.encode(payloadString);
    const clientPubKey = await importClientP256dh(p256dhB64);
    const authSecret = base64urlDecode(authB64);

    const ephemeral = await generateEphemeralEcdh();
    const ephemeralPubBytes = await exportRawPoint(ephemeral.publicKey);

    const sharedSecretBits = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: clientPubKey },
        ephemeral.privateKey,
        256
    );
    const sharedSecret = new Uint8Array(sharedSecretBits);

    // PRK_key = HMAC-SHA256(auth_secret, ECDH_secret)
    // info = "WebPush: info\0" || ua_public || as_public
    // IKM = HKDF-Expand(PRK_key, info, 32)
    const clientPubBytes = base64urlDecode(p256dhB64);
    const prkKey = await hkdfExtract(authSecret, sharedSecret);
    const keyInfo = concat(
        enc.encode('WebPush: info\0'),
        clientPubBytes,
        ephemeralPubBytes
    );
    const ikm = await hkdfExpand(prkKey, keyInfo, 32);

    // Derive CEK + nonce
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const prk = await hkdfExtract(salt, ikm);
    const cek = await hkdfExpand(prk, enc.encode('Content-Encoding: aes128gcm\0'), 16);
    const nonce = await hkdfExpand(prk, enc.encode('Content-Encoding: nonce\0'), 12);

    // Pad: payload || 0x02 (last record) — no extra padding for simplicity
    const padded = concat(payload, new Uint8Array([0x02]));

    const cekKey = await crypto.subtle.importKey(
        'raw',
        cek,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce, tagLength: 128 },
        cekKey,
        padded
    ));

    // Header: salt(16) || rs(4 BE) || idlen(1) || keyid (65)
    const recordSize = ciphertext.length + 86;
    const header = concat(
        salt,
        uint32BE(recordSize),
        new Uint8Array([ephemeralPubBytes.length]),
        ephemeralPubBytes
    );

    return concat(header, ciphertext);
}

// ---------- public API ----------

export async function sendPush({
    subscription,
    payload,
    vapidPublicKey,
    vapidPrivateKey,
    vapidSubject,
    ttlSeconds = 86400,
    urgency = 'normal'
}) {
    if (!subscription || !subscription.endpoint || !subscription.keys) {
        throw new Error('invalid subscription');
    }

    const body = await encryptPayload(
        typeof payload === 'string' ? payload : JSON.stringify(payload),
        subscription.keys.p256dh,
        subscription.keys.auth
    );

    const auth = await buildVapidAuth(
        subscription.endpoint,
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
    );

    const res = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': auth,
            'Content-Encoding': 'aes128gcm',
            'Content-Type': 'application/octet-stream',
            'TTL': String(ttlSeconds),
            'Urgency': urgency
        },
        body
    });

    return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        endpoint: subscription.endpoint
    };
}
