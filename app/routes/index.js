import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';
import { computeContenders } from '../utils/contenders';

export default Route.extend({
    model() {
        return loadTournament().then(data => Object.assign({}, data, {
            contenders: computeContenders(data.groups, 8)
        }));
    }
});
