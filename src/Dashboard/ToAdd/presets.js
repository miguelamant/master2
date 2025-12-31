// src/Dashboard/ToAdd/presets.js

import { presetImg } from './utils/presetImages';

export const PRESET_FILTERS = [
    // 1) All refreshments (keep as is)
    {
        id: 6101,
        name: "Beers (non-zero) — by Subcategory",
        section: "beers",
        groupBy: "subcategory",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 0 }],
        info: {
            image: presetImg("Budgetbewust.png"),
            line1: "All non-alcoholic≠ (is_zero=0) beers by subcategory.",
            line2: "Quick overview of alcoholic beer mix."
        }
    },
    {
        id: 6102,
        name: "Beers (zero) — by Subcategory",
        section: "beers",
        groupBy: "subcategory",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 1 }],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "All zero/NA beers by subcategory.",
            line2: "See where NA presence is strong/weak."
        }
    },
    {
        id: 6103,
        name: "Beers × ABV bands (from subsubcategory)",
        section: "beers",
        groupBy: "subsubcategory",
        within: {},
        predicates: [],
        partitionBy: [
            { label: "ABV 0–0.5", predicates: [{ field: "subsubcategory", op: "in", value: [
                        "LAGERS_ABV_0_TO_0p5","NORMAL_BLOND_AMBER_ABV_0_TO_0p5","BLOND_BITTERS_ABV_0_TO_0p5",
                        "DARK_BROWN_MALT_SWEETNESS_ABV_0_TO_0p5","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_0_TO_0p5",
                        "FRUIT_BEERS_ABV_0_TO_0p5","WHEAT_BEERS_ABV_0_TO_0p5","TABLE_BEER_ABV_0_TO_0p5",
                        "SOURS_SAISON_LAMBIC_GUEUZE_ABV_0_TO_0p5","SMOOTHIE_SOUR_ABV_0_TO_0p5",
                        "BEERS_OTHER_ABV_0_TO_0p5","BEERS_SPECIAL_ABV_0_TO_0p5","RADLERS_ABV_0_TO_0p5",
                        "CIDERS_ABV_0_TO_0p5","SPIRIT_FLAVOURED_BEERS_ABV_0_TO_0p5"
                    ]}]},
            { label: "ABV 0.5–3.5", predicates: [{ field: "subsubcategory", op: "in", value: [
                        "LAGERS_ABV_0p5_TO_3p5","NORMAL_BLOND_AMBER_ABV_0p5_TO_3p5","BLOND_BITTERS_ABV_0p5_TO_3p5",
                        "DARK_BROWN_MALT_SWEETNESS_ABV_0p5_TO_3p5","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_0p5_TO_3p5",
                        "FRUIT_BEERS_ABV_0p5_TO_3p5","WHEAT_BEERS_ABV_0p5_TO_3p5","TABLE_BEER_ABV_0p5_TO_3p5",
                        "SOURS_SAISON_LAMBIC_GUEUZE_ABV_0p5_TO_3p5","SMOOTHIE_SOUR_ABV_0p5_TO_3p5",
                        "BEERS_OTHER_ABV_0p5_TO_3p5","BEERS_SPECIAL_ABV_0p5_TO_3p5","RADLERS_ABV_0p5_TO_3p5",
                        "CIDERS_ABV_0p5_TO_3p5","SPIRIT_FLAVOURED_BEERS_ABV_0p5_TO_3p5"
                    ]}]},
            { label: "ABV 3.5–5.5", predicates: [{ field: "subsubcategory", op: "in", value: [
                        "LAGERS_ABV_3p5_TO_5p5","NORMAL_BLOND_AMBER_ABV_3p5_TO_5p5","BLOND_BITTERS_ABV_3p5_TO_5p5",
                        "DARK_BROWN_MALT_SWEETNESS_ABV_3p5_TO_5p5","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_3p5_TO_5p5",
                        "FRUIT_BEERS_ABV_3p5_TO_5p5","WHEAT_BEERS_ABV_3p5_TO_5p5","TABLE_BEER_ABV_3p5_TO_5p5",
                        "SOURS_SAISON_LAMBIC_GUEUZE_ABV_3p5_TO_5p5","SMOOTHIE_SOUR_ABV_3p5_TO_5p5",
                        "BEERS_OTHER_ABV_3p5_TO_5p5","BEERS_SPECIAL_ABV_3p5_TO_5p5","RADLERS_ABV_3p5_TO_5p5",
                        "CIDERS_ABV_3p5_TO_5p5","SPIRIT_FLAVOURED_BEERS_ABV_3p5_TO_5p5"
                    ]}]},
            { label: "ABV 5.5–7.5", predicates: [{ field: "subsubcategory", op: "in", value: [
                        "LAGERS_ABV_5p5_TO_7p5","NORMAL_BLOND_AMBER_ABV_5p5_TO_7p5","BLOND_BITTERS_ABV_5p5_TO_7p5",
                        "DARK_BROWN_MALT_SWEETNESS_ABV_5p5_TO_7p5","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_5p5_TO_7p5",
                        "FRUIT_BEERS_ABV_5p5_TO_7p5","WHEAT_BEERS_ABV_5p5_TO_7p5","TABLE_BEER_ABV_5p5_TO_7p5",
                        "SOURS_SAISON_LAMBIC_GUEUZE_ABV_5p5_TO_7p5","SMOOTHIE_SOUR_ABV_5p5_TO_7p5",
                        "BEERS_OTHER_ABV_5p5_TO_7p5","BEERS_SPECIAL_ABV_5p5_TO_7p5","RADLERS_ABV_5p5_TO_7p5",
                        "CIDERS_ABV_5p5_TO_7p5","SPIRIT_FLAVOURED_BEERS_ABV_5p5_TO_7p5"
                    ]}]},
            { label: "ABV 7.5+", predicates: [{ field: "subsubcategory", op: "in", value: [
                        "LAGERS_ABV_7p5_PLUS","NORMAL_BLOND_AMBER_ABV_7p5_PLUS","BLOND_BITTERS_ABV_7p5_PLUS",
                        "DARK_BROWN_MALT_SWEETNESS_ABV_7p5_PLUS","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_7p5_PLUS",
                        "FRUIT_BEERS_ABV_7p5_PLUS","WHEAT_BEERS_ABV_7p5_PLUS","TABLE_BEER_ABV_7p5_PLUS",
                        "SOURS_SAISON_LAMBIC_GUEUZE_ABV_7p5_PLUS","SMOOTHIE_SOUR_ABV_7p5_PLUS",
                        "BEERS_OTHER_ABV_7p5_PLUS","BEERS_SPECIAL_ABV_7p5_PLUS","RADLERS_ABV_7p5_PLUS",
                        "CIDERS_ABV_7p5_PLUS","SPIRIT_FLAVOURED_BEERS_ABV_7p5_PLUS"
                    ]}]}
        ],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Group subsubcategories by ABV band.",
            line2: "Compare coverage across alcohol ranges."
        }
    },
    {
        id: 6104,
        name: "Focus — Normal Blond/Amber & Blond Bitters (by subsubcategory)",
        section: "beers",
        groupBy: "subsubcategory",
        within: { subsubcategory_in: [
                "NORMAL_BLOND_AMBER_ABV_0_TO_0p5","NORMAL_BLOND_AMBER_ABV_0p5_TO_3p5","NORMAL_BLOND_AMBER_ABV_3p5_TO_5p5","NORMAL_BLOND_AMBER_ABV_5p5_TO_7p5","NORMAL_BLOND_AMBER_ABV_7p5_PLUS",
                "BLOND_BITTERS_ABV_0_TO_0p5","BLOND_BITTERS_ABV_0p5_TO_3p5","BLOND_BITTERS_ABV_3p5_TO_5p5","BLOND_BITTERS_ABV_5p5_TO_7p5","BLOND_BITTERS_ABV_7p5_PLUS"
            ]},
        predicates: [],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Only Normal Blond/Amber and Blond Bitters (all ABV bands).",
            line2: "Drill into core blond styles."
        }
    },
    {
        id: 6105,
        name: "Focus — Dark Browns (by subsubcategory)",
        section: "beers",
        groupBy: "subsubcategory",
        within: { subsubcategory_in: [
                "DARK_BROWN_MALT_SWEETNESS_ABV_0_TO_0p5","DARK_BROWN_MALT_SWEETNESS_ABV_0p5_TO_3p5","DARK_BROWN_MALT_SWEETNESS_ABV_3p5_TO_5p5","DARK_BROWN_MALT_SWEETNESS_ABV_5p5_TO_7p5","DARK_BROWN_MALT_SWEETNESS_ABV_7p5_PLUS",
                "DARK_BROWN_COFFEE_ROAST_BITTER_ABV_0_TO_0p5","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_0p5_TO_3p5","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_3p5_TO_5p5","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_5p5_TO_7p5","DARK_BROWN_COFFEE_ROAST_BITTER_ABV_7p5_PLUS"
            ]},
        predicates: [],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Only dark brown styles, all ABV bands.",
            line2: "Separate malt-sweet vs roast-bitter families."
        }
    },
    {
        id: 6106,
        name: "Focus — Fruit & Sours/Saison/Lambic/Gueuze (by subsubcategory)",
        section: "beers",
        groupBy: "subsubcategory",
        within: { subsubcategory_in: [
                "FRUIT_BEERS_ABV_0_TO_0p5","FRUIT_BEERS_ABV_0p5_TO_3p5","FRUIT_BEERS_ABV_3p5_TO_5p5","FRUIT_BEERS_ABV_5p5_TO_7p5","FRUIT_BEERS_ABV_7p5_PLUS",
                "SOURS_SAISON_LAMBIC_GUEUZE_ABV_0_TO_0p5","SOURS_SAISON_LAMBIC_GUEUZE_ABV_0p5_TO_3p5","SOURS_SAISON_LAMBIC_GUEUZE_ABV_3p5_TO_5p5","SOURS_SAISON_LAMBIC_GUEUZE_ABV_5p5_TO_7p5","SOURS_SAISON_LAMBIC_GUEUZE_ABV_7p5_PLUS"
            ]},
        predicates: [],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Only Fruit beers and the sour/saison/lambic/gueuze family.",
            line2: "All ABV bands included."
        }
    }
