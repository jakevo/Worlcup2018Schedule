import Helper from '@ember/component/helper';

export default Helper.extend({
    compute([iso]) {
        if (!iso) return '';
        const d = new Date(`${iso}T12:00:00Z`);
        return d.getUTCDate();
    }
});
