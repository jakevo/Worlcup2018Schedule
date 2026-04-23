import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';
import { photoFor } from '../utils/team-colors';

const POSITION_BUCKETS = [
    { labelKey: 'team.squad.gk',  match: /^(goalkeeper|gk|keeper|portero)/i },
    { labelKey: 'team.squad.def', match: /^(defender|def|centre-?back|full-?back)/i },
    { labelKey: 'team.squad.mid', match: /^(midfielder|mid)/i },
    { labelKey: 'team.squad.fwd', match: /^(attacker|forward|fwd|striker)/i }
];

function bucketize(squad) {
    const buckets = POSITION_BUCKETS.map(b => ({ labelKey: b.labelKey, players: [] }));
    const other = [];
    for (const p of (squad || [])) {
        const i = POSITION_BUCKETS.findIndex(b => b.match.test(p.position || ''));
        if (i !== -1) buckets[i].players.push(p);
        else other.push(p);
    }
    if (other.length) buckets.push({ labelKey: 'team.squad.other', players: other });
    return buckets;
}

export default Route.extend({
    model(params) {
        const code = (params.code || '').toUpperCase();
        return loadTournament().then(data => {
            let groupLetter = null;
            let groupStanding = null;
            let positionInGroup = null;
            for (const g of data.groups) {
                const idx = g.teams.findIndex(t => (t.fifaCode || '').toUpperCase() === code);
                if (idx !== -1) {
                    groupLetter = g.letter;
                    groupStanding = g.teams[idx];
                    positionInGroup = idx + 1;
                    break;
                }
            }
            if (!groupStanding) return { notFound: true, code };

            const team = data.teams.find(t => (t.fifaCode || '').toUpperCase() === code);
            const fixtures = data.matches.filter(m =>
                m.team1Code === code || m.team2Code === code
            );
            const groupTeams = (data.groups.find(g => g.letter === groupLetter) || {}).teams || [];

            const squadSource = (data.squads && data.squads[code]) ||
                (team && team.squad) || [];

            const lineup = (data.lineups && data.lineups[code]) || null;
            const formation = (lineup && lineup.formation) || '4-3-3';
            const startingXI = (lineup && lineup.startXI) || [];
            const startingXIRows = [];
            for (let i = 0; i < 11; i++) startingXIRows.push(startingXI[i] || {});

            return {
                team,
                groupLetter,
                groupStanding,
                positionInGroup,
                groupTeams,
                fixtures,
                heroPhoto: photoFor(code),
                squad: squadSource,
                squadByPosition: bucketize(squadSource),
                formation,
                startingXI,
                startingXIRows
            };
        });
    }
});
