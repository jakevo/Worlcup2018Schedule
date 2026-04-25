import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
    tagName: 'article',
    classNames: ['wc-bp-tree-match'],
    classNameBindings: [
        'isOnPath:is-on-path',
        'isFaded:is-faded',
        'isExpanded:is-expanded',
        'hasFixture:has-fixture',
        'hasTeams:has-teams:is-pill'
    ],
    attributeBindings: ['matchId:data-match-id'],

    match: null,
    highlightedMatchIds: null,
    expandedMatchId: null,
    onHoverTeam: null,
    onToggle: null,

    matchId: computed('match.id', function () { return this.get('match.id'); }),

    hasFixture: computed('match.fixture', function () { return !!this.get('match.fixture'); }),

    hasTeams: computed('match.top.winnerOf', function () {
        return !this.get('match.top.winnerOf');
    }),

    topSeed: computed('match.top.label', function () {
        const l = this.get('match.top.label') || '';
        return l.indexOf('/') >= 0 ? '3rd' : l;
    }),
    botSeed: computed('match.bot.label', function () {
        const l = this.get('match.bot.label') || '';
        return l.indexOf('/') >= 0 ? '3rd' : l;
    }),

    isExpanded: computed('match.id', 'expandedMatchId', function () {
        return this.get('match.id') === this.get('expandedMatchId');
    }),

    isOnPath: computed('match.id', 'highlightedMatchIds', function () {
        const map = this.get('highlightedMatchIds');
        return !!(map && map[this.get('match.id')]);
    }),

    isFaded: computed('match.id', 'highlightedMatchIds', function () {
        const map = this.get('highlightedMatchIds');
        if (!map) return false;
        return !map[this.get('match.id')];
    }),

    click() {
        if (!this.get('hasTeams')) return;
        const fn = this.get('onToggle');
        if (fn) fn(this.get('match.id'));
    },

    actions: {
        hoverTopTeam(code) {
            const fn = this.get('onHoverTeam');
            if (fn) fn(code || null);
        }
    }
});
