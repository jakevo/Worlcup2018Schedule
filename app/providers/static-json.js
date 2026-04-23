/*
 * Fetches teams + schedule from the two bundled JSON files in /public.
 * Default provider; the shape it returns is what the rest of the app
 * has historically consumed.
 */

const DEFAULT_TEAMS_URL = '/data.json';
const DEFAULT_SCHEDULE_URL = '/schedule.json';

export default class StaticJsonProvider {
    constructor(options) {
        const opts = options || {};
        this.teamsUrl = opts.teamsUrl || DEFAULT_TEAMS_URL;
        this.scheduleUrl = opts.scheduleUrl || DEFAULT_SCHEDULE_URL;
        this.fetchFn = opts.fetch || ((typeof window !== 'undefined') && window.fetch && window.fetch.bind(window));
        if (typeof this.fetchFn !== 'function') {
            throw new Error('StaticJsonProvider requires a fetch implementation');
        }
    }

    kind() { return 'static'; }

    loadSquad() { return Promise.resolve([]); }

    load() {
        return Promise.all([
            this._fetchJson(this.teamsUrl),
            this._fetchJson(this.scheduleUrl).catch(() => ({ matches: [] }))
        ]).then(([teamsDoc, scheduleDoc]) => {
            const teamsDocObj = teamsDoc || {};
            const scheduleDocObj = scheduleDoc || {};
            return {
                tournament: teamsDocObj.tournament || {},
                venues: Array.isArray(teamsDocObj.venues) ? teamsDocObj.venues : [],
                teams: Array.isArray(teamsDocObj.teams) ? teamsDocObj.teams : [],
                matches: Array.isArray(scheduleDocObj.matches) ? scheduleDocObj.matches : []
            };
        });
    }

    _fetchJson(url) {
        return this.fetchFn(url, { cache: 'no-store' }).then(r => {
            if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
            return r.json();
        });
    }
}
