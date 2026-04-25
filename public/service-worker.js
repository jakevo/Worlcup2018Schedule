// World Cup Hub 2026 service worker.
// Job today: keep iOS happy by always showing a visible notification on push,
// and route taps to the right match URL. No offline caching yet — this SW is
// purely the push transport.

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
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
