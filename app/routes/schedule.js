import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';

export default Route.extend({
    model() {
        return loadTournament();
    }
});
