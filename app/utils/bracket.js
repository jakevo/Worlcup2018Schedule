/*
 * 2026 knockout-stage pairings. These mirror FIFA's published bracket
 * paths for the first 16-team Round of 32. Top-2 slots are resolved
 * directly from group standings; "best third" slots stay as
 * placeholders until those rankings can be computed from played
 * matches.
 */
const R32_PAIRINGS = [
    { id: 'R32-1',  top: { seed: '1A' }, bot: { seed: '3C/D/E/F' } },
    { id: 'R32-2',  top: { seed: '1C' }, bot: { seed: '3A/B/F/H' } },
    { id: 'R32-3',  top: { seed: '1E' }, bot: { seed: '3A/B/C/D' } },
    { id: 'R32-4',  top: { seed: '1G' }, bot: { seed: '3E/H/I/J' } },
    { id: 'R32-5',  top: { seed: '1I' }, bot: { seed: '3D/E/F/G' } },
    { id: 'R32-6',  top: { seed: '1K' }, bot: { seed: '3B/E/H/J' } },
    { id: 'R32-7',  top: { seed: '1B' }, bot: { seed: '2F' } },
    { id: 'R32-8',  top: { seed: '1D' }, bot: { seed: '2H' } },
    { id: 'R32-9',  top: { seed: '1F' }, bot: { seed: '2L' } },
    { id: 'R32-10', top: { seed: '1H' }, bot: { seed: '2J' } },
    { id: 'R32-11', top: { seed: '1J' }, bot: { seed: '2B' } },
    { id: 'R32-12', top: { seed: '1L' }, bot: { seed: '2D' } },
    { id: 'R32-13', top: { seed: '2A' }, bot: { seed: '2C' } },
    { id: 'R32-14', top: { seed: '2E' }, bot: { seed: '2G' } },
    { id: 'R32-15', top: { seed: '2I' }, bot: { seed: '2K' } },
    { id: 'R32-16', top: { seed: '3G/H/I/J/K/L' }, bot: { seed: '3A/B/C/D/E/F/K/L' } }
];

function resolveSeed(seed, groups) {
    const m = /^([12])([A-L])$/.exec(seed);
    if (!m) return { label: seed, team: null, resolved: false };
    const position = Number(m[1]) - 1;
    const letter = m[2];
    const group = groups.find(g => g.letter === letter);
    if (!group) return { label: seed, team: null, resolved: false };
    const team = group.teams[position];
    const anyPlayed = group.teams.some(t => t.mp > 0);
    if (team && anyPlayed) {
        return { label: seed, team, resolved: true };
    }
    return { label: seed, team, resolved: false };
}

function buildRound(pairings, groups) {
    return pairings.map(p => ({
        id: p.id,
        top: resolveSeed(p.top.seed, groups),
        bot: resolveSeed(p.bot.seed, groups)
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

export function buildBracket(groups) {
    const r32 = buildRound(R32_PAIRINGS, groups);
    const r16 = buildNextRound('R16', r32);
    const qf = buildNextRound('QF', r16);
    const sf = buildNextRound('SF', qf);
    const final = buildNextRound('F', sf);
    return [
        { key: 'r32', matches: r32 },
        { key: 'r16', matches: r16 },
        { key: 'qf', matches: qf },
        { key: 'sf', matches: sf },
        { key: 'final', matches: final }
    ];
}
