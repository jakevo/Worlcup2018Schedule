import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Controller.extend({
    router: service('router'),
    isMoreOpen: false,

    init() {
        this._super(...arguments);
        // Read currentRouteName once so the observer below is activated.
        // Without this, Ember's classic observers can stay dormant until
        // the property is consumed somewhere in a template/computed.
        this.get('router.currentRouteName');
    },

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
        }
    }
});
