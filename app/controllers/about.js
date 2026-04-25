import Controller from '@ember/controller';

// Edit these values to point at your own donate page, contact inbox, and socials.
const DONATE_URL = 'https://account.venmo.com/u/Jake-Vo-1';
const HIRE_EMAIL = 'javoucsd@gmail.com';
const LINKEDIN_URL = 'https://www.linkedin.com/in/jake-vo-888353112/';
const FACEBOOK_URL = 'https://www.facebook.com/jake.vo0206';
const TELEGRAM_URL = 'https://t.me/jakevo2026';

export default Controller.extend({
    donateUrl: DONATE_URL,
    hireEmail: HIRE_EMAIL,
    hireMailto: `mailto:${HIRE_EMAIL}?subject=${encodeURIComponent('Website project — let’s talk')}`,
    linkedinUrl: LINKEDIN_URL,
    facebookUrl: FACEBOOK_URL,
    telegramUrl: TELEGRAM_URL
});
