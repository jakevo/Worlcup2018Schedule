import Service from '@ember/service';
import { computed } from '@ember/object';
import EN from 'world-cup2026-schedule/locales/en';
import VI from 'world-cup2026-schedule/locales/vi';

const DICTS = { en: EN, vi: VI };
const STORAGE_KEY = 'wc-locale';

function detectInitialLocale() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && DICTS[saved]) return saved;
    } catch (e) { /* ignore */ }
    if (typeof navigator !== 'undefined' && /^vi\b/i.test(navigator.language || '')) {
        return 'vi';
    }
    return 'en';
}

export default Service.extend({
    current: 'en',

    init() {
        this._super(...arguments);
        this.set('current', detectInitialLocale());
    },

    isVi: computed('current', function () {
        return this.get('current') === 'vi';
    }),

    t(key) {
        const dict = DICTS[this.get('current')] || EN;
        if (dict[key] != null) return dict[key];
        if (EN[key] != null) return EN[key];
        return key;
    },

    setLocale(locale) {
        if (!DICTS[locale] || locale === this.get('current')) return;
        this.set('current', locale);
        try { localStorage.setItem(STORAGE_KEY, locale); } catch (e) { /* ignore */ }
    },

    toggle() {
        this.setLocale(this.get('current') === 'vi' ? 'en' : 'vi');
    }
});
