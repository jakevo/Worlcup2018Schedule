import Route from '@ember/routing/route';
import { loadTournament, invalidateTournamentCache, startPolling, stopPolling } from '../utils/tournament-data';

export default Route.extend({
    model() {
        return loadTournament();
    },
    activate() {
        this._super(...arguments);
        startPolling(() => this.refresh());
    },
    deactivate() {
        this._super(...arguments);
        stopPolling();
    },
    actions: {
        refresh() {
            invalidateTournamentCache();
            this.refresh();
        },
        toggleTheme() {
            const root = document.documentElement;
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('wc-theme', next); } catch (e) { /* ignore */ }
        }
    }
});
