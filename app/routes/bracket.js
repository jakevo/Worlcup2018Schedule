import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';
import { buildBracket } from '../utils/bracket';

export default Route.extend({
    model() {
        return loadTournament().then(data => ({
            rounds: buildBracket(data.groups, data.matches),
            updatedAt: data.updatedAt
        }));
    }
});
