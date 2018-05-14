import DS from 'ember-data';
import { computed } from '@ember/object'

export default DS.Model.extend({
    name: DS.attr('string'),  
    flag: DS.attr('string'),
    fifaCode: DS.attr('string'),
    isEqual: computed('id', function() {
        return this.get('id') <= 4;
    }),
    isEqualA: computed('id', function() {
        return this.get('id') > 4 && this.get('id') <= 8;
    }),
    isEqualB: computed('id', function() {
        return this.get('id') > 8 && this.get('id') <= 12;
    }),
    isEqualC: computed('id', function() {
        return this.get('id') > 12 && this.get('id') <= 16;
    }),
    isEqualD: computed('id', function() {
        return this.get('id') > 16 && this.get('id') <= 20;
    }),
    isEqualE: computed('id', function() {
        return this.get('id') > 20 && this.get('id') <= 24;
    }),
    isEqualF: computed('id', function() {
        return this.get('id') > 24 && this.get('id') <= 28;
    }),
    isEqualG: computed('id', function() {
        return this.get('id') > 28 && this.get('id') <= 32;
    })   
});



