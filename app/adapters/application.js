import DS from 'ember-data';

export default DS.JSONAPIAdapter.extend({
    urlForFindAll(modelName, snapShot){
        return 'https://raw.githubusercontent.com/lsv/fifa-worldcup-2018/master/data.json';
    }
});
