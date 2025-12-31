import { presetImg } from './utils/presetImages';

export const PRESET_FILTERS_BEERS = [


    {
        id: 2001,
        name: <> <strong>De werkemens, de BOB & gezonde </strong>!<br/> De werkmens wil helder blijven, de BOB moet nog rijden en de gezondheidsbewuste gast vermijdt alcohol. </>,
        section: "beers",
        groupBy: "category",

        // keep it strictly to beers
        within:  { category: "BEERS" },
        filters: { category: "BEERS" },

        predicates: [],

        // two mutually-exclusive buckets
        partitionBy: [
            { label: "Zero",          predicates: [{ field: "is_zero", op: "eq", value: 1 }] },
            { label: "With alcohol",  predicates: [{ field: "is_zero", op: "eq", value: 0 }] }
        ],

        // always render both, even if one side is 0
        forceShow: ["BEERS · Zero", "BEERS · With alcohol"],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: <>De verdeling <strong> alcoholvrij vs normaal</strong> <br/> van jouw</>,
            line2: <> <strong> bieren </strong>  op vlak van  is</>
        }
    }
    ,
    {
        id: 2002,
        name: <> <strong>Jan met de pet</strong>!<br/> Mensen drinken alcohol voor ontspanning, gezelligheid en om het moment te vieren. </>,
        section: "beers",
        groupBy: "subcategory",
        within: {category: "BEERS" },
        predicates: [{ field: "is_zero", op: "eq", value: 0 }],
        includeEmpty: false,
        forceShow: ["LAGERS","NORMAL_BLOND_AMBER","BLOND_BITTERS","DARK_BROWN_MALT_SWEETNESS","DARK_BROWN_COFFEE_ROAST_BITTER","FRUIT_BEERS","WHEAT_BEERS","SOURS_SAISON_LAMBIC_GUEUZE","RADLERS","CIDERS","SPIRIT_FLAVOURED_BEERS"],
        sortPriority: [
            "LAGERS","NORMAL_BLOND_AMBER","BLOND_BITTERS","DARK_BROWN_MALT_SWEETNESS","DARK_BROWN_COFFEE_ROAST_BITTER","FRUIT_BEERS","WHEAT_BEERS","SOURS_SAISON_LAMBIC_GUEUZE","RADLERS","CIDERS","SPIRIT_FLAVOURED_BEERS"
        ],
        info: {
            image: presetImg("Budgetbewust.png"),
            line1: <>De verdeling van <strong> smaken </strong> van je <br/>  </>,
            line2: <> <strong> alcoholische bieren </strong> is</>
        }
    },


    {
        id: 2003,
        name: "Alcohol-free Beers",
        section: "beers",
        groupBy: "subcategory",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 1 }],
        includeEmpty: false,
        forceShow: ["LAGERS","NORMAL_BLOND_AMBER","BLOND_BITTERS","DARK_BROWN_MALT_SWEETNESS","DARK_BROWN_COFFEE_ROAST_BITTER","FRUIT_BEERS","WHEAT_BEERS","SOURS_SAISON_LAMBIC_GUEUZE","RADLERS","CIDERS","SPIRIT_FLAVOURED_BEERS"],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: <>De verdeling van <strong> smaken </strong> van je <br/>  </>,
            line2: <> <strong> non-alcoholische bieren </strong> is</>
        }
    },


    {
        id: 2012,
        name: <> <strong>Touristen & Traditionalisten</strong>!<br/> Trappisten- en abdijbieren zijn voor Belgen een tastbaar stuk erfgoed en identiteit, en voor toeristen een authentieke en unieke manier om België te beleven. </>,
        section: "beers",
        groupBy: "subcategory",

        // only beers
        // only beers, and explicitly exclude LAGERS by whitelisting allowed subs
        within: {
            category: "BEERS",
            subcategory_in: [
                "NORMAL_BLOND_AMBER",
                "BLOND_BITTERS",
                "DARK_BROWN_MALT_SWEETNESS",
                "FRUIT_BEERS",
                "SOURS_SAISON_LAMBIC_GUEUZE"
            ]
        },

        // alcoholic only
        predicates: [{field: "is_zero", op: "eq", value: 0}],

        // split by heritage
        partitionBy: [
            {label: "Normal/Abbey", predicates: [{field: "heritage", op: "in", value: ["NORMAL", "ABBEY"]}]},
            {label: "Trappist", predicates: [{field: "heritage", op: "eq", value: "TRAPPIST"}]}
        ],

        // ensure these composites render even when count = 0
        forceShow: [
            "NORMAL_BLOND_AMBER · Normal/Abbey", "NORMAL_BLOND_AMBER · Trappist",
            "BLOND_BITTERS · Normal/Abbey", "BLOND_BITTERS · Trappist",
            "DARK_BROWN_MALT_SWEETNESS · Normal/Abbey", "DARK_BROWN_MALT_SWEETNESS · Trappist",
            "FRUIT_BEERS · Normal/Abbey", "FRUIT_BEERS · Trappist",
            "SOURS_SAISON_LAMBIC_GUEUZE · Normal/Abbey", "SOURS_SAISON_LAMBIC_GUEUZE · Trappist"
        ],

        // alternating Normal/Abbey then Trappist per subcategory
        sortPriority: [
            "NORMAL_BLOND_AMBER · Normal/Abbey", "NORMAL_BLOND_AMBER · Trappist",
            "BLOND_BITTERS · Normal/Abbey", "BLOND_BITTERS · Trappist",
            "DARK_BROWN_MALT_SWEETNESS · Normal/Abbey", "DARK_BROWN_MALT_SWEETNESS · Trappist",
            "FRUIT_BEERS · Normal/Abbey", "FRUIT_BEERS · Trappist",
            "SOURS_SAISON_LAMBIC_GUEUZE · Normal/Abbey", "SOURS_SAISON_LAMBIC_GUEUZE · Trappist"
        ],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: <>De verdeling van deze </>,
            line2: <> <strong> bieren </strong> <br/> op vlak van <strong> herkomst </strong>  is</>
        }

    },





    {
        id: 2011,
        name: (
            <>
                <strong>Beer traditions</strong>!<br />
                Belgische klassiekers apart + Gueuzes + rest gegroepeerd.
            </>
        ),
        section: "beers",
        groupBy: "subsubcategory",
        within: {},
        predicates: [],
        rollups: [
            // 1) Blond & enkel/pater
            {
                match: { baseIn: ["BELGIAN_BLONDE", "BELGIAN_ENKEL_/_PATERSBIER"] },
                into: "Blond & enkel/pater",
                keepZero: true,
            },

            // 2) Strong blonds
            {
                match: { baseIn: ["BELGIAN_TRIPEL", "BELGIAN_STRONG_GOLDEN_ALE"] },
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
                match: { baseIn: ["SOUR_FLANDERS_OUD_BRUIN", "SOUR_FLANDERS_RED_ALE"] },
                into: "Flanders red or oud bruin",
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
                into: "Non-belgian tradition",
                keepZero: true,
            },
        ],


        // Optional but recommended so the order is deterministic in SummaryGrid
        forceShow: [
            // rolled-up Belgian buckets
            "Blond & enkel/pater",
            "Strong blonds",
            "Brown & dark",
            "Flanders red or oud bruin",
            "Gueuzes",
            "Non-belgian tradition",

            // keep this separate (only if you still want it to show as its own row)
            "PALE_ALE_BELGIAN",
        ],

        sortPriority: [
            "Blond & enkel/pater",
            "Strong blonds",
            "Brown & dark",
            "Flanders red or oud bruin",
            "Gueuzes",
            "Non-belgian tradition",

            // keep this separate (only if you still want it to show as its own row)
            "PALE_ALE_BELGIAN",
        ],

        info: {
            image: presetImg("Budgetbewust.png"),
            line1: <>De verdeling van <strong> Belgisch vs andere </strong> <br/> bierstijlen van deze </>,
            line2: <> <strong> bieren </strong> is</>
        }
    },
    {
        id: 2014,
        name: <>Zijn jouw  <strong> 'trendy' </strong>klanten tevreden?<br/> Sommige mensen proeven graag eens iets nieuws wat ze nog niet kennen maar wel 'trending' is. Jij hebt X% zo'n klanten, zorg dus je hen tevreden houd met een trendy aanbod :)</>,

        section: "beers",
        groupBy: "subsubcategory",
        within: {},
        predicates: [],

        rollups: [
            // A) IPA - trendy (roll up all IPA subsubcategories)
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
                    ],
                },
                into: "IPA - trendy",
                keepZero: true,
            },

            // B) Smoothie sour - trendy
            {
                match: { baseIn: ["SOUR_SMOOTHIE_/_PASTRY"] },
                into: "Smoothie sour - trendy",
                keepZero: true,
            },

            // C) Fruited & Shandy/Radler – trendy
            // (you said: combine FRUIT_BEER + Shandy/Radler)
            {
                match: { baseIn: ["FRUIT_BEER", "RADLERS"] },
                into: "Fruited & Shandy/Radler – trendy",
                keepZero: true,
            },

            // D) Other flavours – non-trendy (everything else)
            {
                match: {
                    baseNotIn: [
                        // IPA sources
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

                        // Smoothie sour
                        "SOUR_SMOOTHIE_/_PASTRY",

                        // Fruited & Shandy/Radler
                        "FRUIT_BEER",
                        "RADLERS",

                        // rollup OUTPUT labels (so rest doesn't swallow them)
                        "IPA - trendy",
                        "Smoothie sour - trendy",
                        "Fruited & Shandy/Radler – trendy",
                    ],
                },
                into: "Other flavours – non-trendy",
                keepZero: true,
            },
        ],

        // show the 4 final buckets
        forceShow: [
            "IPA - trendy",
            "Smoothie sour - trendy",
            "Fruited & Shandy/Radler – trendy",
            "Other flavours – non-trendy",
        ],

        // nice fixed order in the SummaryGrid
        sortPriority: [
            "IPA - trendy",
            "Smoothie sour",
            "Fruited & Shandy/Radler – trendy",
            "Other flavours – non-trendy",
        ],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: <>De verdeling tussen <strong> normaal en trendy</strong>, <br/> voor jouw </>,
            line2: <> <strong> alcoholische bieren </strong> is <strong>  </strong> </>
        },
    }
    ,
    {
        id: 2015,
        name: (
            <>
                <strong>Seasonal check</strong>!<br />
                Winter ales + dark/brown apart, rest = other seasons.
            </>
        ),
        section: "beers",
        groupBy: "subsubcategory",
        within: {},
        predicates: [],

        rollups: [
            // A) Winter ale - winter


            // B) Dark & brown – winter
            {
                match: {
                    baseIn: [
                        // explicit dark / brown families
                        "WINTER_ALE",
                        "WINTER_WARMER",
                        "LAGER_WINTER",
                        "DARK_ALE",
                        "MILD_DARK",
                        "LAGER_DARK",
                        "LAGER_MUNICH_DUNKEL",
                        "LAGER_TMAVE_(CZECH_DARK)",
                        "SCHWARZBIER",

                        // brown ales
                        "BROWN_ALE_AMERICAN",
                        "BROWN_ALE_BELGIAN",
                        "BROWN_ALE_ENGLISH",
                        "BROWN_ALE_IMPERIAL_/_DOUBLE",
                        "BROWN_ALE_OTHER",

                        // porters
                        "PORTER_AMERICAN",
                        "PORTER_BALTIC",
                        "PORTER_COFFEE",
                        "PORTER_ENGLISH",
                        "PORTER_IMPERIAL_/_DOUBLE",
                        "PORTER_IMPERIAL_/_DOUBLE_BALTIC",
                        "PORTER_IMPERIAL_/_DOUBLE_COFFEE",
                        "PORTER_OTHER",
                        "PORTER_SMOKED",

                        // stouts
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

                        // scotch / wee heavy
                        "SCOTCH_ALE_/_WEE_HEAVY",
                    ],
                },
                into: "Winter and X-mas beers",
                keepZero: true,
            },

            // C) Other seasons (everything else)
            {
                match: {
                    baseNotIn: [
                        // winter sources
                        "WINTER_ALE",
                        "WINTER_WARMER",
                        "LAGER_WINTER",

                        // dark & brown sources
                        "DARK_ALE",
                        "MILD_DARK",
                        "LAGER_DARK",
                        "LAGER_MUNICH_DUNKEL",
                        "LAGER_TMAVE_(CZECH_DARK)",
                        "SCHWARZBIER",

                        "BROWN_ALE_AMERICAN",
                        "BROWN_ALE_BELGIAN",
                        "BROWN_ALE_ENGLISH",
                        "BROWN_ALE_IMPERIAL_/_DOUBLE",
                        "BROWN_ALE_OTHER",

                        "PORTER_AMERICAN",
                        "PORTER_BALTIC",
                        "PORTER_COFFEE",
                        "PORTER_ENGLISH",
                        "PORTER_IMPERIAL_/_DOUBLE",
                        "PORTER_IMPERIAL_/_DOUBLE_BALTIC",
                        "PORTER_IMPERIAL_/_DOUBLE_COFFEE",
                        "PORTER_OTHER",
                        "PORTER_SMOKED",

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

                        "SCOTCH_ALE_/_WEE_HEAVY",

                        // rollup outputs (so rest doesn't swallow them)
                        "Winter ale - winter",
                        "Dark & brown – winter",
                    ],
                },
                into: "Other seasons",
                keepZero: true,
            },
        ],

        forceShow: ["Winter and X-mas beers", "Other seasons"],
        sortPriority: ["Winter and X-mas beers", "Other seasons"],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: <>De verdeling per <strong> seizoen </strong>, <br/> voor </>,
            line2: <> <strong> alcoholische bieren </strong> is <strong>  </strong> </>
        },
    }





    ]

;

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
 */