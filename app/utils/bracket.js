/*
 * 2026 knockout-stage pairings. These mirror FIFA's published bracket
 * paths for the first 16-team Round of 32. Top-2 slots are resolved
 * directly from group standings; "best third" slots stay as
 * placeholders until those rankings can be computed from played
 * matches.
 */
// Official FIFA-published WC 2026 bracket paths. Order follows the
// public bracket image top-to-bottom: positions 1-8 fill the desktop
// LEFT half (controllers/bracket.js slices [0,8) into leftR32);
// positions 9-16 fill the RIGHT half. Adjacent pairs feed the same
// R16 match (1+2 → R16-1, 3+4 → R16-2, ...). The "3X/Y/Z/..." labels
// list the five groups whose 3rd-place team can land in that slot;
// pre-tournament the bp-tree-match component collapses any "/"
// label down to "3rd" since the actual letter is unresolved.
//
// `simSeed` is the per-slot deterministic mapping used by predict-mode
// simulation. We need 8 distinct group letters for the 8 third-place
// slots (each slot's chosen letter must be in its allowed set), and
// the assignment below is one such valid solution. Real FIFA logic
// picks from a published table once we know which 8 of 12 third-place
// teams advance — for an offline simulation, any valid assignment
// makes the visual bracket honest about which groups feed which slot.
const R32_PAIRINGS = [
    { id: 'R32-1',  top: { seed: '1E' }, bot: { seed: '3A/B/C/D/F', simSeed: '3A' } },
    { id: 'R32-2',  top: { seed: '1I' }, bot: { seed: '3C/D/F/G/H', simSeed: '3C' } },
    { id: 'R32-3',  top: { seed: '2A' }, bot: { seed: '2B' } },
    { id: 'R32-4',  top: { seed: '1F' }, bot: { seed: '2C' } },
    { id: 'R32-5',  top: { seed: '2K' }, bot: { seed: '2L' } },
    { id: 'R32-6',  top: { seed: '1H' }, bot: { seed: '2J' } },
    { id: 'R32-7',  top: { seed: '1D' }, bot: { seed: '3B/E/F/I/J', simSeed: '3B' } },
    { id: 'R32-8',  top: { seed: '1G' }, bot: { seed: '3A/E/H/I/J', simSeed: '3H' } },
    { id: 'R32-9',  top: { seed: '1C' }, bot: { seed: '2F' } },
    { id: 'R32-10', top: { seed: '2E' }, bot: { seed: '2I' } },
    { id: 'R32-11', top: { seed: '1A' }, bot: { seed: '3C/E/F/H/I', simSeed: '3F' } },
    { id: 'R32-12', top: { seed: '1L' }, bot: { seed: '3E/H/I/J/K', simSeed: '3K' } },
    { id: 'R32-13', top: { seed: '1J' }, bot: { seed: '2H' } },
    { id: 'R32-14', top: { seed: '2D' }, bot: { seed: '2G' } },
    { id: 'R32-15', top: { seed: '1B' }, bot: { seed: '3E/F/G/I/J', simSeed: '3G' } },
    { id: 'R32-16', top: { seed: '1K' }, bot: { seed: '3D/E/I/J/L', simSeed: '3L' } }
];

function resolveSeed(seed, groups, force, simSeed) {
    // In simulation mode, "3 A/B/C/D/F" labels collapse to a
    // specific group letter via simSeed (e.g. "3A"); the regex below
    // matches "1A".."3L" so position 2 (3rd place) resolves too.
    // The `label` returned is always the original seed so the card
    // still shows the FIFA-allowed letter set when team is null.
    const useSeed = (force && simSeed) ? simSeed : seed;
    const m = /^([123])([A-L])$/.exec(useSeed);
    if (!m) return { label: seed, team: null, resolved: false };
    const position = Number(m[1]) - 1;
    const letter = m[2];
    const group = groups.find(g => g.letter === letter);
    if (!group) return { label: seed, team: null, resolved: false };
    // `force` is the predict-mode escape: standings come from a
    // simulation or user picks, so we trust whatever order the caller
    // gave us. Without force, only expose a team once the group has
    // actually finished — pre-tournament with all teams at 0 points
    // the sort tiebreaks alphabetically, which would imply matchups
    // like "Brazil vs Netherlands" nobody has predicted.
    const allDone = group.teams.length >= 4 && group.teams.every(t => t.mp >= 3);
    if (force || allDone) {
        const team = group.teams[position] || null;
        return { label: seed, team, resolved: !!team };
    }
    return { label: seed, team: null, resolved: false };
}

function buildRound(pairings, groups, force) {
    return pairings.map(p => ({
        id: p.id,
        top: resolveSeed(p.top.seed, groups, force, p.top.simSeed),
        bot: resolveSeed(p.bot.seed, groups, force, p.bot.simSeed)
    }));
}

function buildNextRound(prefix, prev) {
    const out = [];
    for (let i = 0; i < prev.length; i += 2) {
        out.push({
            id: `${prefix}-${i / 2 + 1}`,
            top: { label: '', winnerOf: prev[i].id, team: null, resolved: false },
            bot: { label: '', winnerOf: prev[i + 1].id, team: null, resolved: false }
        });
    }
    return out;
}

function attachFixture(cell, matches) {
    const t1 = cell.top && cell.top.team && cell.top.team.name;
    const t2 = cell.bot && cell.bot.team && cell.bot.team.name;
    if (!t1 || !t2) return cell;
    const found = matches.find(m =>
        (m.team1 === t1 && m.team2 === t2) ||
        (m.team1 === t2 && m.team2 === t1)
    );
    return found ? Object.assign({}, cell, { fixture: found }) : cell;
}

export function buildBracket(groups, matches, opts) {
    const force = !!(opts && opts.forceResolved);
    const ko = (matches || []).filter(m => !m.group);
    const r32 = buildRound(R32_PAIRINGS, groups, force).map(c => attachFixture(c, ko));
    const r16 = buildNextRound('R16', r32).map(c => attachFixture(c, ko));
    const qf = buildNextRound('QF', r16).map(c => attachFixture(c, ko));
    const sf = buildNextRound('SF', qf).map(c => attachFixture(c, ko));
    const final = buildNextRound('F', sf).map(c => attachFixture(c, ko));
    return [
        { key: 'r32', matches: r32 },
        { key: 'r16', matches: r16 },
        { key: 'qf', matches: qf },
        { key: 'sf', matches: sf },
        { key: 'final', matches: final }
    ];
}