,
    {
        id: 6107,
        name: "Beers (non-zero) — by Heritage",
        section: "beers",
        groupBy: "heritage",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 0 }],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Alcoholic beers grouped by heritage.",
            line2: "Heritage: NORMAL, ABBEY, TRAPPIST."
        }
    }
,
    {
        id: 6108,
        name: "Beers (zero) — by Heritage",
        section: "beers",
        groupBy: "heritage",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 1 }],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Zero/NA beers grouped by heritage.",
            line2: "Heritage: NORMAL, ABBEY, TRAPPIST."
        }
    }
,
    {
        id: 6109,
        name: "Beers (non-zero) × Heritage (merged)",
        section: "beers",
        groupBy: "subcategory",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 0 }],
        partitionBy: [
            { label: "Normal/Abbey", predicates: [{ field: "heritage", op: "in", value: ["NORMAL","ABBEY"] }] },
            { label: "Trappist",      predicates: [{ field: "heritage", op: "eq", value: "TRAPPIST" }] }
        ],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Per subcategory: Normal+Abbey vs Trappist (alcoholic only).",
            line2: "Quick split of mainstream vs heritage Trappist."
        }
    }
,
    {
        id: 6110,
        name: "Beers (zero) × Heritage (merged)",
        section: "beers",
        groupBy: "subcategory",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 1 }],
        partitionBy: [
            { label: "Normal/Abbey", predicates: [{ field: "heritage", op: "in", value: ["NORMAL","ABBEY"] }] },
            { label: "Trappist",      predicates: [{ field: "heritage", op: "eq", value: "TRAPPIST" }] }
        ],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Per subcategory: Normal+Abbey vs Trappist (zero only).",
            line2: "Where NA Trappist shows up (if at all)."
        }
    }






];
