import Component from '@ember/component';
import { computed } from '@ember/object';
import { colorsFor } from '../utils/team-colors';

export default Component.extend({
    tagName: 'div',
    classNames: ['wc-crest'],
    classNameBindings: ['hasLogo:wc-crest--logo'],
    fifaCode: null,
    logoUrl: null,
    size: 120,

    hasLogo: computed('logoUrl', function () {
        return !!this.get('logoUrl');
    }),

    colors: computed('fifaCode', function () {
        return colorsFor(this.get('fifaCode'));
    })
});
