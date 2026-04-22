import RSVP from 'rsvp';

const TEAMS_URL = '/data.json';
const SCHEDULE_URL = '/schedule.json';

let cachedPromise = null;

function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(r => {
        if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
        return r.json();
    });
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
        if (!byLetter.has(t.group)) byLetter.set(t.group, []);
        byLetter.get(t.group).push(Object.assign({}, t, {
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

function enrichMatches(matches, teams) {
    const byName = new Map(teams.map(t => [t.name, t]));
    return matches
        .map(m => {
            const { s1, s2, played } = parseScore(m);
            const t1 = byName.get(m.team1);
            const t2 = byName.get(m.team2);
            return {
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
                kickoff: new Date(`${m.date}T${m.time || '00:00'}:00-04:00`).getTime(),
                dateKey: m.date || ''
            };
        })
        .sort((a, b) => a.kickoff - b.kickoff);
}

function formatLongDate(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00Z`);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function loadTournament() {
    if (cachedPromise) return cachedPromise;
    cachedPromise = RSVP.hash({
        teamsDoc: fetchJson(TEAMS_URL),
        scheduleDoc: fetchJson(SCHEDULE_URL).catch(() => ({ matches: [] }))
    }).then(({ teamsDoc, scheduleDoc }) => {
        const teams = teamsDoc.teams || [];
        const tournament = teamsDoc.tournament || {};
        const venues = teamsDoc.venues || [];
        const matches = scheduleDoc.matches || [];
        const groups = buildGroups(teams);
        applyStandings(groups, matches);
        const enriched = enrichMatches(matches, teams);

        const now = Date.now();
        const upcoming = enriched.filter(m => !m.played && m.kickoff >= now);
        const nextMatch = upcoming[0] || enriched[0] || null;
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
        const daysUntilKickoff = Math.max(0, Math.ceil((kickoffMs - now) / (1000 * 60 * 60 * 24)));

        return {
            tournament,
            venues,
            teams,
            groups,
            matches: enriched,
            matchesByDate: byDate,
            nextMatch,
            featured,
            daysUntilKickoff,
            kickoffMs,
            updatedAt: new Date().toISOString()
        };
    });
    return cachedPromise;
}

export function invalidateTournamentCache() {
    cachedPromise = null;
}
