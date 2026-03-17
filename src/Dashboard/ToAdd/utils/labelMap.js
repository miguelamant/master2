// src/Dashboard/ToAdd/utils/labelMap.js
import { normToken } from './normalize'; // you already have this

// Put any overrides here (UPPER_SNAKE_CASE keys)

//the normToken() function is converting all labels, so must take care.
export const LABEL_MAP = {
    PALE_ALE_BELGIAN:"Belgian Amber",
    BLOND_BITTERS: 'IPA & Refreshing Pale Ale',
    NORMAL_BLOND_AMBER: 'Classic Blonds',
    LAGERS:'Lagers',
    DARK_BROWN_MALT_SWEETNESS:'Dark/Brown/Ambrée | Malt & Sweet',
    DARK_BROWN_COFFEE_ROAST_BITTER:'Dark/Brown | Coffee, Roast & Bitter ',
    FRUIT_BEERS:'Fruit Beers',
    WHEAT_BEERS:'Wheat Beers',
    TABLE_BEER: 'Table Beers',
    SOURS_SAISON_LAMBIC_GUEUZE:'Sour beers',
    SMOOTHIE_SOUR: 'Smoothie Sour',
    BEERS_OTHER: 'Unclassified beers',
    BEERS_SPECIAL: 'Special beers ',
    RADLERS: 'Radlers',
    CIDERS: 'Ciders',
    SPIRIT_FLAVOURED_BEERS: 'Flavoured beers',


    //
    COLA:"Colas",
    ICE_TEA:"Ice-tea",
    LEMONADES:"Lemonades",
    GINGER_DRINKS:"Gember dranken",
    TONICS:"Tonics (kinine)",
    JUICES_CONCENTRATE:"Sappen",
    NFC:"Verse of homemade drankjes",
    FUNCTIONAL_DRINKS:"Functionele dranken",
    KOMBUCHA:"Kombuchas & kefir",
    SPORTDRINKS:"Sportdrank-smaak",
    ENERGY_DRINKS:"Energie-drank",
    MILK_BASED:"Melk-dranken",
    WATER:"Waters",
    OTHER:"Andere frisdranken",
    SPECIALS:"Speciale frisdranken",


    // Fruit beers with % labels
    FRUIT_BEERS_ABV_0_TO_0p5:        'Fruit Beers · 0–0.5%',
    FRUIT_BEERS_ABV_0p5_TO_3p5:      'Fruit Beers · 0.5–3.5%',
    FRUIT_BEERS_ABV_3p5_TO_5p5:      'Fruit Beers · 3.5–5.5%',
    FRUIT_BEERS_ABV_5p5_TO_7p5:      'Fruit Beers · 5.5–7.5%',
    FRUIT_BEERS_ABV_7p5_PLUS:        'Fruit Beers · 7.5%+',

    // Sours/Saison/Lambic/Gueuze with % labels
    SOURS_SAISON_LAMBIC_GUEUZE_ABV_0_TO_0p5:   'Sours/Saison/Lambic/Gueuze · 0–0.5%',
    SOURS_SAISON_LAMBIC_GUEUZE_ABV_0p5_TO_3p5: 'Sours/Saison/Lambic/Gueuze · 0.5–3.5%',
    SOURS_SAISON_LAMBIC_GUEUZE_ABV_3p5_TO_5p5: 'Sours/Saison/Lambic/GueuZe · 3.5–5.5%',
    SOURS_SAISON_LAMBIC_GUEUZE_ABV_5p5_TO_7p5: 'Sours/Saison/Lambic/Gueuze · 5.5–7.5%',
    SOURS_SAISON_LAMBIC_GUEUZE_ABV_7p5_PLUS:   'Sours/Saison/Lambic/Gueuze · 7.5%+',

    /*
       BLOND_BITTERS: 'Hoppy & Bitter - IPA, Tripel Hop etc. ',
    NORMAL_BLOND_AMBER: 'Classic Blonds - Singles, Tripels etc.',
    LAGERS:'Lagers - Pilsner etc.',
    DARK_BROWN_MALT_SWEETNESS:'Dark/Brown/Ambrée | Malt & Sweet - Dubbels etc.',
    DARK_BROWN_COFFEE_ROAST_BITTER:'Dark/Brown | Coffee, Roast & Bitter - Stouts etc.',
    FRUIT_BEERS:'Fruit Beers - Kriek, Ruby etc.',
    WHEAT_BEERS:'Wheat Beers - Wit',
    TABLE_BEER: 'Table Beers',
    SOURS_SAISON_LAMBIC_GUEUZE:'Sour beers - Saison, Gueuze etc.',
    SMOOTHIE_SOUR: 'Smoothie Sour',
    BEERS_OTHER: 'Unclassified beers',
    BEERS_SPECIAL: 'Special beers - Tripel x Gueuze etc',
    RADLERS: 'Radlers',
    CIDERS: 'Ciders',
    SPIRIT_FLAVOURED_BEERS: 'Flavoured beers - Despirados etc.',
     */

    // Stijlkaart bucket display names
    BLOND_ENKEL:    'Patersbier',
    BLOND_STRONG:   'Belgian Golden & Tripel',
    IPA_HAZY_NE:    'NEIPA',
    BIPA:           'BIPA',
    APA:            'APA',
    SPECIALE_BELGE: 'Speciale Belge',
    BELGE_AMBREE:   'Ambrée',
    BOCKS_ALL:      'Bocks',
    DARK_DUBBEL:    'Dubbel',
    ALTBIER:        'Altbier',
    HELLES:         'Helles',
    DORTMUNDER:     'Dortmunder Export',
    KOLSCH:         'Kölsch',
    KELLERBIER:     'Kellerbier / Zwickelbier',
    LAGER_STRONG:   'Lager Strong',
    LAGER_MEXICAN:  'Mexican Lager',
    IPL:            'IPL',
    RAUCHBIER:      'Rauchbier',
    WEIZENBOCK:         'Weizenbock',
    SESSION_IPA:        'Session IPA',
    SESSION_PALE_ALE:   'Session Pale Ale',
    BELGIAN_BLONDE:     'Belgian Blonde',
    GOLDEN_ALES:        'Golden Ales',
    SAISON:             'Saison',
    BIERE_DE_GARDE:     'Bière de Garde',

    // Herkomst preset — Belgium
    BE_BLOND:               'Belgian Blonde',
    BE_WHITE:               'Witbier / Blanche',
    BE_BELGIAN_ALE_MISC:    'Enkel, Pale & Brown Ales',
    BE_DUBBEL:              'Dubbel',
    BE_TRIPEL_STRONG_GOLDEN:'Tripel & Strong Golden',
    BE_STRONG_DARK_QUAD:    'Strong Dark & Quadrupel',
    BE_SAISON_GRISETTE:     'Saison & Grisette',
    BE_BELGIAN_IPA:         'Belgian IPA',
    BE_FLANDERS_SOURS:      'Flemish Red & Oud Bruin',
    BE_LAMBIC_FAMILY:       'Lambic & Gueuze',

    // Herkomst preset — Germany
    DE_PILS:            'German Pils',
    DE_LAGER_CLASSIC:   'Helles, Dortmunder & Kellerbier',
    DE_KOLSCH:          'Kölsch',
    DE_WEIZEN:          'Weizen & Dunkelweizen',
    DE_MARZEN_FESTBIER: 'Märzen & Festbier',
    DE_BOCK_FAMILY:     'Bockbier family',
    DE_SMOKED:          'Rauchbier',
    DE_DARK_SPECIALTY:  'Schwarzbier & Munich Dunkel',
    DE_GERMAN_SOURS:    'Berliner Weisse & Gose',

    // Herkomst preset — UK
    UK_BITTER:          'Bitter (Ordinary / Best / ESB)',
    UK_PALE_GOLDEN:     'Pale & Golden Ales',
    UK_BROWN_MILD:      'Brown Ales & Milds',
    UK_PORTER_STOUT:    'Porter & Stout',
    UK_SCOTTISH:        'Scottish & Scotch Ales',
    UK_BARLEYWINE_STOCK:'Barleywine & Stock Ales',
    UK_IPA:             'English IPA',

    // Herkomst preset — US
    US_LAGER:           'American Lager',
    US_CRAFT_PALE:      'Craft Pale Ales & Blondes',
    US_IPA:             'IPA (American & NEIPA)',
    US_DARK:            'American Stout & Porter',
    US_AMBER_STRONG:    'Amber Red & American Strong',
    US_SOUR_WILD:       'Wild Ales & Modern Sours',

    // Herkomst preset — Czech
    CZ_PALE:        'Czech Pale Lager',
    CZ_AMBER_DARK:  'Czech Amber & Dark Lager',

    // Herkomst preset — Other
    OTHER_IRISH:    'Irish Stout & Red Ale',
    OTHER_GLOBAL:   'Australian, NZ & Mexican',
    OTHER_INTL:     'Other international styles',

    // add more as you go...
};



// Basic fallback prettifier: "DARK_BROWN_COFFEE_ROAST_BITTER" → "Dark Brown Coffee Roast Bitter"
function titleCaseFromToken(token = '') {
    return String(token)
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Convert a raw label (possibly a composite like "X · Y · Z") into a display label.
 * - Converts just the *base* (left part) via LABEL_MAP or fallback title-casing.
 * - Preserves any suffixes like " · Sparkling", " · Zero", " · ABBEY", etc.
 */
export function convertDisplayLabel(raw) {
    const s = String(raw ?? '');
    if (!s.includes(' · ')) {
        const key = normToken(s);
        return LABEL_MAP[key] || titleCaseFromToken(key);
    }

    const parts = s.split(' · ');
    const base = parts[0];
    const suffix = parts.slice(1).join(' · ');

    const baseKey = normToken(base);
    const niceBase = LABEL_MAP[baseKey] || titleCaseFromToken(baseKey);

    return `${niceBase} · ${suffix}`;
}

/**
 * Convert only the base token (no suffix support).
 * Useful for Optionbar taste labels etc.
 */
export function convertBaseLabel(base) {
    const key = normToken(base);
    return LABEL_MAP[key] || titleCaseFromToken(key);
}
