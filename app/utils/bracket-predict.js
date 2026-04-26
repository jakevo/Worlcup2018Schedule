/*
 * Predict-mode helpers for /bracket. Operates on the rounds shape produced
 * by app/utils/bracket.js (matches with `top.team`, `top.label`,
 * `top.winnerOf` and same on `bot`). Picks is a plain object
 * { matchId: 'TOP' | 'BOT' }.
 *
 * Lifted from design_handoff_bracket_redesign/bracket-tree.jsx and
 * adapted from `m.top.code/source/winner` to the existing shape.
 */

function flattenMatches(rounds) {
    const out = [];
    for (const r of (rounds || [])) {
        for (const m of (r.matches || [])) out.push(m);
    }
    return out;
}

// Returns a new rounds array where downstream slots have `team` populated
// based on picks, and every match has a `winner` ('TOP'|'BOT'|null) field.
//
// A pick is treated as a valid winner unless the opponent slot is a
// downstream cell (has `winnerOf`) that hasn't resolved yet — in that
// case the winner is held in suspense (the pick stays in localStorage
// and re-activates when the opponent appears). R32 cells with "3rd"
// placeholders still allow valid winners, because the placeholder is a
// real-but-unresolved group seed, not an unpicked upstream match.
export function decorateRounds(rounds, picks) {
    const safePicks = picks || {};
    const byId = {};
    flattenMatches(rounds).forEach(m => { byId[m.id] = m; });

    function teamFor(matchId, side) {
        const m = byId[matchId];
        if (!m) return null;
        const cell = m[side];
        if (cell.team) return cell.team;
        if (!cell.winnerOf) return null;
        return winnerTeam(cell.winnerOf);
    }
    function winnerTeam(matchId) {
        const m = byId[matchId];
        if (!m) return null;
        const w = safePicks[matchId];
        if (!w) return null;
        const winningSide = w === 'TOP' ? 'top' : 'bot';
        const oppSide    = w === 'TOP' ? 'bot' : 'top';
        const winnerT = teamFor(matchId, winningSide);
        if (!winnerT) return null;
        // Use the resolved (recursively decorated) opponent team — the
        // raw m[oppSide].team is always null for downstream cells. Block
        // propagation only when opponent is a downstream slot that has
        // not resolved yet.
        const oppT = teamFor(matchId, oppSide);
        const oppCell = m[oppSide];
        if (oppCell.winnerOf && !oppT) return null;
        return winnerT;
    }

    return (rounds || []).map(r => Object.assign({}, r, {
        matches: (r.matches || []).map(m => {
            const topT = teamFor(m.id, 'top');
            const botT = teamFor(m.id, 'bot');
            const w = safePicks[m.id] || null;
            let validWinner = null;
            if (w) {
                const winningT = w === 'TOP' ? topT : botT;
                const oppT     = w === 'TOP' ? botT : topT;
                const oppCell  = w === 'TOP' ? m.bot : m.top;
                // Use the decorated opponent team (topT/botT), NOT the
                // raw cell — raw m[side].team is always null for
                // downstream rounds. Opponent passes when it has a
                // resolved team OR is a non-downstream seed slot.
                if (winningT && (oppT || !oppCell.winnerOf)) {
                    validWinner = w;
                }
            }
            return Object.assign({}, m, {
                top: Object.assign({}, m.top, { team: topT }),
                bot: Object.assign({}, m.bot, { team: botT }),
                winner: validWinner
            });
        })
    }));
}

// IDs of the two source matches that feed into this match (or [] for R32).
export function feedersFor(rounds, matchId) {
    const all = flattenMatches(rounds);
    const m = all.find(x => x.id === matchId);
    if (!m) return [];
    return [m.top.winnerOf, m.bot.winnerOf].filter(Boolean);
}

// All ancestor match IDs that feed (recursively) into this match. Used
// to highlight the entire upstream chain when an empty slot is focused,
// so the user sees every match that still needs a pick before this slot
// can resolve.
export function ancestorsFor(rounds, matchId) {
    const result = new Set();
    const all = flattenMatches(rounds);
    const byId = {};
    all.forEach(m => { byId[m.id] = m; });
    function walk(id) {
        const m = byId[id];
        if (!m) return;
        const tops = [m.top.winnerOf, m.bot.winnerOf].filter(Boolean);
        tops.forEach(srcId => {
            if (result.has(srcId)) return;
            result.add(srcId);
            walk(srcId);
        });
    }
    walk(matchId);
    return Array.from(result);
}

// True when at least one slot of the (decorated) match has no team yet.
export function isEmpty(match) {
    return !match || !match.top || !match.bot || !match.top.team || !match.bot.team;
}

// Clears a pick and any downstream picks that depended on the team that
// flowed forward from it. Returns a new picks object.
export function cascadeClear(rounds, picks, matchId) {
    const next = Object.assign({}, picks || {});
    const all = flattenMatches(rounds);
    function clear(id) {
        if (!next[id]) return;
        delete next[id];
        all.forEach(m => {
            if (m.top.winnerOf === id || m.bot.winnerOf === id) clear(m.id);
        });
    }
    clear(matchId);
    return next;
}

// Set of match IDs on the hovered team's forward path. Stops following
// the team once they lose a pick. `cur` is set to the sentinel string
// '__' (not null) so that downstream empty cells (topCode/botCode also
// null) don't all match.
export function pathFor(decoratedRounds, code) {
    const ids = new Set();
    if (!code) return ids;
    let cur = code;
    (decoratedRounds || []).forEach(r => (r.matches || []).forEach(m => {
        const topCode = (m.top.team && m.top.team.fifaCode) || null;
        const botCode = (m.bot.team && m.bot.team.fifaCode) || null;
        if (topCode === cur || botCode === cur) {
            ids.add(m.id);
            if (m.winner === 'TOP' && topCode !== cur) cur = '__';
            if (m.winner === 'BOT' && botCode !== cur) cur = '__';
        }
    }));
    return ids;
}
