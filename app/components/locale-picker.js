import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

const LOCALES = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'vi', label: 'Tiếng Việt', short: 'VI' }
];

export default Component.extend({
    locale: service('locale'),
    tagName: 'div',
    classNames: ['wc-locale'],
    classNameBindings: ['isOpen:is-open'],
    isOpen: false,
    locales: LOCALES,

    _outsideHandler: null,

    didInsertElement() {
        this._super(...arguments);
        this._outsideHandler = (evt) => {
            if (this.get('isOpen') && this.element && !this.element.contains(evt.target)) {
                this.set('isOpen', false);
            }
        };
        document.addEventListener('click', this._outsideHandler, true);
    },

    willDestroyElement() {
        this._super(...arguments);
        if (this._outsideHandler) {
            document.removeEventListener('click', this._outsideHandler, true);
            this._outsideHandler = null;
        }
    },

    currentLocale: computed('locale.current', function () {
        const code = this.get('locale.current');
        return LOCALES.find(l => l.code === code) || LOCALES[0];
    }),

    actions: {
        toggle() {
            this.set('isOpen', !this.get('isOpen'));
        },
        select(code) {
            this.get('locale').setLocale(code);
            this.set('isOpen', false);
        }
    }
});
