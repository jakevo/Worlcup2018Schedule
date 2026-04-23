import Component from '@ember/component';
import { computed } from '@ember/object';
import { positions } from '../utils/formation';
import { colorsFor } from '../utils/team-colors';

export default Component.extend({
    tagName: 'div',
    classNames: ['wc-pitch'],
    classNameBindings: ['orientationClass'],

    formation: '4-3-3',
    players: null,
    teamCode: null,
    orientation: 'landscape',

    orientationClass: computed('orientation', function () {
        return `wc-pitch--${this.get('orientation')}`;
    }),

    markers: computed('formation', 'players.[]', 'orientation', function () {
        return positions(this.get('formation'), this.get('players') || [], this.get('orientation'));
    }),

    colors: computed('teamCode', function () {
        return colorsFor(this.get('teamCode'));
    })
});
