import Service from '@ember/service';

// Fetches /config once on init and exposes flags as observable
// properties. Components inject this service instead of each one
// fetching /config independently.

export default Service.extend({
    signupOpen: false,
    loaded: false,

    init() {
        this._super(...arguments);
        if (typeof fetch === 'undefined') return;
        fetch('/config')
            .then(r => r.ok ? r.json() : {})
            .catch(() => ({}))
            .then(cfg => {
                if (this.isDestroyed || this.isDestroying) return;
                this.set('signupOpen', !!(cfg && cfg.signupOpen));
                this.set('loaded', true);
            });
    }
});
