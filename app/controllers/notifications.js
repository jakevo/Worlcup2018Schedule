import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
    locale: service('locale'),

    email: '',
    submitting: false,
    submittedState: null, // 'subscribed' | 'already_subscribed' | null
    errorKey: null,

    actions: {
        async submit(evt) {
            if (evt && evt.preventDefault) evt.preventDefault();
            if (this.get('submitting')) return;
            const email = (this.get('email') || '').trim();
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                this.set('errorKey', 'notify.signup.error.invalid');
                this.set('submittedState', null);
                return;
            }
            this.set('errorKey', null);
            this.set('submitting', true);
            try {
                const res = await fetch('/waitlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        locale: this.get('locale.current') || 'en'
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                    const code = data && data.error;
                    this.set('errorKey',
                        code === 'invalid_email' ? 'notify.signup.error.invalid'
                        : code === 'storage_not_configured' ? 'notify.signup.error.storage'
                        : 'notify.signup.error.network');
                    return;
                }
                this.set('submittedState', data.status || 'subscribed');
                this.set('email', '');
            } catch (err) {
                this.set('errorKey', 'notify.signup.error.network');
            } finally {
                this.set('submitting', false);
            }
        }
    }
});
