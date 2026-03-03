// src/Dashboard/ToAdd/utils/iconLoader.js

function normToken(s) {
    return String(s ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

let _CTX = null;
let _MAP = null;

function ensureMap() {
    if (!_CTX) {
        // recursive = true so Icons/**.svg get included
        _CTX = require.context("../../Icons/taste_group/", true, /\.svg$/);
    }
    if (!_MAP) {
        _MAP = _CTX.keys().reduce((acc, key) => {
            const base = key.replace(/^\.\/+/, "").replace(/\.svg$/i, "");
            const parts = base.split("/");
            const filenameToken = normToken(parts[parts.length - 1]);
            const fullToken = normToken(base);
            const url = _CTX(key);

            // allow lookup by "RADLERS" and also "beers/RADLERS" etc if you ever nest folders
            acc[filenameToken] = url;
            acc[fullToken] = url;

            return acc;
        }, {});
    }
}

/**
 * Explicit mapping: label/style name -> best matching icon token you have.
 * NOTE: keys must be normalized with normToken(), values must match an SVG filename token.
 *
 * Your available beer icon tokens (from your screenshot):
 * BEERS_OTHER, BEERS_SPECIAL, BLOND_BITTERS, CIDERS,
 * DARK_BROWN_COFFEE_ROAST_BITTER, DARK_BROWN_MALT_SWEETNESS, FRUIT_BEERS,
 * LAGERS, NORMAL_BLOND_AMBER, RADLERS, SMOOTHIE_SOUR,
 * SOURS_SAISON_LAMBIC_GEUUZE, SPIRIT_FLAVOURED_BEERS, TABLE_BEER, WHEAT_BEERS
 */
const LABEL_TO_ICON_TOKEN = {
    // hop-forward pale / IPA-ish
    AMERICAN_PALE_ALE: "BLOND_BITTERS",
    IPA_ETC: "BLOND_BITTERS",

    // mixes / shandy
    BEER_SODA_MIX: "RADLERS",
    RADLERS: "RADLERS",

    // generic buckets
    UNCLASSIFIED_BEERS: "BEERS_OTHER",
    SPECIAL_BEERS: "BEERS_SPECIAL",

    // belgian families

    BELGIAN_BLONDE: "NORMAL_BLOND_AMBER",
    OTHER_BLOND_GOLDENS: "NORMAL_BLOND_AMBER",

    BELGIAN_DUBBEL: "DARK_BROWN_MALT_SWEETNESS",
    BELGIAN_QUADRUPEL: "DARK_BROWN_MALT_SWEETNESS",
    BELGIAN_STRONG_DARK_ALE: "DARK_BROWN_MALT_SWEETNESS",
    OTHER_BROWN_DARK_WINTER_ALES: "DARK_BROWN_MALT_SWEETNESS",

    // belgian strong golden / tripel -> closest icon you have is blond/amber
    BELGIAN_STRONG_GOLDEN_ALE: "NORMAL_BLOND_AMBER",
    BELGIAN_TRIPEL: "NORMAL_BLOND_AMBER",

    // lager families
    CLASSIC_LAGERS: "LAGERS",
    SPECIAL_LAGERS: "LAGERS",

    // dark roast / stout-ish
    DARK_BLACK_ROAST_BITTER: "DARK_BROWN_COFFEE_ROAST_BITTER",
    STOUTS:"DARK_BROWN_COFFEE_ROAST_BITTER",
    PORTERS:"DARK_BROWN_COFFEE_ROAST_BITTER",

    // sour families
    LAMBICS: "SOURS_SAISON_LAMBIC_GEUUZE",
    SAISON: "SOURS_SAISON_LAMBIC_GEUUZE",
    NEW_SOURS: "SOURS_SAISON_LAMBIC_GEUUZE",
    FLANDERS_OUD_BRUIN_RED: "SOURS_SAISON_LAMBIC_GEUUZE",
    WILD_OTHER_SOURS:"SOURS_SAISON_LAMBIC_GEUUZE",

    SMOOTHIE_SOUR: "SMOOTHIE_SOUR",

    // fruity / flavored
    SWEET_FRUITY: "FRUIT_BEERS",
    FLAVOURED_BEERS: "SPIRIT_FLAVOURED_BEERS",

    // other categories
    CIDERS: "CIDERS",
    WHEAT_BEERS: "WHEAT_BEERS",
    TABLE_BEERS: "TABLE_BEER",
    ENKEL_PATERSBIER: "TABLE_BEER",

    //lvl 3
    DUBBELS_ETC: "DARK_BROWN_MALT_SWEETNESS",
    QUADRUPELS_ETC: "DARK_BROWN_MALT_SWEETNESS",
    CLASSIC_BLONDS_ETC: "NORMAL_BLOND_AMBER",
    STRONG_BLONDS_ETC: "NORMAL_BLOND_AMBER",

    BROWN_ALES:"DUBBEL",
    PALE_ALES:"PALE_ALE",
    BELGIAN_AMBER_ETC:"AMBER",
    BLONDS:"BLOND",
    STRONG_BLONDS:"STRONG_BLOND",
    ENKEL:"BLOND",
    SPECIALE_BELGE:"AMBER",
    AMBREE:"AMBER",
    STRONG_AMBREE:"AMBER",

    TRAPPIST:"TRAPPIST"

};

// Parent bucket for labels like "IPA | NEW_ENGLAND_/_HAZY" → "IPA"
function parentFromLabel(label) {
    const s = String(label ?? "").trim();
    if (!s) return null;

    if (s.includes(" | ")) {
        return normToken(s.split(" | ")[0]);
    }

    const tok = normToken(s);

    // You can keep these, but they only help if you actually have icons named BELGIAN / NON_ALCOHOLIC_BEER
    if (tok.startsWith("BELGIAN_")) return "BELGIAN";
    if (tok.startsWith("NON_ALCOHOLIC_BEER_")) return "NON_ALCOHOLIC_BEER";

    return null;
}

export function iconFor(tokenOrLabel) {
    ensureMap();

    const key = normToken(tokenOrLabel);

    // 0) explicit label->icon mapping (your beer-style labels)
    const alias = LABEL_TO_ICON_TOKEN[key];
    if (alias && _MAP[alias]) return _MAP[alias];

    // 1) exact (matches an svg filename)
    if (_MAP[key]) return _MAP[key];

    // 2) fallback by parent (only works if parent icon exists)
    const parent = parentFromLabel(tokenOrLabel);
    if (parent && _MAP[parent]) return _MAP[parent];

    // 3) final generic fallback
    if (_MAP["BEERS_OTHER"]) return _MAP["BEERS_OTHER"];
    if (_MAP["OTHER"]) return _MAP["OTHER"];

    return null;
}
