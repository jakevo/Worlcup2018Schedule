import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
    tagName: 'div',
    classNames: ['wc-countdown'],
    targetMs: 0,
    now: 0,
    _timer: null,

    didInsertElement() {
        this._super(...arguments);
        this.set('now', Date.now());
        this._timer = setInterval(() => {
            if (this.isDestroyed || this.isDestroying) return;
            this.set('now', Date.now());
        }, 1000);
    },

    willDestroyElement() {
        this._super(...arguments);
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    },

    _diff: computed('targetMs', 'now', function () {
        return Math.max(0, (this.get('targetMs') || 0) - (this.get('now') || 0));
    }),

    days: computed('_diff', function () {
        return Math.floor(this.get('_diff') / 86400000);
    }),
    hours: computed('_diff', function () {
        return Math.floor((this.get('_diff') % 86400000) / 3600000);
    }),
    mins: computed('_diff', function () {
        return Math.floor((this.get('_diff') % 3600000) / 60000);
    }),
    secs: computed('_diff', function () {
        return Math.floor((this.get('_diff') % 60000) / 1000);
    })
});
