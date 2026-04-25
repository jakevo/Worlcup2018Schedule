import Component from '@ember/component';

export default Component.extend({
    tagName: 'div',
    classNames: ['wc-bp-match'],
    classNameBindings: ['hasFixture:has-fixture'],
    match: null,

    hasFixture: function () {
        return !!this.get('match.fixture');
    }.property('match.fixture')
});
