import Route from '@ember/routing/route';
import { loadTournament, invalidateTournamentCache } from '../utils/tournament-data';

export default Route.extend({
    model() {
        return loadTournament();
    },
    actions: {
        refresh() {
            invalidateTournamentCache();
            this.refresh();
        }
    }
});
