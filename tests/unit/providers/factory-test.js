import { module, test } from 'qunit';
import { createProvider, StaticJsonProvider, FootballDataProvider } from 'world-cup2026-schedule/providers';

const noopFetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });

module('Unit | Provider | factory', function () {
    test('defaults to static when no config', function (assert) {
        const p = createProvider();
        assert.ok(p instanceof StaticJsonProvider);
        assert.equal(p.kind(), 'static');
    });

    test('picks static for { kind: "static" }', function (assert) {
        const p = createProvider({ kind: 'static' });
        assert.ok(p instanceof StaticJsonProvider);
    });

    test('picks football-data for { kind: "football-data", apiKey }', function (assert) {
        const p = createProvider({ kind: 'football-data', apiKey: 'k', fetch: noopFetch });
        assert.ok(p instanceof FootballDataProvider);
        assert.equal(p.kind(), 'football-data');
    });

    test('unknown kind falls back to static', function (assert) {
        const p = createProvider({ kind: 'nonsense' });
        assert.ok(p instanceof StaticJsonProvider);
    });
});
