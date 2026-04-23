import { BASE_RATING } from './contenders-base';

const POINTS_WEIGHT = 2.0;
const GD_WEIGHT = 0.5;
const TEMPERATURE = 12;

export function computeContenders(groups, limit = 8) {
    const all = [];
    for (const g of groups || []) {
        for (const t of g.teams || []) all.push(t);
    }
    if (!all.length) return [];

    const scored = all.map(t => {
        const base = BASE_RATING[t.name] != null ? BASE_RATING[t.name] : 30;
        const bonus = (t.pts || 0) * POINTS_WEIGHT + (t.gd || 0) * GD_WEIGHT;
        return { team: t, score: base + bonus };
    });

    const maxScore = scored.reduce((m, s) => Math.max(m, s.score), -Infinity);
    const exps = scored.map(s => Math.exp((s.score - maxScore) / TEMPERATURE));
    const sumExp = exps.reduce((a, b) => a + b, 0) || 1;

    const withPct = scored.map((s, i) => Object.assign({}, s, {
        pct: (exps[i] / sumExp) * 100
    }));

    withPct.sort((a, b) => b.pct - a.pct);
    return withPct.slice(0, limit);
}
