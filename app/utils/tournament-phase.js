/*
 * Decide what the "Tournament live" widget should render right now.
 * Pure function — takes a wall-clock `now` plus the schedule data,
 * returns a discriminated union:
 *   { kind: 'pre',    kickoffMs }                    // before opener
 *   { kind: 'live',   matches: [...] }               // >=1 match in progress
 *   { kind: 'today',  matches: [...] }               // kickoffs today, none live
 *   { kind: 'motd',   match }                        // off day, pick best upcoming
 *   { kind: 'ended',  finalMatch }                   // tournament over
 *
 * All date math is in the tournament's local timezone (America/New_York,
 * UTC-4 during the event) so "today" means the ET calendar day, which
 * matches the way the schedule is built.
 */

import { BASE_RATING } from './contenders-base';

const LIVE_WINDOW_MS = 115 * 60 * 1000;
const ET_OFFSET_MS = -4 * 60 * 60 * 1000;

function startOfEtDay(ms) {
    const shifted = ms + ET_OFFSET_MS;
    const dayStart = Math.floor(shifted / 86400000) * 86400000;
    return dayStart - ET_OFFSET_MS;
}

function isLiveAt(match, now) {
    if (match.played) return false;
    const k = match.kickoff;
    return k <= now && (now - k) <= LIVE_WINDOW_MS;
}

function featuredScore(match) {
    const r1 = BASE_RATING[match.team1] != null ? BASE_RATING[match.team1] : 30;
    const r2 = BASE_RATING[match.team2] != null ? BASE_RATING[match.team2] : 30;
    return r1 + r2;
}

export function tournamentPhase(now, { matches, kickoffMs, endMs }) {
    if (kickoffMs != null && now < kickoffMs) {
        return { kind: 'pre', kickoffMs };
    }

    const all = Array.isArray(matches) ? matches : [];
    const live = all.filter(m => isLiveAt(m, now));
    if (live.length) {
        return { kind: 'live', matches: live.slice(0, 6) };
    }

    const todayStart = startOfEtDay(now);
    const todayEnd = todayStart + 86400000;
    const today = all.filter(m => m.kickoff >= todayStart && m.kickoff < todayEnd);
    if (today.length) {
        return { kind: 'today', matches: today.slice(0, 6) };
    }

    const upcoming = all.filter(m => !m.played && m.kickoff > now);
    if (upcoming.length) {
        let best = upcoming[0];
        let bestScore = featuredScore(best);
        for (const m of upcoming) {
            const s = featuredScore(m);
            const daysAway = (m.kickoff - now) / 86400000;
            if (daysAway > 3) continue;
            if (s > bestScore) { best = m; bestScore = s; }
        }
        return { kind: 'motd', match: best };
    }

    if (endMs != null && now > endMs) {
        const finished = all.filter(m => m.played).sort((a, b) => b.kickoff - a.kickoff);
        return { kind: 'ended', finalMatch: finished[0] || null };
    }

    return { kind: 'quiet' };
}
