import Component from '@ember/component';
import { observer } from '@ember/object';

// SVG layer that draws orthogonal connector lines between match cards.
// Lifted from ConnectorLayer in design_handoff_bracket_redesign/bracket-tree.jsx.
//
// The host <div> uses CSS `display: contents` so it doesn't take up a
// grid cell of the parent .bt__grid; the SVG inside positions absolutely
// over the grid (see .bt__connectors in app.css).
export default Component.extend({
    tagName: 'div',
    classNames: ['bp-connector-host'],

    rounds: null,
    picks: null,

    paths: null,
    boxW: 0,
    boxH: 0,

    init() {
        this._super(...arguments);
        this.set('paths', []);
        // Touch tracked props so the observer below activates (Ember 3.1
        // classic observer activation quirk).
        this.get('rounds');
        this.get('picks');
    },

    didInsertElement() {
        this._super(...arguments);
        // The connector host now sits as a SIBLING of .bt__grid inside
        // .bt__grid-wrap; .closest() won't find the grid (it goes up,
        // not sideways). Find it via the parent wrapper.
        const parent = this.element && this.element.parentElement;
        this._gridEl = parent && parent.querySelector('.bt__grid');
        this._onResize = this._recompute.bind(this);
        window.addEventListener('resize', this._onResize);
        if (typeof ResizeObserver !== 'undefined' && this._gridEl) {
            this._ro = new ResizeObserver(this._onResize);
            this._ro.observe(this._gridEl);
        }
        this._recompute();
        this._t1 = setTimeout(this._onResize, 100);
        this._t2 = setTimeout(this._onResize, 600);
    },

    willDestroyElement() {
        if (this._onResize) window.removeEventListener('resize', this._onResize);
        if (this._ro) this._ro.disconnect();
        clearTimeout(this._t1);
        clearTimeout(this._t2);
        this._super(...arguments);
    },

    // Recompute when rounds (which depend on picks) change. The microtask
    // delay lets card positions update first.
    _recomputeOnChange: observer('rounds', function () {
        if (this.isDestroyed || this.isDestroying) return;
        Promise.resolve().then(() => {
            if (this.isDestroyed || this.isDestroying) return;
            this._recompute();
        });
    }),

    _recompute() {
        if (this.isDestroyed || this.isDestroying) return;
        const tree = this._gridEl;
        if (!tree) return;
        const treeRect = tree.getBoundingClientRect();
        this.set('boxW', treeRect.width);
        this.set('boxH', treeRect.height);

        const byId = {};
        const cards = tree.querySelectorAll('[data-match-id]');
        for (let i = 0; i < cards.length; i++) {
            const el = cards[i];
            const r = el.getBoundingClientRect();
            byId[el.getAttribute('data-match-id')] = {
                x1: r.left - treeRect.left,
                x2: r.right - treeRect.left,
                y:  r.top  - treeRect.top + r.height / 2
            };
        }

        const out = [];
        const rounds = this.get('rounds') || [];
        rounds.forEach((round, rIdx) => {
            if (rIdx === 0) return;
            const half = round.matches.length / 2;
            round.matches.forEach((m, mIdx) => {
                const dest = byId[m.id];
                if (!dest) return;
                const isLeft = mIdx < half;
                const sources = [m.top.winnerOf, m.bot.winnerOf].filter(Boolean);
                const decided = !!m.winner;
                sources.forEach(srcId => {
                    const src = byId[srcId];
                    if (!src) return;
                    let d;
                    if (isLeft) {
                        const sx = src.x2, sy = src.y;
                        const dx = dest.x1, dy = dest.y;
                        const midX = sx + (dx - sx) / 2;
                        d = 'M ' + sx + ' ' + sy + ' H ' + midX + ' V ' + dy + ' H ' + dx;
                    } else {
                        const sx = src.x1, sy = src.y;
                        const dx = dest.x2, dy = dest.y;
                        const midX = sx - (sx - dx) / 2;
                        d = 'M ' + sx + ' ' + sy + ' H ' + midX + ' V ' + dy + ' H ' + dx;
                    }
                    out.push({ id: srcId + '-' + m.id, d: d, decided: decided });
                });
            });
        });
        this.set('paths', out);
    }
});
