import Route from '@ember/routing/route';
import { loadTournament } from '../utils/tournament-data';

export default Route.extend({
    model() {
        return loadTournament().then(data => {
            const matchCounts = new Map();
            for (const m of data.matches) {
                matchCounts.set(m.venue, (matchCounts.get(m.venue) || 0) + 1);
            }
            const iso = { Canada: 'ca', Mexico: 'mx', USA: 'us' };
            const venues = (data.venues || []).map(v => ({
                city: v.city,
                country: v.country,
                stadium: v.stadium,
                capacity: v.capacity,
                capacityFmt: Number(v.capacity || 0).toLocaleString('en-US'),
                flag: `https://flagcdn.com/w160/${iso[v.country] || 'un'}.png`,
                matches: matchCounts.get(v.stadium) || 0
            }));
            venues.sort((a, b) => b.matches - a.matches || b.capacity - a.capacity);
            const byCountry = { Mexico: [], Canada: [], USA: [] };
            for (const v of venues) {
                if (byCountry[v.country]) byCountry[v.country].push(v);
            }
            return {
                venues,
                groupedByCountry: [
                    { country: 'USA', flag: 'https://flagcdn.com/w160/us.png', venues: byCountry.USA },
                    { country: 'Mexico', flag: 'https://flagcdn.com/w160/mx.png', venues: byCountry.Mexico },
                    { country: 'Canada', flag: 'https://flagcdn.com/w160/ca.png', venues: byCountry.Canada }
                ],
                totalCapacity: venues.reduce((n, v) => n + v.capacity, 0)
            };
        });
    }
});
