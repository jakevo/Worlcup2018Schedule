import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';
import { photoFor } from '../utils/team-colors';

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

            return {
                team,
                groupLetter,
                groupStanding,
                positionInGroup,
                groupTeams,
                fixtures,
                heroPhoto: photoFor(code)
            };
        });
    }
});
