import Component from '@ember/component';
import { computed } from '@ember/object';
import { colorsFor } from '../utils/team-colors';

export default Component.extend({
    tagName: 'div',
    classNames: ['wc-crest'],
    fifaCode: null,
    size: 120,

    colors: computed('fifaCode', function () {
        return colorsFor(this.get('fifaCode'));
    })
});
