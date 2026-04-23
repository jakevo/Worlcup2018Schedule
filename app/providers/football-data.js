/*
 * Stub provider for the football-data.org v4 API (competition code WC
 * for the men's World Cup). Returns the same normalized shape as the
 * static provider so the rest of the app can't tell them apart.
 *
 * Requires an X-Auth-Token request header. The free tier allows 10
 * requests per minute / 100 per day, so this provider caches the
 * teams doc and only re-fetches matches when load() is called.
 *
 * NOT YET WIRED UP IN PRODUCTION — left as scaffolding so that
 * switching providers means changing one line in config/environment.js
 * once the API is enabled on the chosen plan. All the
 * football-data-specific field names are listed in normalizeTeam()
 * and normalizeMatch() below so future work is a straight mapping
 * job rather than a design exercise.
 */

const BASE_URL = 'https://api.football-data.org/v4';
const COMPETITION = 'WC';

export default class FootballDataProvider {
    constructor(options) {
        const opts = options || {};
        if (!opts.apiKey) {
            throw new Error('FootballDataProvider requires an apiKey');
        }
        this.apiKey = opts.apiKey;
        this.baseUrl = opts.baseUrl || BASE_URL;
        this.competition = opts.competition || COMPETITION;
        this.fetchFn = opts.fetch || ((typeof window !== 'undefined') && window.fetch && window.fetch.bind(window));
        if (typeof this.fetchFn !== 'function') {
            throw new Error('FootballDataProvider requires a fetch implementation');
        }
        this._teamsCache = null;
    }

    kind() { return 'football-data'; }

    load() {
        return Promise.all([
            this._loadTeams(),
            this._loadMatches()
        ]).then(([teamsPayload, matchesPayload]) => {
            return {
                tournament: this._normalizeTournament(teamsPayload),
                venues: [],
                teams: (teamsPayload.teams || []).map(t => this._normalizeTeam(t, teamsPayload)),
                matches: (matchesPayload.matches || []).map(m => this._normalizeMatch(m))
            };
        });
    }

    _loadTeams() {
        if (this._teamsCache) return Promise.resolve(this._teamsCache);
        return this._get(`/competitions/${this.competition}/teams`).then(doc => {
            this._teamsCache = doc;
            return doc;
        });
    }

    _loadMatches() {
        return this._get(`/competitions/${this.competition}/matches`);
    }

    _get(path) {
        return this.fetchFn(`${this.baseUrl}${path}`, {
            headers: { 'X-Auth-Token': this.apiKey },
            cache: 'no-store'
        }).then(r => {
            if (!r.ok) throw new Error(`football-data ${path}: ${r.status}`);
            return r.json();
        });
    }

    /* ------------------------------------------------------------------
     * Shape mappers — fill these in when the API is actually turned on.
     * Left intentionally as pass-through placeholders returning the same
     * keys the rest of the app expects.
     * ------------------------------------------------------------------ */

    _normalizeTournament(teamsDoc) {
        const comp = (teamsDoc && teamsDoc.competition) || {};
        return {
            name: comp.name || 'FIFA World Cup',
            hosts: [],
            startDate: null,
            endDate: null
        };
    }

    _normalizeTeam(apiTeam) {
        return {
            id: apiTeam.id,
            group: null,
            pot: null,
            name: apiTeam.name || apiTeam.shortName || '',
            fifaCode: (apiTeam.tla || apiTeam.shortName || '').toUpperCase(),
            iso2: '',
            flag: apiTeam.crest || '',
            confederation: apiTeam.area && apiTeam.area.name
        };
    }

    _normalizeMatch(apiMatch) {
        const home = (apiMatch.homeTeam || {}).name || '';
        const away = (apiMatch.awayTeam || {}).name || '';
        const utc = apiMatch.utcDate || '';
        const datePart = utc.slice(0, 10);
        const timePart = utc.slice(11, 16);
        const score = (apiMatch.score && apiMatch.score.fullTime) || {};
        const played = apiMatch.status === 'FINISHED';
        return Object.assign(
            {
                date: datePart,
                time: timePart,
                group: apiMatch.group || null,
                venue: apiMatch.venue || '',
                city: '',
                team1: home,
                team2: away
            },
            played ? { score1: score.home, score2: score.away } : {}
        );
    }
}
