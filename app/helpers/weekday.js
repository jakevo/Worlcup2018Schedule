import { helper } from '@ember/component/helper';

export function weekday([iso]) {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00Z`);
    return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

export default helper(weekday);
