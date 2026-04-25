# wc2026-push-sender

Cloudflare Worker that fires the World Cup Hub 2026 match-kickoff
push notifications. Lives outside the main Pages project the same
way `wc2026-proxy` does.

## What it does

Cron `*/5 * * * *` → fetches `worldcuphub2026.com/schedule.json` and
`/data.json` → finds matches with kickoff in 25–35 min from now → for
each, lists `match:<id>:*` keys in the `wc2026-subscriptions` KV
namespace → encrypts a payload with each subscriber's `p256dh` + `auth`
keys → POSTs to the subscription endpoint with a VAPID JWT
authorization header.

Idempotency comes from a `sent:<matchId>` key (12h TTL) in the same
KV. So even if the cron retries, each match's fan-out runs once.

`410 Gone` / `404 Not Found` responses delete the subscription on the
spot — that's how iOS tells us the user uninstalled the PWA.

## One-time setup

1. **Install wrangler** (already installed at the repo root, you can
   reuse it):
   ```
   cd proxy-push-sender
   ../node_modules/.bin/wrangler login   # if not already authed
   ```

2. **Set the secrets**:
   ```
   ../node_modules/.bin/wrangler secret put VAPID_PRIVATE_KEY
   # paste: xLB5UC-RktB0mULAJYNIL3v4u2J82ZzqHNTnmS4szs8

   ../node_modules/.bin/wrangler secret put TRIGGER_KEY
   # paste any random string, e.g. `openssl rand -hex 16`
   ```

3. **Set the plaintext vars** (also via secrets so they're encrypted at
   rest, but they aren't sensitive):
   ```
   ../node_modules/.bin/wrangler secret put VAPID_PUBLIC_KEY
   # paste: BPQYY01mVq_osgpZDKRujvUmOJgk1wQeg7lcWsReUdHqZA43Tj33v0fve-U48Blr-Q6p4Xnj-TOzTLxoPL6tE60

   ../node_modules/.bin/wrangler secret put VAPID_SUBJECT
   # paste: mailto:javoucsd@gmail.com
   ```

4. **Deploy**:
   ```
   ../node_modules/.bin/wrangler deploy
   ```
   The KV binding is already declared in `wrangler.toml` (`SUBSCRIPTIONS`
   → namespace id `047474c6806f47b08f51b808c3532ee9`). Cron triggers
   are also declared there — they're attached automatically on deploy.

## Test the cron logic without waiting 5 min

```
curl -H "x-trigger-key: <your TRIGGER_KEY>" \
     https://wc2026-push-sender.<your-subdomain>.workers.dev/run
```

Returns JSON with the match list and per-match send/fail counts.

## Tail logs

```
../node_modules/.bin/wrangler tail
```

## Rotating VAPID keys

If the private key is ever leaked:

1. `npx web-push generate-vapid-keys` for a new pair.
2. Update `vapidPublicKey` in `config/environment.js` of the main repo,
   redeploy Pages.
3. `wrangler secret put VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` here,
   redeploy this Worker.
4. **Existing subscriptions become invalid** — clients will re-subscribe
   on next bell-tap. There's no way to push to them with the old key.
   The cron will collect 410s and clean them up automatically over the
   next few ticks.

## Code map

- `src/index.js` — entry. Cron handler + `/run` debug endpoint.
- `src/webpush.js` — VAPID JWT signing + RFC 8291 aes128gcm payload
  encryption, all pure Web Crypto. No Node deps.
- `wrangler.toml` — Worker name, cron, KV binding.
- `package.json` — convenience scripts (`deploy`, `tail`, `dev`).
