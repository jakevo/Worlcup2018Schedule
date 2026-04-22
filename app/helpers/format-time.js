import { helper } from '@ember/component/helper';

export function formatTime([time]) {
    if (!time) return '';
    const [hStr, mStr] = String(time).split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (Number.isNaN(h)) return time;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${m} ${suffix} ET`;
}

export default helper(formatTime);
