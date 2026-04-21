import Route from '@ember/routing/route';
import RSVP from 'rsvp';

const MATCHES_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const TEAMS_URL = '/data.json';

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
    if (match.score && Array.isArray(match.score.ft) && match.score.ft.length === 2) {
        return { s1: match.score.ft[0], s2: match.score.ft[1], played: true };
    }
    return { s1: null, s2: null, played: false };
}

function buildGroups(teams) {
    const groupLetters = 'ABCDEFGHIJKL'.split('');
    return groupLetters.map((letter, i) => ({
        letter,
        teams: teams.slice(i * 4, i * 4 + 4).map(t => ({
            ...t,
            mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0
        }))
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
            return {
                date: m.date,
                time: m.time,
                round: m.round,
                group: m.group,
                ground: m.ground,
                team1: m.team1,
                team2: m.team2,
                team1Flag: byName.get(m.team1) && byName.get(m.team1).flag,
                team2Flag: byName.get(m.team2) && byName.get(m.team2).flag,
                score1: s1,
                score2: s2,
                played,
                dateKey: m.date || ''
            };
        })
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || (a.time || '').localeCompare(b.time || ''));
}

export default Route.extend({
    model() {
        return RSVP.hash({
            teamsDoc: fetchJson(TEAMS_URL),
            matchesDoc: fetchJson(MATCHES_URL).catch(() => ({ matches: [] }))
        }).then(({ teamsDoc, matchesDoc }) => {
            const teams = teamsDoc.teams || [];
            const matches = matchesDoc.matches || [];
            const groups = buildGroups(teams);
            applyStandings(groups, matches);
            const enriched = enrichMatches(matches, teams);
            const byDate = [];
            for (const m of enriched) {
                const last = byDate[byDate.length - 1];
                if (last && last.date === m.date) last.matches.push(m);
                else byDate.push({ date: m.date, matches: [m] });
            }
            return {
                groups,
                matches: enriched,
                matchesByDate: byDate,
                updatedAt: new Date().toISOString()
            };
        });
    },
    actions: {
        refresh() {
            this.refresh();
        }
    }
});
