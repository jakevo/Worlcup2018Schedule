import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

export default helper(function ([value]) {
    const n = Math.max(0, Math.min(100, Number(value) || 0));
    return htmlSafe(`width: ${n}%;`);
});
