import { module, test } from 'qunit';
import StaticJsonProvider from 'world-cup2026-schedule/providers/static-json';

function mockResponse(body, ok = true, status = 200) {
    return {
        ok,
        status,
        json: () => Promise.resolve(body)
    };
}

function mockFetch(responses) {
    const calls = [];
    const fn = (url, opts) => {
        calls.push({ url, opts });
        if (typeof responses === 'function') return Promise.resolve(responses(url));
        if (responses[url]) return Promise.resolve(responses[url]);
        return Promise.resolve(mockResponse({}, false, 404));
    };
    fn.calls = calls;
    return fn;
}

const TEAMS_DOC = {
    tournament: { name: 'Test Cup', hosts: ['X'], startDate: '2026-06-11', endDate: '2026-07-19' },
    venues: [{ city: 'A', country: 'X', stadium: 'Stad', capacity: 1000 }],
    teams: [
        { id: 1, group: 'A', name: 'Alpha', fifaCode: 'ALP' },
        { id: 2, group: 'A', name: 'Bravo', fifaCode: 'BRV' }
    ]
};
const SCHEDULE_DOC = {
    matches: [
        { date: '2026-06-11', time: '18:00', group: 'A', team1: 'Alpha', team2: 'Bravo' }
    ]
};

module('Unit | Provider | static-json', function () {
    test('load() returns normalized teams/venues/tournament/matches', function (assert) {
        const fetch = mockFetch({
            '/data.json': mockResponse(TEAMS_DOC),
            '/schedule.json': mockResponse(SCHEDULE_DOC)
        });
        const provider = new StaticJsonProvider({ fetch });
        return provider.load().then(data => {
            assert.equal(data.tournament.name, 'Test Cup');
            assert.equal(data.venues.length, 1);
            assert.equal(data.teams.length, 2);
            assert.equal(data.matches.length, 1);
            assert.equal(data.matches[0].team1, 'Alpha');
        });
    });

    test('kind() returns "static"', function (assert) {
        const provider = new StaticJsonProvider({ fetch: mockFetch({}) });
        assert.equal(provider.kind(), 'static');
    });

    test('schedule fetch failure falls back to empty matches, teams still load', function (assert) {
        const fetch = mockFetch({
            '/data.json': mockResponse(TEAMS_DOC),
            '/schedule.json': mockResponse({}, false, 500)
        });
        const provider = new StaticJsonProvider({ fetch });
        return provider.load().then(data => {
            assert.equal(data.matches.length, 0, 'no matches when schedule 500s');
            assert.equal(data.teams.length, 2, 'teams still load');
        });
    });

    test('teams fetch failure rejects the load', function (assert) {
        const fetch = mockFetch({
            '/data.json': mockResponse({}, false, 500),
            '/schedule.json': mockResponse(SCHEDULE_DOC)
        });
        const provider = new StaticJsonProvider({ fetch });
        return provider.load().then(
            () => assert.ok(false, 'should reject'),
            err => assert.ok(/500/.test(err.message), 'error mentions status')
        );
    });

    test('custom URLs are honoured', function (assert) {
        const fetch = mockFetch({
            '/teams.json': mockResponse(TEAMS_DOC),
            '/sched.json': mockResponse(SCHEDULE_DOC)
        });
        const provider = new StaticJsonProvider({
            fetch,
            teamsUrl: '/teams.json',
            scheduleUrl: '/sched.json'
        });
        return provider.load().then(() => {
            assert.ok(fetch.calls.some(c => c.url === '/teams.json'), 'fetched custom teams url');
            assert.ok(fetch.calls.some(c => c.url === '/sched.json'), 'fetched custom schedule url');
        });
    });

    test('cache:no-store is sent so polling always re-reads', function (assert) {
        const fetch = mockFetch({
            '/data.json': mockResponse(TEAMS_DOC),
            '/schedule.json': mockResponse(SCHEDULE_DOC)
        });
        const provider = new StaticJsonProvider({ fetch });
        return provider.load().then(() => {
            const teamsCall = fetch.calls.find(c => c.url === '/data.json');
            assert.equal(teamsCall.opts.cache, 'no-store');
        });
    });

});
