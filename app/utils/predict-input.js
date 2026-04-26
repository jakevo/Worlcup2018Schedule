/*
 * Predict-mode input model — two test routes save into separate
 * localStorage keys so they don't fight each other:
 *
 *   /predict-matches → wc-predict-matches    (per-match winner picks)
 *   /predict-groups  → wc-predict-groups     (per-group standing picks)
 *
 * Both produce the same shape of "predicted groups" — a list of
 * { letter, teams: [...] } where teams[0] is the predicted 1st-place,
 * teams[1] is 2nd, teams[2] is 3rd. buildBracket(groups, matches,
 * { forceResolved: true }) reads positions 0/1 directly to populate
 * "1A", "2A" slots, so the same bracket renderer drives both pages.
 */

const MATCH_KEY = 'wc-predict-matches';
const GROUP_KEY = 'wc-predict-groups';

function safeRead(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
}
function safeWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value || {})); } catch (e) { /* ignore */ }
}

export function loadMatchPicks() { return safeRead(MATCH_KEY); }
export function saveMatchPicks(p) { safeWrite(MATCH_KEY, p); }
export function clearMatchPicks() { safeWrite(MATCH_KEY, {}); }

export function loadGroupPicks() { return safeRead(GROUP_KEY); }
export function saveGroupPicks(p) { safeWrite(GROUP_KEY, p); }
export function clearGroupPicks() { safeWrite(GROUP_KEY, {}); }

// Apply a per-match prediction to the running standings. We use a
// stand-in 1-0 score for predicted wins (any number works since GD
// only matters for tiebreaks), 0-0 for predicted draws.
function applyResult(t1, t2, s1, s2) {
    t1.mp++; t2.mp++;
    t1.gf += s1; t1.ga += s2;
    t2.gf += s2; t2.ga += s1;
    t1.gd = t1.gf - t1.ga;
    t2.gd = t2.gf - t2.ga;
    if (s1 > s2) { t1.w++; t1.pts += 3; t2.l++; }
    else if (s1 < s2) { t2.w++; t2.pts += 3; t1.l++; }
    else { t1.d++; t2.d++; t1.pts++; t2.pts++; }
}

// For Route A. Real played matches always count first (locked); the
// user's predictions fill in the rest. Returned groups are sorted by
// the same tiebreak chain real applyStandings uses.
export function applyMatchPicksToGroups(groups, matches, picks) {
    const cloned = groups.map(g => ({
        letter: g.letter,
        teams: g.teams.map(t => Object.assign({}, t, {
            mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0
        }))
    }));
    const byName = new Map();
    for (const g of cloned) for (const t of g.teams) byName.set(t.name, t);
    for (const m of (matches || [])) {
        if (!m.group) continue;
        const t1 = byName.get(m.team1);
        const t2 = byName.get(m.team2);
        if (!t1 || !t2) continue;
        if (m.played && m.score1 != null && m.score2 != null) {
            applyResult(t1, t2, m.score1, m.score2);
            continue;
        }
        const pick = picks[m.id];
        if (!pick) continue;
        if (pick === 'team1') applyResult(t1, t2, 1, 0);
        else if (pick === 'team2') applyResult(t1, t2, 0, 1);
        else if (pick === 'draw') applyResult(t1, t2, 0, 0);
    }
    for (const g of cloned) {
        g.teams.sort((a, b) =>
            b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)
        );
    }
    return cloned;
}

// For Route B. picks shape: { 'A': ['BRA', 'MEX', 'KOR'], 'B': [...] }
// — fifaCodes for 1st, 2nd, 3rd. Anything not picked falls through
// to the existing alphabetic order (so partial picks still produce
// a reasonable bracket).
export function applyGroupPicksToGroups(groups, picks) {
    return groups.map(g => {
        const order = (picks && picks[g.letter]) || [];
        if (!order.length) {
            return { letter: g.letter, teams: g.teams.map(t => Object.assign({}, t)) };
        }
        const byCode = new Map(g.teams.map(t => [t.fifaCode, t]));
        const seen = new Set();
        const ranked = [];
        for (const code of order) {
            const t = byCode.get(code);
            if (t && !seen.has(code)) { ranked.push(t); seen.add(code); }
        }
        for (const t of g.teams) {
            if (!seen.has(t.fifaCode)) ranked.push(t);
        }
        return { letter: g.letter, teams: ranked.map(t => Object.assign({}, t, { mp: 3 })) };
    });
}
