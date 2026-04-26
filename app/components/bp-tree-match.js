import Component from '@ember/component';
import { computed } from '@ember/object';
import { isEmpty } from '../utils/bracket-predict';

// MatchCard equivalent — renders one match in the bracket. State classes
// match the mock: mc--final / mc--big / mc--highlighted / mc--focused /
// mc--pickable / mc--dimmed / mc--decided / mc--empty / mc--clickable.
// `is-winner` / `is-loser` go on the row buttons themselves.
export default Component.extend({
    tagName: 'div',
    classNames: ['mc'],
    classNameBindings: [
        'isFinal:mc--final',
        'big:mc--big',
        'isHighlighted:mc--highlighted',
        'isFocused:mc--focused',
        'isPickable:mc--pickable',
        'isDimmed:mc--dimmed',
        'isDecided:mc--decided',
        'isEmptyMatch:mc--empty',
        'topActive:mc--top-checked',
        'predictMode:mc--clickable'
    ],
    attributeBindings: ['matchId:data-match-id'],

    match: null,
    highlightedMatchIds: null,
    hoveredTeamCode: null,
    focusedEmptyId: null,
    focusedFeeders: null,
    predictMode: false,
    isFinal: false,
    big: false,
    onHoverTeam: null,
    onPick: null,
    onFocusEmpty: null,

    matchId: computed('match.id', function () { return this.get('match.id'); }),

    topTeam: computed('match.top.team', function () { return this.get('match.top.team'); }),
    botTeam: computed('match.bot.team', function () { return this.get('match.bot.team'); }),
    topDisabled: computed('topTeam', function () { return !this.get('topTeam'); }),
    botDisabled: computed('botTeam', function () { return !this.get('botTeam'); }),

    topActive: computed('match.winner', function () { return this.get('match.winner') === 'TOP'; }),
    botActive: computed('match.winner', function () { return this.get('match.winner') === 'BOT'; }),
    topLost:   computed('match.winner', function () { return this.get('match.winner') === 'BOT'; }),
    botLost:   computed('match.winner', function () { return this.get('match.winner') === 'TOP'; }),

    isEmptyMatch: computed('match.{top.team,bot.team}', function () {
        return isEmpty(this.get('match'));
    }),

    isDecided: computed('match.winner', function () { return !!this.get('match.winner'); }),

    isHighlighted: computed('match.id', 'highlightedMatchIds', function () {
        const set = this.get('highlightedMatchIds');
        return !!(set && typeof set.has === 'function' && set.has(this.get('match.id')));
    }),

    isDimmed: computed('hoveredTeamCode', 'isHighlighted', function () {
        return !!this.get('hoveredTeamCode') && !this.get('isHighlighted');
    }),

    isFocused: computed('match.id', 'focusedEmptyId', function () {
        return this.get('match.id') === this.get('focusedEmptyId');
    }),

    isPickable: computed('match.id', 'focusedFeeders', 'predictMode', function () {
        if (!this.get('predictMode')) return false;
        const set = this.get('focusedFeeders');
        return !!(set && typeof set.has === 'function' && set.has(this.get('match.id')));
    }),

    // Keep long composite seed labels (e.g. "3C/D/E/F") readable inside
    // the card by collapsing to "3rd" — same trick the old component used.
    topPlaceholder: computed('match.top.{label,winnerOf}', function () {
        const label = this.get('match.top.label') || '';
        if (label) return label.indexOf('/') >= 0 ? '3rd' : label;
        const w = this.get('match.top.winnerOf');
        return w ? 'W ' + w : '';
    }),
    botPlaceholder: computed('match.bot.{label,winnerOf}', function () {
        const label = this.get('match.bot.label') || '';
        if (label) return label.indexOf('/') >= 0 ? '3rd' : label;
        const w = this.get('match.bot.winnerOf');
        return w ? 'W ' + w : '';
    }),

    // Card-level click — only used when both team buttons are disabled
    // (empty match). Row buttons stopPropagation when teams exist.
    click(e) {
        if (!this.get('isEmptyMatch')) return;
        const fn = this.get('onFocusEmpty');
        if (fn) {
            if (e && e.stopPropagation) e.stopPropagation();
            fn(this.get('match.id'));
        }
    },

    actions: {
        // Hover a team row (desktop only — touch devices don't fire it).
        // Empty rows pass code=null and we ignore them so they don't
        // clobber a sticky highlight as the cursor passes through.
        hover(code) {
            if (!code) return;
            const fn = this.get('onHoverTeam');
            if (fn) fn(code);
        },
        clearHover() {
            const fn = this.get('onHoverTeam');
            if (fn) fn(null);
        },
        // Click a team row → pin a sticky highlight (works on mobile,
        // where there is no hover) and pick the team if predict mode is
        // on. The "you can't beat nobody" rule lives in decorateRounds
        // now (validWinner gate), not here — pick always fires; the
        // winner just won't display until both finalists exist.
        pick(side, e) {
            const team = side === 'TOP' ? this.get('topTeam') : this.get('botTeam');
            if (!team) return;
            if (e && e.stopPropagation) e.stopPropagation();
            const hoverFn = this.get('onHoverTeam');
            if (hoverFn) hoverFn(team.fifaCode);
            const fn = this.get('onPick');
            if (fn) fn(this.get('match.id'), side);
        }
    }
});
