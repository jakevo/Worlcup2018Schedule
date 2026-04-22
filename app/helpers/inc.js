import { helper } from '@ember/component/helper';

export function inc([n]) {
    const val = Number(n);
    return Number.isNaN(val) ? n : val + 1;
}

export default helper(inc);
