import Controller from '@ember/controller';
import { computed } from '@ember/object';

function half(arr, side) {
    if (!arr || !arr.length) return [];
    const mid = Math.ceil(arr.length / 2);
    return side === 'left' ? arr.slice(0, mid) : arr.slice(mid);
}

function pairs(arr) {
    const out = [];
    for (let i = 0; i < (arr || []).length; i += 2) {
        out.push([arr[i], arr[i + 1]].filter(Boolean));
    }
    return out;
}

export default Controller.extend({
    activeRoundIndex: 0,
    hoveredTeamCode: null,
    expandedMatchId: null,

    activeRound: computed('model.rounds', 'activeRoundIndex', function () {
        const rounds = this.get('model.rounds') || [];
        return rounds[this.get('activeRoundIndex')];
    }),

    allMatches: computed('model.rounds', function () {
        const out = [];
        (this.get('model.rounds') || []).forEach(r => {
            (r.matches || []).forEach(m => out.push(m));
        });
        return out;
    }),

    // map of matchId → true for every match on the hovered team's path
    // through the bracket. Empty/null when nothing is hovered.
    highlightedMatchIds: computed('hoveredTeamCode', 'allMatches', function () {
        const code = this.get('hoveredTeamCode');
        if (!code) return null;
        const all = this.get('allMatches');
        let currentId = null;
        for (const m of all) {
            const t1 = m.top && m.top.team;
            const t2 = m.bot && m.bot.team;
            if ((t1 && t1.fifaCode === code) || (t2 && t2.fifaCode === code)) {
                currentId = m.id;
                break;
            }
        }
        if (!currentId) return null;
        const path = { [currentId]: true };
        let safety = 8;
        while (safety-- > 0) {
            let next = null;
            for (const m of all) {
                const tw = m.top && m.top.winnerOf;
                const bw = m.bot && m.bot.winnerOf;
                if (tw === currentId || bw === currentId) { next = m.id; break; }
            }
            if (!next) break;
            path[next] = true;
            currentId = next;
        }
        return path;
    }),

    r32Left: computed('model.rounds', function () {
        return half((this.get('model.rounds') || [])[0] && this.get('model.rounds')[0].matches, 'left');
    }),
    r32Right: computed('model.rounds', function () {
        return half((this.get('model.rounds') || [])[0] && this.get('model.rounds')[0].matches, 'right');
    }),
    r16Left: computed('model.rounds', function () {
        return half((this.get('model.rounds') || [])[1] && this.get('model.rounds')[1].matches, 'left');
    }),
    r16Right: computed('model.rounds', function () {
        return half((this.get('model.rounds') || [])[1] && this.get('model.rounds')[1].matches, 'right');
    }),
    qfLeft: computed('model.rounds', function () {
        return half((this.get('model.rounds') || [])[2] && this.get('model.rounds')[2].matches, 'left');
    }),
    qfRight: computed('model.rounds', function () {
        return half((this.get('model.rounds') || [])[2] && this.get('model.rounds')[2].matches, 'right');
    }),
    sfLeft: computed('model.rounds', function () {
        return half((this.get('model.rounds') || [])[3] && this.get('model.rounds')[3].matches, 'left');
    }),
    sfRight: computed('model.rounds', function () {
        return half((this.get('model.rounds') || [])[3] && this.get('model.rounds')[3].matches, 'right');
    }),
    finalMatch: computed('model.rounds', function () {
        const f = (this.get('model.rounds') || [])[4];
        return f && f.matches && f.matches[0];
    }),

    r32LeftPairs:  computed('r32Left',  function () { return pairs(this.get('r32Left')); }),
    r32RightPairs: computed('r32Right', function () { return pairs(this.get('r32Right')); }),
    r16LeftPairs:  computed('r16Left',  function () { return pairs(this.get('r16Left')); }),
    r16RightPairs: computed('r16Right', function () { return pairs(this.get('r16Right')); }),
    qfLeftPairs:   computed('qfLeft',   function () { return pairs(this.get('qfLeft')); }),
    qfRightPairs:  computed('qfRight',  function () { return pairs(this.get('qfRight')); }),

    actions: {
        selectRound(idx) {
            this.set('activeRoundIndex', idx);
        },
        nextRound() {
            const max = ((this.get('model.rounds') || []).length || 1) - 1;
            this.set('activeRoundIndex', Math.min(this.get('activeRoundIndex') + 1, max));
        },
        prevRound() {
            this.set('activeRoundIndex', Math.max(this.get('activeRoundIndex') - 1, 0));
        },
        hoverTeam(code) {
            this.set('hoveredTeamCode', code || null);
        },
        toggleMatch(id) {
            this.set('expandedMatchId', this.get('expandedMatchId') === id ? null : id);
        }
    }
});
