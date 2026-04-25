import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import config from '../config/environment';
import {
    pushSupported,
    needsIOSInstall,
    urlBase64ToUint8Array,
    readSubscribedSet,
    writeSubscribedSet
} from '../utils/push-helpers';

export default Component.extend({
    router: service('router'),
    locale: service('locale'),
    siteConfig: service('site-config'),

    tagName: 'span',
    classNames: ['wc-match-alert'],
    classNameBindings: ['isOn:is-on', 'busy:is-busy'],
    match: null,
    isOn: false,
    busy: false,
    statusKey: null, // i18n key for transient feedback

    matchId: computed('match.id', function () {
        return String(this.get('match.id') || '');
    }),

    didInsertElement() {
        this._super(...arguments);
        const set = readSubscribedSet();
        this.set('isOn', set.has(this.get('matchId')));
    },

    actions: {
        async toggle() {
            if (this.get('busy')) return;

            const matchId = this.get('matchId');
            if (!matchId) return;

            // iOS Chrome / non-PWA iOS / unsupported browser → punt to
            // the instructions page so users land somewhere helpful
            // instead of a silent permission denial.
            if (!pushSupported() || needsIOSInstall()) {
                this.get('router').transitionTo('notifications');
                return;
            }

            this.set('busy', true);
            this.set('statusKey', null);

            try {
                if (this.get('isOn')) {
                    await this._unsubscribe(matchId);
                    const set = readSubscribedSet();
                    set.delete(matchId);
                    writeSubscribedSet(set);
                    this.set('isOn', false);
                } else {
                    const granted = await this._requestPermission();
                    if (!granted) {
                        this.set('statusKey', 'alert.error.denied');
                        return;
                    }
                    await this._subscribe(matchId);
                    const set = readSubscribedSet();
                    set.add(matchId);
                    writeSubscribedSet(set);
                    this.set('isOn', true);
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('[wc2026] match alert toggle failed:', err);
                this.set('statusKey', 'alert.error.network');
            } finally {
                this.set('busy', false);
            }
        }
    },

    async _requestPermission() {
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        const result = await Notification.requestPermission();
        return result === 'granted';
    },

    async _subscribe(matchId) {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
            });
        }
        const res = await fetch('/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId,
                subscription: sub.toJSON(),
                locale: this.get('locale.current') || 'en'
            })
        });
        if (!res.ok) throw new Error(`subscribe HTTP ${res.status}`);
    },

    async _unsubscribe(matchId) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return; // nothing to do server-side either
        const res = await fetch('/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId,
                endpoint: sub.endpoint
            })
        });
        if (!res.ok && res.status !== 404) throw new Error(`unsubscribe HTTP ${res.status}`);
    }
});
