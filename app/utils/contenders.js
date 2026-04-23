/*
 * Pre-tournament strength rating per team (0–100), roughly tracking
 * FIFA rank / bookmaker priors. We blend this with live group-stage
 * points + goal difference, then softmax across all 48 teams so the
 * numbers shift as results come in.
 */
const BASE_RATING = {
    'Argentina': 90,
    'France': 87,
    'Brazil': 85,
    'Spain': 84,
    'England': 82,
    'Portugal': 80,
    'Germany': 80,
    'Netherlands': 78,
    'Belgium': 72,
    'Croatia': 70,
    'Uruguay': 70,
    'Colombia': 68,
    'Morocco': 68,
    'Switzerland': 65,
    'Japan': 64,
    'Mexico': 64,
    'USA': 62,
    'Senegal': 58,
    'Norway': 57,
    'Australia': 55,
    'Canada': 55,
    'Ecuador': 55,
    'South Korea': 54,
    'Austria': 54,
    'Ivory Coast': 52,
    'Iran': 52,
    'Sweden': 52,
    'Egypt': 52,
    'Türkiye': 52,
    'Paraguay': 48,
    'Saudi Arabia': 45,
    'Algeria': 44,
    'Scotland': 44,
    'DR Congo': 44,
    'Ghana': 44,
    'Bosnia & Herzegovina': 42,
    'Tunisia': 42,
    'Uzbekistan': 40,
    'Czechia': 40,
    'Qatar': 38,
    'Panama': 34,
    'New Zealand': 32,
    'South Africa': 32,
    'Iraq': 30,
    'Jordan': 28,
    'Cape Verde': 26,
    'Haiti': 25,
    'Curaçao': 22
};

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
