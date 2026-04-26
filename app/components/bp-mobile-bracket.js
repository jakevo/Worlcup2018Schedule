import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import { feedersFor } from '../utils/bracket-predict';

// 9-panel horizontal swipe bracket for mobile (< 980px). Lifted from
// MobileBracket in design_handoff_bracket_redesign/bracket-tree.jsx.
//
// The two README gotchas are honoured:
//   - Centering math: clamp the computed scroll target to [0, max] so
//     the first/last panel can actually be reached.
//   - Active-panel detection: hard-code boundary cases (scrollLeft <= 1
//     and scrollLeft >= max - 1) so the first/last panel can become
//     "active" — without these, edge panels never centre.
export default Component.extend({
    rounds: null,
    picks: null,
    champion: null,
    predictMode: false,
    hoveredTeamCode: null,
    highlightedMatchIds: null,
    focusedEmptyId: null,
    focusedFeeders: null,

    onHoverTeam: null,
    onPick: null,
    onFocusEmpty: null,

    activePanel: 0,  // start on the leftmost R32 panel — there's something
                     // to act on immediately, vs. the empty FINAL slot

    init() {
        this._super(...arguments);
        // Activate classic observers.
        this.get('focusedEmptyId');
        this.get('rounds');
    },

    panels: computed('rounds', function () {
        const rs = this.get('rounds') || [];
        const slice = (idx, a, b) => (rs[idx] && rs[idx].matches) ? rs[idx].matches.slice(a, b) : [];
        const at    = (idx, i)    => (rs[idx] && rs[idx].matches[i]) ? [rs[idx].matches[i]] : [];
        return [
            { id: 'l-r32', side: 'left',  round: 'r32',   matches: slice(0, 0, 8) },
            { id: 'l-r16', side: 'left',  round: 'r16',   matches: slice(1, 0, 4) },
            { id: 'l-qf',  side: 'left',  round: 'qf',    matches: slice(2, 0, 2) },
            { id: 'l-sf',  side: 'left',  round: 'sf',    matches: at(3, 0) },
            { id: 'final', side: 'final', round: 'final', matches: at(4, 0) },
            { id: 'r-sf',  side: 'right', round: 'sf',    matches: at(3, 1) },
            { id: 'r-qf',  side: 'right', round: 'qf',    matches: slice(2, 2, 4) },
            { id: 'r-r16', side: 'right', round: 'r16',   matches: slice(1, 4, 8) },
            { id: 'r-r32', side: 'right', round: 'r32',   matches: slice(0, 8, 16) }
        ];
    }),

    panelCount: computed('panels', function () { return this.get('panels').length; }),

    currentPanel: computed('panels', 'activePanel', function () {
        const ps = this.get('panels');
        return ps[this.get('activePanel')] || ps[0];
    }),

    matchToPanel: computed('panels', function () {
        const m = {};
        this.get('panels').forEach((p, i) => p.matches.forEach(mt => { m[mt.id] = i; }));
        return m;
    }),

    atFirst: computed('activePanel', function () { return this.get('activePanel') === 0; }),
    atLast: computed('activePanel', 'panelCount', function () {
        return this.get('activePanel') === this.get('panelCount') - 1;
    }),

    // True when the focused empty slot's direct feeders are visible on
    // the current panel — used to swap the focus hint text.
    feedersOnThisPanel: computed('focusedEmptyId', 'activePanel', 'rounds', 'matchToPanel', function () {
        const id = this.get('focusedEmptyId');
        if (!id) return false;
        const fids = feedersFor(this.get('rounds') || [], id);
        if (!fids.length) return false;
        const m2p = this.get('matchToPanel');
        const cur = this.get('activePanel');
        return fids.some(f => m2p[f] === cur);
    }),

    didInsertElement() {
        this._super(...arguments);
        this._scroller = this.element.querySelector('.mh__scroller');
        if (!this._scroller) return;
        // Land on the leftmost R32 panel without animation
        this._goTo(0, 'instant');
        this._onScroll = () => {
            if (this._raf) cancelAnimationFrame(this._raf);
            this._raf = requestAnimationFrame(() => this._updateActiveFromScroll());
        };
        this._scroller.addEventListener('scroll', this._onScroll, { passive: true });
    },

    willDestroyElement() {
        if (this._scroller && this._onScroll) {
            this._scroller.removeEventListener('scroll', this._onScroll);
        }
        if (this._raf) cancelAnimationFrame(this._raf);
        if (this._focusRaf) cancelAnimationFrame(this._focusRaf);
        this._super(...arguments);
    },

    _updateActiveFromScroll() {
        const sc = this._scroller;
        if (!sc || this.isDestroyed || this.isDestroying) return;
        const max = sc.scrollWidth - sc.clientWidth;
        // Boundary cases — without these, the first/last panel can never
        // become "active" because their centre is offset from viewport
        // centre even at the scroll extremes.
        if (sc.scrollLeft <= 1) { this.set('activePanel', 0); return; }
        if (sc.scrollLeft >= max - 1) {
            this.set('activePanel', this.get('panelCount') - 1);
            return;
        }
        const center = sc.scrollLeft + sc.clientWidth / 2;
        const panels = sc.querySelectorAll('.mh__panel');
        let best = 0, bestDist = Infinity;
        for (let i = 0; i < panels.length; i++) {
            const p = panels[i];
            const c = p.offsetLeft + p.clientWidth / 2;
            const d = Math.abs(c - center);
            if (d < bestDist) { bestDist = d; best = i; }
        }
        this.set('activePanel', best);
    },

    _goTo(idx, behavior) {
        const sc = this._scroller;
        if (!sc) return;
        const panel = sc.querySelectorAll('.mh__panel')[idx];
        if (!panel) return;
        // scrollIntoView with inline:center handles iOS Safari and the
        // scroll-snap interaction more reliably than manual scrollTo
        // math against panel.offsetLeft.
        try {
            panel.scrollIntoView({
                inline: 'center',
                block: 'nearest',
                behavior: behavior === 'instant' ? 'auto' : (behavior || 'smooth')
            });
            return;
        } catch (e) { /* fall through to manual */ }
        const raw = panel.offsetLeft - (sc.clientWidth - panel.clientWidth) / 2;
        const max = sc.scrollWidth - sc.clientWidth;
        const target = Math.max(0, Math.min(max, raw));
        sc.scrollLeft = target;
    },

    // When an empty slot is focused, swipe to the nearest feeder panel
    // on the next animation frame — instant enough that the user sees
    // the feeders right after the tap, but deferred so the focus state
    // commits to the DOM first.
    _focusObserver: observer('focusedEmptyId', function () {
        if (this.isDestroyed || this.isDestroying) return;
        const id = this.get('focusedEmptyId');
        if (id == null) return;
        const fids = feedersFor(this.get('rounds') || [], id);
        if (!fids.length) return;
        const m2p = this.get('matchToPanel');
        const feederPanels = fids.map(f => m2p[f]).filter(p => p != null);
        if (!feederPanels.length) return;
        const cur = this.get('activePanel');
        if (feederPanels.indexOf(cur) >= 0) return;
        const target = feederPanels.reduce(
            (a, b) => Math.abs(b - cur) < Math.abs(a - cur) ? b : a
        );
        if (this._focusRaf) cancelAnimationFrame(this._focusRaf);
        this._focusRaf = requestAnimationFrame(() => this._goTo(target));
    }),

    actions: {
        goTo(idx) { this._goTo(idx); },
        next() {
            this._goTo(Math.min(this.get('panelCount') - 1, this.get('activePanel') + 1));
        },
        prev() {
            this._goTo(Math.max(0, this.get('activePanel') - 1));
        }
    }
});
