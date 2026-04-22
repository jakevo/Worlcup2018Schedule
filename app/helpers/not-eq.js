import { helper } from '@ember/component/helper';

export function notEq([a, b]) {
    return a !== b;
}

export default helper(notEq);
