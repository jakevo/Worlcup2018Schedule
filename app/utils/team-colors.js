/*
 * Primary / secondary kit colors per team. Keyed by FIFA code.
 * Used to tint the team hero and drive the stylized shield crest.
 * Sourced from public flag / known kit palettes; tweak freely.
 */
export const TEAM_COLORS = {
    MEX: { primary: '#006341', secondary: '#CE1126' },
    RSA: { primary: '#007749', secondary: '#FFB81C' },
    KOR: { primary: '#CD2E3A', secondary: '#0047A0' },
    CZE: { primary: '#11457E', secondary: '#D7141A' },

    CAN: { primary: '#D52B1E', secondary: '#FFFFFF' },
    BIH: { primary: '#002F6C', secondary: '#FECB00' },
    QAT: { primary: '#8A1538', secondary: '#FFFFFF' },
    SUI: { primary: '#DA291C', secondary: '#FFFFFF' },

    BRA: { primary: '#009C3B', secondary: '#FFDF00' },
    MAR: { primary: '#C1272D', secondary: '#006233' },
    HAI: { primary: '#00209F', secondary: '#D21034' },
    SCO: { primary: '#0065BF', secondary: '#FFFFFF' },

    USA: { primary: '#002868', secondary: '#BF0A30' },
    PAR: { primary: '#D52B1E', secondary: '#0038A8' },
    AUS: { primary: '#FFCD00', secondary: '#006A4E' },
    TUR: { primary: '#E30A17', secondary: '#FFFFFF' },

    GER: { primary: '#000000', secondary: '#DD0000' },
    CUW: { primary: '#002B7F', secondary: '#F9E814' },
    CIV: { primary: '#F77F00', secondary: '#009639' },
    ECU: { primary: '#FFD100', secondary: '#034EA2' },

    NED: { primary: '#FF6B00', secondary: '#FFFFFF' },
    JPN: { primary: '#BC002D', secondary: '#FFFFFF' },
    SWE: { primary: '#006AA7', secondary: '#FECC00' },
    TUN: { primary: '#E70013', secondary: '#FFFFFF' },

    BEL: { primary: '#ED2939', secondary: '#FAE042' },
    EGY: { primary: '#CE1126', secondary: '#FFFFFF' },
    IRN: { primary: '#239F40', secondary: '#DA0000' },
    NZL: { primary: '#0047BB', secondary: '#FFFFFF' },

    ESP: { primary: '#AA151B', secondary: '#F1BF00' },
    CPV: { primary: '#003893', secondary: '#FFFFFF' },
    KSA: { primary: '#006C35', secondary: '#FFFFFF' },
    URU: { primary: '#7CB9E8', secondary: '#FFCE00' },

    FRA: { primary: '#002395', secondary: '#FFFFFF' },
    SEN: { primary: '#00853F', secondary: '#FDEF42' },
    NOR: { primary: '#C8102E', secondary: '#003087' },
    IRQ: { primary: '#CE1126', secondary: '#FFFFFF' },

    ARG: { primary: '#75AADB', secondary: '#FFFFFF' },
    ALG: { primary: '#006633', secondary: '#FFFFFF' },
    AUT: { primary: '#ED2939', secondary: '#FFFFFF' },
    JOR: { primary: '#000000', secondary: '#CE1126' },

    POR: { primary: '#FF0000', secondary: '#046A38' },
    COD: { primary: '#0071CE', secondary: '#F7D618' },
    UZB: { primary: '#0099B5', secondary: '#FFFFFF' },
    COL: { primary: '#FCD116', secondary: '#003893' },

    ENG: { primary: '#CE1124', secondary: '#FFFFFF' },
    CRO: { primary: '#FF0000', secondary: '#171796' },
    GHA: { primary: '#CE1126', secondary: '#FCD116' },
    PAN: { primary: '#DA121A', secondary: '#005AA7' }
};

const FALLBACK = { primary: '#e5174a', secondary: '#ffffff' };

export function colorsFor(fifaCode) {
    if (!fifaCode) return FALLBACK;
    return TEAM_COLORS[fifaCode] || FALLBACK;
}
