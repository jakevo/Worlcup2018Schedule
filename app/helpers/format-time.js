import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';

export default Helper.extend({
    locale: service('locale'),

    compute([time]) {
        if (!time) return '';
        const [hStr, mStr] = String(time).split(':');
        let h = parseInt(hStr, 10);
        const m = mStr || '00';
        if (Number.isNaN(h)) return time;
        const suffix = this.get('locale').t(h >= 12 ? 'time.pm' : 'time.am');
        const tz = this.get('locale').t('time.et');
        const hour12 = ((h + 11) % 12) + 1;
        return `${hour12}:${m} ${suffix} ${tz}`;
    },

    _onLocaleChange: observer('locale.current', function () {
        this.recompute();
    })
});
