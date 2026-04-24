import Controller from '@ember/controller';

export default Controller.extend({
    activeVenue: null,

    actions: {
        openVenue(venue) {
            this.set('activeVenue', venue);
            document.body.style.overflow = 'hidden';
        },
        closeVenue() {
            this.set('activeVenue', null);
            document.body.style.overflow = '';
        }
    }
});
