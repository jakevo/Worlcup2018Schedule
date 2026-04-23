import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';

export default Route.extend({
    model() {
        return loadTournament().then(data => {
            const scorers = Array.isArray(data.topScorers) ? data.topScorers : [];
            return { scorers };
        });
    }
});
