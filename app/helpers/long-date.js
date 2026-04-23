import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Helper.extend({
    locale: service('locale'),

    compute([iso]) {
        if (!iso) return '';
        const d = new Date(`${iso}T12:00:00Z`);
        const t = this.get('locale').t.bind(this.get('locale'));
        const weekday = t(`weekday.full.${d.getUTCDay()}`);
        const month = t(`month.full.${d.getUTCMonth() + 1}`);
        const day = d.getUTCDate();
        const monthFirst = t('date.monthFirst');
        const datePart = monthFirst === true ? `${month} ${day}` : `${day} ${month}`;
        return `${weekday}, ${datePart}`;
    },

    _onLocaleChange: observer('locale.current', function () {
        this.recompute();
    })
});
