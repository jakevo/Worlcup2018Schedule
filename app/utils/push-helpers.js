// Helpers for the per-match push subscribe flow.

const STORAGE_KEY = 'wc-alerts:matchIds';

export function isIOS() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalonePWA() {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    return window.navigator && window.navigator.standalone === true;
}

export function pushSupported() {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
}

// iOS only allows web push for installed PWAs (16.4+). Outside a PWA on
// iOS, we route the user to the install instructions instead of failing
// silently in front of them.
export function needsIOSInstall() {
    return isIOS() && !isStandalonePWA();
}

export function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
}

export function readSubscribedSet() {
    if (typeof localStorage === 'undefined') return new Set();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { return new Set(); }
}

export function writeSubscribedSet(set) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch (e) { /* ignore */ }
}
