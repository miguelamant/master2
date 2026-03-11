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
            name: <> <strong>Jan met de pet - lvl 3</strong>!<br/> Mensen drinken alcohol voor ontspanning, gezelligheid en om het moment te vieren. </>,
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





// Pale Ale & IPA — 3×3 grid: Hop Expression (Little/Lots) × ABV (Low/Med/High)
//
// Assumptions based on your config pattern:
// - Column split = hop “expression”: Pale Ale-ish (little hop) vs IPA-ish (lots of hop) using baseIn lists.
// - Row split = ABV band: low <6, medium 6–<8, high >=8.
// - Buckets encode BOTH dims: column is HOP vs HOPHOP; row is _LOW/_MEDIUM/_STRONG (your UI labels %/%%/%%%).














        {
            id: 2995,
            name: <>Pale ales – IPAs</>,
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
                showItemsInline: false,
                aggregateTop: {
                    enabled: true,
                    deterministic: true,
                    columns: [
                        {
                            title: "Pale ales",
                            iconToken: "PALE_ALE",
                            buckets: [
                                "PALE_ALE_BELGIAN_EU",
                                "PALE_ALE_AMERICAN_CLASSIC",
                                "PALE_ALE_HAZY_NE",
                                "PALE_ALE_SPECIALS",
                                "PALE_ALE_OTHER",
                            ],
                        },
                        {
                            title: "IPAs",
                            iconToken: "BLOND_BITTERS",
                            buckets: [
                                "IPA_CLASSIC",
                                "IPA_HAZY_NE",
                                "IPA_STRONG",
                                "IPA_SPECIALS",
                                "IPA_OTHER",
                            ],
                        },
                    ],
                },
            },

            rollups: [
                // =========================
                // PALE ALES (max 5 buckets)
                // =========================

                // 1) Belgian/European “classic-ish” pale ales (more common in BE cafés)
                {
                    match: { baseIn: ["PALE_ALE_BELGIAN", "PALE_ALE_ENGLISH"] },
                    into: "PALE_ALE_BELGIAN_EU",
                    keepZero: true,
                },

                // 2) American classic pale ale
                {
                    match: { baseIn: ["PALE_ALE_AMERICAN"] },
                    into: "PALE_ALE_AMERICAN_CLASSIC",
                    keepZero: true,
                },

                // 3) Hazy / NE pale ale
                {
                    match: { baseIn: ["PALE_ALE_NEW_ENGLAND_/_HAZY"] },
                    into: "PALE_ALE_HAZY_NE",
                    keepZero: true,
                },

                // 4) Pale ale specials (still plausible in BE but not “default”)
                {
                    match: { baseIn: ["PALE_ALE_XPA_(EXTRA_PALE)", "PALE_ALE_FRUITED", "PALE_ALE_MILKSHAKE"] },
                    into: "PALE_ALE_SPECIALS",
                    keepZero: true,
                },

                // 5) Pale ale other (everything less common for BE cafés)
                {
                    match: { baseIn: ["PALE_ALE_AUSTRALIAN", "PALE_ALE_NEW_ZEALAND", "PALE_ALE_OTHER", "RYE_BEER", "RED_ALE_IMPERIAL_/_DOUBLE"] },
                    into: "PALE_ALE_OTHER",
                    keepZero: true,
                },

                // Non-alc pale ale -> roll into the most “safe” bucket (EU classic)
                {
                    match: { baseIn: ["NON-ALCOHOLIC_BEER_PALE_ALE"] },
                    into: "PALE_ALE_BELGIAN_EU",
                    keepZero: true,
                },

                // =========================
                // IPAs (max 5 buckets)
                // =========================

                // 1) IPA classic (session + “standard” country IPAs that are common in BE/AMS menus)
                {
                    match: {
                        baseIn: [
                            "IPA_SESSION",
                            "IPA_AMERICAN",
                            "IPA_ENGLISH",
                            "IPA_BELGIAN",
                            "IPA_NEW_ZEALAND",
                        ],
                    },
                    into: "IPA_CLASSIC",
                    keepZero: true,
                },

                // 2) Hazy / NE IPA family
                {
                    match: {
                        baseIn: [
                            "IPA_NEW_ENGLAND_/_HAZY",
                            "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                            "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                        ],
                    },
                    into: "IPA_HAZY_NE",
                    keepZero: true,
                },

                // 3) Strong IPA (DIPA / TIPA / quad)
                {
                    match: {
                        baseIn: [
                            "IPA_IMPERIAL_/_DOUBLE",
                            "IPA_TRIPLE",
                            "IPA_QUADRUPLE",
                        ],
                    },
                    into: "IPA_STRONG",
                    keepZero: true,
                },

                // 4) IPA specials (still plausible to encounter; keep as one bucket)
                {
                    match: {
                        baseIn: [
                            "IPA_WHITE_/_WHEAT",
                            "IPA_COLD",
                            "IPA_BRUT",
                            "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                            "IPA_RED",
                        ],
                    },
                    into: "IPA_SPECIALS",
                    keepZero: true,
                },

                // 5) IPA other (less common / niche in Belgium menus -> lump here)
                {
                    match: {
                        baseIn: [
                            "IPA_FRUITED",
                            "IPA_RYE",
                            "IPA_BRETT",
                            "IPA_BROWN",
                            "IPA_FARMHOUSE",
                            "IPA_OTHER",
                            "IPA_IMPERIAL_/_DOUBLE_BLACK",
                            "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                        ],
                    },
                    into: "IPA_OTHER",
                    keepZero: true,
                },

                // Non-alc IPA -> roll into classic IPA bucket
                {
                    match: { baseIn: ["NON-ALCOHOLIC_BEER_IPA"] },
                    into: "IPA_CLASSIC",
                    keepZero: true,
                },
            ],

            sortPriority: ["PALE_ALE_AMERICAN", "IPA_AMERICAN"],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van <strong>hoppy bieren</strong> <strong></strong></>,
                line2: <> <strong></strong> </>,
            },
        }

        ,

        {
            id: 2996,
            name: <>Pale ales × IPAs — per stijl</>,
            section: "beers",
            groupBy: "subsubcategory",

            within: {
                category: "BEERS",
                subcategory_in: ["BLOND_BITTERS"],
            },

            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,

            ui: {
                columns: 3,
                showItemsInline: false,
                aggregateTop: {
                    enabled: true,
                    deterministic: true,
                    columns: [
                        {
                            title: "Classic & Belgian",
                            iconToken: "PALE_ALE",
                            buckets: ["PALE_ALE_BELGIAN_EU", "PALE_ALE_AMERICAN_CLASSIC", "IPA_CLASSIC"],
                        },
                        {
                            title: "Hazy & Strong",
                            iconToken: "BLOND_BITTERS",
                            buckets: ["PALE_ALE_HAZY_NE", "IPA_HAZY_NE", "IPA_STRONG"],
                        },
                        {
                            title: "Specials & Other",
                            iconToken: "BLOND_BITTERS",
                            buckets: ["PALE_ALE_SPECIALS", "PALE_ALE_OTHER", "IPA_SPECIALS", "IPA_OTHER"],
                        },
                    ],
                },
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    rows: [
                        {
                            title: "Pale ales",
                            iconToken: "PALE_ALE",
                            buckets: ["PALE_ALE_BELGIAN_EU", "PALE_ALE_AMERICAN_CLASSIC", "PALE_ALE_HAZY_NE", "PALE_ALE_SPECIALS", "PALE_ALE_OTHER"],
                        },
                        {
                            title: "IPAs",
                            iconToken: "BLOND_BITTERS",
                            buckets: ["IPA_CLASSIC", "IPA_HAZY_NE", "IPA_STRONG", "IPA_SPECIALS", "IPA_OTHER"],
                        },
                    ],
                },
            },

            rollups: [
                // =========================
                // PALE ALES (max 5 buckets)
                // =========================

                // 1) Belgian/European "classic-ish" pale ales (more common in BE cafés)
                {
                    match: { baseIn: ["PALE_ALE_BELGIAN", "PALE_ALE_ENGLISH"] },
                    into: "PALE_ALE_BELGIAN_EU",
                    keepZero: true,
                },

                // 2) American classic pale ale
                {
                    match: { baseIn: ["PALE_ALE_AMERICAN"] },
                    into: "PALE_ALE_AMERICAN_CLASSIC",
                    keepZero: true,
                },

                // 3) Hazy / NE pale ale
                {
                    match: { baseIn: ["PALE_ALE_NEW_ENGLAND_/_HAZY"] },
                    into: "PALE_ALE_HAZY_NE",
                    keepZero: true,
                },

                // 4) Pale ale specials (still plausible in BE but not "default")
                {
                    match: { baseIn: ["PALE_ALE_XPA_(EXTRA_PALE)", "PALE_ALE_FRUITED", "PALE_ALE_MILKSHAKE"] },
                    into: "PALE_ALE_SPECIALS",
                    keepZero: true,
                },

                // 5) Pale ale other (everything less common for BE cafés)
                {
                    match: { baseIn: ["PALE_ALE_AUSTRALIAN", "PALE_ALE_NEW_ZEALAND", "PALE_ALE_OTHER", "RYE_BEER", "RED_ALE_IMPERIAL_/_DOUBLE"] },
                    into: "PALE_ALE_OTHER",
                    keepZero: true,
                },

                // Non-alc pale ale -> roll into the most "safe" bucket (EU classic)
                {
                    match: { baseIn: ["NON-ALCOHOLIC_BEER_PALE_ALE"] },
                    into: "PALE_ALE_BELGIAN_EU",
                    keepZero: true,
                },

                // =========================
                // IPAs (max 5 buckets)
                // =========================

                // 1) IPA classic (session + "standard" country IPAs that are common in BE/AMS menus)
                {
                    match: {
                        baseIn: [
                            "IPA_SESSION",
                            "IPA_AMERICAN",
                            "IPA_ENGLISH",
                            "IPA_BELGIAN",
                            "IPA_NEW_ZEALAND",
                        ],
                    },
                    into: "IPA_CLASSIC",
                    keepZero: true,
                },

                // 2) Hazy / NE IPA family
                {
                    match: {
                        baseIn: [
                            "IPA_NEW_ENGLAND_/_HAZY",
                            "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY",
                            "IPA_TRIPLE_NEW_ENGLAND_/_HAZY",
                        ],
                    },
                    into: "IPA_HAZY_NE",
                    keepZero: true,
                },

                // 3) Strong IPA (DIPA / TIPA / quad)
                {
                    match: {
                        baseIn: [
                            "IPA_IMPERIAL_/_DOUBLE",
                            "IPA_TRIPLE",
                            "IPA_QUADRUPLE",
                        ],
                    },
                    into: "IPA_STRONG",
                    keepZero: true,
                },

                // 4) IPA specials (still plausible to encounter; keep as one bucket)
                {
                    match: {
                        baseIn: [
                            "IPA_WHITE_/_WHEAT",
                            "IPA_COLD",
                            "IPA_BRUT",
                            "IPA_BLACK_/_CASCADIAN_DARK_ALE",
                            "IPA_RED",
                        ],
                    },
                    into: "IPA_SPECIALS",
                    keepZero: true,
                },

                // 5) IPA other (less common / niche in Belgium menus -> lump here)
                {
                    match: {
                        baseIn: [
                            "IPA_FRUITED",
                            "IPA_RYE",
                            "IPA_BRETT",
                            "IPA_BROWN",
                            "IPA_FARMHOUSE",
                            "IPA_OTHER",
                            "IPA_IMPERIAL_/_DOUBLE_BLACK",
                            "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE",
                        ],
                    },
                    into: "IPA_OTHER",
                    keepZero: true,
                },

                // Non-alc IPA -> roll into classic IPA bucket
                {
                    match: { baseIn: ["NON-ALCOHOLIC_BEER_IPA"] },
                    into: "IPA_CLASSIC",
                    keepZero: true,
                },
            ],

            sortPriority: ["PALE_ALE_AMERICAN", "IPA_AMERICAN"],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van <strong>hoppy bieren</strong> — matrix view</>,
                line2: <> <strong></strong> </>,
            },
        }

        ,

        {
            id: 2997,
            name: <>Stijlkaart — alle bierfamilies</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,

            ui: {
                columns: 3,
                showItemsInline: false,
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    rows: [
                        {
                            title: "Lagers",
                            iconToken: "LAGERS",
                            buckets: ["LAGER_PILS", "LAGER_ALE", "LAGER_ROTBIER"],
                            keepEmpty: true,
                        },
                        {
                            title: "Wheat beers",
                            iconToken: "WHEAT_BEERS",
                            buckets: ["WHEAT_WIT", "WHEAT_WEIZEN", "WHEAT_DUNKEL"],
                            keepEmpty: true,
                        },
                        {
                            title: "Normal Blond",
                            iconToken: "BLOND",
                            buckets: ["BLOND_ENKEL", "BLOND", "BLOND_STRONG"],
                            keepEmpty: true,
                        },
                        {
                            title: "Pale Ales",
                            iconToken: "PALE_ALE",
                            buckets: ["PALE_ALE_BELGIAN_EU", "PALE_ALE_AMERICAN_CLASSIC", "PALE_ALE_HAZY_NE", "PALE_ALE_SPECIALS", "PALE_ALE_OTHER"],
                        },
                        {
                            title: "IPAs",
                            iconToken: "BLOND_BITTERS",
                            buckets: ["IPA_CLASSIC", "IPA_HAZY_NE", "IPA_STRONG", "IPA_SPECIALS", "IPA_OTHER"],
                        },
                        {
                            title: "Dark · Malt & Sweet",
                            iconToken: "DUBBEL",
                            buckets: ["DARK_DUBBEL", "DARK_STRONG_QUAD", "DARK_BROWN_ALE", "DARK_BARLEYWINE", "AMBER_ALE", "DARK_OTHER"],
                        },
                        {
                            title: "Dark · Coffee & Roast",
                            iconToken: "STOUT",
                            buckets: ["ROAST_PORTER", "ROAST_STOUT", "ROAST_IMPERIAL", "ROAST_SPECIALTY"],
                        },
                        {
                            title: "Sours & Saisons",
                            iconToken: "SOURS_SAISON_LAMBIC_GUEUZE",
                            buckets: ["SOUR_LIGHT", "SOUR_DARK", "SOUR_LAMBIC", "FRUIT_LAMBIC", "SOUR_FARMHOUSE", "SOUR_OTHER"],
                        },
                        {
                            title: "Fruit beers",
                            iconToken: "FRUIT_BEERS",
                            buckets: ["FRUIT_CLASSIC", "FRUIT_LAMBIC"],
                        },
                        {
                            title: "Radlers",
                            iconToken: "RADLERS",
                            buckets: ["RADLER_ALL"],
                        },
                        {
                            title: "Ciders & Meads",
                            iconToken: "CIDERS",
                            buckets: ["CIDER_CLASSIC", "CIDER_SPECIALTY", "MEAD_ALL"],
                        },
                        {
                            title: "Flavoured & Hard",
                            iconToken: "SPIRIT_FLAVOURED_BEERS",
                            buckets: ["FLAVOURED_ALL"],
                        },
                        {
                            title: "Special beers",
                            iconToken: "BEERS_SPECIAL",
                            buckets: ["SPECIAL_ALL"],
                        },
                        {
                            title: "Other / Unclassified",
                            iconToken: "BEERS_OTHER",
                            buckets: ["BEERS_OTHER_ALL"],
                        },
                    ],
                },
                // NO aggregateTop → triggers rowsOnlyMode in SummaryGrid
            },

            rollups: [
                // ===== LAGERS =====
                // Pils: clean pale lagers, pilsners
                { match: { baseIn: ["PILSNER_CZECH_/_BOHEMIAN","PILSNER_GERMAN","PILSNER_OTHER","LAGER_SVETLE_(CZECH_PALE)","LAGER_HELLES","LAGER_DORTMUNDER_/_EXPORT","LAGER_AMERICAN_LIGHT","LAGER_MEXICAN","LAGER_AMERICAN","LAGER_LEICHTBIER","LAGER_CORE"] }, into: "LAGER_PILS", keepZero: true },
                // Ale-adjacent lagers: kellerbier, kölsch, bocks, märzen, festbier
                { match: { baseIn: ["KELLERBIER_/_ZWICKELBIER","KOLSCH","BOCK_SINGLE_/_TRADITIONAL","BOCK_HELL_/_MAIBOCK_/_LENTEBOCK","BOCK_DOPPELBOCK","BOCK_EISBOCK","MARZEN","FESTBIER","LAGER_STRONG","LAGER_SPECIALS","LAGER_WINTER","LAGER_OTHER"] }, into: "LAGER_ALE", keepZero: true },
                // Rotbier: amber, red, vienna, dark, schwarzbier
                { match: { baseIn: ["LAGER_AMBER_/_RED","LAGER_AMERICAN_AMBER_/_RED","LAGER_VIENNA","LAGER_POLOTMAVE_(CZECH_AMBER)","LAGER_ROTBIER","LAGER_DARK","LAGER_MUNICH_DUNKEL","SCHWARZBIER","LAGER_TMAVE_(CZECH_DARK)"] }, into: "LAGER_ROTBIER", keepZero: true },

                // ===== WHEAT BEERS =====
                // Wit: Belgian witbier/blanche
                { match: { baseIn: ["WHEAT_BEER_WITBIER_/_BLANCHE","NON-ALCOHOLIC_BEER_WHEAT_BEER"] }, into: "WHEAT_WIT", keepZero: true },
                // Weizen: German hefeweizen family
                { match: { baseIn: ["WHEAT_BEER_HEFEWEIZEN","WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT","WHEAT_BEER_KRISTALLWEIZEN","WHEAT_BEER_AMERICAN_PALE_WHEAT","WHEAT_CLASSIC"] }, into: "WHEAT_WEIZEN", keepZero: true },
                // Dunkelweizen: dark wheat & specials
                { match: { baseIn: ["WHEAT_BEER_DUNKELWEIZEN","BOCK_WEIZENBOCK","BOCK_WEIZENDOPPELBOCK","WHEAT_BEER_HOPFENWEISSE","ROGGENBIER","WHEAT_BEER_FRUITED","WHEAT_BEER_WHEAT_WINE","WHEAT_BEER_OTHER","WHEAT_OTHER"] }, into: "WHEAT_DUNKEL", keepZero: true },

                // ===== NORMAL BLOND / AMBER =====
                // Enkel: patersbier, speciale belge (lightest blonds)
                { match: { baseIn: ["BELGIAN_ENKEL_/_PATERSBIER","SPECIALE_BELGE"] }, into: "BLOND_ENKEL", keepZero: true },
                // Blond: Belgian blonde, golden ales
                { match: { baseIn: ["BELGIAN_BLONDE","BLONDE_/_GOLDEN_ALE_AMERICAN","BLONDE_/_GOLDEN_ALE_ENGLISH","BLONDE_/_GOLDEN_ALE_OTHER","GOLDEN_ALE_UKRAINIAN"] }, into: "BLOND", keepZero: true },
                { match: { baseIn: ["BELGIAN_STRONG_GOLDEN_ALE","BELGIAN_TRIPEL","BIERE_DE_CHAMPAGNE_/_BIERE_BRUT"] }, into: "BLOND_STRONG", keepZero: true },
                { match: { baseIn: ["RED_ALE_AMERICAN_AMBER_/_RED","RED_ALE_IRISH","RED_ALE_OTHER","BELGE_AMBREE","TRADITIONAL_ALE","WINTER_ALE","WINTER_WARMER"] }, into: "AMBER_ALE", keepZero: true },
                { match: { baseIn: ["BITTER_SESSION_/_ORDINARY","BITTER_BEST","BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)","CALIFORNIA_COMMON","AUSTRALIAN_SPARKLING_ALE","CREAM_ALE","CREAM_ALE_IMPERIAL_/_DOUBLE"] }, into: "BLOND_OTHER", keepZero: true },

                // ===== HOPPY & BITTER (Pale Ales) =====
                { match: { baseIn: ["PALE_ALE_BELGIAN","PALE_ALE_ENGLISH"] }, into: "PALE_ALE_BELGIAN_EU", keepZero: true },
                { match: { baseIn: ["PALE_ALE_AMERICAN"] }, into: "PALE_ALE_AMERICAN_CLASSIC", keepZero: true },
                { match: { baseIn: ["PALE_ALE_NEW_ENGLAND_/_HAZY"] }, into: "PALE_ALE_HAZY_NE", keepZero: true },
                { match: { baseIn: ["PALE_ALE_XPA_(EXTRA_PALE)","PALE_ALE_FRUITED","PALE_ALE_MILKSHAKE"] }, into: "PALE_ALE_SPECIALS", keepZero: true },
                { match: { baseIn: ["PALE_ALE_AUSTRALIAN","PALE_ALE_NEW_ZEALAND","PALE_ALE_OTHER","RYE_BEER","RED_ALE_IMPERIAL_/_DOUBLE"] }, into: "PALE_ALE_OTHER", keepZero: true },
                { match: { baseIn: ["NON-ALCOHOLIC_BEER_PALE_ALE"] }, into: "PALE_ALE_BELGIAN_EU", keepZero: true },

                // ===== HOPPY & BITTER (IPAs) =====
                { match: { baseIn: ["IPA_SESSION","IPA_AMERICAN","IPA_ENGLISH","IPA_BELGIAN","IPA_NEW_ZEALAND"] }, into: "IPA_CLASSIC", keepZero: true },
                { match: { baseIn: ["IPA_NEW_ENGLAND_/_HAZY","IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY","IPA_TRIPLE_NEW_ENGLAND_/_HAZY"] }, into: "IPA_HAZY_NE", keepZero: true },
                { match: { baseIn: ["IPA_IMPERIAL_/_DOUBLE","IPA_TRIPLE","IPA_QUADRUPLE"] }, into: "IPA_STRONG", keepZero: true },
                { match: { baseIn: ["IPA_WHITE_/_WHEAT","IPA_COLD","IPA_BRUT","IPA_BLACK_/_CASCADIAN_DARK_ALE","IPA_RED"] }, into: "IPA_SPECIALS", keepZero: true },
                { match: { baseIn: ["IPA_FRUITED","IPA_RYE","IPA_BRETT","IPA_BROWN","IPA_FARMHOUSE","IPA_OTHER","IPA_IMPERIAL_/_DOUBLE_BLACK","IPA_IMPERIAL_/_DOUBLE_MILKSHAKE"] }, into: "IPA_OTHER", keepZero: true },
                { match: { baseIn: ["NON-ALCOHOLIC_BEER_IPA"] }, into: "IPA_CLASSIC", keepZero: true },

                // ===== DARK · MALT & SWEET =====
                { match: { baseIn: ["BELGIAN_DUBBEL"] }, into: "DARK_DUBBEL", keepZero: true },
                { match: { baseIn: ["BELGIAN_STRONG_DARK_ALE","BELGIAN_QUADRUPEL","BARLEYWINE_AMERICAN","BARLEYWINE_ENGLISH","BARLEYWINE_OTHER","SCOTCH_ALE_/_WEE_HEAVY","SCOTTISH_ALE","SCOTTISH_EXPORT_ALE","STRONG_ALE_AMERICAN","STRONG_ALE_ENGLISH","STRONG_ALE_OTHER","OLD_/_STOCK_ALE","RYE_WINE"] }, into: "DARK_STRONG_QUAD", keepZero: true },
                { match: { baseIn: ["BROWN_ALE_AMERICAN","BROWN_ALE_BELGIAN","BROWN_ALE_ENGLISH","BROWN_ALE_IMPERIAL_/_DOUBLE","BROWN_ALE_OTHER","ALTBIER_TRADITIONAL","ALTBIER_STICKE","MILD_LIGHT","MILD_DARK","MILD_OTHER","DARK_ALE"] }, into: "DARK_BROWN_ALE", keepZero: true },
                { match: { baseIn: ["BELGIAN_STRONG_DARK_ALE_WINTER","CHRISTMAS_ALE","DARK_STRONG"] }, into: "DARK_BARLEYWINE", keepZero: true },
                { match: { baseIn: ["DARK_BEER_OTHER"] }, into: "DARK_OTHER", keepZero: true },

                // ===== DARK · COFFEE & ROAST =====
                { match: { baseIn: ["PORTER_ENGLISH","PORTER_AMERICAN","PORTER_BALTIC","PORTER_COFFEE","PORTER_SMOKED","PORTER_OTHER","PORTER_STOUT_CLASSIC"] }, into: "ROAST_PORTER", keepZero: true },
                { match: { baseIn: ["STOUT_IRISH_DRY","STOUT_ENGLISH","STOUT_FOREIGN_/_EXPORT","STOUT_OATMEAL","STOUT_MILK_/_SWEET","STOUT_COFFEE","STOUT_PASTRY","STOUT_OYSTER","STOUT_OTHER","RAUCHBIER"] }, into: "ROAST_STOUT", keepZero: true },
                { match: { baseIn: ["STOUT_RUSSIAN_IMPERIAL","STOUT_IMPERIAL_/_DOUBLE","STOUT_IMPERIAL_/_DOUBLE_COFFEE","STOUT_IMPERIAL_/_DOUBLE_MILK","STOUT_IMPERIAL_/_DOUBLE_OATMEAL","STOUT_IMPERIAL_/_DOUBLE_PASTRY","STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN","IMPERIAL_STOUTS","PASTRY_STOUTS"] }, into: "ROAST_IMPERIAL", keepZero: true },
                { match: { baseIn: ["SCHWARZBIER"] }, into: "ROAST_SPECIALTY", keepZero: true },

                // ===== SOURS & SAISONS =====
                { match: { baseIn: ["SOUR_BERLINER_WEISSE","SOUR_TRADITIONAL_GOSE","SOUR_OTHER_GOSE","SOUR_FRUITED_GOSE","SOUR_FRUITED_BERLINER_WEISSE","SOUR_CATHARINA","SOUR_TOMATO_/_VEGETABLE_GOSE","NON-ALCOHOLIC_BEER_SOUR"] }, into: "SOUR_LIGHT", keepZero: true },
                { match: { baseIn: ["SOUR_FLANDERS_OUD_BRUIN","SOUR_FLANDERS_RED_ALE","SOUR_FRUITED","SOUR_OTHER","SOUR_FAMILY","SOUR_SMOOTHIE_/_PASTRY","SMOOTHIE_SOUR","SMOOTHIE_SOUR_IG","IPA_SOUR","WILD_ALE_AMERICAN","WILD_ALE_OTHER","WILD_BRETT","BRETT_BEER"] }, into: "SOUR_DARK", keepZero: true },
                { match: { baseIn: ["LAMBIC_TRADITIONAL","LAMBIC_GUEUZE","LAMBIC_OTHER"] }, into: "SOUR_LAMBIC", keepZero: true },
                { match: { baseIn: ["FARMHOUSE_ALE_SAISON","FARMHOUSE_ALE_BIERE_DE_GARDE","FARMHOUSE_ALE_BIERE_DE_MARS","FARMHOUSE_ALE_BIERE_DE_COUPAGE","FARMHOUSE_ALE_GRISETTE","FARMHOUSE_ALE_BRETT","FARMHOUSE_ALE_OTHER","FARMHOUSE_ALE_SAHTI","FARMHOUSE_ALE_KORNOL"] }, into: "SOUR_FARMHOUSE", keepZero: true },
                { match: { baseIn: ["SOUR_BEER_OTHER"] }, into: "SOUR_OTHER", keepZero: true },

                // ===== FRUIT BEERS =====
                { match: { baseIn: ["FRUIT_BEER","BLOND_FRUITED","FRUIT_DOMINANT","FRUIT_BEER_IG"] }, into: "FRUIT_CLASSIC", keepZero: true },
                { match: { baseIn: ["LAMBIC_FRUIT","LAMBIC_KRIEK","LAMBIC_FRAMBOISE","LAMBIC_FARO"] }, into: "FRUIT_LAMBIC", keepZero: true },

                // ===== RADLERS =====
                { match: { baseIn: ["SHANDY_/_RADLER","RADLER_SHANDY","NON-ALCOHOLIC_BEER_SHANDY_/_RADLER"] }, into: "RADLER_ALL", keepZero: true },

                // ===== CIDERS & MEADS =====
                { match: { baseIn: ["CIDER_DRY","CIDER_SWEET","CIDER_TRADITIONAL_/_APFELWEIN","CIDER_PERRY_/_POIRE","CIDER_ROSE","CIDER_ICE","CIDER_BASQUE","CIDER_GRAFF","CIDER_OTHER_FRUIT","NON-ALCOHOLIC_CIDER_/_PERRY"] }, into: "CIDER_CLASSIC", keepZero: true },
                { match: { baseIn: ["CIDER_HERBED_/_SPICED_/_HOPPED","CIDER_APPLEWINE"] }, into: "CIDER_SPECIALTY", keepZero: true },
                { match: { baseIn: ["MEAD_TRADITIONAL","MEAD_SESSION_/_SHORT","MEAD_MELOMEL","MEAD_CYSER","MEAD_PYMENT","MEAD_METHEGLIN","MEAD_BRAGGOT","MEAD_ACERGLYN_/_MAPLE_WINE","MEAD_BOCHET","MEAD_OTHER"] }, into: "MEAD_ALL", keepZero: true },

                // ===== FLAVOURED & HARD =====
                { match: { baseIn: ["SPIRIT_FLAVOURED_BEERS","HARD_SELTZER","HARD_KOMBUCHA_/_JUN","HARD_GINGER_BEER"] }, into: "FLAVOURED_ALL", keepZero: true },

                // ===== SPECIAL BEERS =====
                { match: { baseIn: ["TABLE_BEER","NON_ALC_MAINSTREAM","NON_ALC_NEUTRAL"] }, into: "SPECIAL_ALL", keepZero: true },

                // ===== OTHER / CATCH-ALL =====
                { match: { baseIn: ["KVASS","BEER_SODA_MIX","CORN_BEER_/_CHICHA_DE_JORA","SORGHUM_/_MILLET_BEER","KOJI_/_GINJO_BEER","MAKGEOLLI","SPECIALTY_GRAIN","SPICED_/_HERBED_BEER","PUMPKIN_/_YAM_BEER","CHILLI_/_CHILE_BEER","HONEY_BEER","GRAPE_ALE_ITALIAN","GRAPE_ALE_OTHER","HAPPOSHU","SMOKED_BEER","HISTORICAL_BEER_OTHER","HISTORICAL_ODDITIES"] }, into: "BEERS_OTHER_ALL", keepZero: true },
            ],

            sortPriority: [],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De <strong>stijlkaart</strong> — alle bierfamilies als rijen</>,
                line2: <> <strong>subsubcategorie</strong> per familie </>,
            },
        }

        ,

        {
            id: 2813,
            name: <>Brown - Blond spectrum - lvl 4 </>,
            section: "beers",
            groupBy: "subsubcategory",
            within: {
                category: "BEERS",
                subcategory_in: [
                    "NORMAL_BLOND_AMBER",  "DARK_BROWN_MALT_SWEETNESS", "BLOND_BITTERS",
                ]
            },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,
            ui: {
                columns: 3,              // 2 or 3
                showItemsInline: false,  // default false
                aggregateTop: {
                    enabled: true,
                    hideEmptyBuckets: true,   // ✅ NEW

                    columns: [
                        { title: "Brown/amber", iconToken: "DUBBEL" },
                        { title: "Blond", iconToken: "BLOND" },
                        { title: "Hoppy", iconToken: "BLOND_BITTERS" }
                        // if columns=3, add a third
                    ],
                },
            },
            rollups: [
                // ENKEL / PATERSBIER
                {
                    match: { baseIn: ["BELGIAN_ENKEL_/_PATERSBIER" ,        "BLONDE_/_GOLDEN_ALE_AMERICAN",
                            "BLONDE_/_GOLDEN_ALE_ENGLISH",  "BITTER_SESSION_/_ORDINARY",] },
                    into: "ENKEL",
                    keepZero: true,
                },

                // BELGIAN_BLONDE
                {
                    match: { baseIn: ["BELGIAN_BLONDE"   ,
                            "BLONDE_/_GOLDEN_ALE_OTHER",
                            "GOLDEN_ALE_UKRAINIAN",
                        ] },
                    into: "BLONDS",
                    keepZero: true,
                },

                // BELGIAN_STRONG_GOLDEN_ALE
                {
                    match: { baseIn: ["BELGIAN_STRONG_GOLDEN_ALE","BELGIAN_TRIPEL"] },
                    into: "STRONG_BLONDS",
                    keepZero: true,
                },

                // BELGIAN_DUBBEL
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

                            "RED_ALE_AMERICAN_AMBER_/_RED",
                            "RED_ALE_IRISH",
                            "RED_ALE_OTHER",
                            "TRADITIONAL_ALE",

                            "SPECIALE_BELGE",
                            "BELGE_AMBREE"
                        ],
                    },
                    into: "SPECIALE_BELGE_&_AMBER_AND_BOCK",
                    keepZero: true,
                },

                {
                    match: { baseIn: [
                            "BELGIAN_DUBBEL",
                            "WINTER_ALE",
                            "WINTER_WARMER",
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
                            "STRONG_ALE_OTHER",] },
                    into: "DUBBELS_AND_BROWN_ALES",
                    keepZero: true,
                },

                // BELGIAN_STRONG_DARK_ALE
                {
                    match: { baseIn: ["BELGIAN_QUADRUPEL","BELGIAN_STRONG_DARK_ALE"] },
                    into: "STRONG_DARK_ALE_AND_QUADRUPEL",
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
                            "PALE_ALE_BELGIAN",
                            "PALE_ALE_XPA_(EXTRA_PALE)",
                            "RED_ALE_IMPERIAL_/_DOUBLE",
                            "RYE_BEER",
                        ],
                    },
                    into: "PALE_ALES",
                    keepZero: true,
                },

                {
                    match: {
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
                    into: "Ipa etc.",
                    keepZero: true,
                },



            ],

            sortPriority: [
                "SPECIALE_BELGE_&_AMBER_AND_BOCK",
                "DUBBELS_AND_BROWN_ALES",
                "STRONG_DARK_ALE_AND_QUADRUPEL",

                "ENKEL",
                "BLONDS",
                "STRONG_BLONDS",

                "PALE_ALES",
                "Ipa etc.",
                "BELGIAN_IPA",
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> van smaken</strong> <br/> van jouw</>,
                line2: <> <strong> bruine/amber </strong> is</>
            }
        },

        {
            id: 2813,
            name: <>Brown - Amber - Blond  </>,
            section: "beers",
            groupBy: "subsubcategory",
            within: {
                category: "BEERS",
                subcategory_in: [
                    "NORMAL_BLOND_AMBER",  "DARK_BROWN_MALT_SWEETNESS"
                ]
            },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,
            ui: {
                columns: 3,              // 2 or 3
                showItemsInline: false,  // default false
                aggregateTop: {
                    enabled: true,
                    hideEmptyBuckets: false,   // ✅ NEW
                    columns: [
                        { title: "Brown/amber", iconToken: "DUBBEL" },
                        { title: "Amber/ambree", iconToken: "SPECIAL_BELGE" },
                        { title: "Blond", iconToken: "BLOND" }
                        // if columns=3, add a third
                    ],
                },
            },
            rollups: [
                // ENKEL / PATERSBIER
                {
                    match: { baseIn: ["BELGIAN_ENKEL_/_PATERSBIER" ,        "BLONDE_/_GOLDEN_ALE_AMERICAN",
                            "BLONDE_/_GOLDEN_ALE_ENGLISH",  "BITTER_SESSION_/_ORDINARY",] },
                    into: "ENKEL",
                    keepZero: true,
                },

                // BELGIAN_BLONDE
                {
                    match: { baseIn: ["BELGIAN_BLONDE"   ,
                            "BLONDE_/_GOLDEN_ALE_OTHER",
                            "GOLDEN_ALE_UKRAINIAN",
                        ] },
                    into: "BLONDS",
                    keepZero: true,
                },

                // BELGIAN_STRONG_GOLDEN_ALE
                {
                    match: { baseIn: ["BELGIAN_STRONG_GOLDEN_ALE","BELGIAN_TRIPEL"] },
                    into: "STRONG_BLONDS",
                    keepZero: true,
                },

                // BELGIAN_DUBBEL
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

                            "PALE_ALE_BELGIAN",
                            "RED_ALE_AMERICAN_AMBER_/_RED",
                            "RED_ALE_IRISH",
                            "RED_ALE_OTHER",
                            "TRADITIONAL_ALE",


                        ],
                    },
                    into: "SPECIALE_BELGE",
                    keepZero: true,
                },

                // BELGIAN_DUBBEL
                {
                    match: {
                        baseIn: [
                            "BELGE_AMBREE",
                        ],
                    },
                    into: "AMBREE",
                    keepZero: true,
                },

                // BELGIAN_DUBBEL
                {
                    match: {
                        baseIn: [
                            "MARZEN",
                        ],
                    },
                    into: "STRONG_AMBREE",
                    keepZero: false,
                },

                {
                    match: { baseIn: [
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
                            "STRONG_ALE_OTHER",] },
                    into: "SESSION_BROWN",
                    keepZero: true,
                },

                {
                    match: { baseIn: [
                            "WINTER_ALE",
                            "WINTER_WARMER",
                            "BELGIAN_DUBBEL",
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
                            "STRONG_ALE_OTHER",] },
                    into: "BROWN_ALES",
                    keepZero: true,
                },

                // BELGIAN_STRONG_DARK_ALE
                {
                    match: { baseIn: ["BELGIAN_QUADRUPEL","BELGIAN_STRONG_DARK_ALE"] },
                    into: "STRONG_DARK_ALE_AND_QUADRUPEL",
                    keepZero: true,
                },


            ],
            forceShow: [
            ],
            sortPriority: [
                "SESSION_BROWN",
                "BROWN_ALES",
                "STRONG_DARK_ALE_AND_QUADRUPEL",

                "SPECIALE_BELGE",
                "AMBREE",
                "STRONG_AMBREE",

                "ENKEL",
                "BLONDS",
                "STRONG_BLONDS",
            ],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> van smaken</strong> <br/> van jouw</>,
                line2: <> <strong> bruine/amber/blonde </strong> is</>
            }
        },





        {
            id: 2820,
            name: <>Sour beers lvl - 3</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: {
                category: "BEERS",
                subcategory_in: ["SOURS_SAISON_LAMBIC_GUEUZE"],
            },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,

            ui: {
                columns: 2,
                showItemsInline: false,

                aggregateTop: {
                    enabled: true,
                    deterministic: true,
                    unassigned: "hide",
                    hideEmptyBuckets: false,
                    columns: [
                        {
                            title: "Traditional lambic & classic sours",
                            iconToken: "TRADITIONAL",
                            buckets: [
                                "OUDE_GEUZE",
                                "OUDE_KRIEK",
                                "KRIEK_LAMBIC",
                                "RED_BROWN_OLD",
                            ],
                        },
                        {
                            title: "Modern tart sours",
                            iconToken: "EXPLORATIVE",
                            buckets: ["BLOND_SOUR"],
                        },
                    ],
                },
            },

            rollups: [
                // =========================
                // Traditional lambic & classic sours (Column 1)
                // =========================

                // 1) OUDE GEUZE (classic gueuze / straight lambic)
                {
                    match: {
                        baseIn: [
                            "LAMBIC_GUEUZE",
                            "LAMBIC_TRADITIONAL",
                            "LAMBIC_OTHER",
                        ],
                    },
                    into: "OUDE_GEUZE",
                    keepZero: true,
                },

                // 2) OUDE KRIEK (traditional kriek)
                {
                    match: {
                        baseIn: ["LAMBIC_KRIEK"],
                    },
                    into: "OUDE_KRIEK",
                    keepZero: true,
                },

                // 3) KRIEK LAMBIC (sweetened / fruit-forward kriek-style lambic)
                // If you later split “oude vs modern kriek” more precisely, add the relevant subsubcats here.
                {
                    match: {
                        baseIn: [
                            // placeholder bucket(s): adjust if your taxonomy has specific “sweet kriek” subsubcats
                            // e.g. "LAMBIC_KRIEK_SWEET" / "KRIEK_LAMBIC" / etc.
                        ],
                    },
                    into: "KRIEK_LAMBIC",
                    keepZero: true,
                },

                // 4) RED, BROWN, OLD (Flemish classics)
                {
                    match: {
                        baseIn: [
                            "SOUR_FLANDERS_RED_ALE",
                            "SOUR_FLANDERS_OUD_BRUIN",
                        ],
                    },
                    into: "RED_BROWN_OLD",
                    keepZero: true,
                },

                // =========================
                // Modern tart sours (Column 2)
                // =========================
                {
                    match: {
                        baseIn: [
                            // Berliner / Gose / modern fruited & “tart” sour family
                            "SOUR_BERLINER_WEISSE",
                            "SOUR_TRADITIONAL_GOSE",
                            "SOUR_OTHER_GOSE",
                            "SOUR_CATHARINA",
                            "SOUR_FRUITED",
                            "SOUR_FRUITED_BERLINER_WEISSE",
                            "SOUR_FRUITED_GOSE",
                            "SOUR_TOMATO_/_VEGETABLE_GOSE",
                            "IPA_SOUR",
                            "NON-ALCOHOLIC_BEER_SOUR",

                            // If you want these “modern tart” too:
                            // "WILD_ALE_AMERICAN",
                            // "WILD_ALE_OTHER",
                            // "BRETT_BEER",
                            // "SOUR_OTHER",
                        ],
                    },
                    into: "BLOND_SOUR",
                    keepZero: true,
                },
            ],

            // Optional: decide if you want to force-show empty buckets
            forceShow: [],

            // Optional: keep your UI order stable
            sortPriority: ["OUDE_GEUZE", "OUDE_KRIEK", "KRIEK_LAMBIC", "RED_BROWN_OLD", "BLOND_SOUR"],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong>van zure stijlen</strong><br />van jouw</>,
                line2: <><strong>sours</strong> is</>,
            },
        }

     ,


        {
            id: 2099,
            name: <>Lagers</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["LAGERS"]},
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: true,
            info: {
                image: presetImg("Budgetbewust.png"),
                line1: <>De verdeling <strong> stijlen </strong><br />van jouw</>,
                line2: <><strong>alcoholische lagers</strong> is</>,
            }
        },

        {
            id: 2099,
            name: <>Lagers</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["WHEAT_BEERS"]},
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: true,
            info: {
                image: presetImg("Budgetbewust.png"),
                line1: <>De verdeling <strong> stijlen </strong><br />van jouw</>,
                line2: <><strong>alcoholische tarwebieren</strong> is</>,
            }
        },

        {
        id: 2003,
        name: "Alcohol-free Beers",
        section: "beers",
        groupBy: "subcategory",
        within: {},
        predicates: [{ field: "is_zero", op: "eq", value: 1 }],
        includeEmpty: true,
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
                "LAGERS",
                "NORMAL_BLOND_AMBER",
                "BLOND_BITTERS",
                "DARK_BROWN_MALT_SWEETNESS",
                "FRUIT_BEERS",
                "SOURS_SAISON_LAMBIC_GUEUZE",
                "DARK_BROWN_COFFEE_ROAST_BITTER",
                "WHEAT_BEERS",
                "RADLERS",
                "CIDERS",
                "SPIRIT_FLAVOURED_BEERS",
                "BEERS_OTHER",
                "BEERS_SPECIAL",
            ]
        },

        // alcoholic only
        predicates: [{field: "is_zero", op: "eq", value: 0}],
        showOnlyRollups: true,
        includeEmpty: false,
        ui: {
            columns: 3,
            aggregateTop: {
                enabled: true,
                deterministic: true, // ✅ NEW
                unassigned: "hide", // "append" (default) | "hide"
                hideEmptyBuckets: false,   // ✅ NEW
                columns: [
                    {
                        title: "Traditionele bieren - Trappisten & Gueuzes",
                        iconToken: "TRADITIONAL",
                        buckets: [

                            "NORMAL_BLOND_AMBER · Traditional",
                            "DARK_BROWN_MALT_SWEETNESS · Traditional",
                            "FRUIT_BEERS · Traditional",
                            "SOURS_SAISON_LAMBIC_GUEUZE · Traditional",
                            "DARK_BROWN_COFFEE_ROAST_BITTER · Traditional",
                            "BEERS_SPECIAL · Traditional",

                        ],
                    },
                    {
                        title: "Normale of abdijbieren",
                        iconToken: "NORMAL",
                        buckets: [
                            "LAGERS · Normal/Abbey",
                            "NORMAL_BLOND_AMBER · Normal/Abbey",
                            "BLOND_BITTERS · Normal/Abbey",
                            "DARK_BROWN_MALT_SWEETNESS · Normal/Abbey",
                            "FRUIT_BEERS · Normal/Abbey",
                            "SOURS_SAISON_LAMBIC_GUEUZE · Normal/Abbey",
                            "DARK_BROWN_COFFEE_ROAST_BITTER · Normal/Abbey",
                            "WHEAT_BEERS · Normal/Abbey",
                            "RADLERS · Normal/Abbey",
                            "CIDERS · Normal/Abbey",
                            "SPIRIT_FLAVOURED_BEERS · Normal/Abbey",
                            "BEERS_OTHER · Normal/Abbey",
                            "BEERS_SPECIAL · Normal/Abbey",

                        ],
                    },
                    {
                        title: "Modern/Explorative",
                        iconToken: "IG_TRENDY",
                        buckets: [


                            "LAGERS · Modern",
                            "NORMAL_BLOND_AMBER · Modern",
                            "BLOND_BITTERS · Modern",
                            "DARK_BROWN_MALT_SWEETNESS · Modern",
                            "FRUIT_BEERS · Modern",
                            "SOURS_SAISON_LAMBIC_GUEUZE · Modern",
                            "DARK_BROWN_COFFEE_ROAST_BITTER · Modern",
                            "WHEAT_BEERS · Modern",
                            "RADLERS · Modern",
                            "CIDERS · Modern",
                            "SPIRIT_FLAVOURED_BEERS · Modern",
                            "BEERS_OTHER · Modern",
                            "BEERS_SPECIAL · Modern",
                        ],
                    },
                ],
            },
        },


        // split by heritage
        partitionBy: [
            {label: "Normal/Abbey", predicates: [{field: "heritage", op: "in", value: ["NORMAL", "ABBEY"]}]},
            {label: "Traditional", predicates: [{field: "heritage", op: "in", value: ["TRAPPIST", "TRADITIONAL"]}]},
            {label: "Modern", predicates: [{field: "heritage", op: "eq", value: "MODERN"}]},
        ],

        // ensure these composites render even when count = 0
        forceShow: [

        ],

        // alternating Normal/Abbey then Trappist per subcategory
        sortPriority: [

        ],

        info: {
            image: presetImg("Fijn-proever.png"),
            line1: <>De verdeling van deze </>,
            line2: <> <strong> bieren </strong> <br/> op vlak van <strong> herkomst </strong>  is</>
        }

    },

