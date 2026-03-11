// src/Dashboard/ToAdd/utils/explanations.js
import { normToken } from './normalize';
import { convertBaseLabel } from './labelMap';

function fmtExplain({ def, styles = [], examples = [] }) {
    const line1 = def?.trim() || '';
    const line2 = styles.length
        ? `Stijlen: ${styles.map(s => `“${s}”`).join(', ')}`
        : '';
    const line3 = examples.length
        ? `Denk aan: ${examples.join(', ')}`
        : '';
    return [line1, line2, line3].filter(Boolean).join('\n\n');
}

const EXPLAIN = {
    // -------------------- BEERS --------------------
    LAGERS: fmtExplain({
        def: 'Fris, helder ondergistend bier met schone smaak en hoge doordrinkbaarheid.',
        styles: ['pils', 'Helles', 'international lager'],
        examples: ['Jupiler', 'Stella Artois', 'Corona']
    }),

    NORMAL_BLOND_AMBER: fmtExplain({
        def: 'Moutige blonds en ambers met ronde body en zachte bitterheid.',
        styles: ['Belgian Blond', 'Strong Golden Ale', 'Tripel'],
        examples: ['Leffe Blond', 'Duvel', 'Westmalle Tripel']
    }),

    BLOND_BITTERS: fmtExplain({
        def: 'Hopgedreven blonds/bitters met citrus-, hars- of florale bitterheid.',
        styles: ['IPA', 'American Pale Ale', 'Triple Hop'],
        examples: ['Duvel Tripel Hop', 'Vedett IPA', 'Sierra Nevada Pale Ale']
    }),

    DARK_BROWN_MALT_SWEETNESS: fmtExplain({
        def: 'Donkere bieren met karamel-, rozijn- of toffeezoetheid en volle body.',
        styles: ['Dubbel', 'Quadrupel'],
        examples: ['Westmalle Dubbel', 'Rochefort 10', 'La Trappe Quadrupel']
    }),

    DARK_BROWN_COFFEE_ROAST_BITTER: fmtExplain({
        def: 'Donkere, geroosterde bieren met koffie/chocolade en uitgesproken bitter.',
        styles: ['Stout', 'Porter'],
        examples: ['Guinness', 'Founders Porter', 'O’Hara’s Stout']
    }),

    FRUIT_BEERS: fmtExplain({
        def: 'Bieren met fruittoevoeging; variërend van zoet tot licht zuur.',
        styles: ['Kriek', 'Framboise', 'Passievrucht-varianten'],
        examples: ['Lindemans Kriek', 'Mort Subite Kriek', 'Timmermans Framboise']
    }),

    WHEAT_BEERS: fmtExplain({
        def: 'Tarwebieren met zachte tarwetoets en vaak lichte citrus/kruidigheid.',
        styles: ['Witbier (Belgian Wit)', 'Hefeweizen'],
        examples: ['Hoegaarden Wit', 'Blanche de Namur', 'Paulaner Hefeweissbier']
    }),

    SOURS_SAISON_LAMBIC_GUEUZE: fmtExplain({
        def: 'Saison, lambiek en geuze: van droog en peperig tot zuur en funky.',
        styles: ['Saison', 'Berliner Weisse', 'Lambiek', 'Geuze'],
        examples: ['Saison Dupont', '3 Fonteinen Oude Geuze', 'Cantillon Geuze']
    }),

    RADLERS: fmtExplain({
        def: 'Mix van bier met limonade/fris; laag alcohol en zeer verfrissend.',
        styles: ['Radler', 'Shandy'],
        examples: ['Amstel Radler', 'Martens Radler']
    }),

    CIDERS: fmtExplain({
        def: 'Gefermenteerde appel/peerdrank; van droog en strak tot rond en zoeter.',
        styles: ['Apple Cider', 'Perry (perencider)'],
        examples: ['Strongbow', 'Magners', 'Savanna Dry']
    }),

    SPIRIT_FLAVOURED_BEERS: fmtExplain({
        def: 'Bieren met spirit-/likeurprofiel of gearomatiseerd met spirits.',
        styles: ['Tequila-geïnspireerd', 'Rum-geïnspireerd'],
        examples: ['Desperados', 'Cubanisto']
    }),

    BEERS_OTHER: fmtExplain({
        def: 'Overige bieren die niet in een hoofdgroep passen.',
        styles: ['Speciaal/experimenteel'],
        examples: ['Lokaal/limited releases']
    }),

    BEERS_SPECIAL: fmtExplain({
        def: 'Seizoens- of speciale uitgaven, vaak beperkte oplage.',
        styles: ['Winterbier', 'Barel-aged releases'],
        examples: ['Kerstbieren', 'Limited barrel-aged']
    }),

    TABLE_BEER: fmtExplain({
        def: 'Tafelbier: zeer laag alcohol, mild en doordrinkbaar.',
        styles: ['Belgian Table Beer'],
        examples: ['Palm 0.0-varianten (stijlvoorbeeld)']
    }),

    // -------------------- REFRESHMENTS --------------------
    COLA: fmtExplain({
        def: 'Cola-frisdranken met karamel/kruidprofiel.',
        styles: ['Regular cola', 'Zero/Light'],
        examples: ['Coca-Cola', 'Pepsi', 'Coca-Cola Zero']
    }),

    ICE_TEA: fmtExplain({
        def: 'Theedranken (zwart/groen), bruisend of plat; vaak per smaakvariant.',
        styles: ['Black', 'Green', 'Peach', 'Lemon'],
        examples: ['Lipton Ice Tea', 'Fuze Tea']
    }),

    LEMONADES: fmtExplain({
        def: 'Citrusgedreven limonades; fris en dorstlessend.',
        styles: ['Lemon-lime', 'Orange', 'Agrum'],
        examples: ['Sprite', 'Fanta', 'Schweppes Agrum']
    }),

    GINGER_DRINKS: fmtExplain({
        def: 'Gemberdranken van zacht (ale) tot pittig (beer).',
        styles: ['Ginger Ale', 'Ginger Beer'],
        examples: ['Schweppes Ginger Ale', 'Fever-Tree Ginger Beer']
    }),

    TONICS: fmtExplain({
        def: 'Tonic met kinine; droog/bitter, vaak als mixer voor gin.',
        styles: ['Indian Tonic', 'Mediterranean', 'Aromatic'],
        examples: ['Fever-Tree Tonic', 'Schweppes Indian Tonic']
    }),

    KOMBUCHA: fmtExplain({
        def: 'Gefermenteerde thee; licht zuur en subtiel bruisend.',
        styles: ['Original', 'Gember/citroen', 'Framboos'],
        examples: ['Remedy Kombucha', 'LOKALE merken']
    }),

    PLAIN_WATER: fmtExplain({
        def: 'Plat water (zonder koolzuur).',
        styles: ['Natuurlijk mineraalwater'],
        examples: ['Spa Reine', 'Evian']
    }),

    FLAVORED_WATER: fmtExplain({
        def: 'Licht gearomatiseerd water, vaak laag/zero in suiker.',
        styles: ['Citroen', 'Bessen', 'Appel'],
        examples: ['Spa Touch', 'Aquafina Flavours']
    }),

    SPORTDRINKS: fmtExplain({
        def: 'Isotone/hydratatiedranken voor sport en herstel.',
        styles: ['Isotonic', 'Zero-sugar isotonic'],
        examples: ['Isostar', 'Gatorade', 'AA Drink']
    }),

    ENERGY_DRINKS: fmtExplain({
        def: 'Cafeïnehoudende dranken voor een “boost”.',
        styles: ['Regular', 'Sugar-free'],
        examples: ['Red Bull', 'Monster', 'Rockstar']
    }),

    JUICES_NFC: fmtExplain({
        def: 'Sappen “Not From Concentrate” met vollere, natuurlijke fruitsmaak.',
        styles: ['Sinaasappel NFC', 'Appel NFC'],
        examples: ['Innocent Orange NFC', 'Tropicana']
    }),

    JUICES_CONCENTRATE: fmtExplain({
        def: 'Sappen uit concentraat: de klassieke varianten.',
        styles: ['Sinaasappel', 'Appel', 'Multivrucht'],
        examples: ['Minute Maid', 'Granini (concentraatlijnen)']
    }),

    MILK_BASED: fmtExplain({
        def: 'Zuivel- of plantaardige zuiveldranken; romig en zacht.',
        styles: ['Chocomelk', 'Yoghurtdrank', 'Plantaardig (haver/soja)'],
        examples: ['Cécémel', 'Fristi', 'Alpro']
    }),

    SPECIALS: fmtExplain({
        def: 'Speciale/overige frisdranken buiten de hoofdgroepen.',
        styles: ['Mix & limited flavours'],
        examples: ['Seizoenssmaken', 'Craft sodas']
    }),

    OTHER: fmtExplain({
        def: 'Overige items die niet in een hoofdgroep passen.',
        styles: ['—'],
        examples: ['—']
    })
};

/**
 * Returns true if a hard-coded explanation exists for this label.
 */
export function hasHardCodedExplanation(rawLabel) {
    return !!EXPLAIN[normToken(rawLabel)];
}

/**
 * Ophalen van gestructureerde uitleg.
 * Returned shape:
 *  { token, title, text }  // text bevat definitie, “Stijlen:” en “Denk aan:” (met \n\n)
 */
export function getGroupExplanation(rawLabel) {
    const token = normToken(rawLabel);
    const title = convertBaseLabel(token);
    const text  = EXPLAIN[token] || 'Nog geen extra uitleg voor deze groep.';
    return { token, title, text };
}
