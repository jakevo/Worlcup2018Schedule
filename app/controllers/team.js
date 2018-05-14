import Controller from '@ember/controller';

export default Controller.extend({
    check: function(params){
        if (params == 1){
            return true;
        }
    }
});
