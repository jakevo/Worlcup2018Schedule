import Component from '@ember/component';
import { observer } from '@ember/object';

// Horizontal scroll-snap carousel. Each child panel is one round.
// Native touch scrolling does the swipe; we sync `activeIndex` two
// ways via IntersectionObserver (scroll → activeIndex) and an
// `activeIndex` observer (tab click → scrollIntoView).

export default Component.extend({
    classNames: ['wc-bp2__rounds'],
    rounds: null,
    activeIndex: 0,
    onActivate: null,

    init() {
        this._super(...arguments);
        // Read activeIndex once so the classic observer activates.
        this.get('activeIndex');
        this._programmaticScroll = false;
    },

    didInsertElement() {
        this._super(...arguments);
        if (typeof IntersectionObserver === 'undefined') return;
        this._observer = new IntersectionObserver((entries) => {
            if (this._programmaticScroll) return;
            let bestIdx = -1;
            let bestRatio = 0;
            for (const entry of entries) {
                if (entry.intersectionRatio > bestRatio) {
                    bestRatio = entry.intersectionRatio;
                    bestIdx = Number(entry.target.dataset.idx);
                }
            }
            if (bestIdx >= 0 && bestRatio > 0.5 && this.get('activeIndex') !== bestIdx) {
                const fn = this.get('onActivate');
                if (fn) fn(bestIdx);
            }
        }, { root: this.element, threshold: [0.5, 0.7, 0.9] });
        this.element.querySelectorAll('[data-idx]').forEach(p => this._observer.observe(p));
    },

    _onActiveChange: observer('activeIndex', function () {
        const idx = this.get('activeIndex');
        const panel = this.element && this.element.querySelector(`[data-idx="${idx}"]`);
        if (!panel) return;
        this._programmaticScroll = true;
        try {
            panel.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        } catch (e) {
            // Older browsers
            this.element.scrollLeft = panel.offsetLeft;
        }
        clearTimeout(this._scrollTimer);
        this._scrollTimer = setTimeout(() => {
            this._programmaticScroll = false;
        }, 450);
    }),

    willDestroyElement() {
        if (this._observer) this._observer.disconnect();
        clearTimeout(this._scrollTimer);
        this._super(...arguments);
    }
});
