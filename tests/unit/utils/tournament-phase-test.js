import { tournamentPhase } from 'world-cup2026-schedule/utils/tournament-phase';
import { module, test } from 'qunit';

const KICKOFF = new Date('2026-06-11T18:00:00-04:00').getTime();
const END = new Date('2026-07-19T20:00:00-04:00').getTime();

function mkMatch(date, time, team1, team2, played = false, score1 = null, score2 = null) {
    const kickoff = new Date(`${date}T${time}:00-04:00`).getTime();
    return { date, time, team1, team2, kickoff, played, score1, score2 };
}

const OPENER = mkMatch('2026-06-11', '18:00', 'Mexico', 'South Africa');
const OPENER_2 = mkMatch('2026-06-11', '21:00', 'Brazil', 'Morocco');
const DAY_TWO_1 = mkMatch('2026-06-12', '12:00', 'Canada', 'Qatar');
const DAY_TWO_2 = mkMatch('2026-06-12', '15:00', 'Spain', 'Uruguay');
const FINALE = mkMatch('2026-07-19', '15:00', 'Argentina', 'France', true, 2, 1);

const SCHEDULE = { matches: [OPENER, OPENER_2, DAY_TWO_1, DAY_TWO_2, FINALE], kickoffMs: KICKOFF, endMs: END };

module('Unit | Utility | tournament-phase', function () {
    test('before kickoff → pre', function (assert) {
        const now = KICKOFF - 2 * 86400000;
        const phase = tournamentPhase(now, SCHEDULE);
        assert.equal(phase.kind, 'pre');
        assert.equal(phase.kickoffMs, KICKOFF);
    });

    test('exactly at kickoff → live (opener in window)', function (assert) {
        const phase = tournamentPhase(KICKOFF + 1000, SCHEDULE);
        assert.equal(phase.kind, 'live');
        assert.equal(phase.matches.length, 1);
        assert.equal(phase.matches[0].team1, 'Mexico');
    });

    test('two simultaneous matches → live with both', function (assert) {
        const sameSlot = { matches: [OPENER, Object.assign({}, OPENER, { team1: 'Brazil', team2: 'Morocco' })], kickoffMs: KICKOFF, endMs: END };
        const phase = tournamentPhase(KICKOFF + 30 * 60 * 1000, sameSlot);
        assert.equal(phase.kind, 'live');
        assert.equal(phase.matches.length, 2);
    });

    test('between opener (finished window) and 21:00 match → today', function (assert) {
        const now = new Date('2026-06-11T20:30:00-04:00').getTime();
        const phase = tournamentPhase(now, SCHEDULE);
        assert.equal(phase.kind, 'today');
        assert.ok(phase.matches.some(m => m.team1 === 'Brazil'), 'includes the later opener day match');
    });

    test('morning of day 2, before first kickoff → today (day 2 fixtures)', function (assert) {
        const now = new Date('2026-06-12T08:00:00-04:00').getTime();
        const phase = tournamentPhase(now, SCHEDULE);
        assert.equal(phase.kind, 'today');
        assert.equal(phase.matches.length, 2);
        assert.equal(phase.matches[0].date, '2026-06-12');
    });

    test('rest day (no kickoffs today) → motd picks highest combined base rating', function (assert) {
        const weakFixture = mkMatch('2026-06-18', '14:00', 'Haiti', 'Curaçao');
        const bigFixture = mkMatch('2026-06-19', '20:00', 'Argentina', 'Brazil');
        const schedule = { matches: [weakFixture, bigFixture, FINALE], kickoffMs: KICKOFF, endMs: END };
        const now = new Date('2026-06-17T22:00:00-04:00').getTime();
        const phase = tournamentPhase(now, schedule);
        assert.equal(phase.kind, 'motd');
        assert.equal(phase.match.team1, 'Argentina', 'picks ARG vs BRA over HAI vs CUW');
    });

    test('rest day but nothing in next 3 days → motd still returns the best available upcoming', function (assert) {
        const farFixture = mkMatch('2026-06-30', '20:00', 'Argentina', 'Brazil');
        const schedule = { matches: [farFixture, FINALE], kickoffMs: KICKOFF, endMs: END };
        const now = new Date('2026-06-17T22:00:00-04:00').getTime();
        const phase = tournamentPhase(now, schedule);
        assert.equal(phase.kind, 'motd');
        assert.ok(phase.match, 'returns a match rather than quiet');
    });

    test('after final + endMs → ended', function (assert) {
        const now = END + 2 * 86400000;
        const phase = tournamentPhase(now, SCHEDULE);
        assert.equal(phase.kind, 'ended');
        assert.equal(phase.finalMatch.team1, 'Argentina');
    });

    test('live takes precedence over today', function (assert) {
        const now = new Date('2026-06-11T18:30:00-04:00').getTime();
        const phase = tournamentPhase(now, SCHEDULE);
        assert.equal(phase.kind, 'live');
    });

    test('finished match within live window no longer counts as live', function (assert) {
        const played = mkMatch('2026-06-11', '18:00', 'Mexico', 'South Africa', true, 1, 0);
        const schedule = { matches: [played], kickoffMs: KICKOFF, endMs: END };
        const now = new Date('2026-06-11T19:00:00-04:00').getTime();
        const phase = tournamentPhase(now, schedule);
        assert.notEqual(phase.kind, 'live');
    });

    test('empty schedule after kickoff → quiet', function (assert) {
        const phase = tournamentPhase(KICKOFF + 1000, { matches: [], kickoffMs: KICKOFF, endMs: END });
        assert.equal(phase.kind, 'quiet');
    });
});
