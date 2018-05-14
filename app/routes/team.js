import Route from '@ember/routing/route';

export default Route.extend({
    model: function(params){
        return this.get('store').findAll('team', params.id );
    }
});
