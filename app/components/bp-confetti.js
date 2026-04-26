import Component from '@ember/component';
import { observer } from '@ember/object';

// Particle burst when the champion is crowned. The .confetti CSS rule
// pins this element absolute over its parent (.bt or .mh) and clips
// overflow.
const COLORS = ['#ffd561', '#e5174a', '#ff4d6d', '#ffb627', '#fff', '#1ac0a6'];

export default Component.extend({
    tagName: 'div',
    classNames: ['confetti'],
    attributeBindings: ['ariaHidden:aria-hidden'],
    ariaHidden: 'true',

    active: null,

    init() {
        this._super(...arguments);
        this.get('active');  // activate observer
    },

    didInsertElement() {
        this._super(...arguments);
        this._renderPieces();
    },

    _activeChanged: observer('active', function () {
        if (this.isDestroyed || this.isDestroying) return;
        this._renderPieces();
    }),

    _renderPieces() {
        const el = this.element;
        if (!el) return;
        el.innerHTML = '';
        if (!this.get('active')) {
            el.style.display = 'none';
            return;
        }
        el.style.display = '';
        for (let i = 0; i < 80; i++) {
            const p = document.createElement('span');
            p.className = 'confetti__piece';
            p.style.left = (Math.random() * 100) + '%';
            p.style.background = COLORS[i % COLORS.length];
            p.style.animationDelay = (Math.random() * 0.6) + 's';
            p.style.animationDuration = (2 + Math.random() * 2.5) + 's';
            p.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
            el.appendChild(p);
        }
    }
});
