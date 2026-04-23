import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Helper.extend({
    locale: service('locale'),

    compute([key]) {
        return this.get('locale').t(key);
    },

    _onLocaleChange: observer('locale.current', function () {
        this.recompute();
    })
});
