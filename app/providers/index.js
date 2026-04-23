import StaticJsonProvider from './static-json';
import FootballDataProvider from './football-data';

/*
 * Returns a data provider instance for the given config. All providers
 * implement:
 *   .kind()   -> string label
 *   .load()   -> Promise<{ tournament, venues, teams, matches }>
 *
 * Add new kinds here; consumers never import providers directly.
 */
export function createProvider(config) {
    const cfg = config || {};
    const kind = cfg.kind || 'static';
    switch (kind) {
        case 'football-data':
            return new FootballDataProvider(cfg);
        case 'static':
        default:
            return new StaticJsonProvider(cfg);
    }
}

export { StaticJsonProvider, FootballDataProvider };
