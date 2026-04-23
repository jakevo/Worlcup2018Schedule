import { module, test } from 'qunit';
import ApiFootballProvider from 'world-cup2026-schedule/providers/api-football';

function mockResponse(body, ok = true, status = 200) {
    return { ok, status, json: () => Promise.resolve(body) };
}

function mockFetch(routes) {
    const calls = [];
    const fn = (url, opts) => {
        calls.push({ url, opts });
        const key = Object.keys(routes).find(k => url.indexOf(k) !== -1);
        if (key) return Promise.resolve(routes[key]);
        return Promise.resolve(mockResponse({}, false, 404));
    };
    fn.calls = calls;
    return fn;
}

const TEAMS_RESPONSE = {
    response: [
        {
            team: { id: 26, name: 'Mexico', code: 'MEX', country: 'Mexico', logo: 'https://x/mx.png' },
            venue: { name: 'Estadio Azteca', city: 'Mexico City', capacity: 83000 }
        },
        {
            team: { id: 7, name: 'South Africa', code: 'RSA', country: 'South Africa', logo: 'https://x/za.png' },
            venue: { name: 'FNB Stadium', city: 'Johannesburg', capacity: 94000 }
        }
    ]
};

const FIXTURES_RESPONSE = {
    response: [
        {
            fixture: {
                id: 100001,
                date: '2026-06-11T22:00:00+00:00',
                status: { short: 'NS', long: 'Not Started' },
                venue: { name: 'Estadio Azteca', city: 'Mexico City' }
            },
            league: { id: 1, season: 2026, round: 'Group A - 1' },
            teams: { home: { id: 26, name: 'Mexico' }, away: { id: 7, name: 'South Africa' } },
            goals: { home: null, away: null }
        },
        {
            fixture: {
                id: 100002,
                date: '2026-06-25T19:00:00+00:00',
                status: { short: 'FT', long: 'Match Finished' },
                venue: { name: 'MetLife Stadium', city: 'East Rutherford' }
            },
            league: { id: 1, season: 2026, round: 'Round of 16' },
            teams: { home: { id: 26, name: 'Mexico' }, away: { id: 7, name: 'South Africa' } },
            goals: { home: 2, away: 1 }
        }
    ]
};

module('Unit | Provider | api-football', function () {
    test('constructor requires proxyUrl OR apiKey', function (assert) {
        assert.throws(() => new ApiFootballProvider({ fetch: () => {} }), /proxyUrl.*apiKey/);
    });

    test('accepts proxyUrl without apiKey (preferred mode)', function (assert) {
        const p = new ApiFootballProvider({ proxyUrl: 'https://proxy.example', fetch: mockFetch({}) });
        assert.equal(p.mode(), 'proxy');
    });

    test('accepts apiKey without proxyUrl (direct, dev-only)', function (assert) {
        const p = new ApiFootballProvider({ apiKey: 'k', fetch: mockFetch({}) });
        assert.equal(p.mode(), 'direct');
    });

    test('kind() returns "api-football"', function (assert) {
        const p = new ApiFootballProvider({ apiKey: 'k', fetch: mockFetch({}) });
        assert.equal(p.kind(), 'api-football');
    });

    test('direct mode: sends x-apisports-key header on every request', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_RESPONSE),
            '/fixtures': mockResponse(FIXTURES_RESPONSE)
        });
        const p = new ApiFootballProvider({ apiKey: 'abc-123', fetch });
        return p.load().then(() => {
            fetch.calls.forEach(c => {
                assert.equal(c.opts.headers['x-apisports-key'], 'abc-123',
                    `${c.url} carried the api-sports key`);
            });
        });
    });

    test('proxy mode: does NOT send the key client-side, hits proxyUrl', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_RESPONSE),
            '/fixtures': mockResponse(FIXTURES_RESPONSE)
        });
        const p = new ApiFootballProvider({ proxyUrl: 'https://proxy.example', fetch });
        return p.load().then(() => {
            fetch.calls.forEach(c => {
                assert.ok(c.url.indexOf('https://proxy.example') === 0,
                    `${c.url} routed through proxy`);
                assert.strictEqual(c.opts.headers['x-apisports-key'], undefined,
                    'no key header in proxy mode');
            });
        });
    });

    test('requests league=1 season=2026 by default', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_RESPONSE),
            '/fixtures': mockResponse(FIXTURES_RESPONSE)
        });
        const p = new ApiFootballProvider({ apiKey: 'k', fetch });
        return p.load().then(() => {
            assert.ok(fetch.calls.some(c => /league=1/.test(c.url) && /season=2026/.test(c.url)),
                'default league/season are 1 / 2026');
        });
    });

    test('honours custom leagueId + season', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse({ response: [] }),
            '/fixtures': mockResponse({ response: [] })
        });
        const p = new ApiFootballProvider({ apiKey: 'k', fetch, leagueId: 42, season: 2030 });
        return p.load().then(() => {
            assert.ok(fetch.calls.every(c => /league=42/.test(c.url) && /season=2030/.test(c.url)),
                'override applied to both endpoints');
        });
    });

    test('normalizes teams into { name, fifaCode, flag, iso2 }', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_RESPONSE),
            '/fixtures': mockResponse(FIXTURES_RESPONSE)
        });
        const p = new ApiFootballProvider({ apiKey: 'k', fetch });
        return p.load().then(data => {
            assert.equal(data.teams.length, 2);
            assert.equal(data.teams[0].name, 'Mexico');
            assert.equal(data.teams[0].fifaCode, 'MEX');
            assert.equal(data.teams[0].flag, 'https://x/mx.png');
            assert.equal(data.teams[0].iso2, 'me', 'iso2 derived from first 2 chars of country name');
        });
    });

    test('extracts unique venues from team list', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_RESPONSE),
            '/fixtures': mockResponse(FIXTURES_RESPONSE)
        });
        const p = new ApiFootballProvider({ apiKey: 'k', fetch });
        return p.load().then(data => {
            assert.equal(data.venues.length, 2);
            assert.equal(data.venues[0].stadium, 'Estadio Azteca');
            assert.equal(data.venues[0].capacity, 83000);
        });
    });

    test('normalizes fixtures: date + HH:mm split, score only when finished', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_RESPONSE),
            '/fixtures': mockResponse(FIXTURES_RESPONSE)
        });
        const p = new ApiFootballProvider({ apiKey: 'k', fetch });
        return p.load().then(data => {
            assert.equal(data.matches.length, 2);
            const m0 = data.matches[0];
            assert.equal(m0.date, '2026-06-11');
            assert.equal(m0.time, '22:00');
            assert.equal(m0.team1, 'Mexico');
            assert.equal(m0.team2, 'South Africa');
            assert.strictEqual(m0.score1, undefined, 'no score for NS fixture');

            const m1 = data.matches[1];
            assert.equal(m1.score1, 2);
            assert.equal(m1.score2, 1);
        });
    });

    test('parses group letter from round string "Group A - 1"', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_RESPONSE),
            '/fixtures': mockResponse(FIXTURES_RESPONSE)
        });
        const p = new ApiFootballProvider({ apiKey: 'k', fetch });
        return p.load().then(data => {
            assert.equal(data.matches[0].group, 'A', 'group stage round parsed');
            assert.equal(data.matches[1].group, null, 'knockout round -> no group');
        });
    });
});
