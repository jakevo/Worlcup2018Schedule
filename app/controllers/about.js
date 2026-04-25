import Controller from '@ember/controller';

// Edit these two values to point at your own donate page and contact inbox.
const DONATE_URL = 'https://www.buymeacoffee.com/wc2026hub';
const HIRE_EMAIL = 'javoucsd@gmail.com';

export default Controller.extend({
    donateUrl: DONATE_URL,
    hireEmail: HIRE_EMAIL,
    hireMailto: `mailto:${HIRE_EMAIL}?subject=${encodeURIComponent('Website project — let’s talk')}`
});
