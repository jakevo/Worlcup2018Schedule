import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { invalidateTournamentCache } from '../utils/tournament-data';

export default Controller.extend({
    groupFilter: 'all',
    searchQuery: '',
    showPlayedOnly: false,
    selectedDate: null,
    _dateInitialized: false,

    allGroups: computed('model.groups.[]', function () {
        return (this.get('model.groups') || []).map(g => g.letter);
    }),

    allDays: computed('model.matchesByDate.[]', 'groupFilter', 'searchQuery', 'showPlayedOnly', function () {
        const group = this.get('groupFilter');
        const query = (this.get('searchQuery') || '').trim().toLowerCase();
        const playedOnly = this.get('showPlayedOnly');
        const days = this.get('model.matchesByDate') || [];

        return days
            .map(day => {
                const matches = day.matches.filter(m => {
                    if (group && group !== 'all') {
                        if (group === 'knockout') {
                            // Knockout matches have no group letter from the
                            // api-football feed; only group-stage rows do.
                            if (m.group) return false;
                        } else if (m.group !== group) {
                            return false;
                        }
                    }
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

    todayOrNext: computed('allDays.[]', function () {
        const days = this.get('allDays') || [];
        if (!days.length) return null;
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (days.some(d => d.date === today)) return today;
        const upcoming = days.find(d => d.date >= today);
        return upcoming ? upcoming.date : days[days.length - 1].date;
    }),

    activeDate: computed('selectedDate', 'todayOrNext', '_dateInitialized', function () {
        const selected = this.get('selectedDate');
        if (selected) return selected;
        if (!this.get('_dateInitialized')) return this.get('todayOrNext');
        return null;
    }),

    filteredDays: computed('allDays.[]', 'activeDate', function () {
        const days = this.get('allDays') || [];
        const active = this.get('activeDate');
        if (!active) return days;
        return days.filter(d => d.date === active);
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
        },
        selectDate(date) {
            if (this.get('activeDate') === date) {
                this.set('selectedDate', null);
                this.set('_dateInitialized', true);
            } else {
                this.set('selectedDate', date);
                this.set('_dateInitialized', true);
            }
        },
        showAllDates() {
            this.set('selectedDate', null);
            this.set('_dateInitialized', true);
        },
        refresh() {
            invalidateTournamentCache();
            getOwner(this).lookup('route:application').refresh();
        }
    }
});
