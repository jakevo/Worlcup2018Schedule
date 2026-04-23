/*
 * api-football / api-sports.io v3 provider.
 *
 * Two modes:
 *
 * 1. Proxy mode (production / public deploys) — PREFERRED
 *    Set `proxyUrl` to your own endpoint that forwards requests to
 *    api-sports.io with the `x-apisports-key` header attached
 *    server-side. The browser bundle carries NO key.
 *
 *        createProvider({ kind: 'api-football',
 *                         proxyUrl: 'https://your-worker.dev' })
 *
 *    See `proxy/cloudflare-worker.js` for a ready-to-deploy proxy
 *    template (free Cloudflare Worker).
 *
 * 2. Direct mode (local dev only)
 *    Set `apiKey` and the provider hits api-sports.io directly.
 *    DO NOT SHIP a build with apiKey baked in — the key is plainly
 *    visible in the JS bundle to anyone who opens devtools.
 *
 *        createProvider({ kind: 'api-football', apiKey: '...' })
 *
 * World Cup league id is 1 on api-football; override via options
 * if a different competition is ever wanted.
 */

const DIRECT_BASE_URL = 'https://v3.football.api-sports.io';
const WORLD_CUP_LEAGUE_ID = 1;
const DEFAULT_SEASON = 2026;

export default class ApiFootballProvider {
    constructor(options) {
        const opts = options || {};
        if (!opts.apiKey && !opts.proxyUrl) {
            throw new Error('ApiFootballProvider requires either proxyUrl (preferred) or apiKey');
        }
        this.apiKey = opts.apiKey || null;
        this.proxyUrl = opts.proxyUrl || null;
        this.baseUrl = this.proxyUrl || opts.baseUrl || DIRECT_BASE_URL;
        this.leagueId = opts.leagueId || WORLD_CUP_LEAGUE_ID;
        this.season = opts.season || DEFAULT_SEASON;
        this.fetchFn = opts.fetch || ((typeof window !== 'undefined') && window.fetch && window.fetch.bind(window));
        if (typeof this.fetchFn !== 'function') {
            throw new Error('ApiFootballProvider requires a fetch implementation');
        }
        this._teamsCache = null;
    }

    kind() { return 'api-football'; }

    mode() { return this.proxyUrl ? 'proxy' : 'direct'; }

    load() {
        return Promise.all([
            this._loadTeams(),
            this._loadFixtures(),
            this._loadLocalMeta().catch(() => null)
        ]).then(([teamsDoc, fixturesDoc, localMeta]) => {
            const meta = localMeta || { teams: [] };
            const teams = this._mergeGroupMeta(this._normalizeTeams(teamsDoc), meta.teams);
            const matches = this._normalizeFixtures(fixturesDoc, teams);
            return {
                tournament: this._normalizeTournament(teamsDoc, meta),
                venues: this._extractVenues(teamsDoc, meta),
                teams,
                matches
            };
        });
    }

    _loadLocalMeta() {
        return this.fetchFn('/data.json', { cache: 'no-store' }).then(r => {
            if (!r.ok) throw new Error(`local meta: ${r.status}`);
            return r.json();
        });
    }

    _mergeGroupMeta(apiTeams, metaTeams) {
        if (!metaTeams || !metaTeams.length) return apiTeams;
        const byName = new Map();
        for (const m of metaTeams) {
            byName.set(normalizeName(m.name), m);
            if (m.fifaCode) byName.set(normalizeName(m.fifaCode), m);
        }
        return apiTeams.map(t => {
            const hit = byName.get(normalizeName(t.name)) || byName.get(normalizeName(t.fifaCode));
            if (!hit) return t;
            return Object.assign({}, t, {
                group: hit.group || t.group,
                pot: hit.pot || t.pot,
                iso2: hit.iso2 || t.iso2,
                fifaCode: hit.fifaCode || t.fifaCode,
                confederation: hit.confederation || t.confederation,
                flag: hit.flag || t.flag
            });
        });
    }

    _loadTeams() {
        if (this._teamsCache) return Promise.resolve(this._teamsCache);
        return this._get(`/teams?league=${this.leagueId}&season=${this.season}`)
            .then(doc => { this._teamsCache = doc; return doc; });
    }

