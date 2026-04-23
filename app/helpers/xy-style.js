import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

export default helper(function ([x, y]) {
    const cx = Math.max(0, Math.min(100, Number(x) || 0));
    const cy = Math.max(0, Math.min(100, Number(y) || 0));
    return htmlSafe(`left: ${cx}%; top: ${cy}%;`);
});
