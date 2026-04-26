import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { decorateRounds, feedersFor, cascadeClear, pathFor } from '../utils/bracket-predict';
import { buildBracket } from '../utils/bracket';
import { applyGroupPicksToGroups } from '../utils/predict-input';

const PICKS_KEY = 'wc2026.bracket.picks.v1';

function loadPicks() {
    try {
        const raw = localStorage.getItem(PICKS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
}

// Random per-group ordering: top-of-list = 1st place, etc. Saved to
// the same wc-predict-groups key so a simulation persists across
// page reloads (and would survive a future "let user manually edit"
// path landing on the same store).
function generateRandomPicks(groups) {
    const out = {};
    for (const g of (groups || [])) {
        const codes = (g.teams || []).map(t => t.fifaCode);
        for (let i = codes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = codes[i]; codes[i] = codes[j]; codes[j] = tmp;
        }
        out[g.letter] = codes;
    }
    return out;
}

export default Controller.extend({
    activeRoundIndex: 0,
    hoveredTeamCode: null,
    expandedMatchId: null,

    predictMode: false,
    picks: null,
    simulatedPicks: null,
    focusedEmptyId: null,

    init() {
        this._super(...arguments);
        this.set('picks', loadPicks());
        // Intentionally NOT loading any saved simulation — toggling
        // predict mode shouldn't auto-fill the bracket. The user has
        // to explicitly click "Generate simulated standings". Keeps
        // the predict-mode entry honest about what's real vs imagined.
        this.set('simulatedPicks', {});
        // Global key + click handlers to dismiss focused empty slot.
        // Controllers in Ember Classic are singletons but the handlers
        // no-op when focusedEmptyId is null, so leaving them attached
        // for the app's lifetime is harmless.
        if (typeof window !== 'undefined') {
            this._keyHandler = (e) => {
                if (e.key === 'Escape' && this.get('focusedEmptyId')) {
                    this.set('focusedEmptyId', null);
                }
            };
            this._docClickHandler = (e) => {
                const t = e.target;
                if (!t || !t.closest) return;
                if (t.closest('[data-match-id]') || t.closest('.predict-banner')) return;
                // Tap outside any card clears both the focused empty slot
                // and the sticky team highlight (the only way mobile users
                // can dismiss the click-driven highlight).
                if (this.get('focusedEmptyId')) this.set('focusedEmptyId', null);
                if (this.get('hoveredTeamCode')) this.set('hoveredTeamCode', null);
            };
            window.addEventListener('keydown', this._keyHandler);
            document.addEventListener('click', this._docClickHandler);
        }
    },

    willDestroy() {
        if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
        if (this._docClickHandler) document.removeEventListener('click', this._docClickHandler);
        this._super(...arguments);
    },

    _persistPicks() {
        try {
            localStorage.setItem(PICKS_KEY, JSON.stringify(this.get('picks') || {}));
        } catch (e) { /* ignore */ }
    },

    // True once every group's three round-robin matches are in. Until
    // then the bracket can't show real matchups (the standings sort
    // ties everything alphabetically pre-tournament), so predict mode
    // surfaces a "simulate standings" banner instead.
    hasRealStandings: computed('model.groups.[]', function () {
        const groups = this.get('model.groups') || [];
        if (groups.length < 12) return false;
        return groups.every(g => (g.teams || []).every(t => t.mp >= 3));
    }),

    hasSimulation: computed('simulatedPicks', function () {
        const sim = this.get('simulatedPicks') || {};
        return Object.keys(sim).length > 0;
    }),

    // Show the "Generate simulated standings" banner only when the
    // user has opted into predict mode AND we'd otherwise have nothing
    // to predict on (no real standings, no simulation yet).
    showSimulateBanner: computed('predictMode', 'hasRealStandings', 'hasSimulation', function () {
        return this.get('predictMode') && !this.get('hasRealStandings') && !this.get('hasSimulation');
    }),

    showSimulationActive: computed('predictMode', 'hasRealStandings', 'hasSimulation', function () {
        return this.get('predictMode') && !this.get('hasRealStandings') && this.get('hasSimulation');
    }),

    // Decorated rounds — downstream slots filled in from picks, every
    // match has a `winner` field. Real groups → real bracket; no real
    // groups but a simulation is set → bracket rebuilt from simulated
    // standings (with forceResolved so the seed labels actually map
    // to teams); otherwise → original placeholder bracket from route.
    rounds: computed('model.rounds', 'model.groups.[]', 'model.matches.[]', 'picks', 'simulatedPicks', 'hasRealStandings', 'hasSimulation', function () {
        const picks = this.get('picks') || {};
        if (this.get('hasRealStandings') || !this.get('hasSimulation')) {
            return decorateRounds(this.get('model.rounds') || [], picks);
        }
        const simGroups = applyGroupPicksToGroups(
            this.get('model.groups') || [],
            this.get('simulatedPicks') || {}
        );
        const simRounds = buildBracket(
            simGroups,
            this.get('model.matches') || [],
            { forceResolved: true }
        );
        return decorateRounds(simRounds, picks);
    }),

    hasPicks: computed('picks', function () {
        const p = this.get('picks') || {};
        return Object.keys(p).length > 0;
    }),

    // Hover-path highlight — the hovered team's forward path through the
    // bracket. Set by hover (transient on desktop) or click (sticky).
    highlightedMatchIds: computed('hoveredTeamCode', 'rounds', function () {
        return pathFor(this.get('rounds') || [], this.get('hoveredTeamCode'));
    }),

    // Direct feeders only — drives mc--pickable on the two source matches
    // of a focused empty slot.
    focusedFeeders: computed('focusedEmptyId', 'rounds', function () {
        const id = this.get('focusedEmptyId');
        if (!id) return new Set();
        return new Set(feedersFor(this.get('rounds') || [], id));
    }),

    finalMatch: computed('rounds', function () {
        const rs = this.get('rounds') || [];
        return rs[4] && rs[4].matches && rs[4].matches[0];
    }),

    champion: computed('finalMatch', function () {
        const f = this.get('finalMatch');
        if (!f || !f.winner) return null;
        return f.winner === 'TOP' ? f.top.team : f.bot.team;
    }),

    // Column slices for the desktop tree
    leftR32: computed('rounds', function () {
        const r = (this.get('rounds') || [])[0];
        return r ? r.matches.slice(0, 8) : [];
    }),
    rightR32: computed('rounds', function () {
        const r = (this.get('rounds') || [])[0];
        return r ? r.matches.slice(8, 16) : [];
    }),
    leftR16: computed('rounds', function () {
        const r = (this.get('rounds') || [])[1];
        return r ? r.matches.slice(0, 4) : [];
    }),
    rightR16: computed('rounds', function () {
        const r = (this.get('rounds') || [])[1];
        return r ? r.matches.slice(4, 8) : [];
    }),
    leftQF: computed('rounds', function () {
        const r = (this.get('rounds') || [])[2];
        return r ? r.matches.slice(0, 2) : [];
    }),
    rightQF: computed('rounds', function () {
        const r = (this.get('rounds') || [])[2];
        return r ? r.matches.slice(2, 4) : [];
    }),
    leftSF: computed('rounds', function () {
        const r = (this.get('rounds') || [])[3];
        return r && r.matches[0] ? [r.matches[0]] : [];
    }),
    rightSF: computed('rounds', function () {
        const r = (this.get('rounds') || [])[3];
        return r && r.matches[1] ? [r.matches[1]] : [];
    }),

    actions: {
        hoverTeam(code) {
            this.set('hoveredTeamCode', code || null);
        },

        onPick(matchId, side) {
            if (!this.get('predictMode')) return;
            const rounds = this.get('rounds') || [];
            const picks = this.get('picks') || {};
            let next = Object.assign({}, picks);
            if (next[matchId] === side) {
                // Toggle off
                next = cascadeClear(rounds, next, matchId);
            } else {
                // If switching the pick, downstream needs to clear first
                // because the team that flowed forward changes.
                if (next[matchId]) next = cascadeClear(rounds, next, matchId);
                next[matchId] = side;
            }
            this.set('picks', next);
            this.set('focusedEmptyId', null);
            this._persistPicks();
        },

        onFocusEmpty(matchId) {
            const cur = this.get('focusedEmptyId');
            this.set('focusedEmptyId', cur === matchId ? null : matchId);
        },

        togglePredict() {
            const next = !this.get('predictMode');
            this.set('predictMode', next);
            this.set('focusedEmptyId', null);
        },

        resetPicks() {
            this.set('picks', {});
            this._persistPicks();
        },

        // Generate plausible standings for every group from the actual
        // 4 teams in each group. The seed labels then map to real
        // teams ("1E" picks Group E's randomized 1st-place finisher,
        // "3 A/B/C/D/F" → 3rd-place team from group A per simSeed).
        // Reset existing KO picks since the bracket changed underneath.
        // The simulation lives in memory only; reload starts fresh.
        simulateStandings() {
            const sim = generateRandomPicks(this.get('model.groups') || []);
            this.set('simulatedPicks', sim);
            this.set('picks', {});
            this.set('focusedEmptyId', null);
            this._persistPicks();
        },

        clearSimulation() {
            this.set('simulatedPicks', {});
            this.set('picks', {});
            this.set('focusedEmptyId', null);
            this._persistPicks();
        },

        toggleTheme() {
            const root = document.documentElement;
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('wc-theme', next); } catch (e) { /* ignore */ }
        }
    }
});
