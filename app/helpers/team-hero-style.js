import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';
import { colorsFor } from '../utils/team-colors';

export default helper(function ([fifaCode]) {
    const { primary, secondary } = colorsFor(fifaCode);
    return htmlSafe(`--team-primary: ${primary}; --team-secondary: ${secondary};`);
});