// FILTER A (3 columns): BELGIAN / GERMAN / UK
// Notes:
// - This filter is intentionally restricted (via predicates) to styles that we classify into these 3 buckets,
//   so the distribution makes sense without needing an "Other" column.
// - Berliner's Weisse + (traditional) Gose are mapped to GERMAN.
// - IPA_ENGLISH → UK; IPA_BELGIAN → BELGIAN; IPA_AMERICAN + HAZY etc → NOT in this filter (handled in Filter B).

        // FILTER A (3 columns): BELGIAN / GERMAN / UK
// Now "bucket per beer style (cluster)" first,
// then aggregateTop puts all Belgian buckets in Belgian column, etc.

        {
            id: 2816,
            name: <>Country styles (BE / DE / UK)</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { category: "BEERS" },
            predicates: [
                { field: "is_zero", op: "eq", value: 0 },
                {
                    field: "subsubcategory",
                    op: "in",
                    value: [
                        // --- BELGIAN-coded
                        "BELGIAN_BLONDE",
                        "BELGIAN_ENKEL_/_PATERSBIER",
                        "BELGIAN_DUBBEL",
                        "BELGIAN_TRIPEL",
                        "BELGIAN_STRONG_GOLDEN_ALE",
                        "BELGIAN_STRONG_DARK_ALE",
                        "BELGIAN_QUADRUPEL",
                        "WHEAT_BEER_WITBIER_/_BLANCHE",
                        "PALE_ALE_BELGIAN",
                        "BROWN_ALE_BELGIAN",
                        "STOUT_BELGIAN",
                        "IPA_BELGIAN",
                        "FARMHOUSE_ALE_SAISON",
                        "FARMHOUSE_ALE_GRISETTE",
                        "SOUR_FLANDERS_OUD_BRUIN",
                        "SOUR_FLANDERS_RED_ALE",
                        "LAMBIC_TRADITIONAL",
                        "LAMBIC_GUEUZE",
                        "LAMBIC_KRIEK",
                        "LAMBIC_FARO",
                        "LAMBIC_FRUIT",
                        "LAMBIC_FRAMBOISE",
                        "LAMBIC_OTHER",

                        // --- GERMAN-coded
                        "PILSNER_GERMAN",
                        "LAGER_HELLES",
                        "LAGER_DORTMUNDER_/_EXPORT",
                        "KELLERBIER_/_ZWICKELBIER",
                        "KOLSCH",
                        "WHEAT_BEER_HEFEWEIZEN",
                        "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                        "WHEAT_BEER_DUNKELWEIZEN",
                        "WHEAT_BEER_KRISTALLWEIZEN",
                        "WHEAT_BEER_HOPFENWEISSE",
                        "MARZEN",
                        "FESTBIER",
                        "BOCK_SINGLE_/_TRADITIONAL",
                        "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK",
                        "BOCK_DOPPELBOCK",
                        "BOCK_WEIZENBOCK",
                        "BOCK_WEIZENDOPPELBOCK",
                        "BOCK_EISBOCK",
                        "RAUCHBIER",
                        "SCHWARZBIER",
                        "ROGGENBIER",
                        "SOUR_BERLINER_WEISSE",
                        "SOUR_TRADITIONAL_GOSE",
                        "SOUR_OTHER_GOSE",

                        // --- UK-coded
                        "BITTER_SESSION_/_ORDINARY",
                        "BITTER_BEST",
                        "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)",
                        "PALE_ALE_ENGLISH",
                        "BLONDE_/_GOLDEN_ALE_ENGLISH",
                        "BROWN_ALE_ENGLISH",
                        "MILD_LIGHT",
                        "MILD_DARK",
                        "MILD_OTHER",
                        "PORTER_ENGLISH",
                        "STOUT_ENGLISH",
                        "BARLEYWINE_ENGLISH",
                        "OLD_/_STOCK_ALE",
                        "SCOTCH_ALE_/_WEE_HEAVY",
                        "SCOTTISH_ALE",
                        "SCOTTISH_EXPORT_ALE",
                        "IPA_ENGLISH",
                    ],
                },
            ],
            includeEmpty: false,

            ui: {
                columns: 3,
                showItemsInline: false,
                aggregateTop: {
                    enabled: true,
                    hideEmptyBuckets: true,   // ✅ NEW
                    columns: [
                        {
                            title: "Belgian",
                            iconToken: "BELGIUM",
                            buckets: [
                                "BE_BLOND",
                                "BE_WHITE",
                                "BE_DUBBEL",
                                "BE_TRIPEL_STRONG_GOLDEN",
                                "BE_STRONG_DARK_QUAD",
                                "BE_LAMBIC_FAMILY",
                                "BE_SAISON_GRISETTE",
                                "BE_FLANDERS_SOURS",
                                "BE_BELGIAN_IPA",
                                "BE_BELGIAN_ALE_MISC",
                            ],
                        },
                        {
                            title: "German",
                            iconToken: "GERMANY",
                            buckets: [
                                "DE_PILS",
                                "DE_LAGER_CLASSIC",
                                "DE_KOLSCH",
                                "DE_WEIZEN",
                                "DE_MARZEN_FESTBIER",
                                "DE_BOCK_FAMILY",
                                "DE_SMOKED",
                                "DE_DARK_SPECIALTY",
                                "DE_GERMAN_SOURS",
                            ],
                        },
                        {
                            title: "UK",
                            iconToken: "UK",
                            buckets: [
                                "UK_BITTER",
                                "UK_PALE_GOLDEN",
                                "UK_BROWN_MILD",
                                "UK_PORTER_STOUT",
                                "UK_BARLEYWINE_STOCK",
                                "UK_SCOTTISH",
                                "UK_IPA",
                            ],
                        },
                    ],
                },
            },

            rollups: [
                // =========================
                // BELGIUM buckets
                // =========================
                { match: { baseIn: ["BELGIAN_BLONDE"] }, into: "BE_BLOND", keepZero: true },
                { match: { baseIn: ["WHEAT_BEER_WITBIER_/_BLANCHE"] }, into: "BE_WHITE", keepZero: true },
                { match: { baseIn: ["BELGIAN_DUBBEL"] }, into: "BE_DUBBEL", keepZero: true },

                {
                    match: { baseIn: ["BELGIAN_TRIPEL", "BELGIAN_STRONG_GOLDEN_ALE"] },
                    into: "BE_TRIPEL_STRONG_GOLDEN",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["BELGIAN_STRONG_DARK_ALE", "BELGIAN_QUADRUPEL"] },
                    into: "BE_STRONG_DARK_QUAD",
                    keepZero: true,
                },

                {
                    match: {
                        baseIn: [
                            "LAMBIC_TRADITIONAL",
                            "LAMBIC_GUEUZE",
                            "LAMBIC_KRIEK",
                            "LAMBIC_FARO",
                            "LAMBIC_FRUIT",
                            "LAMBIC_FRAMBOISE",
                            "LAMBIC_OTHER",
                        ],
                    },
                    into: "BE_LAMBIC_FAMILY",
                    keepZero: false,
                },

                { match: { baseIn: ["FARMHOUSE_ALE_SAISON", "FARMHOUSE_ALE_GRISETTE"] }, into: "BE_SAISON_GRISETTE", keepZero: false },
                { match: { baseIn: ["SOUR_FLANDERS_OUD_BRUIN", "SOUR_FLANDERS_RED_ALE"] }, into: "BE_FLANDERS_SOURS", keepZero: false },

                { match: { baseIn: ["IPA_BELGIAN"] }, into: "BE_BELGIAN_IPA", keepZero: true },

                // Belgian-adjective “misc” (so they still land in Belgium column cleanly)
                { match: { baseIn: ["BELGIAN_ENKEL_/_PATERSBIER", "PALE_ALE_BELGIAN", "BROWN_ALE_BELGIAN", "STOUT_BELGIAN"] }, into: "BE_BELGIAN_ALE_MISC", keepZero: true },

                // =========================
                // GERMANY buckets
                // =========================
                { match: { baseIn: ["PILSNER_GERMAN"] }, into: "DE_PILS", keepZero: true },
                { match: { baseIn: ["LAGER_HELLES", "LAGER_DORTMUNDER_/_EXPORT", "KELLERBIER_/_ZWICKELBIER"] }, into: "DE_LAGER_CLASSIC", keepZero: true },
                { match: { baseIn: ["KOLSCH"] }, into: "DE_KOLSCH", keepZero: true },

                {
                    match: {
                        baseIn: [
                            "WHEAT_BEER_HEFEWEIZEN",
                            "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT",
                            "WHEAT_BEER_DUNKELWEIZEN",
                            "WHEAT_BEER_KRISTALLWEIZEN",
                            "WHEAT_BEER_HOPFENWEISSE",
                        ],
                    },
                    into: "DE_WEIZEN",
                    keepZero: true,
                },

                { match: { baseIn: ["MARZEN", "FESTBIER"] }, into: "DE_MARZEN_FESTBIER", keepZero: true },

                {
                    match: {
                        baseIn: [
                            "BOCK_SINGLE_/_TRADITIONAL",
                            "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK",
                            "BOCK_DOPPELBOCK",
                            "BOCK_WEIZENBOCK",
                            "BOCK_WEIZENDOPPELBOCK",
                            "BOCK_EISBOCK",
                        ],
                    },
                    into: "DE_BOCK_FAMILY",
                    keepZero: true,
                },

                { match: { baseIn: ["RAUCHBIER"] }, into: "DE_SMOKED", keepZero: true },
                { match: { baseIn: ["SCHWARZBIER", "ROGGENBIER"] }, into: "DE_DARK_SPECIALTY", keepZero: true },
                { match: { baseIn: ["SOUR_BERLINER_WEISSE", "SOUR_TRADITIONAL_GOSE", "SOUR_OTHER_GOSE"] }, into: "DE_GERMAN_SOURS", keepZero: true },

                // =========================
                // UK buckets
                // =========================
                { match: { baseIn: ["BITTER_SESSION_/_ORDINARY", "BITTER_BEST", "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)"] }, into: "UK_BITTER", keepZero: true },
                { match: { baseIn: ["PALE_ALE_ENGLISH", "BLONDE_/_GOLDEN_ALE_ENGLISH"] }, into: "UK_PALE_GOLDEN", keepZero: true },
                { match: { baseIn: ["BROWN_ALE_ENGLISH", "MILD_LIGHT", "MILD_DARK", "MILD_OTHER"] }, into: "UK_BROWN_MILD", keepZero: true },
                { match: { baseIn: ["PORTER_ENGLISH", "STOUT_ENGLISH"] }, into: "UK_PORTER_STOUT", keepZero: true },
                { match: { baseIn: ["BARLEYWINE_ENGLISH", "OLD_/_STOCK_ALE"] }, into: "UK_BARLEYWINE_STOCK", keepZero: true },
                { match: { baseIn: ["SCOTCH_ALE_/_WEE_HEAVY", "SCOTTISH_ALE", "SCOTTISH_EXPORT_ALE"] }, into: "UK_SCOTTISH", keepZero: true },
                { match: { baseIn: ["IPA_ENGLISH"] }, into: "UK_IPA", keepZero: true },
            ],

            sortPriority: ["BELGIAN_STYLES", "GERMAN_STYLES", "UK_STYLES"], // optional; you can remove or replace with your bucket names

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van deze </>,
                line2: <> <strong> bieren </strong> <br/> op vlak van <strong> herkomst </strong>  is</>
            }
        }
        ,
        // FILTER B (2 columns): US / INTERNATIONAL_OTHER
// Notes:
// - This one is NOT restricted; it can classify the entire beer universe.
// - US bucket includes explicit AMERICAN labels + NE/HAZY families + a few US-iconic modern categories.
// - Everything not in US is routed to INTERNATIONAL_OTHER by listing the remaining enums.
//
// If you later add/remove beer enums, you'll want to update the INTERNATIONAL list accordingly.




    ]

;

