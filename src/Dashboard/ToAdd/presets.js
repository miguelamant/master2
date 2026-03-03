// src/Dashboard/ToAdd/presets.js

import { presetImg } from './utils/presetImages';

export const PRESET_FILTERS = [
    // 1) All refreshments (keep as is)
    {
        id: 2018,
        name: <>Similarity clusters lvl5 </>,
        section: "beers",
        groupBy: "subsubcategory",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 0 }],
        rollups: [
            // =========================
            // DARK / BROWN (split)
            // =========================

            // BELGIAN_DUBBEL
            {
                match: { baseIn: ["BELGIAN_DUBBEL"] },
                into: "BELGIAN_DUBBEL",
                keepZero: true,
            },

            // BELGIAN_QUADRUPEL
            {
                match: { baseIn: ["BELGIAN_QUADRUPEL"] },
                into: "BELGIAN_QUADRUPEL",
                keepZero: true,
            },

            // BELGIAN_STRONG_DARK_ALE
            {
                match: { baseIn: ["BELGIAN_STRONG_DARK_ALE"] },
                into: "BELGIAN_STRONG_DARK_ALE",
                keepZero: true,
            },

            // OTHER_BROWN_DARK_WINTER_ALES
            {
                match: {
                    baseIn: [
                        "ALTBIER_STICKE",
                        "ALTBIER_TRADITIONAL",
                        "BARLEYWINE_AMERICAN",
                        "BARLEYWINE_ENGLISH",
                        "BARLEYWINE_OTHER",
                        "BOCK_DOPPELBOCK",
                        "BOCK_EISBOCK",
                        "BROWN_ALE_AMERICAN",
                        "BROWN_ALE_BELGIAN",
                        "BROWN_ALE_ENGLISH",
                        "BROWN_ALE_IMPERIAL_/_DOUBLE",
                        "BROWN_ALE_OTHER",
                        "DARK_ALE",
                        "LAGER_DARK",
                        "LAGER_MUNICH_DUNKEL",
                        "LAGER_TMAVE_(CZECH_DARK)",
                        "MILD_DARK",
                        "MILD_LIGHT",
                        "MILD_OTHER",
                        "OLD_/_STOCK_ALE",
                        "RYE_WINE",
                        "SCOTCH_ALE_/_WEE_HEAVY",
                        "SCOTTISH_ALE",
                        "SCOTTISH_EXPORT_ALE",
                        "STRONG_ALE_AMERICAN",
                        "STRONG_ALE_ENGLISH",
                        "STRONG_ALE_OTHER",
                    ],
                },
                into: "OTHER_BROWN_DARK_WINTER_ALES",
                keepZero: true,
            },

            // =========================
            // MALT_LIL_SWEET (unchanged)
            // =========================
            {
                match: {
                    baseIn: [
                        "AUSTRALIAN_SPARKLING_ALE",
                        "BIERE_DE_CHAMPAGNE_/_BIERE_BRUT",
                        "BITTER_BEST",
                        "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)",
                        "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK",
                        "BOCK_SINGLE_/_TRADITIONAL",
                        "CALIFORNIA_COMMON",
                        "CREAM_ALE",
                        "CREAM_ALE_IMPERIAL_/_DOUBLE",
                        "FESTBIER",
                        "LAGER_AMBER_/_RED",
                        "LAGER_AMERICAN_AMBER_/_RED",
                        "LAGER_POLOTMAVE_(CZECH_AMBER)",
                        "LAGER_ROTBIER",
                        "LAGER_VIENNA",
                        "MARZEN",
                        "PALE_ALE_BELGIAN",
                        "RED_ALE_AMERICAN_AMBER_/_RED",
                        "RED_ALE_IRISH",
                        "RED_ALE_OTHER",
                        "TRADITIONAL_ALE",
                        "WINTER_ALE",
                        "WINTER_WARMER",
                    ],
                },
                into: "Belgian amber etc.",
                keepZero: true,
            },

            // =========================
            // CLASSIC_BLOND_AND_TRIPELS (split)
            // =========================

            // ENKEL / PATERSBIER
            {
                match: { baseIn: ["BELGIAN_ENKEL_/_PATERSBIER"] },
                into: "ENKEL_/_PATERSBIER",
                keepZero: true,
            },

            // BELGIAN_BLONDE
            {
                match: { baseIn: ["BELGIAN_BLONDE"] },
                into: "BELGIAN_BLONDE",
                keepZero: true,
            },

            // BELGIAN_TRIPEL
            {
                match: { baseIn: ["BELGIAN_TRIPEL"] },
                into: "BELGIAN_TRIPEL",
                keepZero: true,
            },

            // BELGIAN_STRONG_GOLDEN_ALE
            {
                match: { baseIn: ["BELGIAN_STRONG_GOLDEN_ALE"] },
                into: "BELGIAN_STRONG_GOLDEN_ALE",
                keepZero: true,
            },

            // OTHER_BLOND_GOLDENS
            {
                match: {
                    baseIn: [
                        "BLONDE_/_GOLDEN_ALE_AMERICAN",
                        "BLONDE_/_GOLDEN_ALE_ENGLISH",
                        "BLONDE_/_GOLDEN_ALE_OTHER",
                        "GOLDEN_ALE_UKRAINIAN",
                        // was previously in CLASSIC_BLOND_AND_TRIPELS in your mapping
                        "BITTER_SESSION_/_ORDINARY",
                    ],
                },
                into: "OTHER_BLOND_GOLDENS",
                keepZero: true,
            },

            // =========================
            // WHEAT_BEERS (unchanged)
            // =========================
            {
                match: {
                    baseIn: [
                        "BOCK_WEIZENBOCK",
                        "BOCK_WEIZENDOPPELBOCK",
                        "WHEAT_BEER_AMERICAN_PALE_WHEAT",
                        "WHEAT_BEER_DUNKELWEIZEN",
                        "WHEAT_BEER_FRUITED",
                        "WHEAT_BEER_HEFEWEIZEN",
                        "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                        "WHEAT_BEER_HOPFENWEISSE",
                        "WHEAT_BEER_KRISTALLWEIZEN",
                        "WHEAT_BEER_OTHER",
                        "WHEAT_BEER_WHEAT_WINE",
                        "WHEAT_BEER_WITBIER_/_BLANCHE",
                        "NON-ALCOHOLIC_BEER_WHEAT_BEER",
                    ],
                },
                into: "WHEAT_BEERS",
                keepZero: true,
            },

            // =========================
            // SOURS (split into 3)
            // =========================

            // LAMBICS
            {
                match: {
                    baseIn: [
                        "LAMBIC_FARO",
                        "LAMBIC_FRAMBOISE",
                        "LAMBIC_FRUIT",
                        "LAMBIC_GUEUZE",
                        "LAMBIC_KRIEK",
                        "LAMBIC_OTHER",
                        "LAMBIC_TRADITIONAL",
                    ],
                },
                into: "LAMBICS",
                keepZero: true,
            },

            // FLANDERS_OUD_BRUIN_/_RED
            {
                match: {
                    baseIn: ["SOUR_FLANDERS_OUD_BRUIN", "SOUR_FLANDERS_RED_ALE"],
                },
                into: "FLANDERS_OUD_BRUIN_/_RED",
                keepZero: true,
            },

            // NEW_SOURS (Berliner/Gose/etc + wild/brett/IPA sour)
            {
                match: {
                    baseIn: [
                        "BRETT_BEER",
                        "IPA_SOUR",
                        "NON-ALCOHOLIC_BEER_SOUR",
                        "SOUR_BERLINER_WEISSE",
                        "SOUR_CATHARINA",
                        "SOUR_FRUITED",
                        "SOUR_FRUITED_BERLINER_WEISSE",
                        "SOUR_FRUITED_GOSE",
                        "SOUR_OTHER",
                        "SOUR_OTHER_GOSE",
                        "SOUR_TOMATO_/_VEGETABLE_GOSE",
                        "SOUR_TRADITIONAL_GOSE",
                        "WILD_ALE_AMERICAN",
                        "WILD_ALE_OTHER",
                    ],
                },
                into: "WILD_OTHER_SOURS",
                keepZero: true,
            },


            // =========================
            // CIDERS (unchanged)
            // =========================
            {
                match: {
                    baseIn: [
                        "CIDER_APPLEWINE",
                        "CIDER_BASQUE",
                        "CIDER_DRY",
                        "CIDER_GRAFF",
                        "CIDER_HERBED_/_SPICED_/_HOPPED",
                        "CIDER_ICE",
                        "CIDER_OTHER_FRUIT",
                        "CIDER_PERRY_/_POIRE",
                        "CIDER_ROSE",
                        "CIDER_SWEET",
                        "CIDER_TRADITIONAL_/_APFELWEIN",
                        "NON-ALCOHOLIC_CIDER_/_PERRY",
                    ],
                },
                into: "CIDERS",
                keepZero: true,
            },

            // =========================
            // SAISON (unchanged)
            // =========================
            {
                match: {
                    baseIn: [
                        "FARMHOUSE_ALE_BIERE_DE_COUPAGE",
                        "FARMHOUSE_ALE_BIERE_DE_GARDE",
                        "FARMHOUSE_ALE_BIERE_DE_MARS",
                        "FARMHOUSE_ALE_BRETT",
                        "FARMHOUSE_ALE_GRISETTE",
                        "FARMHOUSE_ALE_KORNØL",
                        "FARMHOUSE_ALE_OTHER",
                        "FARMHOUSE_ALE_SAHTI",
                        "FARMHOUSE_ALE_SAISON",
                    ],
                },
                into: "SAISON",
                keepZero: true,
            },

            // =========================
            // SWEET_FRUITY (unchanged)
            // =========================
            {
                match: { baseIn: ["FRUIT_BEER", "BLOND_FRUITED", "FRUIT_DOMINANT"] },
                into: "SWEET_FRUITY",
                keepZero: true,
            },

            // =========================
            // HOPPY_BITTER (unchanged from last version)
            // =========================
            {
                match: {
                    baseIn: [
                        "IPA_AMERICAN",
                        "IPA_BELGIAN",
                        "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                        "IPA_BRETT",
                        "IPA_BROWN",
                        "IPA_BRUT",
                        "IPA_COLD",
                        "IPA_ENGLISH",
                        "IPA_FARMHOUSE",
                        "IPA_FRUITED",
                        "IPA_IMPERIAL_/_DOUBLE",
                        "IPA_IMPERIAL_/_DOUBLE_BLACK",
                        "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                        "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                        "IPA_MILKSHAKE",
                        "IPA_NEW_ENGLAND_/_HAZY",
                        "IPA_NEW_ZEALAND",
                        "IPA_OTHER",
                        "IPA_QUADRUPLE",
                        "IPA_RED",
                        "IPA_RYE",
                        "IPA_SESSION",
                        "IPA_TRIPLE",
                        "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                        "IPA_WHITE_/_WHEAT",
                        "NON-ALCOHOLIC_BEER_IPA",
                        "PALE_ALE_AMERICAN",
                        "PALE_ALE_MILKSHAKE",
                        "PALE_ALE_NEW_ENGLAND_/_HAZY",
                    ],
                },
                into: "Ipa etc.",
                keepZero: true,
            },

            // HOPPY_MALT (unchanged)
            {
                match: {
                    baseIn: [
                        "NON-ALCOHOLIC_BEER_PALE_ALE",
                        "PALE_ALE_AUSTRALIAN",
                        "PALE_ALE_ENGLISH",
                        "PALE_ALE_FRUITED",
                        "PALE_ALE_NEW_ZEALAND",
                        "PALE_ALE_OTHER",
                        "PALE_ALE_XPA_(EXTRA_PALE)",
                        "RED_ALE_IMPERIAL_/_DOUBLE",
                        "RYE_BEER",
                    ],
                },
                into: "American Pale ale",
                keepZero: true,
            },

            // =========================
            // CLASSIC_LAGERS / SPECIAL_LAGERS (unchanged)
            // =========================
            {
                match: {
                    baseIn: [
                        "KELLERBIER_/_ZWICKELBIER",
                        "KVASS",
                        "LAGER_AMERICAN",
                        "LAGER_AMERICAN_LIGHT",
                        "LAGER_AMERICAN_PRE-PROHIBITION",
                        "LAGER_DORTMUNDER_/_EXPORT",
                        "LAGER_HELLES",
                        "LAGER_JAPANESE_RICE",
                        "LAGER_LEICHTBIER",
                        "LAGER_MEXICAN",
                        "LAGER_PALE",
                        "LAGER_SVETLE_(CZECH_PALE)",
                        "PILSNER_CZECH_/_BOHEMIAN",
                        "PILSNER_GERMAN",
                        "PILSNER_ITALIAN",
                        "PILSNER_NEW_ZEALAND",
                        "PILSNER_OTHER",
                        "NON-ALCOHOLIC_BEER_LAGER",
                    ],
                },
                into: "CLASSIC_LAGERS",
                keepZero: true,
            },
            {
                match: {
                    baseIn: [
                        "LAGER_IPL_(INDIA_PALE_LAGER)",
                        "LAGER_OTHER",
                        "LAGER_SMOKED",
                        "LAGER_STRONG",
                        "LAGER_WINTER",
                        "PILSNER_IMPERIAL_/_DOUBLE",
                        "RAUCHBIER",
                    ],
                },
                into: "SPECIAL_LAGERS",
                keepZero: true,
            },

            {
                match: { baseIn: ["SHANDY_/_RADLER", "NON-ALCOHOLIC_BEER_SHANDY_/_RADLER"] },
                into: "RADLERS",
                keepZero: true,
            },

            // =========================
            // DARK_BLACK_ROAST_BITTER (unchanged)
            // =========================
            {
                match: {
                    baseIn: [
                        "NON-ALCOHOLIC_BEER_PORTER_/_STOUT",
                        "PORTER_AMERICAN",
                        "PORTER_BALTIC",
                        "PORTER_COFFEE",
                        "PORTER_ENGLISH",
                        "PORTER_IMPERIAL_/_DOUBLE",
                        "PORTER_IMPERIAL_/_DOUBLE_BALTIC",
                        "PORTER_IMPERIAL_/_DOUBLE_COFFEE",
                        "PORTER_OTHER",
                        "PORTER_SMOKED",
                        "SCHWARZBIER",
                    ],
                },
                into: "Porters",
                keepZero: true,
            },

            // =========================
            // DARK_BLACK_ROAST_BITTER (unchanged)
            // =========================
            {
                match: {
                    baseIn: [
                        "NON-ALCOHOLIC_BEER_PORTER_/_STOUT",
                        "STOUT_AMERICAN",
                        "STOUT_BELGIAN",
                        "STOUT_COFFEE",
                        "STOUT_ENGLISH",
                        "STOUT_FOREIGN_/_EXPORT",
                        "STOUT_IMPERIAL_/_DOUBLE",
                        "STOUT_IMPERIAL_/_DOUBLE_COFFEE",
                        "STOUT_IMPERIAL_/_DOUBLE_MILK",
                        "STOUT_IMPERIAL_/_DOUBLE_OATMEAL",
                        "STOUT_IMPERIAL_/_DOUBLE_PASTRY",
                        "STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN",
                        "STOUT_IRISH_DRY",
                        "STOUT_MILK_/_SWEET",
                        "STOUT_OATMEAL",
                        "STOUT_OTHER",
                        "STOUT_OYSTER",
                        "STOUT_PASTRY",
                        "STOUT_RUSSIAN_IMPERIAL",
                        "STOUT_WHITE_/_GOLDEN",
                    ],
                },
                into: "Stouts",
                keepZero: true,
            },

            // =========================
            // BEERS_OTHER / BEERS_SPECIAL / TABLE / SPIRIT / SODA MIX (unchanged)
            // =========================
            {
                match: {
                    baseIn: [
                        "CORN_BEER_/_CHICHA_DE_JORA",
                        "FLAVORED_MALT_BEVERAGE",
                        "HAPPOSHU",
                        "HARD_GINGER_BEER",
                        "HARD_KOMBUCHA_/_JUN",
                        "HARD_SELTZER",
                        "KOJI_/_GINJO_BEER",
                        "KOLSCH",
                        "MAKGEOLLI",
                        "MALT_BEER",
                        "MALT_LIQUOR",
                        "NON-ALCOHOLIC_BEER_OTHER",
                        "ROOT_BEER",
                        "BEERS_OTHER",
                        "MEAD_ACERGLYN_/_MAPLE_WINE",
                        "MEAD_BOCHET",
                        "MEAD_BRAGGOT",
                        "MEAD_CYSER",
                        "MEAD_MELOMEL",
                        "MEAD_METHEGLIN",
                        "MEAD_OTHER",
                        "MEAD_PYMENT",
                        "MEAD_SESSION_/_SHORT",
                        "MEAD_TRADITIONAL",
                        "NON-ALCOHOLIC_MEAD",
                    ],
                },
                into: "BEERS_OTHER",
                keepZero: true,
            },
            {
                match: {
                    baseIn: [
                        "BLACK_&_TAN",
                        "CHILLI_/_CHILE_BEER",
                        "FREEZE-DISTILLED_BEER",
                        "GLUTEN-FREE",
                        "GRAPE_ALE_ITALIAN",
                        "GRAPE_ALE_OTHER",
                        "GRODZISKIE_/_GRATZER",
                        "HISTORICAL_BEER_ADAMBIER",
                        "HISTORICAL_BEER_BERLINER_BRAUNBIER",
                        "HISTORICAL_BEER_BROYHAN",
                        "HISTORICAL_BEER_BURTON_ALE",
                        "HISTORICAL_BEER_DAMPFBIER",
                        "HISTORICAL_BEER_GRUIT_/_ANCIENT_HERBED_ALE",
                        "HISTORICAL_BEER_KENTUCKY_COMMON",
                        "HISTORICAL_BEER_KOTTBUSSER",
                        "HISTORICAL_BEER_KUIT_/_KUYT_/_KOYT",
                        "HISTORICAL_BEER_LICHTENHAINER",
                        "HISTORICAL_BEER_MUMME",
                        "HISTORICAL_BEER_OTHER",
                        "HISTORICAL_BEER_STEINBIER",
                        "HISTORICAL_BEER_ZOIGL",
                        "MAZOUT",
                        "HONEY_BEER",
                        "PUMPKIN_/_YAM_BEER",
                        "ROGGENBIER",
                        "SMOKED_BEER",
                        "SORGHUM_/_MILLET_BEER",
                        "SPECIALTY_GRAIN",
                        "SPICED_/_HERBED_BEER",
                        "BEERS_SPECIAL",
                    ],
                },
                into: "BEERS_SPECIAL",
                keepZero: true,
            },
            {
                match: { baseIn: ["TABLE_BEER"] },
                into: "TABLE_BEER",
                keepZero: false,
            },
            {
                match: { baseIn: ["SPIRIT_FLAVOURED_BEERS"] },
                into: "SPIRIT_FLAVOURED_BEERS",
                keepZero: true,
            },
            {
                match: { baseIn: ["BEER_SODA_MIX"] },
                into: "BEER_SODA_MIX",
                keepZero: true,
            },
        ],
        forceShow: [
        ],
        sortPriority: [
        ],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: <>De verdeling <strong> van smaken</strong> <br/> van jouw</>,
            line2: <> <strong> bieren </strong> is</>
        }
    },




];


