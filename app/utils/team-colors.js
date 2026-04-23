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

/*
 * Hero banner photo per team. Each URL points at a capital-city /
 * landmark image sourced from Wikimedia Commons (CC-licensed or
 * public domain — safe to hotlink from upload.wikimedia.org).
 * Replace any entry with a different Wikimedia Commons / Unsplash
 * / Pexels URL if you prefer a different shot for a given country.
 */
export const TEAM_PHOTOS = {
    MEX: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg/3840px-Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg',
    RSA: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Cape_Town_%28ZA%29%2C_Table_Mountain%2C_Blick_auf_City_Bowl_--_2024_--_2855.jpg',
    KOR: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg/3840px-%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg',
    CZE: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Prague_%286365119737%29.jpg',
    CAN: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Toronto_Skyline_from_Snake_Island%2C_February_28_2026_%2808%29.jpg',
    BIH: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Sarajevo_City_Panorama.JPG',
    QAT: 'https://upload.wikimedia.org/wikipedia/commons/2/26/The_Pearl_Marina_in_Nov_2013.jpg',
    SUI: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Altstadt_Z%C3%BCrich_2015.jpg/3840px-Altstadt_Z%C3%BCrich_2015.jpg',
    BRA: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Cidade_Maravilhosa.jpg',
    MAR: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Pavillon_Menarag%C3%A4rten.jpg',
    HAI: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Port-au-Prince_Haiti_Temple_-_Pierre.jpg',
    SCO: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Skyline_of_Edinburgh.jpg',
    USA: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg',
    PAR: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Palacio_de_Gobierno2.jpg',
    AUS: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg',
    TUR: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg',
    GER: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg/3840px-Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg',
    CUW: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Handelskade_in_Willemstad.jpg',
    CIV: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Visite_du_mus%C3%A9e_de_civilisation_de_C%C3%B4te_d%27Ivoire_08.jpg/3840px-Visite_du_mus%C3%A9e_de_civilisation_de_C%C3%B4te_d%27Ivoire_08.jpg',
    ECU: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/FACHADA_ASAMBLEA_NACIONAL._QUITO%2C_20_DE_FEBRERO_2020._01.jpg',
    NED: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png',
    JPN: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg',
    SWE: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Royal_Dramatic_Theatre_Stockholm.jpg',
    TUN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Minaret_et_patio_de_la_mosqu%C3%A9e_Zitouna_au_centre_de_la_M%C3%A9dina_de_Tunis.jpg/3840px-Minaret_et_patio_de_la_mosqu%C3%A9e_Zitouna_au_centre_de_la_M%C3%A9dina_de_Tunis.jpg',
    BEL: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Grand_Place_Bruselas_2.jpg',
    EGY: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg/3840px-Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg',
    IRN: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/North_of_Tehran_Skyline_view.jpg',
    NZL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Auckland_skyline_-_May_2024_%282%29.jpg/3840px-Auckland_skyline_-_May_2024_%282%29.jpg',
    ESP: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Madrid_-_Sky_Bar_360%C2%BA_%28Hotel_Riu_Plaza_Espa%C3%B1a%29%2C_vistas_19.jpg',
    CPV: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Pal%C3%A1cio_da_Cultura%2C_Praia%2C_Cape_Verde.jpg',
    KSA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Riyadh_Skyline.jpg/3840px-Riyadh_Skyline.jpg',
    URU: 'https://upload.wikimedia.org/wikipedia/commons/5/59/PALACIO_LEGISLATIVO_01.JPG',
    FRA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/3840px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg',
    SEN: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Dakar-place-de-l%27Ind%C3%A9pendance.jpg',
    NOR: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Nationaltheatret_evening.jpg',
    IRQ: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/5628442718_b10fc2c47f_o.jpg',
    ARG: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg',
    ALG: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Botanical_Garden_Hamma.jpg/3840px-Botanical_Garden_Hamma.jpg',
    AUT: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Schoenbrunn_philharmoniker_2012.jpg/3840px-Schoenbrunn_philharmoniker_2012.jpg',
    JOR: 'https://upload.wikimedia.org/wikipedia/commons/2/24/New_Abdali_2024.png',
    POR: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Lisboa_-_Portugal_%2852597836992%29.jpg',
    COD: 'https://upload.wikimedia.org/wikipedia/commons/1/18/La_Gombe%2C_Kinshasa%2C_RDC_%28cropped%29.jpg',
    UZB: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Nest_One_Tashkent.jpg',
    COL: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Bogota%2C_Colombia_%2836668708290%29.jpg',
    ENG: 'https://upload.wikimedia.org/wikipedia/commons/6/67/London_Skyline_%28125508655%29.jpeg',
    CRO: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Zagreb_%2829255640143%29.jpg/3840px-Zagreb_%2829255640143%29.jpg',
    GHA: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Acca.jpg',
    PAN: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Panama_Papers_%28148830809%29.jpeg'
};

export function photoFor(fifaCode) {
    return TEAM_PHOTOS[fifaCode] || null;
}
