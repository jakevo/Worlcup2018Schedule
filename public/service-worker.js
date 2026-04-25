// World Cup Hub 2026 service worker.
// Job today: keep iOS happy by always showing a visible notification on push,
// route taps to the right match URL, and reload open pages whenever a new SW
// version activates so deploys can't get stuck behind a cached app shell.
// No offline caching — this SW is purely the push transport + freshness gate.

// Bump SW_VERSION on any release that ships JS/template changes which
// might otherwise be served from a cached hashed bundle. Any byte change
// in this file triggers the install→activate cycle on next navigation.
const SW_VERSION = '2026-04-25-17';

// Set during install: true if a previous SW was already active (i.e.
// this is an upgrade), false on the very first install. Drives whether
// activate() reloads existing pages.
let isUpgrade = false;

self.addEventListener('install', () => {
    isUpgrade = !!(self.registration && self.registration.active);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        await self.clients.claim();
        // After a real version bump, reload every open page so it picks up
        // the latest JS bundle. Skip the first install so brand-new visitors
        // don't see a flash-reload on their initial page load.
        if (!isUpgrade) return;
        const windows = await self.clients.matchAll({ type: 'window' });
        for (const c of windows) {
            try { await c.navigate(c.url); } catch (e) { /* ignore */ }
        }
    })());
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: 'World Cup 2026', body: event.data ? event.data.text() : '' };
    }

    const title = data.title || 'World Cup 2026';
    const options = {
        body: data.body || '',
        icon: data.icon || '/apple-touch-icon.svg',
        badge: data.badge || '/favicon.svg',
        tag: data.tag || 'wc2026',
        data: { url: data.url || '/', matchId: data.matchId || null },
        requireInteraction: false
    };

    // iOS revokes the push subscription if a push event lands without a
    // visible notification. Always show one, even if data is sparse.
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        for (const client of allClients) {
            if (client.url && client.url.includes(target) && 'focus' in client) {
                return client.focus();
            }
        }
        if (self.clients.openWindow) {
            return self.clients.openWindow(target);
        }
    })());
});
