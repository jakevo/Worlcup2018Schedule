import { module, test } from 'qunit';
import FootballDataProvider from 'world-cup2026-schedule/providers/football-data';

function mockResponse(body, ok = true, status = 200) {
    return { ok, status, json: () => Promise.resolve(body) };
}

function mockFetch(responses) {
    const calls = [];
    const fn = (url, opts) => {
        calls.push({ url, opts });
        const key = Object.keys(responses).find(k => url.indexOf(k) !== -1);
        if (key) return Promise.resolve(responses[key]);
        return Promise.resolve(mockResponse({}, false, 404));
    };
    fn.calls = calls;
    return fn;
}

const TEAMS_PAYLOAD = {
    competition: { name: 'FIFA World Cup' },
    teams: [
        { id: 101, name: 'Argentina', tla: 'ARG', crest: 'https://x/ar.svg', area: { name: 'South America' } },
        { id: 102, name: 'Brazil',    tla: 'BRA', crest: 'https://x/br.svg', area: { name: 'South America' } }
    ]
};
const MATCHES_PAYLOAD = {
    matches: [
        {
            utcDate: '2026-06-11T22:00:00Z',
            status: 'TIMED',
            homeTeam: { name: 'Argentina' },
            awayTeam: { name: 'Brazil' },
            score: { fullTime: { home: null, away: null } }
        },
        {
            utcDate: '2026-06-25T19:00:00Z',
            status: 'FINISHED',
            homeTeam: { name: 'Argentina' },
            awayTeam: { name: 'Brazil' },
            score: { fullTime: { home: 2, away: 1 } }
        }
    ]
};

module('Unit | Provider | football-data', function () {
    test('constructor requires apiKey', function (assert) {
        assert.throws(() => new FootballDataProvider({ fetch: () => {} }), /apiKey/);
    });

    test('kind() returns "football-data"', function (assert) {
        const p = new FootballDataProvider({ apiKey: 'k', fetch: mockFetch({}) });
        assert.equal(p.kind(), 'football-data');
    });

    test('sends X-Auth-Token header on every request', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_PAYLOAD),
            '/matches': mockResponse(MATCHES_PAYLOAD)
        });
        const p = new FootballDataProvider({ apiKey: 'abc-123', fetch });
        return p.load().then(() => {
            fetch.calls.forEach(c => {
                assert.equal(c.opts.headers['X-Auth-Token'], 'abc-123',
                    `${c.url} carried the auth token`);
            });
        });
    });

    test('load() normalizes teams into { name, fifaCode, flag }', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_PAYLOAD),
            '/matches': mockResponse(MATCHES_PAYLOAD)
        });
        const p = new FootballDataProvider({ apiKey: 'k', fetch });
        return p.load().then(data => {
            assert.equal(data.teams.length, 2);
            assert.equal(data.teams[0].name, 'Argentina');
            assert.equal(data.teams[0].fifaCode, 'ARG');
            assert.equal(data.teams[0].flag, 'https://x/ar.svg');
        });
    });

    test('load() normalizes matches, splitting UTC into date + HH:mm', function (assert) {
        const fetch = mockFetch({
            '/teams': mockResponse(TEAMS_PAYLOAD),
            '/matches': mockResponse(MATCHES_PAYLOAD)
        });
        const p = new FootballDataProvider({ apiKey: 'k', fetch });
        return p.load().then(data => {
            assert.equal(data.matches.length, 2);
            assert.equal(data.matches[0].date, '2026-06-11');
            assert.equal(data.matches[0].time, '22:00');
            assert.equal(data.matches[0].team1, 'Argentina');
            assert.strictEqual(data.matches[0].score1, undefined, 'unplayed: no score');
            assert.equal(data.matches[1].score1, 2, 'finished: score attached');
            assert.equal(data.matches[1].score2, 1);
        });
    });
});
