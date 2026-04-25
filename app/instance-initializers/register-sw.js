// Register the service worker once the app boots so the browser can hand
// push events to it. Skipped in tests, in non-secure contexts, and where
// the API isn't supported (older Safari, server-side rendering).

export function initialize() {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (window.location && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') return;

    const register = () => {
        navigator.serviceWorker
            .register('/service-worker.js', { scope: '/' })
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.warn('[wc2026] service worker registration failed:', err);
            });
    };

    if (document.readyState === 'complete') {
        register();
    } else {
        window.addEventListener('load', register, { once: true });
    }
}

export default {
    name: 'register-sw',
    initialize
};
