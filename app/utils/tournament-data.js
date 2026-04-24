import config from '../config/environment';
import { createProvider } from '../providers';

const FAST_POLL_MS = 60 * 1000;            // live matches: 1 min
const SLOW_POLL_MS = 10 * 60 * 1000;       // pre/post tournament: 10 min
const LIVE_WINDOW_MS = 115 * 60 * 1000;    // ~kickoff + 115 min = still "live"

let cachedPromise = null;
let cachedData = null;
let pollHandle = null;
let providerInstance = null;

function getProvider() {
    if (!providerInstance) {
        providerInstance = createProvider(config.dataProvider);
    }
    return providerInstance;
}

// Exposed for tests so they can inject a fake provider.
export function _setProviderForTesting(p) {
    providerInstance = p;
    cachedPromise = null;
}

// Lazy-load a single team's squad. Cached inside the provider so
// repeat calls for the same team don't burn API quota.
export function loadSquad(teamId) {
    const p = getProvider();
    if (typeof p.loadSquad !== 'function') return Promise.resolve([]);
    return p.loadSquad(teamId);
}

function parseScore(match) {
    if (match.score1 !== undefined && match.score2 !== undefined) {
        return { s1: match.score1, s2: match.score2, played: true };
    }
    return { s1: null, s2: null, played: false };
}

function buildGroups(teams) {
    const byLetter = new Map();
    for (const t of teams) {
        const letter = typeof t.group === 'string' ? t.group.trim() : '';
        if (!letter) continue;
        if (!byLetter.has(letter)) byLetter.set(letter, []);
        byLetter.get(letter).push(Object.assign({}, t, {
            mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0
        }));
    }
    return Array.from(byLetter.keys()).sort().map(letter => ({
        letter,
        teams: byLetter.get(letter)
    }));
}

function applyStandings(groups, matches) {
    const byName = new Map();
    for (const g of groups) for (const t of g.teams) byName.set(t.name, t);
    for (const m of matches) {
        if (!m.group) continue;
        const { s1, s2, played } = parseScore(m);
        if (!played) continue;
        const t1 = byName.get(m.team1);
        const t2 = byName.get(m.team2);
        if (!t1 || !t2) continue;
        t1.mp++; t2.mp++;
        t1.gf += s1; t1.ga += s2;
        t2.gf += s2; t2.ga += s1;
        t1.gd = t1.gf - t1.ga;
        t2.gd = t2.gf - t2.ga;
        if (s1 > s2) { t1.w++; t1.pts += 3; t2.l++; }
        else if (s1 < s2) { t2.w++; t2.pts += 3; t1.l++; }
        else { t1.d++; t2.d++; t1.pts++; t2.pts++; }
    }
    for (const g of groups) {
        g.teams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
    }
}

function enrichMatches(matches, teams, now) {
    const byName = new Map(teams.map(t => [t.name, t]));
    return matches
        .map(m => {
            const { s1, s2, played } = parseScore(m);
            const t1 = byName.get(m.team1);
            const t2 = byName.get(m.team2);
            const kickoff = new Date(`${m.date}T${m.time || '00:00'}:00-04:00`).getTime();
            const isLive = !played && kickoff <= now && (now - kickoff) <= LIVE_WINDOW_MS;
            const t1Code = (t1 && t1.fifaCode) || slug(m.team1);
            const t2Code = (t2 && t2.fifaCode) || slug(m.team2);
            const id = m.id != null ? String(m.id) : `${m.date}-${t1Code}-${t2Code}`;
            return {
                id,
                date: m.date,
                time: m.time,
                group: m.group,
                venue: m.venue,
                city: m.city,
                team1: m.team1,
                team2: m.team2,
                team1Code: t1 && t1.fifaCode,
                team2Code: t2 && t2.fifaCode,
                team1Flag: t1 && t1.flag,
                team2Flag: t2 && t2.flag,
                score1: s1,
                score2: s2,
                played,
                isLive,
                kickoff,
                dateKey: m.date || ''
            };
        })
        .sort((a, b) => a.kickoff - b.kickoff);
}

function slug(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6) || 'TBD';
}

function formatLongDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00Z`);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function buildResult(data) {
    const teams = data.teams || [];
    const tournament = data.tournament || {};
    const venues = data.venues || [];
    const matches = data.matches || [];
    const groups = buildGroups(teams);
    applyStandings(groups, matches);

    const now = Date.now();
    const enriched = enrichMatches(matches, teams, now);
    const liveMatches = enriched.filter(m => m.isLive);
    const upcoming = enriched.filter(m => !m.played && !m.isLive && m.kickoff >= now);
    const nextMatch = liveMatches[0] || upcoming[0] || enriched[0] || null;
    const featured = upcoming.slice(0, 8);

    const byDate = [];
    for (const m of enriched) {
        const last = byDate[byDate.length - 1];
        if (last && last.date === m.date) last.matches.push(m);
        else byDate.push({
            date: m.date,
            label: formatLongDate(m.date),
            matches: [m]
        });
    }

    const kickoffMs = new Date(`${tournament.startDate || '2026-06-11'}T18:00:00-05:00`).getTime();
    const endMs = new Date(`${tournament.endDate || '2026-07-19'}T23:59:59-04:00`).getTime();
    const daysUntilKickoff = Math.max(0, Math.ceil((kickoffMs - now) / (1000 * 60 * 60 * 24)));

    return {
        tournament,
        venues,
        teams,
        groups,
        matches: enriched,
        matchesByDate: byDate,
        nextMatch,
        liveMatches,
        featured,
        daysUntilKickoff,
        kickoffMs,
        endMs,
        squads: data.squads || {},
        topScorers: data.topScorers || [],
        updatedAt: new Date().toISOString()
    };
}

export function loadTournament() {
    if (cachedPromise) return cachedPromise;
    cachedPromise = getProvider().load()
        .then(buildResult)
        .then(result => { cachedData = result; return result; })
        .catch(err => {
            cachedPromise = null;
            throw err;
        });
    return cachedPromise;
}

export function invalidateTournamentCache() {
    cachedPromise = null;
    cachedData = null;
}

// Decide the next poll delay based on whether anything live is happening.
// Pre-tournament and post-tournament we don't need 60s polling — the
// schedule and standings aren't moving, so we back off to 10 min to save
// the Cloudflare Worker / api-football quota and reduce cold-start pain.
function nextPollDelay() {
    const data = cachedData;
    if (!data) return FAST_POLL_MS;
    if (data.liveMatches && data.liveMatches.length) return FAST_POLL_MS;
    const now = Date.now();
    if (data.kickoffMs && now < data.kickoffMs) return SLOW_POLL_MS;
    if (data.endMs && now > data.endMs) return SLOW_POLL_MS;
    return FAST_POLL_MS;
}

export function startPolling(onTick) {
    stopPolling();
    const tick = () => {
        invalidateTournamentCache();
        if (typeof onTick === 'function') onTick();
        pollHandle = setTimeout(tick, nextPollDelay());
    };
    pollHandle = setTimeout(tick, nextPollDelay());
}

export function stopPolling() {
    if (pollHandle) {
        clearTimeout(pollHandle);
        pollHandle = null;
    }
}
