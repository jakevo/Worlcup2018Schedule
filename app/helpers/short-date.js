import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Helper.extend({
    locale: service('locale'),

    compute([iso]) {
        if (!iso) return '';
        const d = new Date(`${iso}T12:00:00Z`);
        const month = this.get('locale').t(`month.${d.getUTCMonth() + 1}`);
        const day = d.getUTCDate();
        const monthFirst = this.get('locale').t('date.monthFirst');
        return monthFirst === true ? `${month} ${day}` : `${day} ${month}`;
    },

    _onLocaleChange: observer('locale.current', function () {
        this.recompute();
    })
});
