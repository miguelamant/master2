// src/Dashboard/ToAdd/utils/tasteAlias.js

const ALIAS = {
    // beers (plural → singular)
    LAGERS: "LAGER",
    WHEAT_BEERS: "WHEAT_BEER",
    CIDERS: "CIDER",
    RADLERS: "RADLER",
    FRUIT_BEERS: "FRUIT_BEER",

    // you already use these elsewhere sometimes
    WATER: "PLAIN_WATER",
};

// If you want: treat BEERS_OTHER / OTHER similarly, add them here too.

export function canonTasteToken(normTokenFn, raw) {
    const t = normTokenFn(raw);
    return ALIAS[t] || t;
}