/*
    1001: [1001],                 // Subcategory overview (1D)
    2001: [1001, 2001, 2101],     // Subcat + Zero 1D + Subcat×Zero 2D

    3001: [3001, 3101, 3111],     // Ice Tea × carbonation + variants 1D (unchanged)
    3002: [3101, 3111, 2001],           // Ice Tea × sugar (no carbonation refs)

    4001: [3201],                 // Lemonades — overview (no carbonation)
    4002: [3201, 3211,2001],           // Lemonades × sugar (no carbonation refs)

    5001: [2001, 3311, 3301],           // Cola variants × sugar
    6001: [3601],                 // Juices variants (1D)

    7001: [2001, 3411, 3401],           // Ginger variants × sugar
    8001: [2001, 3511,3501]


,
    {
        id: 2099,
        name: <>
            <strong>All SUBSUBs</strong>!<br/>

        </>,
        section: "beers",
        groupBy: "subsubcategory",
        within: {},
        predicates: [],




        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "All subsubs.",
            line2: ".",
        },
    },



    {
        id: 2004,
        name: "Alcohol % distribution ",
        section: "beers",

        // base group is the category row "BEERS"
        groupBy: "category",

        // scope strictly to beers
        within:     { category: "BEERS" },
        filters:    { category: "BEERS" },

        // optional global predicates (e.g. only alcoholic)
        predicates: [],

        // partition the single BEERS row into ABV buckets
        partitionBy: [

            { label: "0.6–5.5%", predicates: [{ field: "abv", op: "between", value: [0.5, 5.5] }] },
            { label: "5.6–7.5%", predicates: [{ field: "abv", op: "between", value: [5.6, 7.5] }] },
            { label: "7.6% +",    predicates: [{ field: "abv", op: "between", value: [7.6, 100] }] } // open-ended
        ],

        includeEmpty: false,

        // ensure the 5 bands render even at zero
        forceShow: [

            "BEERS · 0.6–5.5%",
            "BEERS · 5.6–7.5%",
            "BEERS · 7.6% +"
        ],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "De verdeling tussen van alcohol-% van jouw ",
            line2: "2004"
        }
    }



    ,
    {
        id: 2005,
        name: "Blonde bieren",
        section: "beers",
        groupBy: "subcategory",
        within: { category: "BEERS", subcategory_in: ["NORMAL_BLOND_AMBER"] },
        predicates: [],
        partitionBy: [
            { label: "0.6–5.5%", predicates: [{ field: "abv", op: "between", value: [0.5, 5.5] }] },
            { label: "5.6–7.5%", predicates: [{ field: "abv", op: "between", value: [5.6, 7.5] }] },
            { label: "7.6%+",    predicates: [{ field: "abv", op: "between", value: [7.6, 100] }] } // open-ended
        ],
        forceShow: [
          "NORMAL_BLOND_AMBER · 0.6–5.5%",
          "NORMAL_BLOND_AMBER · 5.6–7.5%", "NORMAL_BLOND_AMBER · 7.6%+",
        ],
        sortPriority: [
            "NORMAL_BLOND_AMBER · 0.6–5.5%",

            "NORMAL_BLOND_AMBER · 5.6–7.5%",

            "NORMAL_BLOND_AMBER · 7.6%+",

        ],
        info: {
            line1: "De verdeling tussen van alcohol-% van jouw  ",
            line2: "2005"
        }
    }
        ,
        {
            id: 2006,
            name: "Blond & bitter bieren",
            section: "beers",
            groupBy: "subcategory",
            within: { category: "BEERS", subcategory_in: ["BLOND_BITTERS"] },
            predicates: [],
            partitionBy: [
                { label: "0.6–5.5%", predicates: [{ field: "abv", op: "between", value: [0.5, 5.5] }] },
                { label: "5.6–7.5%", predicates: [{ field: "abv", op: "between", value: [5.6, 7.5] }] },
                { label: "7.6%+",    predicates: [{ field: "abv", op: "between", value: [7.6, 100] }] } // open-ended
            ],
            forceShow: [

                "BLOND_BITTERS · 0.6–5.5%",
                "BLOND_BITTERS · 5.6–7.5%", "BLOND_BITTERS · 7.6%+"
            ],
            sortPriority: [

                "NORMAL_BLOND_AMBER · 0.6–5.5%",
                "BLOND_BITTERS · 0.6–5.5%",
                "NORMAL_BLOND_AMBER · 5.6–7.5%",
                "BLOND_BITTERS · 5.6–7.5%",
                "NORMAL_BLOND_AMBER · 7.6%+",
                "BLOND_BITTERS · 7.6%+",
            ],
            info: {
                line1: "De verdeling tussen van alcohol-% van jouw  ",
                line2: "2006"
            }
        }
    ,
    {
        id: 2007,
        name: "Bruine & donker - malt, zoet",
        section: "beers",
        groupBy: "subcategory",
        within: { category: "BEERS", subcategory_in: ["DARK_BROWN_MALT_SWEETNESS"] },
        predicates: [],
        partitionBy: [
            { label: "0.6–5.5%", predicates: [{ field: "abv", op: "between", value: [0.5, 5.5] }] },
            { label: "5.6–7.5%", predicates: [{ field: "abv", op: "between", value: [5.6, 7.5] }] },
            { label: "7.6%+",    predicates: [{ field: "abv", op: "between", value: [7.6, 100] }] } // open-ended
        ],
        forceShow: [
            "DARK_BROWN_MALT_SWEETNESS · 0.6–5.5%", "DARK_BROWN_MALT_SWEETNESS · 5.6–7.5%","DARK_BROWN_MALT_SWEETNESS · 7.6%+",


        ],
        sortPriority: [

            "DARK_BROWN_MALT_SWEETNESS · 0.6–5.5%",
            "DARK_BROWN_COFFEE_ROAST_BITTER · 0.6–5.5%",
            "DARK_BROWN_MALT_SWEETNESS · 5.6–7.5%",
            "DARK_BROWN_COFFEE_ROAST_BITTER · 5.6–7.5%",
            "DARK_BROWN_MALT_SWEETNESS · 7.6%+",
            "DARK_BROWN_COFFEE_ROAST_BITTER · 7.6%+",
        ],
        info: {
            line1: "De verdeling tussen van alcohol-% van jouw ",
            line2: "Malt-zoet voor traditioneel; roast-bitter populair bij avontuurlijke drinkers. 2007"
        }
    }
        ,
        {
            id: 2008,
            name: "Bruin & donker - koffie, bitter",
            section: "beers",
            groupBy: "subcategory",
            within: { category: "BEERS", subcategory_in: ["DARK_BROWN_COFFEE_ROAST_BITTER"] },
            predicates: [],
            partitionBy: [
                { label: "0.6–5.5%", predicates: [{ field: "abv", op: "between", value: [0.5, 5.5] }] },
                { label: "5.6–7.5%", predicates: [{ field: "abv", op: "between", value: [5.6, 7.5] }] },
                { label: "7.6%+",    predicates: [{ field: "abv", op: "between", value: [7.6, 100] }] } // open-ended
            ],
            forceShow: [
                "DARK_BROWN_COFFEE_ROAST_BITTER · 0.6–5.5%","DARK_BROWN_COFFEE_ROAST_BITTER · 7.6%+", "DARK_BROWN_COFFEE_ROAST_BITTER · 5.6–7.5%",

            ],
            sortPriority: [

                "DARK_BROWN_MALT_SWEETNESS · 0.6–5.5%",
                "DARK_BROWN_COFFEE_ROAST_BITTER · 0.6–5.5%",
                "DARK_BROWN_MALT_SWEETNESS · 5.6–7.5%",
                "DARK_BROWN_COFFEE_ROAST_BITTER · 5.6–7.5%",
                "DARK_BROWN_MALT_SWEETNESS · 7.6%+",
                "DARK_BROWN_COFFEE_ROAST_BITTER · 7.6%+",
            ],
            info: {
                line1: "De verdeling tussen van alcohol-% van jouw ",
                line2: "Malt-zoet voor traditioneel; roast-bitter populair bij avontuurlijke drinkers. 2008"
            }
        }
    ,
    {
        id: 2009,
        name: "Fruit bieren",
        section: "beers",
        groupBy: "subcategory",

        // restrict to beers and just these two families
        within: { category: "BEERS", subcategory_in: ["FRUIT_BEERS"] },

        predicates: [],

        // non-overlapping ABV bands (avoid double-counting on edges)
        partitionBy: [


            { label: "0.6–5.5%", predicates: [{ field: "abv", op: "between", value: [0.6, 5.5] }] },
            { label: "5.6–7.5%", predicates: [{ field: "abv", op: "between", value: [5.6, 7.5] }] },
            { label: "7.6%+",    predicates: [{ field: "abv", op: "between", value: [7.6, 100] }] }
        ],

        // show even if zero (composite keys = base "subcategory" + " · " + band label)
        forceShow: [
            "FRUIT_BEERS · 0.6–5.5%",
            "FRUIT_BEERS · 5.6–7.5%",
            "FRUIT_BEERS · 7.6%+"

        ],

        // alternate Fruit / Sours per band
        sortPriority: [


            "FRUIT_BEERS · 0.6–5.5%", "SOURS_SAISON_LAMBIC_GUEUZE · 0.6–5.5%",
            "FRUIT_BEERS · 5.6–7.5%", "SOURS_SAISON_LAMBIC_GUEUZE · 5.6–7.5%",
            "FRUIT_BEERS · 7.6%+",    "SOURS_SAISON_LAMBIC_GUEUZE · 7.6%+"
        ],

        info: {
            line1: "De verdeling tussen van alcohol-% van jouw ",
            line2: "Fruit voor wie geen bitterheid wil; zuur voor ontdekkers en traditieliefhebbers. 2009"
        }
    }
        ,
        {
            id: 2010,
            name: "Zure bieren",
            section: "beers",
            groupBy: "subcategory",

            // restrict to beers and just these two families
            within: { category: "BEERS", subcategory_in: ["SOURS_SAISON_LAMBIC_GUEUZE"] },

            predicates: [],

            // non-overlapping ABV bands (avoid double-counting on edges)
            partitionBy: [


                { label: "0.6–5.5%", predicates: [{ field: "abv", op: "between", value: [0.6, 5.5] }] },
                { label: "5.6–7.5%", predicates: [{ field: "abv", op: "between", value: [5.6, 7.5] }] },
                { label: "7.6%+",    predicates: [{ field: "abv", op: "between", value: [7.6, 100] }] }
            ],
            includeEmpty: false,

            // show even if zero (composite keys = base "subcategory" + " · " + band label)
            forceShow: [
                "SOURS_SAISON_LAMBIC_GUEUZE · 0.6–5.5%",
                "SOURS_SAISON_LAMBIC_GUEUZE · 5.6–7.5%",
                "SOURS_SAISON_LAMBIC_GUEUZE · 7.6%+"
            ],

            // alternate Fruit / Sours per band
            sortPriority: [

                "SOURS_SAISON_LAMBIC_GUEUZE · 0.6–5.5%",
                "SOURS_SAISON_LAMBIC_GUEUZE · 5.6–7.5%",
                 "SOURS_SAISON_LAMBIC_GUEUZE · 7.6%+"
            ],

            info: {
                line1: "De verdeling tussen van alcohol-% van jouw ",
                line2: "Fruit voor wie geen bitterheid wil; zuur voor ontdekkers en traditieliefhebbers. 2010"
            }
        }
        ,

    ,
        {
            id: 2011,
            name: "Alcoholische bieren",
            section: "beers",
            groupBy: "category",
            within:  { category: "BEERS" },
            filters: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            partitionBy: [
                { label: "NORMAL",   predicates: [{ field: "heritage", op: "eq", value: "NORMAL" }] },
                { label: "ABBEY",    predicates: [{ field: "heritage", op: "eq", value: "ABBEY"  }] },
                { label: "TRAPPIST", predicates: [{ field: "heritage", op: "eq", value: "TRAPPIST"}] }
            ],
            includeEmpty: false,

            // 👇 new: exact labels as they appear in the grid keys (base + " · " + partition label)
            forceShow: ["BEERS · NORMAL", "BEERS · ABBEY", "BEERS · TRAPPIST"],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: "De verdeling tussen van erfgoed van jouw ",
                line2: "Heritage buckets: NORMAL, ABBEY, TRAPPIST. 2011"
            }
        }
        ,

     {
        id: 6103,
        name: "Beers — by ABV band",
        section: "beers",
        groupBy: "abv_band",
        predicates: [],        // you can still add e.g. {field:'is_zero', op:'eq', value:0}
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "Only Normal Blond/Amber and Blond Bitters (all ABV bands).",
            line2: "Drill into core blond styles."
        }
    }


      {
        id: 6108,
        name: "Non-alcoholische bieren",
        section: "beers",

        // base row is the category "BEERS"
        groupBy: "category",

        // strictly include beers
        within:  { category: "BEERS" },
        filters: { category: "BEERS" },

        // only zero / non-alcoholic beers
        predicates: [{ field: "is_zero", op: "eq", value: 1 }],

        // split BEERS into heritage buckets
        partitionBy: [
            { label: "NORMAL",   predicates: [{ field: "heritage", op: "eq", value: "NORMAL"  }] },
            { label: "ABBEY",    predicates: [{ field: "heritage", op: "eq", value: "ABBEY"   }] },
            { label: "TRAPPIST", predicates: [{ field: "heritage", op: "eq", value: "TRAPPIST"}] }
        ],

        includeEmpty: false,

        // ensure they still render at zero
        forceShow: ["BEERS · NORMAL", "BEERS · ABBEY", "BEERS · TRAPPIST"],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: "De verdeling tussen van erfgoed van jouw ",
            line2: "Heritage buckets: NORMAL, ABBEY, TRAPPIST."
        }
    }

    ,
    {
            id: 6110,
            name: "Non-alcoholische bieren",
            section: "beers",
            groupBy: "subcategory",

            // only beers, and explicitly exclude LAGERS by whitelisting allowed subs
            within: {
                category: "BEERS",
                subcategory_in: [
                    "NORMAL_BLOND_AMBER",
                    "BLOND_BITTERS",
                    "DARK_BROWN_MALT_SWEETNESS",
                    "FRUIT_BEERS",
                    "SOURS_SAISON_LAMBIC_GUEUZE",
                    "WHEAT_BEERS"
                ]
            },

            // zero/NA only
            predicates: [{ field: "is_zero", op: "eq", value: 1 }],

            partitionBy: [
                { label: "Normal/Abbey", predicates: [{ field: "heritage", op: "in", value: ["NORMAL","ABBEY"] }] },
                { label: "Trappist",     predicates: [{ field: "heritage", op: "eq", value: "TRAPPIST" }] }
            ],

            forceShow: [
                "NORMAL_BLOND_AMBER · Normal/Abbey", "NORMAL_BLOND_AMBER · Trappist",
                "BLOND_BITTERS · Normal/Abbey",      "BLOND_BITTERS · Trappist",
                "DARK_BROWN_MALT_SWEETNESS · Normal/Abbey", "DARK_BROWN_MALT_SWEETNESS · Trappist",
                "FRUIT_BEERS · Normal/Abbey",        "FRUIT_BEERS · Trappist",
                "SOURS_SAISON_LAMBIC_GUEUZE · Normal/Abbey", "SOURS_SAISON_LAMBIC_GUEUZE · Trappist",
                "WHEAT_BEERS · Normal/Abbey", "WHEAT_BEERS · Trappist"
            ],

            sortPriority: [
                "NORMAL_BLOND_AMBER · Normal/Abbey", "NORMAL_BLOND_AMBER · Trappist",
                "BLOND_BITTERS · Normal/Abbey",      "BLOND_BITTERS · Trappist",
                "DARK_BROWN_MALT_SWEETNESS · Normal/Abbey", "DARK_BROWN_MALT_SWEETNESS · Trappist",
                "FRUIT_BEERS · Normal/Abbey",        "FRUIT_BEERS · Trappist",
                "SOURS_SAISON_LAMBIC_GUEUZE · Normal/Abbey", "SOURS_SAISON_LAMBIC_GUEUZE · Trappist"
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: "De verdeling tussen van smaak en erfgoed van jouw ",
                line2: "Where NA Trappist shows up (if at all)."
            }
        }
        ,



        {
            id: 2192,
            name: <>TEMP: Roll-up subsubcategories → SUB (taste clusters)</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: {},
            showOnlyRollups: true,
            predicates: [],
            includeEmpty: false,
            ui: {
                columns: 2,
                aggregateTop: {
                    enabled: true,
                    deterministic: true, // ✅ NEW
                    unassigned: "hide", // "append" (default) | "hide"
                    columns: [
                        {
                            title: "Mainstream styles",
                            iconToken: "SUGAR_FREE",
                            buckets: [

                                "CLASSIC_BLOND",
                                "WHEAT_BEERS",
                                "CLASSIC_LAGERS"
                            ],
                        },
                        {
                            title: "Anti-mainstream",
                            iconToken: "SUGAR",
                            buckets: [
                                "IPA_ETC",
                                "PALE_ALE",
                                "SOURS",
                                "SAISON",
                                "DARK_BLACK_ROAST_BITTER",

                            ],
                        },
                    ],
                },
            },
            rollups: [

                // CLASSIC_BLOND_AND_TRIPELS
                {
                    match: {
                        baseIn: [
                            "BELGIAN_BLONDE",
                            "BELGIAN_ENKEL_/_PATERSBIER",
                            "BELGIAN_STRONG_GOLDEN_ALE",
                            "BELGIAN_TRIPEL",
                            "BITTER_SESSION_/_ORDINARY",
                            "BLONDE_/_GOLDEN_ALE_AMERICAN",
                            "BLONDE_/_GOLDEN_ALE_ENGLISH",
                            "BLONDE_/_GOLDEN_ALE_OTHER",
                            "GOLDEN_ALE_UKRAINIAN",
                        ],
                    },
                    into: "CLASSIC_BLOND",
                    keepZero: true,
                },

                // WHEAT_BEERS
                {
                    match: {
                        baseIn: [
                            "BOCK_WEIZENBOCK",
                            "BOCK_WEIZENDOPPELBOCK",
                            "WHEAT_BEER_AMERICAN_PALE_WHEAT",
                            "WHEAT_BEER_DUNKELWEIZEN",
                            "WHEAT_BEER_FRUITED",
                            "WHEAT_BEER_HEFEWEIZEN",
                            "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                            "WHEAT_BEER_HOPFENWEISSE",
                            "WHEAT_BEER_KRISTALLWEIZEN",
                            "WHEAT_BEER_OTHER",
                            "WHEAT_BEER_WHEAT_WINE",
                            "WHEAT_BEER_WITBIER_/_BLANCHE",
                            "NON-ALCOHOLIC_BEER_WHEAT_BEER",
                        ],
                    },
                    into: "WHEAT_BEERS",
                    keepZero: true,
                },

                // SOURS (incl. lambic + wild + sour styles, incl. IPA sour)
                {
                    match: {
                        baseIn: [
                            "BRETT_BEER",
                            "IPA_SOUR",
                            "NON-ALCOHOLIC_BEER_SOUR",
                            "LAMBIC_FARO",
                            "LAMBIC_FRAMBOISE",
                            "LAMBIC_FRUIT",
                            "LAMBIC_GUEUZE",
                            "LAMBIC_KRIEK",
                            "LAMBIC_OTHER",
                            "LAMBIC_TRADITIONAL",
                            "SOUR_BERLINER_WEISSE",
                            "SOUR_CATHARINA",
                            "SOUR_FLANDERS_OUD_BRUIN",
                            "SOUR_FLANDERS_RED_ALE",
                            "SOUR_FRUITED",
                            "SOUR_FRUITED_BERLINER_WEISSE",
                            "SOUR_FRUITED_GOSE",
                            "SOUR_OTHER",
                            "SOUR_OTHER_GOSE",
                            "SOUR_TOMATO_/_VEGETABLE_GOSE",
                            "SOUR_TRADITIONAL_GOSE",
                            "WILD_ALE_AMERICAN",
                            "WILD_ALE_OTHER",
                        ],
                    },
                    into: "SOURS",
                    keepZero: true,
                },



                // SAISON
                {
                    match: {
                        baseIn: [
                            "FARMHOUSE_ALE_BIERE_DE_COUPAGE",
                            "FARMHOUSE_ALE_BIERE_DE_GARDE",
                            "FARMHOUSE_ALE_BIERE_DE_MARS",
                            "FARMHOUSE_ALE_BRETT",
                            "FARMHOUSE_ALE_GRISETTE",
                            "FARMHOUSE_ALE_KORNØL",
                            "FARMHOUSE_ALE_OTHER",
                            "FARMHOUSE_ALE_SAHTI",
                            "FARMHOUSE_ALE_SAISON",
                        ],
                    },
                    into: "SAISON",
                    keepZero: true,
                },


                // HOPPY_BITTER (all IPAs except IPA_SOUR, plus some pale ales)
                {
                    match: {
                        baseIn: [
                            "IPA_AMERICAN",
                            "IPA_BELGIAN",
                            "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                            "IPA_BRETT",
                            "IPA_BROWN",
                            "IPA_BRUT",
                            "IPA_COLD",
                            "IPA_ENGLISH",
                            "IPA_FARMHOUSE",
                            "IPA_FRUITED",
                            "IPA_IMPERIAL_/_DOUBLE",
                            "IPA_IMPERIAL_/_DOUBLE_BLACK",
                            "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                            "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                            "IPA_MILKSHAKE",
                            "IPA_NEW_ENGLAND_/_HAZY",
                            "IPA_NEW_ZEALAND",
                            "IPA_OTHER",
                            "IPA_QUADRUPLE",
                            "IPA_RED",
                            "IPA_RYE",
                            "IPA_SESSION",
                            "IPA_TRIPLE",
                            "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                            "IPA_WHITE_/_WHEAT",
                            "NON-ALCOHOLIC_BEER_IPA",
                            "PALE_ALE_AMERICAN",
                            "PALE_ALE_MILKSHAKE",
                            "PALE_ALE_NEW_ENGLAND_/_HAZY",
                        ],
                    },
                    into: "IPA_ETC",
                    keepZero: true,
                },

                // HOPPY_MALT
                {
                    match: {
                        baseIn: [
                            "NON-ALCOHOLIC_BEER_PALE_ALE",
                            "PALE_ALE_AUSTRALIAN",
                            "PALE_ALE_ENGLISH",
                            "PALE_ALE_FRUITED",
                            "PALE_ALE_NEW_ZEALAND",
                            "PALE_ALE_OTHER",
                            "PALE_ALE_XPA_(EXTRA_PALE)",
                            "RED_ALE_IMPERIAL_/_DOUBLE",
                            "RYE_BEER",
                        ],
                    },
                    into: "PALE_ALE",
                    keepZero: true,
                },

                // CLASSIC_LAGERS
                {
                    match: {
                        baseIn: [
                            "KELLERBIER_/_ZWICKELBIER",
                            "KVASS",
                            "LAGER_AMERICAN",
                            "LAGER_AMERICAN_LIGHT",
                            "LAGER_AMERICAN_PRE-PROHIBITION",
                            "LAGER_DORTMUNDER_/_EXPORT",
                            "LAGER_HELLES",
                            "LAGER_JAPANESE_RICE",
                            "LAGER_LEICHTBIER",
                            "LAGER_MEXICAN",
                            "LAGER_PALE",
                            "LAGER_SVETLE_(CZECH_PALE)",
                            "PILSNER_CZECH_/_BOHEMIAN",
                            "PILSNER_GERMAN",
                            "PILSNER_ITALIAN",
                            "PILSNER_NEW_ZEALAND",
                            "PILSNER_OTHER",
                            "NON-ALCOHOLIC_BEER_LAGER",
                        ],
                    },
                    into: "CLASSIC_LAGERS",
                    keepZero: true,
                },


                // DARK_BLACK_ROAST_BITTER
                {
                    match: {
                        baseIn: [
                            "NON-ALCOHOLIC_BEER_PORTER_/_STOUT",
                            "PORTER_AMERICAN",
                            "PORTER_BALTIC",
                            "PORTER_COFFEE",
                            "PORTER_ENGLISH",
                            "PORTER_IMPERIAL_/_DOUBLE",
                            "PORTER_IMPERIAL_/_DOUBLE_BALTIC",
                            "PORTER_IMPERIAL_/_DOUBLE_COFFEE",
                            "PORTER_OTHER",
                            "PORTER_SMOKED",
                            "SCHWARZBIER",
                            "STOUT_AMERICAN",
                            "STOUT_BELGIAN",
                            "STOUT_COFFEE",
                            "STOUT_ENGLISH",
                            "STOUT_FOREIGN_/_EXPORT",
                            "STOUT_IMPERIAL_/_DOUBLE",
                            "STOUT_IMPERIAL_/_DOUBLE_COFFEE",
                            "STOUT_IMPERIAL_/_DOUBLE_MILK",
                            "STOUT_IMPERIAL_/_DOUBLE_OATMEAL",
                            "STOUT_IMPERIAL_/_DOUBLE_PASTRY",
                            "STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN",
                            "STOUT_IRISH_DRY",
                            "STOUT_MILK_/_SWEET",
                            "STOUT_OATMEAL",
                            "STOUT_OTHER",
                            "STOUT_OYSTER",
                            "STOUT_PASTRY",
                            "STOUT_RUSSIAN_IMPERIAL",
                            "STOUT_WHITE_/_GOLDEN",
                        ],
                    },
                    into: "DARK_BLACK_ROAST_BITTER",
                    keepZero: true,
                },





                // SPIRIT_FLAVOURED_BEERS



            ],
            forceShow: [
            ],
            sortPriority: [
         ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> main vs anti</strong> <br/> van jouw</>,
                line2: <> <strong> bieren </strong>    is</>
            }
        }
,

{
        id: 2015,
        name: <>TEMP: Roll-up subsubcategories → SUB_BILLY</>,
        section: "beers",
        groupBy: "subsubcategory",
        within: {},
        predicates: [],
        rollups: [
            // ALTBIER
            {
                match: { baseIn: ["ALTBIER_STICKE", "ALTBIER_TRADITIONAL"] },
                into: "ALTBIER",
                keepZero: true,
            },

            // AUSTRALIAN_SPARKLING_ALE
            {
                match: { baseIn: ["AUSTRALIAN_SPARKLING_ALE"] },
                into: "AUSTRALIAN_SPARKLING_ALE",
                keepZero: true,
            },

            // BARLEYWINE
            {
                match: {
                    baseIn: ["BARLEYWINE_AMERICAN", "BARLEYWINE_ENGLISH", "BARLEYWINE_OTHER"],
                },
                into: "BARLEYWINE",
                keepZero: true,
            },

            // BLONDE_/_GOLDEN_ALE
            {
                match: {
                    baseIn: [
                        "BELGIAN_BLONDE",
                        "BELGIAN_ENKEL_/_PATERSBIER",
                        "BELGIAN_STRONG_GOLDEN_ALE",
                        "BELGIAN_TRIPEL",
                        "BLONDE_/_GOLDEN_ALE_AMERICAN",
                        "BLONDE_/_GOLDEN_ALE_ENGLISH",
                        "BLONDE_/_GOLDEN_ALE_OTHER",
                        "GOLDEN_ALE_UKRAINIAN",
                    ],
                },
                into: "BLONDE_/_GOLDEN_ALE",
                keepZero: true,
            },

            // DARK_/_BROWN_ALE
            {
                match: {
                    baseIn: [
                        "BELGIAN_DUBBEL",
                        "BELGIAN_QUADRUPEL",
                        "BELGIAN_STRONG_DARK_ALE",
                        "BROWN_ALE_AMERICAN",
                        "BROWN_ALE_BELGIAN",
                        "BROWN_ALE_ENGLISH",
                        "BROWN_ALE_IMPERIAL_/_DOUBLE",
                        "BROWN_ALE_OTHER",
                        "DARK_ALE",
                        "MILD_DARK",
                        "MILD_LIGHT",
                        "MILD_OTHER",
                        "OLD_/_STOCK_ALE",
                        "WINTER_ALE",
                        "WINTER_WARMER",
                    ],
                },
                into: "DARK_/_BROWN_ALE",
                keepZero: true,
            },

            // BIERE_DE_CHAMPAGNE
            {
                match: { baseIn: ["BIERE_DE_CHAMPAGNE_/_BIERE_BRUT"] },
                into: "BIERE_DE_CHAMPAGNE",
                keepZero: true,
            },

            // BITTER
            {
                match: {
                    baseIn: [
                        "BITTER_BEST",
                        "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)",
                        "BITTER_SESSION_/_ORDINARY",
                    ],
                },
                into: "BITTER",
                keepZero: true,
            },

            // BEERS_SPECIAL
            {
                match: {
                    baseIn: [
                        "BLACK_&_TAN",
                        "CALIFORNIA_COMMON",
                        "CHILLI_/_CHILE_BEER",
                        "GLUTEN-FREE",
                        "GRAPE_ALE_ITALIAN",
                        "GRAPE_ALE_OTHER",
                        "GRODZISKIE_/_GRATZER",
                        "MAZOUT",
                        "HONEY_BEER",
                        "PUMPKIN_/_YAM_BEER",
                        "ROGGENBIER",
                        "SMOKED_BEER",
                        "SORGHUM_/_MILLET_BEER",
                        "SPECIALTY_GRAIN",
                        "SPICED_/_HERBED_BEER",
                        "BEERS_SPECIAL",
                    ],
                },
                into: "BEERS_SPECIAL",
                keepZero: true,
            },

            // BOCK
            {
                match: {
                    baseIn: [
                        "BOCK_DOPPELBOCK",
                        "BOCK_EISBOCK",
                        "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK",
                        "BOCK_SINGLE_/_TRADITIONAL",
                        "BOCK_WEIZENBOCK",
                        "BOCK_WEIZENDOPPELBOCK",
                    ],
                },
                into: "BOCK",
                keepZero: true,
            },

            // BRETT_BEER
            {
                match: { baseIn: ["BRETT_BEER"] },
                into: "BRETT_BEER",
                keepZero: true,
            },

            // CIDER
            {
                match: {
                    baseIn: [
                        "CIDER_APPLEWINE",
                        "CIDER_BASQUE",
                        "CIDER_DRY",
                        "CIDER_GRAFF",
                        "CIDER_HERBED_/_SPICED_/_HOPPED",
                        "CIDER_ICE",
                        "CIDER_OTHER_FRUIT",
                        "CIDER_PERRY_/_POIRE",
                        "CIDER_ROSE",
                        "CIDER_SWEET",
                        "CIDER_TRADITIONAL_/_APFELWEIN",
                        "NON-ALCOHOLIC_CIDER_/_PERRY",
                    ],
                },
                into: "CIDER",
                keepZero: true,
            },

            // BEERS_OTHER
            {
                match: {
                    baseIn: [
                        "CORN_BEER_/_CHICHA_DE_JORA",
                        "FESTBIER",
                        "FLAVORED_MALT_BEVERAGE",
                        "FREEZE-DISTILLED_BEER",
                        "HAPPOSHU",
                        "HARD_GINGER_BEER",
                        "HARD_KOMBUCHA_/_JUN",
                        "HARD_SELTZER",
                        "KOJI_/_GINJO_BEER",
                        "MAKGEOLLI",
                        "MALT_BEER",
                        "MALT_LIQUOR",
                        "ROOT_BEER",
                        "RYE_BEER",
                        "RYE_WINE",
                        "SCHWARZBIER",
                        "TRADITIONAL_ALE",
                        "BEERS_OTHER",
                    ],
                },
                into: "BEERS_OTHER",
                keepZero: true,
            },

            // CREAM_ALE
            {
                match: { baseIn: ["CREAM_ALE", "CREAM_ALE_IMPERIAL_/_DOUBLE"] },
                into: "CREAM_ALE",
                keepZero: true,
            },

            // FARMHOUSE_ALE
            {
                match: {
                    baseIn: [
                        "FARMHOUSE_ALE_BIERE_DE_COUPAGE",
                        "FARMHOUSE_ALE_BIERE_DE_GARDE",
                        "FARMHOUSE_ALE_BIERE_DE_MARS",
                        "FARMHOUSE_ALE_BRETT",
                        "FARMHOUSE_ALE_GRISETTE",
                        "FARMHOUSE_ALE_KORNØL",
                        "FARMHOUSE_ALE_OTHER",
                        "FARMHOUSE_ALE_SAHTI",
                        "FARMHOUSE_ALE_SAISON",
                    ],
                },
                into: "FARMHOUSE_ALE",
                keepZero: true,
            },

            // FRUIT_BEER
            {
                match: { baseIn: ["FRUIT_BEER", "BLOND_FRUITED", "FRUIT_DOMINANT"] },
                into: "FRUIT_BEER",
                keepZero: true,
            },

            // HISTORICAL_BEER
            {
                match: {
                    baseIn: [
                        "HISTORICAL_BEER_ADAMBIER",
                        "HISTORICAL_BEER_BERLINER_BRAUNBIER",
                        "HISTORICAL_BEER_BROYHAN",
                        "HISTORICAL_BEER_BURTON_ALE",
                        "HISTORICAL_BEER_DAMPFBIER",
                        "HISTORICAL_BEER_GRUIT_/_ANCIENT_HERBED_ALE",
                        "HISTORICAL_BEER_KENTUCKY_COMMON",
                        "HISTORICAL_BEER_KOTTBUSSER",
                        "HISTORICAL_BEER_KUIT_/_KUYT_/_KOYT",
                        "HISTORICAL_BEER_LICHTENHAINER",
                        "HISTORICAL_BEER_MUMME",
                        "HISTORICAL_BEER_OTHER",
                        "HISTORICAL_BEER_STEINBIER",
                        "HISTORICAL_BEER_ZOIGL",
                    ],
                },
                into: "HISTORICAL_BEER",
                keepZero: true,
            },

            // IPA
            {
                match: {
                    baseIn: [
                        "IPA_AMERICAN",
                        "IPA_BELGIAN",
                        "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                        "IPA_BRETT",
                        "IPA_BROWN",
                        "IPA_BRUT",
                        "IPA_COLD",
                        "IPA_ENGLISH",
                        "IPA_FARMHOUSE",
                        "IPA_FRUITED",
                        "IPA_IMPERIAL_/_DOUBLE",
                        "IPA_IMPERIAL_/_DOUBLE_BLACK",
                        "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                        "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                        "IPA_MILKSHAKE",
                        "IPA_NEW_ENGLAND_/_HAZY",
                        "IPA_NEW_ZEALAND",
                        "IPA_OTHER",
                        "IPA_QUADRUPLE",
                        "IPA_RED",
                        "IPA_RYE",
                        "IPA_SESSION",
                        "IPA_SOUR",
                        "IPA_TRIPLE",
                        "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                        "IPA_WHITE_/_WHEAT",
                        "NON-ALCOHOLIC_BEER_IPA",
                    ],
                },
                into: "IPA",
                keepZero: true,
            },

            // LAGER
            {
                match: {
                    baseIn: [
                        "KELLERBIER_/_ZWICKELBIER",
                        "LAGER_AMBER_/_RED",
                        "LAGER_AMERICAN",
                        "LAGER_AMERICAN_AMBER_/_RED",
                        "LAGER_AMERICAN_LIGHT",
                        "LAGER_AMERICAN_PRE-PROHIBITION",
                        "LAGER_DARK",
                        "LAGER_DORTMUNDER_/_EXPORT",
                        "LAGER_HELLES",
                        "LAGER_IPL_(INDIA_PALE_LAGER)",
                        "LAGER_JAPANESE_RICE",
                        "LAGER_LEICHTBIER",
                        "LAGER_MEXICAN",
                        "LAGER_MUNICH_DUNKEL",
                        "LAGER_OTHER",
                        "LAGER_PALE",
                        "LAGER_POLOTMAVE_(CZECH_AMBER)",
                        "LAGER_ROTBIER",
                        "LAGER_SMOKED",
                        "LAGER_STRONG",
                        "LAGER_SVETLE_(CZECH_PALE)",
                        "LAGER_TMAVE_(CZECH_DARK)",
                        "LAGER_VIENNA",
                        "LAGER_WINTER",
                        "RAUCHBIER",
                        "NON-ALCOHOLIC_BEER_LAGER",
                    ],
                },
                into: "LAGER",
                keepZero: true,
            },

            // KOLSCH
            {
                match: { baseIn: ["KOLSCH"] },
                into: "KOLSCH",
                keepZero: true,
            },

            // KVASS
            {
                match: { baseIn: ["KVASS"] },
                into: "KVASS",
                keepZero: true,
            },

            // LAMBIC
            {
                match: {
                    baseIn: [
                        "LAMBIC_FARO",
                        "LAMBIC_FRAMBOISE",
                        "LAMBIC_FRUIT",
                        "LAMBIC_GUEUZE",
                        "LAMBIC_KRIEK",
                        "LAMBIC_OTHER",
                        "LAMBIC_TRADITIONAL",
                    ],
                },
                into: "LAMBIC",
                keepZero: true,
            },

            // MEAD
            {
                match: {
                    baseIn: [
                        "MEAD_ACERGLYN_/_MAPLE_WINE",
                        "MEAD_BOCHET",
                        "MEAD_BRAGGOT",
                        "MEAD_CYSER",
                        "MEAD_MELOMEL",
                        "MEAD_METHEGLIN",
                        "MEAD_OTHER",
                        "MEAD_PYMENT",
                        "MEAD_SESSION_/_SHORT",
                        "MEAD_TRADITIONAL",
                        "NON-ALCOHOLIC_MEAD",
                    ],
                },
                into: "MEAD",
                keepZero: true,
            },

            // MARZEN
            {
                match: { baseIn: ["MARZEN"] },
                into: "MARZEN",
                keepZero: true,
            },

            // OTHER
            {
                match: { baseIn: ["NON-ALCOHOLIC_BEER_OTHER"] },
                into: "OTHER",
                keepZero: true,
            },

            // PALE_ALE
            {
                match: {
                    baseIn: [
                        "PALE_ALE_AMERICAN",
                        "PALE_ALE_AUSTRALIAN",
                        "PALE_ALE_BELGIAN",
                        "PALE_ALE_ENGLISH",
                        "PALE_ALE_FRUITED",
                        "PALE_ALE_MILKSHAKE",
                        "PALE_ALE_NEW_ENGLAND_/_HAZY",
                        "PALE_ALE_NEW_ZEALAND",
                        "PALE_ALE_OTHER",
                        "PALE_ALE_XPA_(EXTRA_PALE)",
                        "NON-ALCOHOLIC_BEER_PALE_ALE",
                    ],
                },
                into: "PALE_ALE",
                keepZero: true,
            },

            // PILSNER
            {
                match: {
                    baseIn: [
                        "PILSNER_CZECH_/_BOHEMIAN",
                        "PILSNER_GERMAN",
                        "PILSNER_IMPERIAL_/_DOUBLE",
                        "PILSNER_ITALIAN",
                        "PILSNER_NEW_ZEALAND",
                        "PILSNER_OTHER",
                    ],
                },
                into: "PILSNER",
                keepZero: true,
            },

            // PORTER
            {
                match: {
                    baseIn: [
                        "PORTER_AMERICAN",
                        "PORTER_BALTIC",
                        "PORTER_COFFEE",
                        "PORTER_ENGLISH",
                        "PORTER_IMPERIAL_/_DOUBLE",
                        "PORTER_IMPERIAL_/_DOUBLE_BALTIC",
                        "PORTER_IMPERIAL_/_DOUBLE_COFFEE",
                        "PORTER_OTHER",
                        "PORTER_SMOKED",
                        "NON-ALCOHOLIC_BEER_PORTER_/_STOUT",
                    ],
                },
                into: "PORTER",
                keepZero: true,
            },

            // RADLERS
            {
                match: { baseIn: ["SHANDY_/_RADLER", "NON-ALCOHOLIC_BEER_SHANDY_/_RADLER"] },
                into: "RADLERS",
                keepZero: true,
            },

            // RED_ALE
            {
                match: {
                    baseIn: [
                        "RED_ALE_AMERICAN_AMBER_/_RED",
                        "RED_ALE_IMPERIAL_/_DOUBLE",
                        "RED_ALE_IRISH",
                        "RED_ALE_OTHER",
                    ],
                },
                into: "RED_ALE",
                keepZero: true,
            },

            // SCOTCH_ALE
            {
                match: { baseIn: ["SCOTCH_ALE_/_WEE_HEAVY"] },
                into: "SCOTCH_ALE",
                keepZero: true,
            },

            // SCOTTISH_ALE
            {
                match: { baseIn: ["SCOTTISH_ALE", "SCOTTISH_EXPORT_ALE"] },
                into: "SCOTTISH_ALE",
                keepZero: true,
            },

            // SOUR
            {
                match: {
                    baseIn: [
                        "SOUR_BERLINER_WEISSE",
                        "SOUR_CATHARINA",
                        "SOUR_FLANDERS_OUD_BRUIN",
                        "SOUR_FLANDERS_RED_ALE",
                        "SOUR_FRUITED",
                        "SOUR_FRUITED_BERLINER_WEISSE",
                        "SOUR_FRUITED_GOSE",
                        "SOUR_OTHER",
                        "SOUR_OTHER_GOSE",
                        "SOUR_SMOOTHIE_/_PASTRY",
                        "SOUR_TOMATO_/_VEGETABLE_GOSE",
                        "SOUR_TRADITIONAL_GOSE",
                        "NON-ALCOHOLIC_BEER_SOUR",
                    ],
                },
                into: "SOUR",
                keepZero: true,
            },

            // STOUT
            {
                match: {
                    baseIn: [
                        "STOUT_AMERICAN",
                        "STOUT_BELGIAN",
                        "STOUT_COFFEE",
                        "STOUT_ENGLISH",
                        "STOUT_FOREIGN_/_EXPORT",
                        "STOUT_IMPERIAL_/_DOUBLE",
                        "STOUT_IMPERIAL_/_DOUBLE_COFFEE",
                        "STOUT_IMPERIAL_/_DOUBLE_MILK",
                        "STOUT_IMPERIAL_/_DOUBLE_OATMEAL",
                        "STOUT_IMPERIAL_/_DOUBLE_PASTRY",
                        "STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN",
                        "STOUT_IRISH_DRY",
                        "STOUT_MILK_/_SWEET",
                        "STOUT_OATMEAL",
                        "STOUT_OTHER",
                        "STOUT_OYSTER",
                        "STOUT_PASTRY",
                        "STOUT_RUSSIAN_IMPERIAL",
                        "STOUT_WHITE_/_GOLDEN",
                    ],
                },
                into: "STOUT",
                keepZero: true,
            },

            // STRONG_ALE
            {
                match: {
                    baseIn: ["STRONG_ALE_AMERICAN", "STRONG_ALE_ENGLISH", "STRONG_ALE_OTHER"],
                },
                into: "STRONG_ALE",
                keepZero: true,
            },

            // TABLE_BEER
            {
                match: { baseIn: ["TABLE_BEER"] },
                into: "TABLE_BEER",
                keepZero: true,
            },

            // WHEAT_BEER
            {
                match: {
                    baseIn: [
                        "WHEAT_BEER_AMERICAN_PALE_WHEAT",
                        "WHEAT_BEER_DUNKELWEIZEN",
                        "WHEAT_BEER_FRUITED",
                        "WHEAT_BEER_HEFEWEIZEN",
                        "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                        "WHEAT_BEER_HOPFENWEISSE",
                        "WHEAT_BEER_KRISTALLWEIZEN",
                        "WHEAT_BEER_OTHER",
                        "WHEAT_BEER_WHEAT_WINE",
                        "WHEAT_BEER_WITBIER_/_BLANCHE",
                        "NON-ALCOHOLIC_BEER_WHEAT_BEER",
                    ],
                },
                into: "WHEAT_BEER",
                keepZero: true,
            },

            // WILD_ALE
            {
                match: { baseIn: ["WILD_ALE_AMERICAN", "WILD_ALE_OTHER"] },
                into: "WILD_ALE",
                keepZero: true,
            },

            // SPIRIT_FLAVOURED_BEERS
            {
                match: { baseIn: ["SPIRIT_FLAVOURED_BEERS"] },
                into: "SPIRIT_FLAVOURED_BEERS",
                keepZero: true,
            },

            // BEER_SODA_MIX
            {
                match: { baseIn: ["BEER_SODA_MIX"] },
                into: "BEER_SODA_MIX",
                keepZero: true,
            },
        ],
    forceShow: ["BEERS · Zero", "BEERS · With alcohol"],

    info: {
        image: presetImg("Fijn-proever.png"),
        line1: <>De verdeling <strong> alcoholvrij vs normaal</strong> <br/> van jouw</>,
        line2: <> <strong> bieren </strong>  op vlak van  is</>
    }
    },


            {
            id: 2003,
            name: (
                <>
                    <strong>Jan met de pet - lvl 1</strong>!<br />
                    Mensen drinken alcohol voor ontspanning, gezelligheid en om het moment te vieren.
                </>
            ),
            section: "beers",
            groupBy: "subcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,

            // NEW: roll up a few buckets
            rollups: [
                // NORMAL_BLOND_AMBER + BLOND_BITTERS -> one bucket
                {
                    match: { baseIn: ["NORMAL_BLOND_AMBER", "BLOND_BITTERS"] },
                    into: "BLOND_AMBER_AND_PALE_ALES",
                    keepZero: false,
                },

                // DARK_BROWN_MALT_SWEETNESS + DARK_BROWN_COFFEE_ROAST_BITTER -> one bucket
                {
                    match: {
                        baseIn: ["DARK_BROWN_MALT_SWEETNESS", "DARK_BROWN_COFFEE_ROAST_BITTER"],
                    },
                    into: "DARK_BROWN",
                    keepZero: true,
                },

                // RADLERS + CIDERS + SPIRIT_FLAVOURED_BEERS -> one bucket
                {
                    match: { baseIn: ["RADLERS", "CIDERS", "SPIRIT_FLAVOURED_BEERS"] },
                    into: "RADLERS_&_CIDERS_&_SPIRIT",
                    keepZero: true,
                },
                // Add this extra rollup at the end of your rollups array
                {
                    // Anything not caught by earlier rollups becomes "OTHERS"
                    match: { baseNotIn: ["LAGERS", "BLOND_AMBER_&_BITTERS", "DARK_BROWN", "FRUIT_BEERS", "WHEAT_BEERS", "SOURS_SAISON_LAMBIC_GUEUZE", "RADLERS_&_CIDERS_&_SPIRIT"] },
                    into: "OTHERS",
                    keepZero: true,
                },
            ],

            forceShow: [

            ],
            sortPriority: [

            ],

            info: {
                image: presetImg("Budgetbewust.png"),
                line1: (
                    <>
                        De verdeling van <strong>smaken</strong> van je <br />
                    </>
                ),
                line2: (
                    <>
                        <strong>alcoholische bieren</strong> is
                    </>
                ),
            },
        }
,


//Printout products:


{
            id: 2019,
            name: <>Taste clusters lvl 3 - Belgian relevant 15+ beers</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: {},
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,
            ui: {
                columns: 2,              // 2 or 3
                showItemsInline: true,  // default false
                aggregateTop: {
                    enabled: true,
                    columns: [
                        { title: "Column 1", iconToken: "BEERS_OTHER" },
                        { title: "Column 2", iconToken: "BEERS_SPECIAL" },
                        // if columns=3, add a third
                    ],
                },
            },

            rollups: [
                // =========================
                // BLONDS (split)
                // =========================

                // BLONDS (regular)
                {
                    match: {
                        baseIn: [
                            "BELGIAN_BLONDE",
                            "BLONDE_/_GOLDEN_ALE_AMERICAN",
                            "BLONDE_/_GOLDEN_ALE_ENGLISH",
                            "BLONDE_/_GOLDEN_ALE_OTHER",
                            "GOLDEN_ALE_UKRAINIAN",
                            "BITTER_SESSION_/_ORDINARY",
                            "BELGIAN_TRIPEL",
                            "BELGIAN_STRONG_GOLDEN_ALE",
                            "BELGIAN_ENKEL_/_PATERSBIER"
                        ],
                    },
                    into: "BLONDS",
                    keepZero: true,
                },



                // =========================
                // BROWNS / DARKS (split)
                // =========================

                // BROWN_DARK (regular)
                {
                    match: {
                        baseIn: [
                            "BELGIAN_DUBBEL",
                            "ALTBIER_STICKE",
                            "ALTBIER_TRADITIONAL",
                            "BROWN_ALE_AMERICAN",
                            "BROWN_ALE_BELGIAN",
                            "BROWN_ALE_ENGLISH",
                            "BROWN_ALE_OTHER",
                            "DARK_ALE",
                            "MILD_DARK",
                            "MILD_LIGHT",
                            "MILD_OTHER",
                            "SCOTCH_ALE_/_WEE_HEAVY",
                            "SCOTTISH_ALE",
                            "SCOTTISH_EXPORT_ALE",
                            "OLD_/_STOCK_ALE",
                            "WINTER_ALE",
                            "WINTER_WARMER",
                            "BELGIAN_QUADRUPEL",
                            "BELGIAN_STRONG_DARK_ALE",
                            "BARLEYWINE_AMERICAN",
                            "BARLEYWINE_ENGLISH",
                            "BARLEYWINE_OTHER",
                            "BROWN_ALE_IMPERIAL_/_DOUBLE",
                            "BOCK_DOPPELBOCK",
                            "BOCK_EISBOCK",
                            "STRONG_ALE_AMERICAN",
                            "STRONG_ALE_ENGLISH",
                            "STRONG_ALE_OTHER",
                            "RYE_WINE",
                        ],
                    },
                    into: "BROWN_ALES",
                    keepZero: true,
                },



                // =========================
                // MALT_LIL_SWEET (unchanged)
                // =========================
                {
                    match: {
                        baseIn: [
                            "AUSTRALIAN_SPARKLING_ALE",
                            "BIERE_DE_CHAMPAGNE_/_BIERE_BRUT",
                            "BITTER_BEST",
                            "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)",
                            "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK",
                            "BOCK_SINGLE_/_TRADITIONAL",
                            "CALIFORNIA_COMMON",
                            "CREAM_ALE",
                            "CREAM_ALE_IMPERIAL_/_DOUBLE",
                            "FESTBIER",
                            "LAGER_AMBER_/_RED",
                            "LAGER_AMERICAN_AMBER_/_RED",
                            "LAGER_POLOTMAVE_(CZECH_AMBER)",
                            "LAGER_ROTBIER",
                            "LAGER_VIENNA",
                            "MARZEN",
                            "PALE_ALE_BELGIAN",
                            "RED_ALE_AMERICAN_AMBER_/_RED",
                            "RED_ALE_IRISH",
                            "RED_ALE_OTHER",
                            "TRADITIONAL_ALE",

                        ],
                    },
                    into: "Belgian amber etc.",
                    keepZero: true,
                },

                // =========================
                // WHEAT_BEERS (unchanged)
                // =========================
                {
                    match: {
                        baseIn: [
                            "BOCK_WEIZENBOCK",
                            "BOCK_WEIZENDOPPELBOCK",
                            "WHEAT_BEER_AMERICAN_PALE_WHEAT",
                            "WHEAT_BEER_DUNKELWEIZEN",
                            "WHEAT_BEER_FRUITED",
                            "WHEAT_BEER_HEFEWEIZEN",
                            "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                            "WHEAT_BEER_HOPFENWEISSE",
                            "WHEAT_BEER_KRISTALLWEIZEN",
                            "WHEAT_BEER_OTHER",
                            "WHEAT_BEER_WHEAT_WINE",
                            "WHEAT_BEER_WITBIER_/_BLANCHE",
                            "NON-ALCOHOLIC_BEER_WHEAT_BEER",
                        ],
                    },
                    into: "WHEAT_BEERS",
                    keepZero: true,
                },

                // =========================
                // SOURS (merged again)
                // =========================
                {
                    match: {
                        baseIn: [
                            // lambics
                            "LAMBIC_FARO",
                            "LAMBIC_FRAMBOISE",
                            "LAMBIC_FRUIT",
                            "LAMBIC_GUEUZE",
                            "LAMBIC_KRIEK",
                            "LAMBIC_OTHER",
                            "LAMBIC_TRADITIONAL",
                            // sour styles
                            "SOUR_BERLINER_WEISSE",
                            "SOUR_CATHARINA",
                            "SOUR_FLANDERS_OUD_BRUIN",
                            "SOUR_FLANDERS_RED_ALE",
                            "SOUR_FRUITED",
                            "SOUR_FRUITED_BERLINER_WEISSE",
                            "SOUR_FRUITED_GOSE",
                            "SOUR_OTHER",
                            "SOUR_OTHER_GOSE",
                            "SOUR_TOMATO_/_VEGETABLE_GOSE",
                            "SOUR_TRADITIONAL_GOSE",
                            "SOUR_SMOOTHIE_/_PASTRY",
                            // wild/brett + IPA sour + NA sour
                            "WILD_ALE_AMERICAN",
                            "WILD_ALE_OTHER",
                            "BRETT_BEER",
                            "IPA_SOUR",
                            "NON-ALCOHOLIC_BEER_SOUR",
                        ],
                    },
                    into: "SOUR_BEERS",
                    keepZero: true,
                },

                // =========================
                // CIDERS (unchanged)
                // =========================
                {
                    match: {
                        baseIn: [
                            "CIDER_APPLEWINE",
                            "CIDER_BASQUE",
                            "CIDER_DRY",
                            "CIDER_GRAFF",
                            "CIDER_HERBED_/_SPICED_/_HOPPED",
                            "CIDER_ICE",
                            "CIDER_OTHER_FRUIT",
                            "CIDER_PERRY_/_POIRE",
                            "CIDER_ROSE",
                            "CIDER_SWEET",
                            "CIDER_TRADITIONAL_/_APFELWEIN",
                            "NON-ALCOHOLIC_CIDER_/_PERRY",
                        ],
                    },
                    into: "CIDERS",
                    keepZero: true,
                },

                // =========================
                // SAISON (unchanged)
                // =========================
                {
                    match: {
                        baseIn: [
                            "FARMHOUSE_ALE_BIERE_DE_COUPAGE",
                            "FARMHOUSE_ALE_BIERE_DE_GARDE",
                            "FARMHOUSE_ALE_BIERE_DE_MARS",
                            "FARMHOUSE_ALE_BRETT",
                            "FARMHOUSE_ALE_GRISETTE",
                            "FARMHOUSE_ALE_KORNØL",
                            "FARMHOUSE_ALE_OTHER",
                            "FARMHOUSE_ALE_SAHTI",
                            "FARMHOUSE_ALE_SAISON",
                        ],
                    },
                    into: "SAISON",
                    keepZero: true,
                },

                // =========================
                // SWEET_FRUITY (unchanged)
                // =========================
                {
                    match: { baseIn: ["FRUIT_BEER", "BLOND_FRUITED", "FRUIT_DOMINANT"] },
                    into: "SWEET_FRUITY",
                    keepZero: true,
                },

                // =========================
                // HOPPY_BITTER / HOPPY_MALT (unchanged)
                // =========================
                {
                    match: {
                        baseIn: [
                            "IPA_AMERICAN",
                            "IPA_BELGIAN",
                            "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                            "IPA_BRETT",
                            "IPA_BROWN",
                            "IPA_BRUT",
                            "IPA_COLD",
                            "IPA_ENGLISH",
                            "IPA_FARMHOUSE",
                            "IPA_FRUITED",
                            "IPA_IMPERIAL_/_DOUBLE",
                            "IPA_IMPERIAL_/_DOUBLE_BLACK",
                            "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                            "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                            "IPA_MILKSHAKE",
                            "IPA_NEW_ENGLAND_/_HAZY",
                            "IPA_NEW_ZEALAND",
                            "IPA_OTHER",
                            "IPA_QUADRUPLE",
                            "IPA_RED",
                            "IPA_RYE",
                            "IPA_SESSION",
                            "IPA_TRIPLE",
                            "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                            "IPA_WHITE_/_WHEAT",
                            "NON-ALCOHOLIC_BEER_IPA",
                            "PALE_ALE_AMERICAN",
                            "PALE_ALE_MILKSHAKE",
                            "PALE_ALE_NEW_ENGLAND_/_HAZY",
                        ],
                    },
                    into: "Ipa etc.",
                    keepZero: true,
                },
                {
                    match: {
                        baseIn: [
                            "NON-ALCOHOLIC_BEER_PALE_ALE",
                            "PALE_ALE_AUSTRALIAN",
                            "PALE_ALE_ENGLISH",
                            "PALE_ALE_FRUITED",
                            "PALE_ALE_NEW_ZEALAND",
                            "PALE_ALE_OTHER",
                            "PALE_ALE_XPA_(EXTRA_PALE)",
                            "RED_ALE_IMPERIAL_/_DOUBLE",
                            "RYE_BEER",
                        ],
                    },
                    into: "Pale ales",
                    keepZero: true,
                },

                // =========================
                // CLASSIC_LAGERS / SPECIAL_LAGERS (unchanged)
                // =========================
                {
                    match: {
                        baseIn: [
                            "KELLERBIER_/_ZWICKELBIER",
                            "KVASS",
                            "LAGER_AMERICAN",
                            "LAGER_AMERICAN_LIGHT",
                            "LAGER_AMERICAN_PRE-PROHIBITION",
                            "LAGER_DORTMUNDER_/_EXPORT",
                            "LAGER_HELLES",
                            "LAGER_JAPANESE_RICE",
                            "LAGER_LEICHTBIER",
                            "LAGER_MEXICAN",
                            "LAGER_PALE",
                            "LAGER_SVETLE_(CZECH_PALE)",
                            "PILSNER_CZECH_/_BOHEMIAN",
                            "PILSNER_GERMAN",
                            "PILSNER_ITALIAN",
                            "PILSNER_NEW_ZEALAND",
                            "PILSNER_OTHER",
                            "NON-ALCOHOLIC_BEER_LAGER",

                        ],
                    },
                    into: "CLASSIC_LAGERS",
                    keepZero: true,
                },
                {
                    match: {
                        baseIn: [
                            "LAGER_IPL_(INDIA_PALE_LAGER)",
                            "LAGER_OTHER",
                            "LAGER_SMOKED",
                            "LAGER_STRONG",
                            "LAGER_WINTER",
                            "PILSNER_IMPERIAL_/_DOUBLE",
                            "RAUCHBIER",
                            "LAGER_DARK",
                            "LAGER_MUNICH_DUNKEL",
                            "LAGER_TMAVE_(CZECH_DARK)",
                        ],
                    },
                    into: "SPECIAL_LAGERS",
                    keepZero: false,
                },


                {
                    match: { baseIn: ["SHANDY_/_RADLER", "NON-ALCOHOLIC_BEER_SHANDY_/_RADLER"] },
                    into: "RADLERS",
                    keepZero: true,
                },

                // =========================
                // DARK_BLACK_ROAST_BITTER (unchanged)
                // =========================
                {
                    match: {
                        baseIn: [
                            "NON-ALCOHOLIC_BEER_PORTER_/_STOUT",
                            "PORTER_AMERICAN",
                            "PORTER_BALTIC",
                            "PORTER_COFFEE",
                            "PORTER_ENGLISH",
                            "PORTER_IMPERIAL_/_DOUBLE",
                            "PORTER_IMPERIAL_/_DOUBLE_BALTIC",
                            "PORTER_IMPERIAL_/_DOUBLE_COFFEE",
                            "PORTER_OTHER",
                            "PORTER_SMOKED",
                            "SCHWARZBIER",
                            "STOUT_AMERICAN",
                            "STOUT_BELGIAN",
                            "STOUT_COFFEE",
                            "STOUT_ENGLISH",
                            "STOUT_FOREIGN_/_EXPORT",
                            "STOUT_IMPERIAL_/_DOUBLE",
                            "STOUT_IMPERIAL_/_DOUBLE_COFFEE",
                            "STOUT_IMPERIAL_/_DOUBLE_MILK",
                            "STOUT_IMPERIAL_/_DOUBLE_OATMEAL",
                            "STOUT_IMPERIAL_/_DOUBLE_PASTRY",
                            "STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN",
                            "STOUT_IRISH_DRY",
                            "STOUT_MILK_/_SWEET",
                            "STOUT_OATMEAL",
                            "STOUT_OTHER",
                            "STOUT_OYSTER",
                            "STOUT_PASTRY",
                            "STOUT_RUSSIAN_IMPERIAL",
                            "STOUT_WHITE_/_GOLDEN",
                        ],
                    },
                    into: "DARK_BLACK_ROAST_BITTER",
                    keepZero: false,
                },

                // =========================
                // BEERS_OTHER / BEERS_SPECIAL / TABLE / SPIRIT / SODA MIX (unchanged)
                // =========================
                {
                    match: {
                        baseIn: [
                            "CORN_BEER_/_CHICHA_DE_JORA",
                            "FLAVORED_MALT_BEVERAGE",
                            "HAPPOSHU",
                            "HARD_GINGER_BEER",
                            "HARD_KOMBUCHA_/_JUN",
                            "HARD_SELTZER",
                            "KOJI_/_GINJO_BEER",
                            "KOLSCH",
                            "MAKGEOLLI",
                            "MALT_BEER",
                            "MALT_LIQUOR",
                            "NON-ALCOHOLIC_BEER_OTHER",
                            "ROOT_BEER",
                            "BEERS_OTHER",
                            "MEAD_ACERGLYN_/_MAPLE_WINE",
                            "MEAD_BOCHET",
                            "MEAD_BRAGGOT",
                            "MEAD_CYSER",
                            "MEAD_MELOMEL",
                            "MEAD_METHEGLIN",
                            "MEAD_OTHER",
                            "MEAD_PYMENT",
                            "MEAD_SESSION_/_SHORT",
                            "MEAD_TRADITIONAL",
                            "NON-ALCOHOLIC_MEAD",
                        ],
                    },
                    into: "OTHER_DRINKS",
                    keepZero: false,
                },
                {
                    match: {
                        baseIn: [
                            "BLACK_&_TAN",
                            "CHILLI_/_CHILE_BEER",
                            "FREEZE-DISTILLED_BEER",
                            "GLUTEN-FREE",
                            "GRAPE_ALE_ITALIAN",
                            "GRAPE_ALE_OTHER",
                            "GRODZISKIE_/_GRATZER",
                            "HISTORICAL_BEER_ADAMBIER",
                            "HISTORICAL_BEER_BERLINER_BRAUNBIER",
                            "HISTORICAL_BEER_BROYHAN",
                            "HISTORICAL_BEER_BURTON_ALE",
                            "HISTORICAL_BEER_DAMPFBIER",
                            "HISTORICAL_BEER_GRUIT_/_ANCIENT_HERBED_ALE",
                            "HISTORICAL_BEER_KENTUCKY_COMMON",
                            "HISTORICAL_BEER_KOTTBUSSER",
                            "HISTORICAL_BEER_KUIT_/_KUYT_/_KOYT",
                            "HISTORICAL_BEER_LICHTENHAINER",
                            "HISTORICAL_BEER_MUMME",
                            "HISTORICAL_BEER_OTHER",
                            "HISTORICAL_BEER_STEINBIER",
                            "HISTORICAL_BEER_ZOIGL",
                            "MAZOUT",
                            "HONEY_BEER",
                            "PUMPKIN_/_YAM_BEER",
                            "ROGGENBIER",
                            "SMOKED_BEER",
                            "SORGHUM_/_MILLET_BEER",
                            "SPECIALTY_GRAIN",
                            "SPICED_/_HERBED_BEER",
                            "BEERS_SPECIAL",
                        ],
                    },
                    into: "BEERS_SPECIAL",
                    keepZero: false,
                },
                {
                    match: { baseIn: ["TABLE_BEER"] },
                    into: "TABLE_BEER",
                    keepZero: false,
                },
                {
                    match: { baseIn: ["SPIRIT_FLAVOURED_BEERS"] },
                    into: "SPIRIT_FLAVOURED_BEERS",
                    keepZero: false,
                },
                {
                    match: { baseIn: ["BEER_SODA_MIX"] },
                    into: "BEER_SODA_MIX",
                    keepZero: false,
                },
            ],

            forceShow: [
            ],
            sortPriority: [
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> van smaken</strong> <br/> van jouw</>,
                line2: <> <strong> bieren </strong> is</>
            }
        },



        {
    id: 2818,
    name: <>Pale ale & IPA</>,
    section: "beers",
    groupBy: "subsubcategory",
    within: {
        category: "BEERS",
        subcategory_in: ["BLOND_BITTERS"],
    },

    predicates: [{ field: "is_zero", op: "eq", value: 0 }],
    includeEmpty: false,

    ui: {
        columns: 2,

        aggregateTop: {
            enabled: true,
            deterministic: true,
            unassigned: "append",
            hideEmptyBuckets: false,
            columns: [
                {
                    title: "Little hop",
                    iconToken: "SUGAR_FREE",
                    buckets: ["HOP_LOW", "HOP_MEDIUM", "HOP_HIGH"],
                },
                {
                    title: "Lots of hop",
                    iconToken: "SUGAR",
                    buckets: ["HOPHOP_LOW", "HOPHOP_MEDIUM", "HOPHOP_HIGH"],
                },
            ],
        },

        aggregateRows: {
            enabled: true,
            deterministic: true,
            unassigned: "append",
            rows: [
                {
                    title: "Low ABV",
                    iconToken: "GINGER_ALE",
                    buckets: ["HOP_LOW", "HOPHOP_LOW"],
                },
                {
                    title: "Med ABV",
                    iconToken: "GINGER_BEER",
                    buckets: ["HOP_MEDIUM", "HOPHOP_MEDIUM"],
                },
                {
                    title: "High ABV",
                    iconToken: "GINGER_LEMON",
                    buckets: ["HOP_HIGH", "HOPHOP_HIGH"],
                },
            ],
        },
    },

    rollups: [
        // -----------------------
        // LOW ABV (<6%)
        // -----------------------
        {
            match: {
                predicates: [{ field: "abv", op: "lt", value: 6 }],
                // "Little hop": Pale Ale-ish families + hop-forward-but-not-IPA group
                baseIn: [
                    "NON-ALCOHOLIC_BEER_PALE_ALE",
                    "PALE_ALE_AUSTRALIAN",
                    "PALE_ALE_ENGLISH",
                    "PALE_ALE_FRUITED",
                    "PALE_ALE_NEW_ZEALAND",
                    "PALE_ALE_OTHER",
                    "PALE_ALE_XPA_(EXTRA_PALE)",
                    "PALE_ALE_AMERICAN",
                    "PALE_ALE_MILKSHAKE",
                    "PALE_ALE_NEW_ENGLAND_/_HAZY",
                    // optional: keep if you consider these “pale” side
                    "RYE_BEER",
                    "RED_ALE_IMPERIAL_/_DOUBLE",
                ],
            },
            into: "HOP_LOW",
            keepZero: true,
        },
        {
            match: {
                predicates: [{ field: "abv", op: "lt", value: 6 }],
                // "Lots of hop": IPA family (including session + NA)
                baseIn: [
                    "NON-ALCOHOLIC_BEER_IPA",
                    "IPA_SESSION",
                    "IPA_AMERICAN",
                    "IPA_ENGLISH",
                    "IPA_NEW_ENGLAND_/_HAZY",
                    "IPA_NEW_ZEALAND",
                    "IPA_FRUITED",
                    "IPA_WHITE_/_WHEAT",
                    "IPA_COLD",
                    "IPA_BRUT",
                    "IPA_BELGIAN",
                    "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                    "IPA_RYE",
                    "IPA_BRETT",
                    "IPA_BROWN",
                    "IPA_FARMHOUSE",
                    "IPA_RED",
                    "IPA_OTHER",
                    // you can keep imperials here too, but ABV <6 will rarely match
                    "IPA_IMPERIAL_/_DOUBLE",
                    "IPA_IMPERIAL_/_DOUBLE_BLACK",
                    "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                    "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                    "IPA_TRIPLE",
                    "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                    "IPA_QUADRUPLE",
                ],
            },
            into: "HOPHOP_LOW",
            keepZero: true,
        },

        // -----------------------
        // MED ABV (6–<8%)
        // -----------------------
        {
            match: {
                predicates: [
                    { field: "abv", op: "gte", value: 6 },
                    { field: "abv", op: "lt", value: 8 },
                ],
                baseIn: [
                    "NON-ALCOHOLIC_BEER_PALE_ALE",
                    "PALE_ALE_AUSTRALIAN",
                    "PALE_ALE_ENGLISH",
                    "PALE_ALE_FRUITED",
                    "PALE_ALE_NEW_ZEALAND",
                    "PALE_ALE_OTHER",
                    "PALE_ALE_XPA_(EXTRA_PALE)",
                    "PALE_ALE_AMERICAN",
                    "PALE_ALE_MILKSHAKE",
                    "PALE_ALE_NEW_ENGLAND_/_HAZY",
                    "RYE_BEER",
                    "RED_ALE_IMPERIAL_/_DOUBLE",
                ],
            },
            into: "HOP_MEDIUM",
            keepZero: true,
        },
        {
            match: {
                predicates: [
                    { field: "abv", op: "gte", value: 6 },
                    { field: "abv", op: "lt", value: 8 },
                ],
                baseIn: [
                    "NON-ALCOHOLIC_BEER_IPA",
                    "IPA_SESSION",
                    "IPA_AMERICAN",
                    "IPA_ENGLISH",
                    "IPA_NEW_ENGLAND_/_HAZY",
                    "IPA_NEW_ZEALAND",
                    "IPA_FRUITED",
                    "IPA_WHITE_/_WHEAT",
                    "IPA_COLD",
                    "IPA_BRUT",
                    "IPA_BELGIAN",
                    "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                    "IPA_RYE",
                    "IPA_BRETT",
                    "IPA_BROWN",
                    "IPA_FARMHOUSE",
                    "IPA_RED",
                    "IPA_OTHER",
                    "IPA_IMPERIAL_/_DOUBLE",
                    "IPA_IMPERIAL_/_DOUBLE_BLACK",
                    "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                    "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                    "IPA_TRIPLE",
                    "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                    "IPA_QUADRUPLE",
                ],
            },
            into: "HOPHOP_MEDIUM",
            keepZero: true,
        },

        // -----------------------
        // HIGH ABV (>=8%)
        // -----------------------
        {
            match: {
                predicates: [{ field: "abv", op: "gte", value: 8 }],
                baseIn: [
                    "NON-ALCOHOLIC_BEER_PALE_ALE",
                    "PALE_ALE_AUSTRALIAN",
                    "PALE_ALE_ENGLISH",
                    "PALE_ALE_FRUITED",
                    "PALE_ALE_NEW_ZEALAND",
                    "PALE_ALE_OTHER",
                    "PALE_ALE_XPA_(EXTRA_PALE)",
                    "PALE_ALE_AMERICAN",
                    "PALE_ALE_MILKSHAKE",
                    "PALE_ALE_NEW_ENGLAND_/_HAZY",
                    "RYE_BEER",
                    "RED_ALE_IMPERIAL_/_DOUBLE",
                ],
            },
            into: "HOP_HIGH",
            keepZero: true,
        },
        {
            match: {
                predicates: [{ field: "abv", op: "gte", value: 8 }],
                baseIn: [
                    "NON-ALCOHOLIC_BEER_IPA",
                    "IPA_SESSION",
                    "IPA_AMERICAN",
                    "IPA_ENGLISH",
                    "IPA_NEW_ENGLAND_/_HAZY",
                    "IPA_NEW_ZEALAND",
                    "IPA_FRUITED",
                    "IPA_WHITE_/_WHEAT",
                    "IPA_COLD",
                    "IPA_BRUT",
                    "IPA_BELGIAN",
                    "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                    "IPA_RYE",
                    "IPA_BRETT",
                    "IPA_BROWN",
                    "IPA_FARMHOUSE",
                    "IPA_RED",
                    "IPA_OTHER",
                    "IPA_IMPERIAL_/_DOUBLE",
                    "IPA_IMPERIAL_/_DOUBLE_BLACK",
                    "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                    "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                    "IPA_TRIPLE",
                    "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                    "IPA_QUADRUPLE",
                ],
            },
            into: "HOPHOP_HIGH",
            keepZero: true,
        },
    ],

    info: {
        image: presetImg("Fijn-proever.png"),
        line1: <>De verdeling <strong> van smaken</strong> <br /> van jouw</>,
        line2: <> <strong> hoppy bieren </strong> is</>,
    },
}

 ,{
            id: 2898,
            name: <>Pale ale & IPA </>,
            section: "beers",
            groupBy: "subsubcategory",
            within: {
                category: "BEERS",
                subcategory_in: [
                    "BLOND_BITTERS",
                ]
            },


            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,
            ui: {
                columns: 2,
                aggregateTop: {
                    enabled: true,
                    deterministic: true,
                    unassigned: "append",
                    hideEmptyBuckets: false,   // ✅ NEW
                    columns: [
                        {
                            title: "Little hop",
                            iconToken: "SUGAR_FREE",
                            buckets: [
                                "HOP_LOW","HOP_MEDIUM","HOP_STRONG"
                            ],
                        },
                        {
                            title: "Lots of hop",
                            iconToken: "SUGAR",
                            buckets: [
                                "HOPHOP_LOW","HOPHOP_MEDIUM","HOPHOP_STRONG"
                            ],
                        },
                    ],
                },

                // ✅ Row aggregates (and deterministic row layout)
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    unassigned: "append",

                    rows: [
                        {
                            title: "%",
                            iconToken: "GINGER_ALE",
                            buckets: ["HOP_LOW","HOPHOP_LOW"],
                        },
                        {
                            title: "%%",
                            iconToken: "GINGER_BEER",
                            buckets: ["HOP_MEDIUM","HOPHOP_MEDIUM"],
                        },
                        {
                            title: "%%%",
                            iconToken: "GINGER_LEMON",
                            buckets: ["HOP_STRONG","HOPHOP_STRONG"],
                        },

                    ],
                },
            },
            rollups: [

                {
                    match:
                        {
                            predicates: [{ field: "abv", op: "lt", value: 6 }]
    ,
                        baseIn: [
                            "NON-ALCOHOLIC_BEER_PALE_ALE",
                            "PALE_ALE_AUSTRALIAN",
                            "PALE_ALE_ENGLISH",
                            "PALE_ALE_FRUITED",
                            "PALE_ALE_NEW_ZEALAND",
                            "PALE_ALE_OTHER",
                            "PALE_ALE_XPA_(EXTRA_PALE)",
                            "RED_ALE_IMPERIAL_/_DOUBLE",
                            "RYE_BEER",
                        ],
                    },
                    into: "HOP_LOW",
                    keepZero: true,
                },

                {
                    match:
                        {
                            predicates: [{ field: "abv", op: "lt", value: 6 }],

                            baseIn: [
                            "IPA_AMERICAN",
                            "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                            "IPA_BRETT",
                            "IPA_BROWN",
                            "IPA_BRUT",
                            "IPA_COLD",
                            "IPA_ENGLISH",
                            "IPA_FARMHOUSE",
                            "IPA_FRUITED",
                            "IPA_IMPERIAL_/_DOUBLE",
                            "IPA_IMPERIAL_/_DOUBLE_BLACK",
                            "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                            "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                            "IPA_MILKSHAKE",
                            "IPA_NEW_ENGLAND_/_HAZY",
                            "IPA_NEW_ZEALAND",
                            "IPA_OTHER",
                            "IPA_QUADRUPLE",
                            "IPA_RED",
                            "IPA_RYE",
                            "IPA_SESSION",
                            "IPA_TRIPLE",
                            "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                            "IPA_WHITE_/_WHEAT",
                            "NON-ALCOHOLIC_BEER_IPA",
                            "PALE_ALE_AMERICAN",
                            "PALE_ALE_MILKSHAKE",
                            "PALE_ALE_NEW_ENGLAND_/_HAZY",
                            "IPA_BELGIAN",
                        ],
                    },
                    into: "HOPHOP_LOW",
                    keepZero: true,
                },

                {
                    match: {
                        predicates: [
                            { field: "abv", op: "gte", value: 6 },
                            { field: "abv", op: "lt", value: 8 },
                        ],

                        baseIn: [
                            "NON-ALCOHOLIC_BEER_PALE_ALE",
                            "PALE_ALE_AUSTRALIAN",
                            "PALE_ALE_ENGLISH",
                            "PALE_ALE_FRUITED",
                            "PALE_ALE_NEW_ZEALAND",
                            "PALE_ALE_OTHER",
                            "PALE_ALE_XPA_(EXTRA_PALE)",
                            "RED_ALE_IMPERIAL_/_DOUBLE",
                            "RYE_BEER",
                        ],
                    },
                    into: "HOP_MEDIUM",
                    keepZero: true,
                },

                {
                    match: {
                        predicates: [
                            { field: "abv", op: "gte", value: 6 },
                            { field: "abv", op: "lt", value: 8 },
                        ],
                            baseIn: [
                                "IPA_AMERICAN",
                                "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                                "IPA_BRETT",
                                "IPA_BROWN",
                                "IPA_BRUT",
                                "IPA_COLD",
                                "IPA_ENGLISH",
                                "IPA_FARMHOUSE",
                                "IPA_FRUITED",
                                "IPA_IMPERIAL_/_DOUBLE",
                                "IPA_IMPERIAL_/_DOUBLE_BLACK",
                                "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                                "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                                "IPA_MILKSHAKE",
                                "IPA_NEW_ENGLAND_/_HAZY",
                                "IPA_NEW_ZEALAND",
                                "IPA_OTHER",
                                "IPA_QUADRUPLE",
                                "IPA_RED",
                                "IPA_RYE",
                                "IPA_SESSION",
                                "IPA_TRIPLE",
                                "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                                "IPA_WHITE_/_WHEAT",
                                "NON-ALCOHOLIC_BEER_IPA",
                                "PALE_ALE_AMERICAN",
                                "PALE_ALE_MILKSHAKE",
                                "PALE_ALE_NEW_ENGLAND_/_HAZY",
                                "IPA_BELGIAN",
                            ],
                        },
                    into: "HOPHOP_MEDIUM",
                    keepZero: true,
                },

                {
                    match: {
                        predicates: [
                            { field: "abv", op: "gte", value: 8 },
                        ],
                        baseIn: [
                            "NON-ALCOHOLIC_BEER_PALE_ALE",
                            "PALE_ALE_AUSTRALIAN",
                            "PALE_ALE_ENGLISH",
                            "PALE_ALE_FRUITED",
                            "PALE_ALE_NEW_ZEALAND",
                            "PALE_ALE_OTHER",
                            "PALE_ALE_XPA_(EXTRA_PALE)",
                            "RED_ALE_IMPERIAL_/_DOUBLE",
                            "RYE_BEER",
                        ],
                    },
                    into: "HOP_STRONG",
                    keepZero: true,
                },

                {
                    match:
                        {predicates: [
                                { field: "abv", op: "gte", value: 8 },
                            ],
                            baseIn: [
                                "IPA_AMERICAN",
                                "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                                "IPA_BRETT",
                                "IPA_BROWN",
                                "IPA_BRUT",
                                "IPA_COLD",
                                "IPA_ENGLISH",
                                "IPA_FARMHOUSE",
                                "IPA_FRUITED",
                                "IPA_IMPERIAL_/_DOUBLE",
                                "IPA_IMPERIAL_/_DOUBLE_BLACK",
                                "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                                "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                                "IPA_MILKSHAKE",
                                "IPA_NEW_ENGLAND_/_HAZY",
                                "IPA_NEW_ZEALAND",
                                "IPA_OTHER",
                                "IPA_QUADRUPLE",
                                "IPA_RED",
                                "IPA_RYE",
                                "IPA_SESSION",
                                "IPA_TRIPLE",
                                "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                                "IPA_WHITE_/_WHEAT",
                                "NON-ALCOHOLIC_BEER_IPA",
                                "PALE_ALE_AMERICAN",
                                "PALE_ALE_MILKSHAKE",
                                "PALE_ALE_NEW_ENGLAND_/_HAZY",
                                "IPA_BELGIAN",
                            ],
                        },
                    into: "HOPHOP_STRONG",
                    keepZero: true,
                },

            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> van smaken</strong> <br/> van jouw</>,
                line2: <> <strong> hoppy bieren </strong> is</>
            }
        },

        {
            id: 2815,
            name: <>Comfort - neutral - explorative</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,



            ui: {
                columns: 3,
                showItemsInline: false,
                aggregateTop: {
                    enabled: true,
                    deterministic: true, // ✅ NEW
                    unassigned: "hide", // "append" (default) | "hide"
                    hideEmptyBuckets: true,   // ✅ NEW
                    keepZeroBuckets: ["SMOOTHIE_SOUR",
                        "PASTRY_STOUT",
                        "IMPERIAL_EXTREME",
                        "SOUR_EXPERIMENTAL",
                        "WILD_BRETT",
                        "IPA_EXPERIMENTAL",
                        "HISTORICAL_EXPERIMENT",
                        "PROCESS_EXPERIMENT",
                        "NON_BEER_EXPERIMENT",],
                    columns: [
                        {
                            title: "Conservative",
                            iconToken: "TRADITIONAL",
                            buckets: [
                                "CORE_PILS_LAGER",
                                "CORE_WHEAT",
                                "RADLER_SHANDY",
                                "TABLE_LOW_ABV",
                                "BELGIAN_CAFE_CLASSICS",
                                "NON_ALC_COMFORT",
                            ],
                        },
                        {
                            title: "Normal",
                            iconToken: "NORMAL",
                            buckets: [
                                "CLASSIC_ALES",
                                "CLASSIC_LAGERS_SPECIAL",
                                "BELGIAN_STRONG_CLASSIC",
                                "BROWN_MILD",
                                "BOCK_FAMILY",
                                "PORTER_STOUT_CLASSIC",
                                "CIDER_CLASSIC",
                                "IPA_CLASSIC",
                                "NON_ALC_NORMAL",
                            ],
                        },
                        {
                            title: "Explorative",
                            iconToken: "IG_TRENDY",
                            buckets: [
                                "SMOOTHIE_SOUR",
                                "PASTRY_STOUT",
                                "IMPERIAL_EXTREME",
                                "SOUR_EXPERIMENTAL",
                                "WILD_BRETT",
                                "IPA_EXPERIMENTAL",
                                "HISTORICAL_EXPERIMENT",
                                "PROCESS_EXPERIMENT",
                                "NON_BEER_EXPERIMENT",
                            ],
                        },
                    ],
                },

            },

            rollups: [
                { match: { baseIn: [
                            "PILSNER_CZECH_/_BOHEMIAN",
                            "PILSNER_GERMAN",
                            "LAGER_PALE",
                            "LAGER_HELLES",
                            "LAGER_SVETLE_(CZECH_PALE)",
                            "LAGER_DORTMUNDER_/_EXPORT",
                            "LAGER_AMERICAN",
                            "LAGER_AMERICAN_LIGHT",
                            "LAGER_MEXICAN",
                            "KELLERBIER_/_ZWICKELBIER"
                        ]}, into: "CORE_PILS_LAGER", keepZero: false },

                { match: { baseIn: [
                            "WHEAT_BEER_WITBIER_/_BLANCHE",
                            "WHEAT_BEER_HEFEWEIZEN",
                            "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT"
                        ]}, into: "CORE_WHEAT", keepZero: false },

                { match: { baseIn: [
                            "SHANDY_/_RADLER",
                            "NON-ALCOHOLIC_BEER_SHANDY_/_RADLER"
                        ]}, into: "RADLER_SHANDY", keepZero: false },

                { match: { baseIn: [
                            "TABLE_BEER",
                            "BELGIAN_ENKEL_/_PATERSBIER"
                        ]}, into: "TABLE_LOW_ABV", keepZero: false },

                { match: { baseIn: [
                            "BELGIAN_BLONDE"
                        ]}, into: "BELGIAN_CAFE_CLASSICS", keepZero: false },

                { match: { baseIn: [
                            "NON-ALCOHOLIC_BEER_LAGER",
                            "NON-ALCOHOLIC_BEER_WHEAT_BEER"
                        ]}, into: "NON_ALC_COMFORT", keepZero: false },
                { match: { baseIn: [
                            "BITTER_SESSION_/_ORDINARY",
                            "BITTER_BEST",
                            "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)",
                            "TRADITIONAL_ALE",
                            "KOLSCH",
                            "SCOTTISH_ALE",
                            "SCOTTISH_EXPORT_ALE"
                        ]}, into: "CLASSIC_ALES", keepZero: false },

                { match: { baseIn: [
                            "LAGER_VIENNA",
                            "LAGER_AMBER_/_RED",
                            "LAGER_MUNICH_DUNKEL",
                            "LAGER_TMAVE_(CZECH_DARK)",
                            "FESTBIER",
                            "MARZEN"
                        ]}, into: "CLASSIC_LAGERS_SPECIAL", keepZero: false },

                { match: { baseIn: [
                            "BELGIAN_DUBBEL",
                            "BELGIAN_TRIPEL",
                            "BELGIAN_STRONG_GOLDEN_ALE",
                            "BELGIAN_STRONG_DARK_ALE"
                        ]}, into: "BELGIAN_STRONG_CLASSIC", keepZero: false },

                { match: { baseIn: [
                            "BROWN_ALE_ENGLISH",
                            "BROWN_ALE_AMERICAN",
                            "MILD_LIGHT",
                            "MILD_DARK"
                        ]}, into: "BROWN_MILD", keepZero: false },

                { match: { baseIn: [
                            "BOCK_SINGLE_/_TRADITIONAL",
                            "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK",
                            "BOCK_DOPPELBOCK"
                        ]}, into: "BOCK_FAMILY", keepZero: false },

                { match: { baseIn: [
                            "PORTER_ENGLISH",
                            "PORTER_AMERICAN",
                            "STOUT_IRISH_DRY",
                            "STOUT_ENGLISH",
                            "STOUT_OATMEAL"
                        ]}, into: "PORTER_STOUT_CLASSIC", keepZero: false },

                { match: { baseIn: [
                            "CIDER_DRY",
                            "CIDER_SWEET",
                            "CIDER_TRADITIONAL_/_APFELWEIN"
                        ]}, into: "CIDER_CLASSIC", keepZero: false },

                { match: { baseIn: [
                            "IPA_AMERICAN",
                            "IPA_ENGLISH",
                            "IPA_SESSION"
                        ]}, into: "IPA_CLASSIC", keepZero: false },

                { match: { baseIn: [
                            "NON-ALCOHOLIC_BEER_PALE_ALE",
                            "NON-ALCOHOLIC_BEER_OTHER"
                        ]}, into: "NON_ALC_NORMAL", keepZero: false },
                { match: { baseIn: [
                            "SOUR_SMOOTHIE_/_PASTRY"
                        ]}, into: "SMOOTHIE_SOUR", keepZero: false },

                { match: { baseIn: [
                            "STOUT_PASTRY",
                            "STOUT_IMPERIAL_/_DOUBLE_PASTRY"
                        ]}, into: "PASTRY_STOUT", keepZero: false },

                { match: { baseIn: [
                            "STOUT_IMPERIAL_/_DOUBLE",
                            "STOUT_RUSSIAN_IMPERIAL",
                            "BARLEYWINE_AMERICAN",
                            "BARLEYWINE_ENGLISH",
                            "BOCK_EISBOCK",
                            "FREEZE-DISTILLED_BEER"
                        ]}, into: "IMPERIAL_EXTREME", keepZero: false },

                { match: { baseIn: [
                            "SOUR_FRUITED",
                            "SOUR_TOMATO_/_VEGETABLE_GOSE",
                            "SOUR_OTHER",
                            "SOUR_OTHER_GOSE"
                        ]}, into: "SOUR_EXPERIMENTAL", keepZero: false },

                { match: { baseIn: [
                            "WILD_ALE_AMERICAN",
                            "WILD_ALE_OTHER",
                            "BRETT_BEER"
                        ]}, into: "WILD_BRETT", keepZero: false },

                { match: { baseIn: [
                            "IPA_NEW_ENGLAND_/_HAZY",
                            "IPA_IMPERIAL_/_DOUBLE",
                            "IPA_TRIPLE",
                            "IPA_SOUR",
                            "IPA_MILKSHAKE",
                            "IPA_BRUT",
                            "IPA_COLD"
                        ]}, into: "IPA_EXPERIMENTAL", keepZero: false },

                { match: { baseIn: [
                            "HISTORICAL_BEER_ADAMBIER",
                            "HISTORICAL_BEER_GRUIT_/_ANCIENT_HERBED_ALE",
                            "HISTORICAL_BEER_LICHTENHAINER",
                            "HISTORICAL_BEER_OTHER"
                        ]}, into: "HISTORICAL_EXPERIMENT", keepZero: false },

                { match: { baseIn: [
                            "KOJI_/_GINJO_BEER",
                            "GRAPE_ALE_ITALIAN",
                            "CORN_BEER_/_CHICHA_DE_JORA",
                            "CHILLI_/_CHILE_BEER",
                            "SMOKED_BEER",
                            "RAUCHBIER"
                        ]}, into: "PROCESS_EXPERIMENT", keepZero: false },

                { match: { baseIn: [
                            "MEAD_TRADITIONAL",
                            "KVASS",
                            "MAKGEOLLI",
                            "HARD_KOMBUCHA_/_JUN",
                            "HARD_SELTZER"
                        ]}, into: "NON_BEER_EXPERIMENT", keepZero: false },


            ],

            // only show the core buckets as top-level (optional)
            forceShow: [],

            sortPriority: ["MAINSTREAM_CORE", "NEUTRAL_CORE", "DISTINCT_CORE"],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van <strong>axis 1</strong> </>,
                line2: <> <strong></strong></>,
            },
        }
,
 {
            id: 2954,
            name: <>Normal – Instagrammable</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,

            ui: {
                columns: 2,
                showItemsInline: false,
                aggregateTop: {
                    enabled: true,
                    deterministic: true, // ✅ NEW
                    unassigned: "hide", // "append" (default) | "hide"
                    hideEmptyBuckets: true,   // ✅ NEW
                    keepZeroBuckets: [         "VIS_IG_CORE",
                        "SMOOTHIE_SOUR_IG",
                        "PASTRY_STOUT_IG",
                        "HAZY_IPA_IG",
                        "FRUITED_SOUR_IG",
                        "LAMBIC_FRUIT_IG",
                        "WEIRD_PROCESS_IG",],
                    columns: [
                        {
                            title: "Normal",
                            iconToken: "NORMAL",
                            buckets: [
                                "VIS_NORMAL_CORE",
                                // optionally include specific buckets you still want to count as normal
                                "PILS_LAGER_NORMAL",
                                "BELGIAN_CLASSICS_NORMAL",
                                "CLASSIC_ALES_NORMAL",
                                "WHEAT_NORMAL",
                                "PORTER_STOUT_NORMAL",
                                "CIDER_NORMAL",
                            ],
                        },
                        {
                            title: "Gen Z - Trendy",
                            iconToken: "IG_TRENDY", //IG_TRENDY
                            buckets: [
                                "VIS_IG_CORE",
                                "SMOOTHIE_SOUR_IG",
                                "PASTRY_STOUT_IG",
                                "HAZY_IPA_IG",
                                "FRUITED_SOUR_IG",
                                "LAMBIC_FRUIT_IG",
                                "WEIRD_PROCESS_IG",
                            ],
                        },
                    ],
                },
            },

            rollups: [
                // =========================
                // Instagrammable buckets (visual first)
                // =========================
                { match: { baseIn: ["SOUR_SMOOTHIE_/_PASTRY"] }, into: "SMOOTHIE_SOUR_IG", keepZero: true },

                { match: { baseIn: [
                            "STOUT_PASTRY",
                            "STOUT_IMPERIAL_/_DOUBLE_PASTRY"
                        ] }, into: "PASTRY_STOUT_IG", keepZero: true },

                { match: { baseIn: [
                            "IPA_NEW_ENGLAND_/_HAZY",
                            "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                            "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                            "PALE_ALE_NEW_ENGLAND_/_HAZY"
                        ] }, into: "HAZY_IPA_IG", keepZero: true },

                { match: { baseIn: [
                            "SOUR_FRUITED",
                            "SOUR_FRUITED_BERLINER_WEISSE",
                            "SOUR_FRUITED_GOSE"
                        ] }, into: "FRUITED_SOUR_IG", keepZero: true },

                // Fruited lambic is a classic “photo beer” in BE/Brussels
                { match: { baseIn: [
                            "LAMBIC_KRIEK",
                            "LAMBIC_FRAMBOISE",
                            "LAMBIC_FRUIT"
                        ] }, into: "LAMBIC_FRUIT_IG", keepZero: true },

                // Visual / novelty process beers that often look/feel postable
                { match: { baseIn: [
                            "CHILLI_/_CHILE_BEER",
                            "PUMPKIN_/_YAM_BEER",
                            "GRAPE_ALE_ITALIAN",
                            "GRAPE_ALE_OTHER",
                            "KOJI_/_GINJO_BEER",
                            "CORN_BEER_/_CHICHA_DE_JORA",
                            "MAZOUT",
                            "HARD_SELTZER",
                            "HARD_KOMBUCHA_/_JUN"
                        ] }, into: "WEIRD_PROCESS_IG", keepZero: true },

                // Optional “catch-all IG”: if you prefer to route *all* remaining fruited/novelty to IG
                // (leave out if you want stricter IG definition)
                { match: { baseIn: ["FRUIT_BEER","BLOND_FRUITED","FRUIT_DOMINANT"] }, into: "FRUIT_BEER_IG", keepZero: false },

                // =========================
                // Normal buckets (everything that’s not visually optimized)
                // =========================
                { match: { baseIn: [
                            "PILSNER_CZECH_/_BOHEMIAN",
                            "PILSNER_GERMAN",
                            "PILSNER_OTHER",
                            "LAGER_PALE",
                            "LAGER_HELLES",
                            "LAGER_SVETLE_(CZECH_PALE)",
                            "LAGER_DORTMUNDER_/_EXPORT",
                            "LAGER_AMERICAN",
                            "LAGER_AMERICAN_LIGHT",
                            "LAGER_MEXICAN",
                            "LAGER_OTHER",
                            "KELLERBIER_/_ZWICKELBIER"
                        ] }, into: "PILS_LAGER_NORMAL", keepZero: false },

                { match: { baseIn: [
                            "BELGIAN_ENKEL_/_PATERSBIER",
                            "BELGIAN_BLONDE",
                            "BELGIAN_DUBBEL",
                            "BELGIAN_TRIPEL",
                            "BELGIAN_STRONG_GOLDEN_ALE",
                            "BELGIAN_STRONG_DARK_ALE",
                            "BELGIAN_QUADRUPEL",
                            "TABLE_BEER"
                        ] }, into: "BELGIAN_CLASSICS_NORMAL", keepZero: false },

                { match: { baseIn: [
                            "TRADITIONAL_ALE",
                            "BITTER_SESSION_/_ORDINARY",
                            "BITTER_BEST",
                            "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)",
                            "KOLSCH",
                            "SCOTTISH_ALE",
                            "SCOTTISH_EXPORT_ALE",
                            "WINTER_ALE",
                            "WINTER_WARMER",
                            "CALIFORNIA_COMMON",
                            "AUSTRALIAN_SPARKLING_ALE"
                        ] }, into: "CLASSIC_ALES_NORMAL", keepZero: false },

                { match: { baseIn: [
                            "WHEAT_BEER_WITBIER_/_BLANCHE",
                            "WHEAT_BEER_HEFEWEIZEN",
                            "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                            "WHEAT_BEER_AMERICAN_PALE_WHEAT",
                            "WHEAT_BEER_KRISTALLWEIZEN",
                            "WHEAT_BEER_DUNKELWEIZEN",
                            "WHEAT_BEER_OTHER"
                        ] }, into: "WHEAT_NORMAL", keepZero: false },

                { match: { baseIn: [
                            "PORTER_ENGLISH",
                            "PORTER_AMERICAN",
                            "PORTER_BALTIC",
                            "PORTER_OTHER",
                            "STOUT_ENGLISH",
                            "STOUT_FOREIGN_/_EXPORT",
                            "STOUT_IRISH_DRY",
                            "STOUT_OATMEAL",
                            "STOUT_OTHER",
                            "STOUT_MILK_/_SWEET"
                        ] }, into: "PORTER_STOUT_NORMAL", keepZero: false },

                { match: { baseIn: [
                            "CIDER_DRY",
                            "CIDER_SWEET",
                            "CIDER_TRADITIONAL_/_APFELWEIN",
                            "CIDER_PERRY_/_POIRE",
                            "CIDER_ROSE",
                            "CIDER_APPLEWINE",
                            "NON-ALCOHOLIC_CIDER_/_PERRY"
                        ] }, into: "CIDER_NORMAL", keepZero: false },

                // =========================
                // Final “core” buckets used by the two UI columns
                // (these make it robust: anything matched above is pulled into IG core; otherwise into Normal core)
                // =========================
                {
                    match: {
                        baseIn: [
                            "SMOOTHIE_SOUR_IG",
                            "PASTRY_STOUT_IG",
                            "HAZY_IPA_IG",
                            "FRUITED_SOUR_IG",
                            "LAMBIC_FRUIT_IG",
                            "WEIRD_PROCESS_IG",
                            "FRUIT_BEER_IG",
                        ],
                    },
                    into: "VIS_IG_CORE",
                    keepZero: false,
                },

                {
                    match: {
                        baseIn: [
                            "PILS_LAGER_NORMAL",
                            "BELGIAN_CLASSICS_NORMAL",
                            "CLASSIC_ALES_NORMAL",
                            "WHEAT_NORMAL",
                            "PORTER_STOUT_NORMAL",
                            "CIDER_NORMAL",
                            "BEERS_OTHER",
                            "BEERS_SPECIAL",
                        ],
                    },
                    into: "VIS_NORMAL_CORE",
                    keepZero: false,
                },
            ],

            sortPriority: ["VIS_NORMAL_CORE", "VIS_IG_CORE"],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van <strong>zichtbaarheid</strong> </>,
                line2: <>i <strong></strong></>,
            },
        }

,
{
            id: 2874,
            name: <>Mainstream – Neutral – Distinct</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,



            ui: {
                columns: 3,
                showItemsInline: false,
                aggregateTop: {
                        enabled: true,
                    deterministic: true, // ✅ NEW
                    unassigned: "hide", // "append" (default) | "hide"
                    hideEmptyBuckets: true,   // ✅ NEW
                        columns: [
                            {
                                title: "Mainstream",
                                iconToken: "MAINSTREAM",
                                buckets: [
                                    // mainstream buckets
                                    "PILSNER",
                                    "LAGER_CORE",
                                    "RADLER_SHANDY",
                                    "WHEAT_CLASSIC",
                                    "BELGIAN_CAFE_CLASSICS",
                                    "NON_ALC_MAINSTREAM",
                                ],
                            },
                            {
                                title: "Neutral",
                                iconToken: "NEUTRAL",
                                buckets: [
                                    // neutral buckets
                                    "BELGIAN_STRONGS",
                                    "CLASSIC_ALES",
                                    "LAGER_SPECIALS",
                                    "BROWN_MILD_DARK",
                                    "BOCK_FAMILY",
                                    "WHEAT_OTHER",
                                    "PORTER_STOUT_CLASSIC",
                                    "CIDER_MAIN",
                                    "NON_ALC_NEUTRAL",

                                    // catch-alls you decided were neutral
                                    "BEERS_OTHER",
                                    "BEERS_SPECIAL",
                                    "FLAVORED_MALT_BEVERAGE",
                                    "SPIRIT_FLAVOURED_BEERS",
                                    "BEER_SODA_MIX",
                                ],
                            },
                            {
                                title: "Distinct",
                                iconToken: "DISTINCT",
                                buckets: [
                                    // distinct buckets
                                    "SMOOTHIE_SOUR",
                                    "MILKSHAKE_IPA_PALE",
                                    "LAMBIC_FAMILY",
                                    "SOUR_FAMILY",
                                    "WILD_BRETT",
                                    "IPA_FAMILY",
                                    "PASTRY_STOUTS",
                                    "IMPERIAL_STOUTS",
                                    "HISTORICAL_ODDITIES",
                                    "PROCESS_SPECIALTY",
                                    "NON_BEER_ALT",
                                ],
                            },
                        ],


                },
            },

            rollups: [
                // =========================
                // DISTINCT buckets (examples of finer buckets you can expand later)
                // =========================
                { match: { baseIn: ["SOUR_SMOOTHIE_/_PASTRY"] }, into: "SMOOTHIE_SOUR", keepZero: false },
                { match: { baseIn: ["IPA_MILKSHAKE","IPA_IMPERIAL_/_DOUBLE_MILKSHAKE","PALE_ALE_MILKSHAKE"] }, into: "MILKSHAKE_IPA_PALE", keepZero: false },
                { match: { baseIn: ["LAMBIC_GUEUZE","LAMBIC_TRADITIONAL","LAMBIC_KRIEK","LAMBIC_FARO","LAMBIC_FRUIT","LAMBIC_FRAMBOISE","LAMBIC_OTHER"] }, into: "LAMBIC_FAMILY", keepZero: false },
                { match: { baseIn: ["SOUR_BERLINER_WEISSE","SOUR_TRADITIONAL_GOSE","SOUR_OTHER_GOSE","SOUR_FRUITED","SOUR_FRUITED_BERLINER_WEISSE","SOUR_FRUITED_GOSE","SOUR_TOMATO_/_VEGETABLE_GOSE","SOUR_FLANDERS_RED_ALE","SOUR_FLANDERS_OUD_BRUIN","SOUR_CATHARINA","SOUR_OTHER"] }, into: "SOUR_FAMILY", keepZero: false },
                { match: { baseIn: ["WILD_ALE_AMERICAN","WILD_ALE_OTHER","BRETT_BEER"] }, into: "WILD_BRETT", keepZero: false },

                { match: { baseIn: ["IPA_AMERICAN","IPA_ENGLISH","IPA_BELGIAN","IPA_NEW_ENGLAND_/_HAZY","IPA_IMPERIAL_/_DOUBLE","IPA_TRIPLE","IPA_SESSION","IPA_COLD","IPA_BRUT","IPA_NEW_ZEALAND","IPA_RED","IPA_RYE","IPA_WHITE_/_WHEAT","IPA_BLACK_/_CASCADIAN_DARK_ALE","IPA_BRETT","IPA_FARMHOUSE","IPA_FRUITED","IPA_SOUR","IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY","IPA_IMPERIAL_/_DOUBLE_BLACK","IPA_TRIPLE_NEW_ENGLAND_/_HAZY","IPA_BROWN","IPA_QUADRUPLE","IPA_OTHER"] }, into: "IPA_FAMILY", keepZero: false },

                { match: { baseIn: ["STOUT_PASTRY","STOUT_IMPERIAL_/_DOUBLE_PASTRY","STOUT_RUSSIAN_IMPERIAL"] }, into: "PASTRY_STOUTS", keepZero: false },
                { match: { baseIn: ["STOUT_IMPERIAL_/_DOUBLE","STOUT_IMPERIAL_/_DOUBLE_COFFEE","STOUT_IMPERIAL_/_DOUBLE_MILK","STOUT_IMPERIAL_/_DOUBLE_OATMEAL","STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN"] }, into: "IMPERIAL_STOUTS", keepZero: false },

                { match: { baseIn: ["HISTORICAL_BEER_ADAMBIER","HISTORICAL_BEER_BERLINER_BRAUNBIER","HISTORICAL_BEER_BROYHAN","HISTORICAL_BEER_BURTON_ALE","HISTORICAL_BEER_DAMPFBIER","HISTORICAL_BEER_GRUIT_/_ANCIENT_HERBED_ALE","HISTORICAL_BEER_KENTUCKY_COMMON","HISTORICAL_BEER_KOTTBUSSER","HISTORICAL_BEER_KUIT_/_KUYT_/_KOYT","HISTORICAL_BEER_LICHTENHAINER","HISTORICAL_BEER_MUMME","HISTORICAL_BEER_STEINBIER","HISTORICAL_BEER_ZOIGL","HISTORICAL_BEER_OTHER"] }, into: "HISTORICAL_ODDITIES", keepZero: false },

                { match: { baseIn: ["SMOKED_BEER","RAUCHBIER","ROGGENBIER","RYE_BEER","CHILLI_/_CHILE_BEER","PUMPKIN_/_YAM_BEER","SPICED_/_HERBED_BEER","HONEY_BEER","SPECIALTY_GRAIN","KOJI_/_GINJO_BEER","CORN_BEER_/_CHICHA_DE_JORA","GRAPE_ALE_ITALIAN","GRAPE_ALE_OTHER","FREEZE-DISTILLED_BEER","BOCK_EISBOCK","MAZOUT","HAPPOSHU","GLUTEN-FREE"] }, into: "PROCESS_SPECIALTY", keepZero: false },

                { match: { baseIn: ["MEAD_TRADITIONAL","MEAD_OTHER","MEAD_SESSION_/_SHORT","MEAD_MELOMEL","MEAD_CYSER","MEAD_METHEGLIN","MEAD_PYMENT","MEAD_BRAGGOT","MEAD_BOCHET","MEAD_ACERGLYN_/_MAPLE_WINE","NON-ALCOHOLIC_MEAD","KVASS","MAKGEOLLI","SORGHUM_/_MILLET_BEER","HARD_SELTZER","HARD_KOMBUCHA_/_JUN","HARD_GINGER_BEER"] }, into: "NON_BEER_ALT", keepZero: false },

                // =========================
                // MAINSTREAM buckets
                // =========================
                { match: { baseIn: ["PILSNER_CZECH_/_BOHEMIAN","PILSNER_GERMAN","PILSNER_OTHER"] }, into: "PILSNER", keepZero: false },
                { match: { baseIn: ["LAGER_PALE","LAGER_HELLES","LAGER_SVETLE_(CZECH_PALE)","LAGER_DORTMUNDER_/_EXPORT","LAGER_AMERICAN","LAGER_AMERICAN_LIGHT","LAGER_MEXICAN","LAGER_LEICHTBIER","KELLERBIER_/_ZWICKELBIER","LAGER_OTHER"] }, into: "LAGER_CORE", keepZero: false },
                { match: { baseIn: ["SHANDY_/_RADLER","NON-ALCOHOLIC_BEER_SHANDY_/_RADLER"] }, into: "RADLER_SHANDY", keepZero: false },
                { match: { baseIn: ["WHEAT_BEER_WITBIER_/_BLANCHE","WHEAT_BEER_HEFEWEIZEN","WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT"] }, into: "WHEAT_CLASSIC", keepZero: false },
                { match: { baseIn: ["BELGIAN_ENKEL_/_PATERSBIER","BELGIAN_BLONDE","TABLE_BEER"] }, into: "BELGIAN_CAFE_CLASSICS", keepZero: false },
                { match: { baseIn: ["NON-ALCOHOLIC_BEER_LAGER","NON-ALCOHOLIC_BEER_WHEAT_BEER"] }, into: "NON_ALC_MAINSTREAM", keepZero: false },

                // =========================
                // NEUTRAL buckets
                // =========================
                { match: { baseIn: ["BELGIAN_DUBBEL","BELGIAN_TRIPEL","BELGIAN_STRONG_GOLDEN_ALE","BELGIAN_STRONG_DARK_ALE","BELGIAN_QUADRUPEL"] }, into: "BELGIAN_STRONGS", keepZero: false },

                { match: { baseIn: ["BITTER_SESSION_/_ORDINARY","BITTER_BEST","BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)","TRADITIONAL_ALE","KOLSCH","SCOTTISH_ALE","SCOTTISH_EXPORT_ALE","WINTER_ALE","WINTER_WARMER","CALIFORNIA_COMMON","AUSTRALIAN_SPARKLING_ALE"] }, into: "CLASSIC_ALES", keepZero: false },

                { match: { baseIn: ["LAGER_AMBER_/_RED","LAGER_AMERICAN_AMBER_/_RED","LAGER_VIENNA","LAGER_POLOTMAVE_(CZECH_AMBER)","LAGER_ROTBIER","LAGER_MUNICH_DUNKEL","LAGER_TMAVE_(CZECH_DARK)","LAGER_DARK","LAGER_STRONG","LAGER_WINTER","FESTBIER","MARZEN","SCHWARZBIER"] }, into: "LAGER_SPECIALS", keepZero: false },

                { match: { baseIn: ["BROWN_ALE_AMERICAN","BROWN_ALE_ENGLISH","BROWN_ALE_OTHER","MILD_LIGHT","MILD_DARK","MILD_OTHER","DARK_ALE"] }, into: "BROWN_MILD_DARK", keepZero: false },

                { match: { baseIn: ["BOCK_SINGLE_/_TRADITIONAL","BOCK_HELL_/_MAIBOCK_/_LENTEBOCK","BOCK_DOPPELBOCK","BOCK_WEIZENBOCK","BOCK_WEIZENDOPPELBOCK"] }, into: "BOCK_FAMILY", keepZero: false },

                { match: { baseIn: ["WHEAT_BEER_AMERICAN_PALE_WHEAT","WHEAT_BEER_KRISTALLWEIZEN","WHEAT_BEER_DUNKELWEIZEN","WHEAT_BEER_OTHER","WHEAT_BEER_HOPFENWEISSE"] }, into: "WHEAT_OTHER", keepZero: false },

                { match: { baseIn: ["PORTER_ENGLISH","PORTER_AMERICAN","PORTER_BALTIC","PORTER_OTHER","STOUT_ENGLISH","STOUT_FOREIGN_/_EXPORT","STOUT_IRISH_DRY","STOUT_OATMEAL","STOUT_OTHER","STOUT_MILK_/_SWEET","PORTER_SMOKED","PORTER_COFFEE","STOUT_COFFEE","STOUT_OYSTER"] }, into: "PORTER_STOUT_CLASSIC", keepZero: false },

                { match: { baseIn: ["CIDER_DRY","CIDER_SWEET","CIDER_TRADITIONAL_/_APFELWEIN","CIDER_PERRY_/_POIRE","CIDER_ROSE","CIDER_APPLEWINE"] }, into: "CIDER_MAIN", keepZero: false },

                { match: { baseIn: ["NON-ALCOHOLIC_BEER_OTHER","NON-ALCOHOLIC_BEER_PALE_ALE","NON-ALCOHOLIC_CIDER_/_PERRY"] }, into: "NON_ALC_NEUTRAL", keepZero: false },

            ],



            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van <strong>identiteit</strong> </>,
                line2: <> <strong></strong></>,
            },
        }

,

 {
            id: 2814,
            name: <>Sporter vs normal beers - lvl 4 </>,
            section: "beers",
            groupBy: "category",
            within: {
                category: "BEERS",
            },
            predicates: [{ field: "is_zero", op: "eq", value: 1 }],
            includeEmpty: false,
            showOnlyRollups: true,
            ui: {
                columns:2,
                aggregateTop: {
                    enabled: true,
                    deterministic: true, // ✅ NEW
                    unassigned: "hide", // "append" (default) | "hide"
                    hideEmptyBuckets: false,   // ✅ NEW
                    keepZeroBuckets: [],
                    columns: [

                        {
                            title: "Normale bieren",
                            iconToken: "NORMAL",
                            buckets: [

                            ],
                        },
                        {
                            title: "Sporters-bieren",
                            iconToken: "SPORT",
                            buckets: [
                                "WITH_PROTEIN","WITH_VITAMINS","WITH_MAGNESIUM","WITH_PREBIOTICS","WITH_ELECTROLYTES",
                            ],
                        },

                    ],
                },
            },

            rollups: [
    // 1) With protein

    {
        match: {
            predicates: [{ field: "is_protein", op: "eq", value: 1 }],
        },
        into: "WITH_PROTEIN",
        keepZero: true,
    },

    // 2) With vitamins
    {
        match: {
            predicates: [{ field: "is_vitamins", op: "eq", value: 1 }],
        },
        into: "WITH_VITAMINS",
        keepZero: true,
    },

    // 3) With magnesium
    {
        match: {
            predicates: [{ field: "is_magnesium", op: "eq", value: 1 }],
        },
        into: "WITH_MAGNESIUM",
        keepZero: true,
    },

    // 4) With prebiotics
    {
        match: {
            predicates: [{ field: "is_prebiotic", op: "eq", value: 1 }],
        },
        into: "WITH_PREBIOTICS",
        keepZero: true,
    },

    // 5) Trending
    {
        match: {
            predicates: [{ field: "is_trending", op: "eq", value: 1 }],
        },
        into: "WITH_ELECTROLYTES",
        keepZero: true,
    },

    // 6) With electrolytes
    {
        match: {
            predicates: [{ field: "I", op: "eq", value: 1 }],
        },
        into: "W",
        keepZero: true,
    },

            ],


            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> van sport vs normaal</strong> <br/> van jouw</>,
                line2: <> <strong> non-alcoholische bieren </strong> is</>
            }
        }    ,


         {
            id: 2332,
            name: <> <strong> Localiteit van je bier </strong><br/> Sommigen willen iets lokaals </>,
            section: "beers",
            groupBy: "subcategory",
            within: {category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: true,
            ui: {
                columns: 3,
                aggregateTop: {
                    enabled: true,
                    deterministic: true,
                    unassigned: "append",
                    hideEmptyBuckets: false,   // ✅ NEW
                    columns: [
                        {
                            title: "Regionaal",
                            iconToken: "REGIONAL",
                            buckets: [
                                "LOCAL"
                            ],
                        },
                        {
                            title: "Belgisch",
                            iconToken: "BELGIUM",
                            buckets: [
                                "BELGIAN"
                            ],
                        },
                        {
                            title: "Internationaal",
                            iconToken: "WORLD",
                            buckets: [
                                "INTERNATIONAL"
                            ],
                        },
                    ],
                },


            },

            rollups: [

                // 1) OUDE GEUZE (classic gueuze / straight lambic)
                {
                    match: {
                        baseIn: [
                            "NORMAL_BLOND_AMBER",
                            "BLOND_BITTERS",
                            "DARK_BROWN_MALT_SWEETNESS",
                            "FRUIT_BEERS",
                            "SOURS_SAISON_LAMBIC_GUEUZE"
                        ],
                    },
                    into: "LOCAL",
                    keepZero: true,
                },
                {
                    match: {
                        baseIn: [
                            "NORMAL_BLOND_AMBER",
                            "BLOND_BITTERS",
                            "DARK_BROWN_MALT_SWEETNESS",
                            "FRUIT_BEERS",
                            "SOURS_SAISON_LAMBIC_GUEUZE"
                        ],
                    },
                    into: "BELGIAN",
                    keepZero: true,
                },
                {
                    match: {
                        baseIn: [
                            "NORMAL_BLOND_AMBER",
                            "BLOND_BITTERS",
                            "DARK_BROWN_MALT_SWEETNESS",
                            "FRUIT_BEERS",
                            "SOURS_SAISON_LAMBIC_GUEUZE"
                        ],
                    },
                    into: "INTERNATIONAL",
                    keepZero: true,
                },

            ],


            info: {
                image: presetImg("Budgetbewust.png"),
                line1: <>De verdeling van <strong> smaken </strong> van je <br/>  </>,
                line2: <> <strong> alcoholische bieren </strong> is</>
            }
        },


{
    id: 2191,
    name: <>Seasonal drank kan je extra marge voor vragen & houd je kaart relevant. Lente: in de kiezen mensen meestal vaker voor lichtere, frissere en aromatischere bieren. </>,
    section: "beers",
    groupBy: "subsubcategory",
    within: {},
    predicates: [],
    includeEmpty: false,
    showOnlyRollups: true,
    ui: {
        columns: 3,
        aggregateTop: {
            enabled: true,
            deterministic: true, // ✅ NEW
            unassigned: "hide", // "append" (default) | "hide"
            hideEmptyBuckets: false,   // ✅ NEW
            columns: [
                {
                    title: "WINTER",
                    iconToken: "WINTER",
                    buckets: [
                        "WINTER"
                    ],
                },
                {
                    title: "SPRING",
                    iconToken: "SPRING",
                    buckets: [
                        "FRUIT_SOUR","LENTEBOCK","WHEAT","SAISON"
                    ],
                },
                {
                    title: "SUMMER",
                    iconToken: "SUMMER",
                    buckets: [
                        "SUMMER"
                    ],
                },
                {
                    title: "AUTUMN",
                    iconToken: "AUTUMN",
                    buckets: [

                    ],
                },
                {
                    title: "ALL_SEASON",
                    iconToken: "ALL_SEASON",
                    buckets: [

                    ],
                },
            ],
        },
    },

    rollups: [
        // DARK_BROWN_MALT_SWEETNESS
        // ALL_SEASONS
        {
            match: {
                baseIn: [
                    "AUSTRALIAN_SPARKLING_ALE",
                    "BEERS_OTHER",
                    "BEERS_SPECIAL",
                    "BELGIAN_BLONDE",
                    "BELGIAN_ENKEL_/_PATERSBIER",
                    "BITTER_BEST",
                    "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)",
                    "BITTER_SESSION_/_ORDINARY",
                    "BLONDE_/_GOLDEN_ALE_AMERICAN",
                    "BLONDE_/_GOLDEN_ALE_ENGLISH",
                    "BLONDE_/_GOLDEN_ALE_OTHER",
                    "CALIFORNIA_COMMON",
                    "CREAM_ALE",
                    "GLUTEN-FREE",
                    "HAPPOSHU",
                    "HISTORICAL_BEER_ADAMBIER",
                    "HISTORICAL_BEER_BERLINER_BRAUNBIER",
                    "HISTORICAL_BEER_BROYHAN",
                    "HISTORICAL_BEER_BURTON_ALE",
                    "HISTORICAL_BEER_DAMPFBIER",
                    "HISTORICAL_BEER_GRUIT_/_ANCIENT_HERBED_ALE",
                    "HISTORICAL_BEER_KENTUCKY_COMMON",
                    "HISTORICAL_BEER_KOTTBUSSER",
                    "HISTORICAL_BEER_KUIT_/_KUYT_/_KOYT",
                    "HISTORICAL_BEER_LICHTENHAINER",
                    "HISTORICAL_BEER_MUMME",
                    "HISTORICAL_BEER_OTHER",
                    "HISTORICAL_BEER_STEINBIER",
                    "HISTORICAL_BEER_ZOIGL",
                    "HONEY_BEER",
                    "IPA_AMERICAN",
                    "IPA_BELGIAN",
                    "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                    "IPA_BRETT",
                    "IPA_BROWN",
                    "IPA_BRUT",
                    "IPA_COLD",
                    "IPA_ENGLISH",
                    "IPA_FARMHOUSE",
                    "IPA_FRUITED",
                    "IPA_MILKSHAKE",
                    "IPA_NEW_ENGLAND_/_HAZY",
                    "IPA_NEW_ZEALAND",
                    "IPA_OTHER",
                    "IPA_RED",
                    "IPA_RYE",
                    "IPA_SESSION",
                    "IPA_SOUR",
                    "IPA_WHITE_/_WHEAT",
                    "KELLERBIER_/_ZWICKELBIER",
                    "KOJI_/_GINJO_BEER",
                    "KOLSCH",
                    "LAGER_AMERICAN",
                    "LAGER_AMERICAN_LIGHT",
                    "LAGER_AMERICAN_PRE-PROHIBITION",
                    "LAGER_DORTMUNDER_/_EXPORT",
                    "LAGER_HELLES",
                    "LAGER_IPL_(INDIA_PALE_LAGER)",
                    "LAGER_JAPANESE_RICE",
                    "LAGER_LEICHTBIER",
                    "LAGER_MEXICAN",
                    "LAGER_OTHER",
                    "LAGER_PALE",
                    "LAGER_SVETLE_(CZECH_PALE)",
                    "MAKGEOLLI",
                    "MALT_BEER",
                    "MALT_LIQUOR",
                    "MAZOUT",
                    "NON-ALCOHOLIC_BEER_IPA",
                    "NON-ALCOHOLIC_BEER_LAGER",
                    "NON-ALCOHOLIC_BEER_OTHER",
                    "NON-ALCOHOLIC_BEER_PALE_ALE",
                    "NON-ALCOHOLIC_BEER_PORTER_/_STOUT",
                    "NON-ALCOHOLIC_BEER_SOUR",
                    "NON-ALCOHOLIC_BEER_SHANDY_/_RADLER",
                    "NON-ALCOHOLIC_BEER_WHEAT_BEER",
                    "NON-ALCOHOLIC_CIDER_/_PERRY",
                    "NON-ALCOHOLIC_MEAD",
                    "PALE_ALE_AMERICAN",
                    "PALE_ALE_AUSTRALIAN",
                    "PALE_ALE_BELGIAN",
                    "PALE_ALE_ENGLISH",
                    "PALE_ALE_FRUITED",
                    "PALE_ALE_MILKSHAKE",
                    "PALE_ALE_NEW_ENGLAND_/_HAZY",
                    "PALE_ALE_NEW_ZEALAND",
                    "PALE_ALE_OTHER",
                    "PALE_ALE_XPA_(EXTRA_PALE)",
                    "PILSNER_CZECH_/_BOHEMIAN",
                    "PILSNER_GERMAN",
                    "PILSNER_IMPERIAL_/_DOUBLE",
                    "PILSNER_ITALIAN",
                    "PILSNER_NEW_ZEALAND",
                    "PILSNER_OTHER",
                    "ROOT_BEER",
                    "SORGHUM_/_MILLET_BEER",
                    "SPECIALTY_GRAIN",
                    "SPIRIT_FLAVOURED_BEERS",
                    "TABLE_BEER",
                    "TRADITIONAL_ALE",
                ],
            },
            into: "ALL_SEASONS",
            keepZero: true,
        },

// SPRING
        {
            match: {
                baseIn: [
                    "BIERE_DE_CHAMPAGNE_/_BIERE_BRUT",
                    "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK",
                ],
            },
            into: "LENTEBOCK",
            keepZero: true,
        },

        {
            match: {
                baseIn: [
                    "BRETT_BEER",
                    "FARMHOUSE_ALE_BRETT",
                    "FARMHOUSE_ALE_BIERE_DE_MARS",
                    "FARMHOUSE_ALE_GRISETTE",
                    "FARMHOUSE_ALE_SAISON",
                    "WILD_ALE_AMERICAN",
                    "WILD_ALE_OTHER",
                ],
            },
            into: "SAISON",
            keepZero: true,
        },
        {
            match: {
                baseIn: [
                    "WHEAT_BEER_AMERICAN_PALE_WHEAT",
                    "WHEAT_BEER_DUNKELWEIZEN",
                    "WHEAT_BEER_FRUITED",
                    "WHEAT_BEER_HEFEWEIZEN",
                    "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                    "WHEAT_BEER_HOPFENWEISSE",
                    "WHEAT_BEER_KRISTALLWEIZEN",
                    "WHEAT_BEER_OTHER",
                    "WHEAT_BEER_WHEAT_WINE",
                    "WHEAT_BEER_WITBIER_/_BLANCHE",
                ],
            },
            into: "WHEAT",
            keepZero: true,
        },
        {
            match: {
                baseIn: [
                    "LAMBIC_FARO",
                    "LAMBIC_FRAMBOISE",
                    "LAMBIC_FRUIT",
                    "LAMBIC_GUEUZE",
                    "LAMBIC_KRIEK",
                    "LAMBIC_OTHER",
                    "LAMBIC_TRADITIONAL",
                ],
            },
            into: "FRUIT_SOUR",
            keepZero: true,
        },
        {
            match: {
                baseIn: [

                ],
            },
            into: "SPRING",
            keepZero: true,
        },

// SUMMER
        {
            match: {
                baseIn: [
                    "BEER_SODA_MIX",
                    "BLOND_FRUITED",
                    "CIDER_APPLEWINE",
                    "CIDER_BASQUE",
                    "CIDER_DRY",
                    "CIDER_GRAFF",
                    "CIDER_HERBED_/_SPICED_/_HOPPED",
                    "CIDER_OTHER_FRUIT",
                    "CIDER_PERRY_/_POIRE",
                    "CIDER_ROSE",
                    "CIDER_SWEET",
                    "CIDER_TRADITIONAL_/_APFELWEIN",
                    "CORN_BEER_/_CHICHA_DE_JORA",
                    "FLAVORED_MALT_BEVERAGE",
                    "FRUIT_BEER",
                    "FRUIT_DOMINANT",
                    "HARD_GINGER_BEER",
                    "HARD_KOMBUCHA_/_JUN",
                    "HARD_SELTZER",
                    "LAMBIC_FARO",
                    "LAMBIC_FRAMBOISE",
                    "LAMBIC_FRUIT",
                    "LAMBIC_GUEUZE",
                    "LAMBIC_KRIEK",
                    "LAMBIC_OTHER",
                    "LAMBIC_TRADITIONAL",
                    "SHANDY_/_RADLER",
                    "SOUR_BERLINER_WEISSE",
                    "SOUR_CATHARINA",
                    "SOUR_FRUITED",
                    "SOUR_FRUITED_BERLINER_WEISSE",
                    "SOUR_FRUITED_GOSE",
                    "SOUR_OTHER",
                    "SOUR_OTHER_GOSE",
                    "SOUR_SMOOTHIE_/_PASTRY",
                    "SOUR_TOMATO_/_VEGETABLE_GOSE",
                    "SOUR_TRADITIONAL_GOSE",
                    "WHEAT_BEER_AMERICAN_PALE_WHEAT",
                    "WHEAT_BEER_DUNKELWEIZEN",
                    "WHEAT_BEER_FRUITED",
                    "WHEAT_BEER_HEFEWEIZEN",
                    "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                    "WHEAT_BEER_HOPFENWEISSE",
                    "WHEAT_BEER_KRISTALLWEIZEN",
                    "WHEAT_BEER_OTHER",
                    "WHEAT_BEER_WHEAT_WINE",
                    "WHEAT_BEER_WITBIER_/_BLANCHE",
                ],
            },
            into: "SUMMER",
            keepZero: true,
        },

// AUTUMN
        {
            match: {
                baseIn: [
                    "ALTBIER_STICKE",
                    "ALTBIER_TRADITIONAL",
                    "BLACK_&_TAN",
                    "BROWN_ALE_AMERICAN",
                    "BROWN_ALE_BELGIAN",
                    "BROWN_ALE_ENGLISH",
                    "BROWN_ALE_IMPERIAL_/_DOUBLE",
                    "BROWN_ALE_OTHER",
                    "CIDER_APPLEWINE",
                    "CIDER_BASQUE",
                    "CIDER_DRY",
                    "CIDER_GRAFF",
                    "CIDER_HERBED_/_SPICED_/_HOPPED",
                    "CIDER_OTHER_FRUIT",
                    "CIDER_PERRY_/_POIRE",
                    "CIDER_ROSE",
                    "CIDER_SWEET",
                    "CIDER_TRADITIONAL_/_APFELWEIN",
                    "DARK_ALE",
                    "FARMHOUSE_ALE_BIERE_DE_COUPAGE",
                    "FARMHOUSE_ALE_BIERE_DE_GARDE",
                    "FARMHOUSE_ALE_KORNØL",
                    "FARMHOUSE_ALE_OTHER",
                    "FARMHOUSE_ALE_SAHTI",
                    "FESTBIER",
                    "GRAPE_ALE_ITALIAN",
                    "GRAPE_ALE_OTHER",
                    "GRODZISKIE_/_GRATZER",
                    "KVASS",
                    "LAGER_AMBER_/_RED",
                    "LAGER_AMERICAN_AMBER_/_RED",
                    "LAGER_DARK",
                    "LAGER_MUNICH_DUNKEL",
                    "LAGER_POLOTMAVE_(CZECH_AMBER)",
                    "LAGER_ROTBIER",
                    "LAGER_SMOKED",
                    "LAGER_TMAVE_(CZECH_DARK)",
                    "LAGER_VIENNA",
                    "MARZEN",
                    "MEAD_ACERGLYN_/_MAPLE_WINE",
                    "MEAD_BOCHET",
                    "MEAD_BRAGGOT",
                    "MEAD_CYSER",
                    "MEAD_MELOMEL",
                    "MEAD_METHEGLIN",
                    "MEAD_OTHER",
                    "MEAD_PYMENT",
                    "MEAD_SESSION_/_SHORT",
                    "MEAD_TRADITIONAL",
                    "MILD_DARK",
                    "MILD_LIGHT",
                    "MILD_OTHER",
                    "PUMPKIN_/_YAM_BEER",
                    "RAUCHBIER",
                    "RED_ALE_AMERICAN_AMBER_/_RED",
                    "RED_ALE_IMPERIAL_/_DOUBLE",
                    "RED_ALE_IRISH",
                    "RED_ALE_OTHER",
                    "ROGGENBIER",
                    "RYE_BEER",
                    "SCHWARZBIER",
                    "SMOKED_BEER",
                    "SOUR_FLANDERS_OUD_BRUIN",
                    "SOUR_FLANDERS_RED_ALE",
                ],
            },
            into: "AUTUMN",
            keepZero: true,
        },

// WINTER
        {
            match: {
                baseIn: [
                    "BELGIAN_DUBBEL",
                    "BELGIAN_QUADRUPEL",
                    "BELGIAN_STRONG_DARK_ALE",
                    "BELGIAN_STRONG_GOLDEN_ALE",
                    "BELGIAN_TRIPEL",
                    "BIERE_DE_CHAMPAGNE_/_BIERE_BRUT",
                    "BOCK_DOPPELBOCK",
                    "BOCK_EISBOCK",
                    "BOCK_SINGLE_/_TRADITIONAL",
                    "BOCK_WEIZENBOCK",
                    "BOCK_WEIZENDOPPELBOCK",
                    "BROWN_ALE_IMPERIAL_/_DOUBLE",
                    "CHILLI_/_CHILE_BEER",
                    "CIDER_ICE",
                    "CREAM_ALE_IMPERIAL_/_DOUBLE",
                    "FREEZE-DISTILLED_BEER",
                    "GOLDEN_ALE_UKRAINIAN",
                    "IPA_IMPERIAL_/_DOUBLE",
                    "IPA_IMPERIAL_/_DOUBLE_BLACK",
                    "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                    "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                    "IPA_QUADRUPLE",
                    "IPA_TRIPLE",
                    "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                    "LAGER_STRONG",
                    "LAGER_WINTER",
                    "MALT_LIQUOR",
                    "OLD_/_STOCK_ALE",
                    "PORTER_AMERICAN",
                    "PORTER_BALTIC",
                    "PORTER_COFFEE",
                    "PORTER_ENGLISH",
                    "PORTER_IMPERIAL_/_DOUBLE",
                    "PORTER_IMPERIAL_/_DOUBLE_BALTIC",
                    "PORTER_IMPERIAL_/_DOUBLE_COFFEE",
                    "PORTER_OTHER",
                    "PORTER_SMOKED",
                    "RED_ALE_IMPERIAL_/_DOUBLE",
                    "RYE_WINE",
                    "SCHWARZBIER",
                    "SCOTCH_ALE_/_WEE_HEAVY",
                    "SCOTTISH_ALE",
                    "SCOTTISH_EXPORT_ALE",
                    "SPICED_/_HERBED_BEER",
                    "STOUT_AMERICAN",
                    "STOUT_BELGIAN",
                    "STOUT_COFFEE",
                    "STOUT_ENGLISH",
                    "STOUT_FOREIGN_/_EXPORT",
                    "STOUT_IMPERIAL_/_DOUBLE",
                    "STOUT_IMPERIAL_/_DOUBLE_COFFEE",
                    "STOUT_IMPERIAL_/_DOUBLE_MILK",
                    "STOUT_IMPERIAL_/_DOUBLE_OATMEAL",
                    "STOUT_IMPERIAL_/_DOUBLE_PASTRY",
                    "STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN",
                    "STOUT_IRISH_DRY",
                    "STOUT_MILK_/_SWEET",
                    "STOUT_OATMEAL",
                    "STOUT_OTHER",
                    "STOUT_OYSTER",
                    "STOUT_PASTRY",
                    "STOUT_RUSSIAN_IMPERIAL",
                    "STOUT_WHITE_/_GOLDEN",
                    "STRONG_ALE_AMERICAN",
                    "STRONG_ALE_ENGLISH",
                    "STRONG_ALE_OTHER",
                    "WINTER_ALE",
                    "WINTER_WARMER",
                ],
            },
            into: "WINTER",
            keepZero: true,
        },

    ],


    info: {
        image: presetImg("Fijn-proever.png"),
        line1: <>De verdeling <strong> stijlen</strong> <br/> van jouw</>,
        line2: <> <strong> bieren </strong>  voor connaisseurs  is</>
    }
},

 {
            id: 2817,
            name: <>Country styles (US / International)</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,

            ui: {
                columns: 2,
                showItemsInline: false,
                aggregateTop: {
                    enabled: true,
                    columns: [
                        { title: "US", iconToken: "US", buckets: ["US_STYLES"] },
                        { title: "International", iconToken: "WORLD", buckets: ["INTERNATIONAL_OTHER"] },
                    ],
                },
            },

            rollups: [
                // --- US ---
                {
                    match: {
                        baseIn: [
                            // Explicit American / US-associated classics
                            "CALIFORNIA_COMMON",
                            "CREAM_ALE",
                            "CREAM_ALE_IMPERIAL_/_DOUBLE",

                            // American lagers (style labels, not brands)
                            "LAGER_AMERICAN",
                            "LAGER_AMERICAN_LIGHT",
                            "LAGER_AMERICAN_PRE-PROHIBITION",
                            "LAGER_AMERICAN_AMBER_/_RED",

                            // US-coded hop culture
                            "IPA_AMERICAN",
                            "PALE_ALE_AMERICAN",

                            // New England / Hazy family (commonly US-associated)
                            "IPA_NEW_ENGLAND_/_HAZY",
                            "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                            "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                            "PALE_ALE_NEW_ENGLAND_/_HAZY",

                            // Other explicitly American labels
                            "BARLEYWINE_AMERICAN",
                            "BROWN_ALE_AMERICAN",
                            "PORTER_AMERICAN",
                            "STOUT_AMERICAN",
                            "RED_ALE_AMERICAN_AMBER_/_RED",
                            "STRONG_ALE_AMERICAN",

                            // Modern categories strongly tied to US market culture
                            "HARD_SELTZER",
                        ],
                    },
                    into: "US_STYLES",
                    keepZero: true,
                },

                // --- INTERNATIONAL / OTHER ---
                // Everything else from your provided enum list (including Belgium/Germany/UK/Czech/etc. + “OTHER” + modern hybrids)
                {
                    match: {
                        baseIn: [
                            "ALTBIER_STICKE",
                            "ALTBIER_TRADITIONAL",
                            "AUSTRALIAN_SPARKLING_ALE",
                            "BARLEYWINE_ENGLISH",
                            "BARLEYWINE_OTHER",
                            "BELGIAN_BLONDE",
                            "BELGIAN_DUBBEL",
                            "BELGIAN_ENKEL_/_PATERSBIER",
                            "BELGIAN_QUADRUPEL",
                            "BELGIAN_STRONG_DARK_ALE",
                            "BELGIAN_STRONG_GOLDEN_ALE",
                            "BELGIAN_TRIPEL",
                            "BIERE_DE_CHAMPAGNE_/_BIERE_BRUT",
                            "BITTER_BEST",
                            "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)",
                            "BITTER_SESSION_/_ORDINARY",
                            "BLACK_&_TAN",
                            "BLONDE_/_GOLDEN_ALE_AMERICAN", // (kept international here; US filter is focused on US-coded, but you can move it if you want)
                            "BLONDE_/_GOLDEN_ALE_ENGLISH",
                            "BLONDE_/_GOLDEN_ALE_OTHER",
                            "BOCK_DOPPELBOCK",
                            "BOCK_EISBOCK",
                            "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK",
                            "BOCK_SINGLE_/_TRADITIONAL",
                            "BOCK_WEIZENBOCK",
                            "BOCK_WEIZENDOPPELBOCK",
                            "BRETT_BEER",
                            "BROWN_ALE_BELGIAN",
                            "BROWN_ALE_ENGLISH",
                            "BROWN_ALE_IMPERIAL_/_DOUBLE",
                            "BROWN_ALE_OTHER",
                            "CHILLI_/_CHILE_BEER",
                            "CIDER_APPLEWINE",
                            "CIDER_BASQUE",
                            "CIDER_DRY",
                            "CIDER_GRAFF",
                            "CIDER_HERBED_/_SPICED_/_HOPPED",
                            "CIDER_ICE",
                            "CIDER_OTHER_FRUIT",
                            "CIDER_PERRY_/_POIRE",
                            "CIDER_ROSE",
                            "CIDER_SWEET",
                            "CIDER_TRADITIONAL_/_APFELWEIN",
                            "CORN_BEER_/_CHICHA_DE_JORA",
                            "FREEZE-DISTILLED_BEER",
                            "FARMHOUSE_ALE_BIERE_DE_COUPAGE",
                            "FARMHOUSE_ALE_BIERE_DE_GARDE",
                            "FARMHOUSE_ALE_BIERE_DE_MARS",
                            "FARMHOUSE_ALE_BRETT",
                            "FARMHOUSE_ALE_GRISETTE",
                            "FARMHOUSE_ALE_KORNØL",
                            "FARMHOUSE_ALE_OTHER",
                            "FARMHOUSE_ALE_SAHTI",
                            "FARMHOUSE_ALE_SAISON",
                            "FESTBIER",
                            "FLAVORED_MALT_BEVERAGE",
                            "FRUIT_BEER",
                            "BLOND_FRUITED",
                            "FRUIT_DOMINANT",
                            "GLUTEN-FREE",
                            "GOLDEN_ALE_UKRAINIAN",
                            "GRAPE_ALE_ITALIAN",
                            "GRAPE_ALE_OTHER",
                            "GRODZISKIE_/_GRATZER",
                            "HAPPOSHU",
                            "HARD_GINGER_BEER",
                            "HARD_KOMBUCHA_/_JUN",
                            "HISTORICAL_BEER_ADAMBIER",
                            "HISTORICAL_BEER_BERLINER_BRAUNBIER",
                            "HISTORICAL_BEER_BROYHAN",
                            "HISTORICAL_BEER_BURTON_ALE",
                            "HISTORICAL_BEER_DAMPFBIER",
                            "HISTORICAL_BEER_GRUIT_/_ANCIENT_HERBED_ALE",
                            "HISTORICAL_BEER_KENTUCKY_COMMON",
                            "HISTORICAL_BEER_KOTTBUSSER",
                            "HISTORICAL_BEER_KUIT_/_KUYT_/_KOYT",
                            "HISTORICAL_BEER_LICHTENHAINER",
                            "HISTORICAL_BEER_MUMME",
                            "HISTORICAL_BEER_OTHER",
                            "HISTORICAL_BEER_STEINBIER",
                            "HISTORICAL_BEER_ZOIGL",
                            "IPA_BELGIAN",
                            "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                            "IPA_BRETT",
                            "IPA_BROWN",
                            "IPA_BRUT",
                            "IPA_COLD",
                            "IPA_ENGLISH",
                            "IPA_FARMHOUSE",
                            "IPA_FRUITED",
                            "IPA_IMPERIAL_/_DOUBLE",
                            "IPA_IMPERIAL_/_DOUBLE_BLACK",
                            "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                            "IPA_MILKSHAKE",
                            "IPA_NEW_ZEALAND",
                            "IPA_OTHER",
                            "IPA_QUADRUPLE",
                            "IPA_RED",
                            "IPA_RYE",
                            "IPA_SESSION",
                            "IPA_SOUR",
                            "IPA_TRIPLE",
                            "IPA_WHITE_/_WHEAT",
                            "KELLERBIER_/_ZWICKELBIER",
                            "KOJI_/_GINJO_BEER",
                            "KOLSCH",
                            "KVASS",
                            "LAGER_AMBER_/_RED",
                            "LAGER_DARK",
                            "LAGER_DORTMUNDER_/_EXPORT",
                            "LAGER_HELLES",
                            "LAGER_IPL_(INDIA_PALE_LAGER)",
                            "LAGER_JAPANESE_RICE",
                            "LAGER_LEICHTBIER",
                            "LAGER_MEXICAN",
                            "LAGER_MUNICH_DUNKEL",
                            "LAGER_OTHER",
                            "LAGER_PALE",
                            "LAGER_POLOTMAVE_(CZECH_AMBER)",
                            "LAGER_ROTBIER",
                            "LAGER_SMOKED",
                            "LAGER_STRONG",
                            "LAGER_SVETLE_(CZECH_PALE)",
                            "LAGER_TMAVE_(CZECH_DARK)",
                            "LAGER_VIENNA",
                            "LAGER_WINTER",
                            "LAMBIC_FARO",
                            "LAMBIC_FRAMBOISE",
                            "LAMBIC_FRUIT",
                            "LAMBIC_GUEUZE",
                            "LAMBIC_KRIEK",
                            "LAMBIC_OTHER",
                            "LAMBIC_TRADITIONAL",
                            "MAKGEOLLI",
                            "MALT_BEER",
                            "MALT_LIQUOR",
                            "MARZEN",
                            "MEAD_ACERGLYN_/_MAPLE_WINE",
                            "MEAD_BOCHET",
                            "MEAD_BRAGGOT",
                            "MEAD_CYSER",
                            "MEAD_MELOMEL",
                            "MEAD_METHEGLIN",
                            "MEAD_OTHER",
                            "MEAD_PYMENT",
                            "MEAD_SESSION_/_SHORT",
                            "MEAD_TRADITIONAL",
                            "MILD_DARK",
                            "MILD_LIGHT",
                            "MILD_OTHER",
                            "NON-ALCOHOLIC_BEER_IPA",
                            "NON-ALCOHOLIC_BEER_LAGER",
                            "NON-ALCOHOLIC_BEER_OTHER",
                            "NON-ALCOHOLIC_BEER_PALE_ALE",
                            "NON-ALCOHOLIC_BEER_PORTER_/_STOUT",
                            "NON-ALCOHOLIC_BEER_SHANDY_/_RADLER",
                            "NON-ALCOHOLIC_BEER_SOUR",
                            "NON-ALCOHOLIC_BEER_WHEAT_BEER",
                            "NON-ALCOHOLIC_CIDER_/_PERRY",
                            "NON-ALCOHOLIC_MEAD",
                            "OLD_/_STOCK_ALE",
                            "PALE_ALE_AUSTRALIAN",
                            "PALE_ALE_BELGIAN",
                            "PALE_ALE_ENGLISH",
                            "PALE_ALE_FRUITED",
                            "PALE_ALE_MILKSHAKE",
                            "PALE_ALE_NEW_ZEALAND",
                            "PALE_ALE_OTHER",
                            "PALE_ALE_XPA_(EXTRA_PALE)",
                            "PILSNER_CZECH_/_BOHEMIAN",
                            "PILSNER_GERMAN",
                            "PILSNER_IMPERIAL_/_DOUBLE",
                            "PILSNER_ITALIAN",
                            "PILSNER_NEW_ZEALAND",
                            "PILSNER_OTHER",
                            "PORTER_BALTIC",
                            "PORTER_COFFEE",
                            "PORTER_IMPERIAL_/_DOUBLE",
                            "PORTER_IMPERIAL_/_DOUBLE_BALTIC",
                            "PORTER_IMPERIAL_/_DOUBLE_COFFEE",
                            "PORTER_OTHER",
                            "PORTER_SMOKED",
                            "PUMPKIN_/_YAM_BEER",
                            "RAUCHBIER",
                            "RED_ALE_IMPERIAL_/_DOUBLE",
                            "RED_ALE_IRISH",
                            "RED_ALE_OTHER",
                            "ROGGENBIER",
                            "ROOT_BEER",
                            "RYE_BEER",
                            "RYE_WINE",
                            "SCHWARZBIER",
                            "SCOTCH_ALE_/_WEE_HEAVY",
                            "SCOTTISH_ALE",
                            "SCOTTISH_EXPORT_ALE",
                            "SHANDY_/_RADLER",
                            "SMOKED_BEER",
                            "SORGHUM_/_MILLET_BEER",
                            "SOUR_BERLINER_WEISSE",
                            "SOUR_CATHARINA",
                            "SOUR_FLANDERS_OUD_BRUIN",
                            "SOUR_FLANDERS_RED_ALE",
                            "SOUR_FRUITED",
                            "SOUR_FRUITED_BERLINER_WEISSE",
                            "SOUR_FRUITED_GOSE",
                            "SOUR_OTHER",
                            "SOUR_OTHER_GOSE",
                            "SOUR_SMOOTHIE_/_PASTRY",
                            "SOUR_TOMATO_/_VEGETABLE_GOSE",
                            "SOUR_TRADITIONAL_GOSE",
                            "SPECIALTY_GRAIN",
                            "SPICED_/_HERBED_BEER",
                            "STOUT_COFFEE",
                            "STOUT_ENGLISH",
                            "STOUT_FOREIGN_/_EXPORT",
                            "STOUT_IMPERIAL_/_DOUBLE",
                            "STOUT_IMPERIAL_/_DOUBLE_COFFEE",
                            "STOUT_IMPERIAL_/_DOUBLE_MILK",
                            "STOUT_IMPERIAL_/_DOUBLE_OATMEAL",
                            "STOUT_IMPERIAL_/_DOUBLE_PASTRY",
                            "STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN",
                            "STOUT_IRISH_DRY",
                            "STOUT_MILK_/_SWEET",
                            "STOUT_OATMEAL",
                            "STOUT_OTHER",
                            "STOUT_OYSTER",
                            "STOUT_PASTRY",
                            "STOUT_RUSSIAN_IMPERIAL",
                            "STOUT_WHITE_/_GOLDEN",
                            "STRONG_ALE_ENGLISH",
                            "STRONG_ALE_OTHER",
                            "TABLE_BEER",
                            "TRADITIONAL_ALE",
                            "WHEAT_BEER_AMERICAN_PALE_WHEAT",
                            "WHEAT_BEER_DUNKELWEIZEN",
                            "WHEAT_BEER_FRUITED",
                            "WHEAT_BEER_HEFEWEIZEN",
                            "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                            "WHEAT_BEER_HOPFENWEISSE",
                            "WHEAT_BEER_KRISTALLWEIZEN",
                            "WHEAT_BEER_OTHER",
                            "WHEAT_BEER_WHEAT_WINE",
                            "WHEAT_BEER_WITBIER_/_BLANCHE",
                            "WILD_ALE_AMERICAN",
                            "WILD_ALE_OTHER",
                            "WINTER_ALE",
                            "WINTER_WARMER",
                            "BEERS_OTHER",
                            "BEERS_SPECIAL",
                            "SPIRIT_FLAVOURED_BEERS",
                            "BEER_SODA_MIX",
                        ],
                    },
                    into: "INTERNATIONAL_OTHER",
                    keepZero: true,
                },
            ],

            sortPriority: ["US_STYLES", "INTERNATIONAL_OTHER"],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van deze </>,
                line2: <> <strong> bieren </strong> <br/> op vlak van <strong> cultuur </strong>  is</>
            }
        }
,

        {
            id: 2091,
            name: <> <strong>Gluten-free </strong>!<br/> Je gluten-vrije klanten lusten ook wat lekkers. </>,
            section: "beers",
            groupBy: "subcategory",

            // keep it strictly to beers
            within:  { category: "BEERS" },
            filters: { category: "BEERS" },

            predicates: [],

            // two mutually-exclusive buckets
            partitionBy: [
                { label: "Gluten-free",          predicates: [{ field: "is_gluten_free", op: "eq", value: 1 }] },
                { label: "Normal",  predicates: [{ field: "is_gluten_free", op: "eq", value: 0 }] }
            ],



            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> alcoholvrij vs normaal</strong> <br/> van jouw</>,
                line2: <> <strong> bieren </strong>  op vlak van  is</>
            }
        }
        ,
{
            id: 2765,
            name: (
                <>
                    <strong>Beer cultures</strong>!<br/>
                    Bouw je identiteit door bepaalde culturen te kiezen.
                </>
            ),
            section: "beers",
            groupBy: "subsubcategory",
            within: {},
            predicates: [],
            ui: {
                columns: 3,
                aggregateTop: {
                    enabled: true,
                    deterministic: true,
                    unassigned: "append",
                    columns: [
                        {
                            title: "BELGIAN",
                            iconToken: "BELGIUM",
                            buckets: [
                                "Blond & enkel/pater",
                                "Strong blonds",
                                "Brown & dark",
                                "Flanders red or oud bruin",
                                "Gueuzes",
                                "Non-belgian tradition",

                                // keep this separate (only if you still want it to show as its own row)
                                "PALE_ALE_BELGIAN",
                            ],
                        },
                        {
                            title: "ITALIAN",
                            iconToken: "ITALY",
                            buckets: [
                                "ITALIAN_BEERS"
                            ],
                        },
                        {
                            title: "GREEK",
                            iconToken: "GREECE",
                            buckets: [
                                "GREEK_BEERS"
                            ],
                        },
                    ],
                },
            },


                rollups: [
                    // 1) Blond & enkel/pater
                    {
                        match: {baseIn: ["BELGIAN_BLONDE", "BELGIAN_ENKEL_/_PATERSBIER"]},
                        into: "Blond & enkel/pater",
                        keepZero: true,
                    },

                    // 2) Strong blonds
                    {
                        match: {baseIn: ["BELGIAN_TRIPEL", "BELGIAN_STRONG_GOLDEN_ALE"]},
                        into: "Strong blonds",
                        keepZero: true,
                    },

                    // 3) Brown & dark
                    {
                        match: {
                            baseIn: [
                                "BELGIAN_DUBBEL",
                                "BELGIAN_QUADRUPEL",
                                "BELGIAN_STRONG_DARK_ALE",
                                "BROWN_ALE_BELGIAN",
                            ],
                        },
                        into: "Brown & dark",
                        keepZero: true,
                    },

                    // 4) Flanders bucket (OUD_BRUIN stays here)
                    {
                        match: {baseIn: ["SOUR_FLANDERS_OUD_BRUIN", "SOUR_FLANDERS_RED_ALE"]},
                        into: "Flanders red/oud bruin",
                        keepZero: true,
                    },

                    // 5) Gueuzes bucket (all lambic variants)
                    {
                        match: {
                            baseIn: [
                                "LAMBIC_FARO",
                                "LAMBIC_FRAMBOISE",
                                "LAMBIC_FRUIT",
                                "LAMBIC_GUEUZE",
                                "LAMBIC_KRIEK",
                                "LAMBIC_OTHER",
                                "LAMBIC_TRADITIONAL",
                            ],
                        },
                        into: "Gueuzes",
                        keepZero: true,
                    },

                    // 6) Rest bucket
                    {
                        match: {
                            baseNotIn: [
                                // --- sources that belong to explicit Belgian buckets ---
                                "BELGIAN_BLONDE",
                                "BELGIAN_ENKEL_/_PATERSBIER",
                                "BELGIAN_TRIPEL",
                                "BELGIAN_STRONG_GOLDEN_ALE",
                                "BELGIAN_DUBBEL",
                                "BELGIAN_QUADRUPEL",
                                "BELGIAN_STRONG_DARK_ALE",
                                "BROWN_ALE_BELGIAN",

                                // keep separate (if you want it separate)
                                "PALE_ALE_BELGIAN",

                                // --- sources for Flanders/Gueuzes ---
                                "SOUR_FLANDERS_OUD_BRUIN",
                                "SOUR_FLANDERS_RED_ALE",
                                "LAMBIC_FARO",
                                "LAMBIC_FRAMBOISE",
                                "LAMBIC_FRUIT",
                                "LAMBIC_GUEUZE",
                                "LAMBIC_KRIEK",
                                "LAMBIC_OTHER",
                                "LAMBIC_TRADITIONAL",

                                // --- rollup OUTPUT labels (so rest doesn't swallow them) ---
                                "Blond & enkel/pater",
                                "Strong blonds",
                                "Brown & dark",
                                "Flanders red or oud bruin",
                                "Gueuzes",
                            ],
                        },
                        into: "ITALIAN_BEERS",
                        keepZero: true,
                    },
                ],


                info: {
                    image: presetImg("Budgetbewust.png"),
                    line1: <>De verdeling van <strong> smaken </strong> van je <br/>  </>,
                    line2: <> <strong> alcoholische bieren </strong> is</>
                }

        }

 */


