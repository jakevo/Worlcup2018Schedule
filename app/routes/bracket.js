import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';
import { buildBracket } from '../utils/bracket';

export default Route.extend({
    model() {
        return loadTournament().then(data => ({
            // Pass groups + matches through so the controller can
            // rebuild the bracket from a simulated standings when
            // the real group stage hasn't been played yet.
            groups: data.groups,
            matches: data.matches,
            rounds: buildBracket(data.groups, data.matches),
            updatedAt: data.updatedAt
        }));
    }
});
