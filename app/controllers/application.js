import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { observer, computed } from '@ember/object';

export default Controller.extend({
    router: service('router'),
    isMoreOpen: false,
    showToTop: false,

    init() {
        this._super(...arguments);
        this.get('router.currentRouteName');
        this._onScroll = () => {
            this.set('showToTop', (window.pageYOffset || document.documentElement.scrollTop) > 480);
        };
        window.addEventListener('scroll', this._onScroll, { passive: true });
    },

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
