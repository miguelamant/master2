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

    TRAPPIST:"TRAPPIST",

    // Deep Fried Snacks subcategories
    DEEP_FRIED_SNACKS: "DEEP_FRIED_SNACKS",
    MINCED: "MINCED",
    BURGER: "BURGER",
    SEAFOOD: "SEAFOOD",
    CRISPY_CHICKEN: "CRISPY_CHICKEN",
    CHUNK_STICK: "CHUNK_STICK",
    RAGOUT_CROQUETTE: "RAGOUT_CROQUETTE",
    CHEESE_CROQUETTE: "CHEESE_CROQUETTE",
    STUFFED_ROLLS: "STUFFED_ROLLS",
    SOFT_STICK: "SOFT_STICK",
    BAMI_NASI: "BAMI_NASI",

    // Deep Fried Snacks subsubcategories → subcategory icons
    FRIKANDEL: "MINCED",
    FRIKANDEL_SPECIAAL: "MINCED",
    VIANDEL: "MINCED",
    MEXICANO: "MINCED",
    MEXICANO_XL: "MINCED",
    BOULET: "MINCED",
    BOULET_SPECIAAL: "MINCED",
    RIBSTER: "MINCED",
    BERENHAP: "MINCED",
    BEREPOOT: "MINCED",
    PLAYBOY: "MINCED",
    CERVELA_ROOD: "MINCED",
    CERVELA_BRUIN: "MINCED",
    BOCKWORST: "MINCED",
    GRIZZLY: "MINCED",
    JOSKE: "MINCED",
    KROKETBURGER: "MINCED",
    LOOK_WORST: "MINCED",
    MEXICANO_BURGER: "MINCED",
    PLATTE_BOULET: "MINCED",
    PLATTE_HAMBURGER: "MINCED",

    HAMBURGER: "BURGER",
    FISHBURGER: "BURGER",
    CHICKENBURGER: "BURGER",
    CHEESEBURGER: "BURGER",
    BACONBURGER: "BURGER",
    RIB_BURGER: "BURGER",
    RIB_SANDWICH: "BURGER",
    SATE_BURGER: "BURGER",
    SITO_BURGER: "BURGER",
    VIANDEL_BURGER: "BURGER",

    GARNAALKROKET: "SEAFOOD",
    PICK_NICKER: "SEAFOOD",
    CALAMARES: "SEAFOOD",
    FISH_STICK: "SEAFOOD",
    MOSSELEN: "SEAFOOD",

    KIPCORN: "CRISPY_CHICKEN",
    KIPKROKET: "CRISPY_CHICKEN",
    LUCIFER: "CRISPY_CHICKEN",
    MINI_LUCIFER: "CRISPY_CHICKEN",
    CHICKEN_NUGGETS: "CRISPY_CHICKEN",
    CHICKEN_FINGERS: "CRISPY_CHICKEN",

    SATE: "CHUNK_STICK",
    DRUMSTICK: "CHUNK_STICK",
    ARDEENSE_SATE: "CHUNK_STICK",

    BITTERBALLEN: "RAGOUT_CROQUETTE",
    VLEESKROKET: "RAGOUT_CROQUETTE",
    GOULASHKROKET: "RAGOUT_CROQUETTE",
    RAGOUZI: "RAGOUT_CROQUETTE",

    KAASSOUFFLE: "CHEESE_CROQUETTE",
    KAASKROKET: "CHEESE_CROQUETTE",
    MOZZARELLA_STICKS: "CHEESE_CROQUETTE",
    CHEESE_BALLS: "CHEESE_CROQUETTE",
    CHILI_CHEESE_NUGGETS: "CHEESE_CROQUETTE",

    LOEMPIA: "STUFFED_ROLLS",
    MINI_LOEMPIA: "STUFFED_ROLLS",
    SMULROL: "STUFFED_ROLLS",
    VLAMMETJES: "STUFFED_ROLLS",
    VLAMPIJP: "STUFFED_ROLLS",
    VUURVRETER: "STUFFED_ROLLS",

    GYPSY_STICK: "SOFT_STICK",
    SITO_STICK: "SOFT_STICK",
    ZIGEUNERSTICK: "SOFT_STICK",

    BAMIBAL: "BAMI_NASI",
    BAMISCHIJF: "BAMI_NASI",
    NASISCHIJF: "BAMI_NASI",
    BAMI_BURGER: "BAMI_NASI",

    TWIJFELAAR: "DEEP_FRIED_SNACKS",
    ZIGEUNERSAUS: "DEEP_FRIED_SNACKS",
    KROKETTEN: "DEEP_FRIED_SNACKS",
    STOOFVLEES: "DEEP_FRIED_SNACKS",
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
