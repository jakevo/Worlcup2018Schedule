import { helper } from '@ember/component/helper';

export function pct([value]) {
    const n = Number(value);
    if (!isFinite(n)) return '';
    return `${n.toFixed(1)}%`;
}

export default helper(pct);