    _loadFixtures() {
        return this._get(`/fixtures?league=${this.leagueId}&season=${this.season}`);
    }

    _get(path) {
        const headers = {};
        // In proxy mode the Worker attaches the key server-side.
        if (!this.proxyUrl && this.apiKey) {
            headers['x-apisports-key'] = this.apiKey;
        }
        return this.fetchFn(`${this.baseUrl}${path}`, {
            headers,
            cache: 'no-store'
        }).then(r => {
            if (!r.ok) throw new Error(`api-football ${path}: ${r.status}`);
            return r.json();
        });
    }

    /* ------------------------------------------------------------------
     * Normalization — api-football → app shape
     * ------------------------------------------------------------------ */

    _normalizeTournament(teamsDoc, meta) {
        if (meta && meta.tournament) return meta.tournament;
        return {
            name: 'FIFA World Cup 2026',
            hosts: ['Canada', 'Mexico', 'USA'],
            startDate: '2026-06-11',
            endDate: '2026-07-19'
        };
    }

    _normalizeTeams(teamsDoc) {
        const list = (teamsDoc && teamsDoc.response) || [];
        return list.map(item => {
            const t = item.team || {};
            return {
                id: t.id,
                group: null,
                pot: null,
                name: t.name || '',
                fifaCode: (t.code || '').toUpperCase() || (t.name || '').slice(0, 3).toUpperCase(),
                iso2: '',
                flag: t.logo || '',
                confederation: null
            };
        });
    }

    _extractVenues(teamsDoc, meta) {
        // Prefer the curated WC 2026 host venues from the bundled
        // data file — api-football returns each team's home-
        // country stadium, not the tournament host venues.
        if (meta && Array.isArray(meta.venues) && meta.venues.length) {
            return meta.venues;
        }
        const list = (teamsDoc && teamsDoc.response) || [];
        const seen = new Set();
        const out = [];
        for (const item of list) {
            const v = item.venue;
            if (!v || !v.name || seen.has(v.name)) continue;
            seen.add(v.name);
            out.push({
                city: v.city || '',
                country: (item.team && item.team.country) || '',
                stadium: v.name,
                capacity: v.capacity || null
            });
        }
        return out;
    }

    _normalizeFixtures(fixturesDoc, teams) {
        const groupByName = new Map();
        for (const t of (teams || [])) {
            if (t.name && t.group) groupByName.set(normalizeName(t.name), t.group);
        }
        const list = (fixturesDoc && fixturesDoc.response) || [];
        return list.map(f => {
            const fixture = f.fixture || {};
            const league = f.league || {};
            const apiTeams = f.teams || {};
            const goals = f.goals || {};
            const utc = fixture.date || '';
            // Convert UTC wall-clock to America/New_York (UTC-4) so
            // date/time match what the rest of the app expects.
            const { date, time } = utcToEt(utc);
            const status = (fixture.status && fixture.status.short) || '';
            const played = status === 'FT' || status === 'AET' || status === 'PEN';
            const home = (apiTeams.home && apiTeams.home.name) || '';
            const away = (apiTeams.away && apiTeams.away.name) || '';
            const group = groupByName.get(normalizeName(home)) ||
                          groupByName.get(normalizeName(away)) ||
                          parseGroupLetter(league.round);
            const row = {
                id: fixture.id,
                date,
                time,
                group,
                round: league.round || '',
                venue: (fixture.venue && fixture.venue.name) || '',
                city: (fixture.venue && fixture.venue.city) || '',
                team1: home,
                team2: away
            };
            if (played) {
                row.score1 = goals.home != null ? goals.home : 0;
                row.score2 = goals.away != null ? goals.away : 0;
            }
            return row;
        });
    }
}

function parseGroupLetter(round) {
    if (!round) return null;
    const m = /Group\s+([A-L])/i.exec(round);
    return m ? m[1].toUpperCase() : null;
}

function normalizeName(s) {
    return String(s || '').trim().toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/&/g, 'and');
}

function utcToEt(iso) {
    if (!iso) return { date: '', time: '' };
    const t = Date.parse(iso);
    if (isNaN(t)) return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
    const d = new Date(t - 4 * 60 * 60 * 1000);  // UTC-4 (tournament window)
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}
