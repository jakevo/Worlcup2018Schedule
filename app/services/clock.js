import Service from '@ember/service';

/*
 * Wall clock, with a dev override for previewing time-dependent UI.
 *
 *   ?simulate=<iso>       — freeze `now` at a specific instant
 *   ?simulate=live        — opener kick-off (2026-06-11 18:05 ET)
 *   ?simulate=today       — day 2 morning, several kickoffs pending
 *   ?simulate=motd        — between match-days, match-of-day state
 *   ?simulate=ended       — day after the final
 *
 * Unrecognised values are ignored and the clock runs real-time.
 */
const PRESETS = {
    'live':   '2026-06-11T18:05:00-04:00',
    'today':  '2026-06-12T09:00:00-04:00',
    'motd':   '2026-06-18T22:00:00-04:00',
    'ended':  '2026-07-20T12:00:00-04:00'
};

function parseSimulate(value) {
    if (!value) return null;
    if (PRESETS[value]) {
        const t = Date.parse(PRESETS[value]);
        return isNaN(t) ? null : t;
    }
    const t = Date.parse(value);
    return isNaN(t) ? null : t;
}

export default Service.extend({
    _override: null,

    init() {
        this._super(...arguments);
        try {
            if (typeof window === 'undefined') return;
            const params = new URLSearchParams(window.location.search);
            this._override = parseSimulate(params.get('simulate'));
        } catch (e) { /* ignore */ }
    },

    now() {
        return this._override != null ? this._override : Date.now();
    },

    isSimulated() {
        return this._override != null;
    }
});
