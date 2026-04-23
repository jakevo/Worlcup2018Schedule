import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { loadTournament, loadSquad } from '../utils/tournament-data';
import { photoFor } from '../utils/team-colors';

const POSITION_BUCKETS = [
    { labelKey: 'team.squad.gk',  match: /^(goalkeeper|gk|keeper|portero)/i },
    { labelKey: 'team.squad.def', match: /^(defender|def|centre-?back|full-?back)/i },
    { labelKey: 'team.squad.mid', match: /^(midfielder|mid)/i },
    { labelKey: 'team.squad.fwd', match: /^(attacker|forward|fwd|striker)/i }
];

const POSITION_ORDER = { goalkeeper: 0, defender: 1, midfielder: 2, attacker: 3 };

function positionWeight(p) {
    const key = String(p || '').toLowerCase().split(' ')[0];
    return POSITION_ORDER[key] != null ? POSITION_ORDER[key] : 4;
}

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

/*
 * Construct a probable XI from a squad. No shirt-number magic —
 * pick 1 GK, 4 DEF, 3 MID, 3 FWD (default 4-3-3) in roster order.
 * Replaced by real lineups when /fixtures/lineups is wired.
 */
function pickStartingXI(squad) {
    const sorted = (squad || []).slice().sort((a, b) =>
        positionWeight(a.position) - positionWeight(b.position));
    const gk = sorted.filter(p => /^goalkeeper/i.test(p.position || '')).slice(0, 1);
    const def = sorted.filter(p => /^defender/i.test(p.position || '')).slice(0, 4);
    const mid = sorted.filter(p => /^midfielder/i.test(p.position || '')).slice(0, 3);
    const fwd = sorted.filter(p => /^(attacker|forward)/i.test(p.position || '')).slice(0, 3);
    return gk.concat(def, mid, fwd);
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

            return RSVP.hash({
                tournament: data,
                squad: team && team.id ? loadSquad(team.id) : Promise.resolve([])
            }).then(({ squad }) => {
                const startingXI = pickStartingXI(squad);
                const startingXIRows = [];
                for (let i = 0; i < 11; i++) startingXIRows.push(startingXI[i] || {});
                const formation = '4-3-3';

                return {
                    team,
                    groupLetter,
                    groupStanding,
                    positionInGroup,
                    groupTeams,
                    fixtures,
                    heroPhoto: photoFor(code),
                    squad,
                    squadByPosition: bucketize(squad),
                    formation,
                    startingXI,
                    startingXIRows
                };
            });
        });
    }
});
