import Controller from '@ember/controller';

// Edit these two values to point at your own donate page and contact inbox.
const DONATE_URL = 'https://account.venmo.com/u/Jake-Vo-1';
const HIRE_EMAIL = 'javoucsd@gmail.com';

export default Controller.extend({
    donateUrl: DONATE_URL,
    hireEmail: HIRE_EMAIL,
    hireMailto: `mailto:${HIRE_EMAIL}?subject=${encodeURIComponent('Website project — let’s talk')}`
});
