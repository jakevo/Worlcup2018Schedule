import Component from '@ember/component';
import { computed } from '@ember/object';
import { positions } from '../utils/formation';
import { colorsFor } from '../utils/team-colors';

export default Component.extend({
    tagName: 'div',
    classNames: ['wc-pitch'],

    formation: '4-3-3',
    players: null,
    teamCode: null,

    markers: computed('formation', 'players.[]', function () {
        return positions(this.get('formation'), this.get('players') || []);
    }),

    colors: computed('teamCode', function () {
        return colorsFor(this.get('teamCode'));
    })
});
