import Route from '@ember/routing/route';

export default Route.extend({
    model() {
        return fetch('/config')
            .then(r => r.ok ? r.json() : {})
            .catch(() => ({}))
            .then(cfg => ({ signupOpen: !!(cfg && cfg.signupOpen) }));
    }
});
