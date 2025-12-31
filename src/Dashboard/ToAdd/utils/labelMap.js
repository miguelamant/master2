// src/Dashboard/ToAdd/utils/labelMap.js
import { normToken } from './normalize'; // you already have this

// Put any overrides here (UPPER_SNAKE_CASE keys)

//the normToken() function is converting all labels, so must take care.
export const LABEL_MAP = {
    PALE_ALE_BELGIAN:"Belgian Amber",
    BLOND_BITTERS: 'Hoppy & Bitter',
    NORMAL_BLOND_AMBER: 'Normal Blond & Amber',
    LAGERS:'Lagers',
    DARK_BROWN_MALT_SWEETNESS:'Dark/Brown | Malt & Sweet',
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
    NORMAL_BLOND_AMBER: 'Normal Blond & Amber - Singles, Tripels etc.',
    LAGERS:'Lagers - Pilsner etc.',
    DARK_BROWN_MALT_SWEETNESS:'Dark/Brown | Malt & Sweet - Dubbels etc.',
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
