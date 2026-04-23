import Route from '@ember/routing/route';
import { scheduleOnce } from '@ember/runloop';
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
        didTransition() {
            scheduleOnce('afterRender', null, () => {
                if (typeof window !== 'undefined') window.scrollTo(0, 0);
            });
            return true;
        }
    }
});
