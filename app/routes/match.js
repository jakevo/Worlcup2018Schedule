import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';

export default Route.extend({
    model(params) {
        return loadTournament().then(data => {
            const match = (data.matches || []).find(m => m.id === params.id);
            return {
                id: params.id,
                match,
                notFound: !match
            };
        });
    }
});
