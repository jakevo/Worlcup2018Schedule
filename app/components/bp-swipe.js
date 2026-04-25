import Component from '@ember/component';

export default Component.extend({
    classNames: ['wc-bp2__swipe'],
    onSwipeLeft: null,
    onSwipeRight: null,

    didInsertElement() {
        this._super(...arguments);
        this._touchStartX = null;
        this._touchStartY = null;
        this._onTouchStart = (e) => {
            const t = e.touches && e.touches[0];
            if (!t) return;
            this._touchStartX = t.clientX;
            this._touchStartY = t.clientY;
        };
        this._onTouchEnd = (e) => {
            if (this._touchStartX == null) return;
            const t = e.changedTouches && e.changedTouches[0];
            if (!t) { this._touchStartX = null; return; }
            const dx = t.clientX - this._touchStartX;
            const dy = t.clientY - this._touchStartY;
            this._touchStartX = null;
            this._touchStartY = null;
            // Only trigger on a clearly horizontal swipe past 60px.
            if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
            const fn = dx < 0 ? this.get('onSwipeLeft') : this.get('onSwipeRight');
            if (fn) fn();
        };
        this.element.addEventListener('touchstart', this._onTouchStart, { passive: true });
        this.element.addEventListener('touchend', this._onTouchEnd, { passive: true });
    },

    willDestroyElement() {
        if (this.element) {
            this.element.removeEventListener('touchstart', this._onTouchStart);
            this.element.removeEventListener('touchend', this._onTouchEnd);
        }
        this._super(...arguments);
    }
});
