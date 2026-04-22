import { helper } from '@ember/component/helper';

export function shortDate([iso]) {
    if (!iso) return '';
    const d = new Date(`${iso}T12:00:00Z`);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default helper(shortDate);
