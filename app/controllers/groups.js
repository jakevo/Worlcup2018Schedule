import Controller from '@ember/controller';
import { getOwner } from '@ember/application';
import { invalidateTournamentCache } from '../utils/tournament-data';

export default Controller.extend({
    actions: {
        refresh() {
            invalidateTournamentCache();
            getOwner(this).lookup('route:application').refresh();
        }
    }
});
