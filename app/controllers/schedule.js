import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
    groupFilter: 'all',
    searchQuery: '',
    showPlayedOnly: false,

    allGroups: computed('model.groups.[]', function () {
        return (this.get('model.groups') || []).map(g => g.letter);
    }),

    filteredDays: computed('model.matchesByDate.[]', 'groupFilter', 'searchQuery', 'showPlayedOnly', function () {
        const group = this.get('groupFilter');
        const query = (this.get('searchQuery') || '').trim().toLowerCase();
        const playedOnly = this.get('showPlayedOnly');
        const days = this.get('model.matchesByDate') || [];

        return days
            .map(day => {
                const matches = day.matches.filter(m => {
                    if (group && group !== 'all' && m.group !== group) return false;
                    if (playedOnly && !m.played) return false;
                    if (query) {
                        const hay = `${m.team1} ${m.team2} ${m.city} ${m.venue}`.toLowerCase();
                        if (!hay.includes(query)) return false;
                    }
                    return true;
                });
                return matches.length ? Object.assign({}, day, { matches }) : null;
            })
            .filter(Boolean);
    }),

    totalFiltered: computed('filteredDays.[]', function () {
        return (this.get('filteredDays') || []).reduce((n, d) => n + d.matches.length, 0);
    }),

    actions: {
        setGroupFilter(letter) {
            this.set('groupFilter', letter);
        },
        clearFilters() {
            this.set('groupFilter', 'all');
            this.set('searchQuery', '');
            this.set('showPlayedOnly', false);
        },
        togglePlayedOnly() {
            this.set('showPlayedOnly', !this.get('showPlayedOnly'));
        }
    }
});
