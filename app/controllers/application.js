import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { observer, computed } from '@ember/object';

export default Controller.extend({
    router: service('router'),
    locale: service('locale'),
    isMoreOpen: false,
    showToTop: false,
    headlines: null,

    init() {
        this._super(...arguments);
        this.get('router.currentRouteName');
        // Read locale.current once to activate the _onLocaleChange observer
        // (Ember 3.1 classic observers stay dormant until their dep is read).
        this.get('locale.current');
        this._loadHeadlines();
        this._onScroll = () => {
            this.set('showToTop', (window.pageYOffset || document.documentElement.scrollTop) > 480);
        };
        window.addEventListener('scroll', this._onScroll, { passive: true });
    },

    _loadHeadlines() {
        if (typeof fetch === 'undefined') return;
        const lang = this.get('locale.current') || 'en';
        fetch(`/headlines?locale=${encodeURIComponent(lang)}`)
            .then(r => r.ok ? r.json() : { items: [] })
            .catch(() => ({ items: [] }))
            .then(data => {
                if (this.isDestroyed || this.isDestroying) return;
                const items = (data && Array.isArray(data.items)) ? data.items : [];
                this.set('headlines', items);
            });
    },

    _onLocaleChange: observer('locale.current', function () {
        this._loadHeadlines();
    }),

    willDestroy() {
        if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
        this._super(...arguments);
    },

    isHome: computed('router.currentRouteName', function () {
        return this.get('router.currentRouteName') === 'index';
    }),

    _closeOnRouteChange: observer('router.currentRouteName', function () {
        if (this.get('isMoreOpen')) this.set('isMoreOpen', false);
    }),

    actions: {
        toggleTheme() {
            const root = document.documentElement;
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('wc-theme', next); } catch (e) { /* ignore */ }
        },
        toggleMore() {
            this.set('isMoreOpen', !this.get('isMoreOpen'));
        },
        closeMore() {
            this.set('isMoreOpen', false);
        },
        scrollToTop() {
            try {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e) {
                window.scrollTo(0, 0);
            }
        }
    }
});
