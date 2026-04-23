import Controller from '@ember/controller';

export default Controller.extend({
    actions: {
        toggleTheme() {
            const root = document.documentElement;
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('wc-theme', next); } catch (e) { /* ignore */ }
        }
    }
});
