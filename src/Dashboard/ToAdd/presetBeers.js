import { presetImg } from './utils/presetImages';

export const PRESET_FILTERS_BEERS = [
        {
            id: 2001,
            willyOff: true,
            name: <> <strong>De werkemens, de BOB & gezonde </strong>!<br/> De werkmens wil helder blijven, de BOB moet nog rijden en de gezondheidsbewuste gast vermijdt alcohol. </>,
            section: "beers",
            groupBy: "subcategory",

            // keep it strictly to beers
            within:  { category: "BEERS" },
            filters: { category: "BEERS" },

            predicates: [],
            showOnlyRollups: true,
            includeEmpty: false,

            // two mutually-exclusive buckets
            partitionBy: [
                { label: "Zero",          predicates: [{ field: "is_zero", op: "eq", value: 1 }] },
                { label: "With alcohol",  predicates: [{ field: "is_zero", op: "eq", value: 0 }] }
            ],

            // always render both, even if one side is 0
            forceShow: [
                "LAGERS · With alcohol", "NORMAL_BLOND_AMBER · With alcohol", "BLOND_BITTERS · With alcohol",
                "DARK_BROWN_MALT_SWEETNESS · With alcohol", "DARK_BROWN_COFFEE_ROAST_BITTER · With alcohol",
                "FRUIT_BEERS · With alcohol", "WHEAT_BEERS · With alcohol", "SOURS_SAISON_LAMBIC_GUEUZE · With alcohol",
                "RADLERS · With alcohol", "CIDERS · With alcohol", "SPIRIT_FLAVOURED_BEERS · With alcohol",
                "LAGERS · Zero", "NORMAL_BLOND_AMBER · Zero", "BLOND_BITTERS · Zero",
                "DARK_BROWN_MALT_SWEETNESS · Zero", "DARK_BROWN_COFFEE_ROAST_BITTER · Zero",
                "FRUIT_BEERS · Zero", "WHEAT_BEERS · Zero", "SOURS_SAISON_LAMBIC_GUEUZE · Zero",
                "RADLERS · Zero", "CIDERS · Zero", "SPIRIT_FLAVOURED_BEERS · Zero",
            ],

            ui: {
                columns: 2,
                showItemsInline: false,
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    layout: 'cards',
                    suppressUnassigned: true,
                    rows: [
                        {
                            title: "Alcoholische bieren",
                            iconToken: "BEERS",
                            buckets: [
                                "LAGERS · With alcohol",
                                "NORMAL_BLOND_AMBER · With alcohol",
                                "BLOND_BITTERS · With alcohol",
                                "DARK_BROWN_MALT_SWEETNESS · With alcohol",
                                "DARK_BROWN_COFFEE_ROAST_BITTER · With alcohol",
                                "FRUIT_BEERS · With alcohol",
                                "WHEAT_BEERS · With alcohol",
                                "SOURS_SAISON_LAMBIC_GUEUZE · With alcohol",
                                "RADLERS · With alcohol",
                                "CIDERS · With alcohol",
                                "SPIRIT_FLAVOURED_BEERS · With alcohol",
                                "BEERS_OTHER · With alcohol",
                                "BEERS_SPECIAL · With alcohol",
                            ],
                            keepEmpty: true,
                        },
                        {
                            title: "Alcoholvrije bieren",
                            iconToken: "ZERO",
                            buckets: [
                                "LAGERS · Zero",
                                "NORMAL_BLOND_AMBER · Zero",
                                "BLOND_BITTERS · Zero",
                                "DARK_BROWN_MALT_SWEETNESS · Zero",
                                "DARK_BROWN_COFFEE_ROAST_BITTER · Zero",
                                "FRUIT_BEERS · Zero",
                                "WHEAT_BEERS · Zero",
                                "SOURS_SAISON_LAMBIC_GUEUZE · Zero",
                                "RADLERS · Zero",
                                "CIDERS · Zero",
                                "SPIRIT_FLAVOURED_BEERS · Zero",
                                "BEERS_OTHER · Zero",
                                "BEERS_SPECIAL · Zero",
                            ],
                            keepEmpty: true,
                        },
                    ],
                },
            },

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
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            showOnlyRollups: true,
            includeEmpty: false,

            forceShow: [
                "LAGERS", "NORMAL_BLOND_AMBER", "BLOND_BITTERS",
                "DARK_BROWN_MALT_SWEETNESS", "DARK_BROWN_COFFEE_ROAST_BITTER",
                "FRUIT_BEERS", "WHEAT_BEERS", "SOURS_SAISON_LAMBIC_GUEUZE",
                "RADLERS", "CIDERS", "SPIRIT_FLAVOURED_BEERS",
            ],

            ui: {
                columns: 1,
                showItemsInline: false,
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    layout: 'cards',
                    suppressUnassigned: true,
                    rows: [
                        {
                            title: "Alcoholische bieren",
                            iconToken: "BEERS",
                            buckets: [
                                "LAGERS",
                                "NORMAL_BLOND_AMBER",
                                "BLOND_BITTERS",
                                "DARK_BROWN_MALT_SWEETNESS",
                                "DARK_BROWN_COFFEE_ROAST_BITTER",
                                "FRUIT_BEERS",
                                "WHEAT_BEERS",
                                "SOURS_SAISON_LAMBIC_GUEUZE",
                                "RADLERS",
                                "CIDERS",
                                "SPIRIT_FLAVOURED_BEERS",
                                "BEERS_OTHER",
                                "BEERS_SPECIAL",
                            ],
                            keepEmpty: true,
                        },
                    ],
                },
            },

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
            id: 2004,
            willyOff: true,
            name: <> <strong>Alcoholvrij aanbod</strong><br/> Welke stijlen alcoholvrije bieren heb je op de kaart?</>,
            section: "beers",
            groupBy: "subcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 1 }],
            showOnlyRollups: true,
            includeEmpty: false,

            forceShow: [
                "LAGERS", "NORMAL_BLOND_AMBER", "BLOND_BITTERS",
                "DARK_BROWN_MALT_SWEETNESS", "DARK_BROWN_COFFEE_ROAST_BITTER",
                "FRUIT_BEERS", "WHEAT_BEERS", "SOURS_SAISON_LAMBIC_GUEUZE",
                "RADLERS", "CIDERS", "SPIRIT_FLAVOURED_BEERS",
            ],

            ui: {
                columns: 1,
                showItemsInline: false,
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    layout: 'cards',
                    suppressUnassigned: true,
                    rows: [
                        {
                            title: "Alcoholvrije bieren",
                            iconToken: "ZERO",
                            buckets: [
                                "LAGERS",
                                "NORMAL_BLOND_AMBER",
                                "BLOND_BITTERS",
                                "DARK_BROWN_MALT_SWEETNESS",
                                "DARK_BROWN_COFFEE_ROAST_BITTER",
                                "FRUIT_BEERS",
                                "WHEAT_BEERS",
                                "SOURS_SAISON_LAMBIC_GUEUZE",
                                "RADLERS",
                                "CIDERS",
                                "SPIRIT_FLAVOURED_BEERS",
                                "BEERS_OTHER",
                                "BEERS_SPECIAL",
                            ],
                            keepEmpty: true,
                        },
                    ],
                },
            },

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van <strong> smaken </strong> van je <br/> </>,
                line2: <> <strong> alcoholvrije bieren </strong> is</>
            }
        },

        {
            id: 2003,
            name: <> <strong>Alcoholpercentage</strong><br/> Verdeling van bierstijlen per ABV-range.</>,
            section: "beers",
            groupBy: "subcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            showOnlyRollups: true,
            includeEmpty: false,

            partitionBy: [
                { label: "0.5 – 3.9%", predicates: [{ field: "abv", op: "gte", value: 0.5 }, { field: "abv", op: "lte", value: 3.9 }] },
                { label: "4 – 5.9%",   predicates: [{ field: "abv", op: "gte", value: 4 },   { field: "abv", op: "lte", value: 5.9 }] },
                { label: "6 – 7.9%",   predicates: [{ field: "abv", op: "gte", value: 6 },   { field: "abv", op: "lte", value: 7.9 }] },
                { label: "8%+",        predicates: [{ field: "abv", op: "gte", value: 8 }] },
            ],

            forceShow: [
                "LAGERS · 0.5 – 3.9%", "NORMAL_BLOND_AMBER · 0.5 – 3.9%", "BLOND_BITTERS · 0.5 – 3.9%",
                "DARK_BROWN_MALT_SWEETNESS · 0.5 – 3.9%", "DARK_BROWN_COFFEE_ROAST_BITTER · 0.5 – 3.9%",
                "FRUIT_BEERS · 0.5 – 3.9%", "WHEAT_BEERS · 0.5 – 3.9%", "SOURS_SAISON_LAMBIC_GUEUZE · 0.5 – 3.9%",
                "RADLERS · 0.5 – 3.9%", "CIDERS · 0.5 – 3.9%",

                "LAGERS · 4 – 5.9%", "NORMAL_BLOND_AMBER · 4 – 5.9%", "BLOND_BITTERS · 4 – 5.9%",
                "DARK_BROWN_MALT_SWEETNESS · 4 – 5.9%", "DARK_BROWN_COFFEE_ROAST_BITTER · 4 – 5.9%",
                "FRUIT_BEERS · 4 – 5.9%", "WHEAT_BEERS · 4 – 5.9%", "SOURS_SAISON_LAMBIC_GUEUZE · 4 – 5.9%",
                "RADLERS · 4 – 5.9%", "CIDERS · 4 – 5.9%",

                "LAGERS · 6 – 7.9%", "NORMAL_BLOND_AMBER · 6 – 7.9%", "BLOND_BITTERS · 6 – 7.9%",
                "DARK_BROWN_MALT_SWEETNESS · 6 – 7.9%", "DARK_BROWN_COFFEE_ROAST_BITTER · 6 – 7.9%",
                "FRUIT_BEERS · 6 – 7.9%", "WHEAT_BEERS · 6 – 7.9%", "SOURS_SAISON_LAMBIC_GUEUZE · 6 – 7.9%",

                "LAGERS · 8%+", "NORMAL_BLOND_AMBER · 8%+", "BLOND_BITTERS · 8%+",
                "DARK_BROWN_MALT_SWEETNESS · 8%+", "DARK_BROWN_COFFEE_ROAST_BITTER · 8%+",
                "FRUIT_BEERS · 8%+", "SOURS_SAISON_LAMBIC_GUEUZE · 8%+",
            ],

            ui: {
                columns: 2,
                showItemsInline: false,
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    layout: 'cards',
                    suppressUnassigned: true,
                    rows: [
                        {
                            title: "0.5 – 3.9% ABV",
                            iconToken: "LAGERS",
                            buckets: [
                                "LAGERS · 0.5 – 3.9%",
                                "NORMAL_BLOND_AMBER · 0.5 – 3.9%",
                                "BLOND_BITTERS · 0.5 – 3.9%",
                                "DARK_BROWN_MALT_SWEETNESS · 0.5 – 3.9%",
                                "DARK_BROWN_COFFEE_ROAST_BITTER · 0.5 – 3.9%",
                                "FRUIT_BEERS · 0.5 – 3.9%",
                                "WHEAT_BEERS · 0.5 – 3.9%",
                                "SOURS_SAISON_LAMBIC_GUEUZE · 0.5 – 3.9%",
                                "RADLERS · 0.5 – 3.9%",
                                "CIDERS · 0.5 – 3.9%",
                                "SPIRIT_FLAVOURED_BEERS · 0.5 – 3.9%",
                                "BEERS_OTHER · 0.5 – 3.9%",
                                "BEERS_SPECIAL · 0.5 – 3.9%",
                            ],
                            keepEmpty: true,
                        },
                        {
                            title: "4 – 5.9% ABV",
                            iconToken: "NORMAL_BLOND_AMBER",
                            buckets: [
                                "LAGERS · 4 – 5.9%",
                                "NORMAL_BLOND_AMBER · 4 – 5.9%",
                                "BLOND_BITTERS · 4 – 5.9%",
                                "DARK_BROWN_MALT_SWEETNESS · 4 – 5.9%",
                                "DARK_BROWN_COFFEE_ROAST_BITTER · 4 – 5.9%",
                                "FRUIT_BEERS · 4 – 5.9%",
                                "WHEAT_BEERS · 4 – 5.9%",
                                "SOURS_SAISON_LAMBIC_GUEUZE · 4 – 5.9%",
                                "RADLERS · 4 – 5.9%",
                                "CIDERS · 4 – 5.9%",
                                "SPIRIT_FLAVOURED_BEERS · 4 – 5.9%",
                                "BEERS_OTHER · 4 – 5.9%",
                                "BEERS_SPECIAL · 4 – 5.9%",
                            ],
                            keepEmpty: true,
                        },
                        {
                            title: "6 – 7.9% ABV",
                            iconToken: "DARK_BROWN_MALT_SWEETNESS",
                            buckets: [
                                "LAGERS · 6 – 7.9%",
                                "NORMAL_BLOND_AMBER · 6 – 7.9%",
                                "BLOND_BITTERS · 6 – 7.9%",
                                "DARK_BROWN_MALT_SWEETNESS · 6 – 7.9%",
                                "DARK_BROWN_COFFEE_ROAST_BITTER · 6 – 7.9%",
                                "FRUIT_BEERS · 6 – 7.9%",
                                "WHEAT_BEERS · 6 – 7.9%",
                                "SOURS_SAISON_LAMBIC_GUEUZE · 6 – 7.9%",
                                "RADLERS · 6 – 7.9%",
                                "CIDERS · 6 – 7.9%",
                                "SPIRIT_FLAVOURED_BEERS · 6 – 7.9%",
                                "BEERS_OTHER · 6 – 7.9%",
                                "BEERS_SPECIAL · 6 – 7.9%",
                            ],
                            keepEmpty: true,
                        },
                        {
                            title: "8%+ ABV",
                            iconToken: "DARK_BROWN_COFFEE_ROAST_BITTER",
                            buckets: [
                                "LAGERS · 8%+",
                                "NORMAL_BLOND_AMBER · 8%+",
                                "BLOND_BITTERS · 8%+",
                                "DARK_BROWN_MALT_SWEETNESS · 8%+",
                                "DARK_BROWN_COFFEE_ROAST_BITTER · 8%+",
                                "FRUIT_BEERS · 8%+",
                                "WHEAT_BEERS · 8%+",
                                "SOURS_SAISON_LAMBIC_GUEUZE · 8%+",
                                "RADLERS · 8%+",
                                "CIDERS · 8%+",
                                "SPIRIT_FLAVOURED_BEERS · 8%+",
                                "BEERS_OTHER · 8%+",
                                "BEERS_SPECIAL · 8%+",
                            ],
                            keepEmpty: true,
                        },
                    ],
                },
            },

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling van <strong> bierstijlen </strong> per <br/> </>,
                line2: <> <strong> alcoholpercentage </strong> is</>
            }
        },



















        {
            id: 2997,
            name: <>Stijlkaart — alle bierfamilies</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,

            forceShow: [
                // Lagers
                "HELLES", "DORTMUNDER", "LAGER_MEXICAN", "IPL", "KOLSCH", "LAGER_STRONG", "RAUCHBIER",
                // Kellerbier (in Special Beers row)
                "KELLERBIER",
                // Wheat
                "WEIZENBOCK",
                // Normal Blond
                "BELGIAN_BLONDE", "GOLDEN_ALES",
                // Pale ales
                "SESSION_PALE_ALE", "PALE_ALE_BELGIAN_EU", "APA", "PALE_ALE_HAZY_NE", "PALE_ALE_OTHER",
                // IPAs
                "SESSION_IPA", "IPA_CLASSIC", "IPA_HAZY_NE", "IPA_STRONG", "IPA_OTHER", "BIPA",
                // Special beers
                "SAISON",
                // Sours — flemish red-brown, berliner weisse, oude geuze, oude kriek
                "SOUR_LIGHT", "SOUR_DARK", "OUDE_GEUZE", "OUDE_KRIEK",
                // Malt & Sweet
                "ALTBIER", "BOCKS_ALL", "SPECIALE_BELGE", "BELGE_AMBREE",
            ],

            ui: {
                columns: 3,
                showItemsInline: false,
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    layout: 'cards',
                    suppressUnassigned: true,
                    rows: [
                        {
                            title: "Lagers",
                            iconToken: "LAGERS",
                            buckets: ["LAGER_PILS", "HELLES", "DORTMUNDER", "LAGER_MEXICAN", "IPL", "KOLSCH", "LAGER_STRONG", "LAGER_ALE", "RAUCHBIER", "LAGER_PALE"],
                            keepEmpty: true,
                        },
                        {
                            title: "Wheat beers",
                            iconToken: "WHEAT_BEERS",
                            buckets: ["WHEAT_WIT", "WHEAT_WEIZEN", "WHEAT_DUNKEL", "WEIZENBOCK"],
                            keepEmpty: true,
                        },
                        {
                            title: "Normal Blond",
                            iconToken: "BLOND",
                            buckets: ["BLOND_ENKEL", "BELGIAN_BLONDE", "GOLDEN_ALES", "BLOND_STRONG", "BLOND_OTHER"],
                            keepEmpty: true,
                        },
                        {
                            title: "Hoppy Pale Ales",
                            iconToken: "PALE_ALE",
                            buckets: ["SESSION_PALE_ALE", "PALE_ALE_BELGIAN_EU", "APA", "PALE_ALE_HAZY_NE", "PALE_ALE_OTHER"],
                            keepEmpty: true,
                        },
                        {
                            title: "IPAs",
                            iconToken: "BLOND_BITTERS",
                            buckets: ["SESSION_IPA", "IPA_CLASSIC", "BIPA", "IPA_HAZY_NE", "IPA_STRONG", "IPA_OTHER"],
                            keepEmpty: true,
                        },
                        {
                            title: "Malt & Sweet",
                            iconToken: "DUBBEL",
                            buckets: ["SPECIALE_BELGE", "BELGE_AMBREE", "DARK_DUBBEL", "DARK_STRONG_QUAD", "ALTBIER", "DARK_BROWN_ALE", "DARK_BARLEYWINE", "AMBER_ALE", "DARK_OTHER", "BOCKS_ALL"],
                            keepEmpty: true,
                        },
                        {
                            title: "Dark · Coffee & Roast",
                            iconToken: "STOUT",
                            buckets: ["ROAST_PORTER", "ROAST_STOUT", "ROAST_IMPERIAL", "ROAST_SPECIALTY"],
                            keepEmpty: true,
                        },
                        {
                            title: "Sours",
                            iconToken: "SOURS_SAISON_LAMBIC_GUEUZE",
                            buckets: ["SOUR_LIGHT", "SOUR_DARK", "OUDE_GEUZE", "OUDE_KRIEK", "FRUIT_LAMBIC", "SOUR_OTHER"],
                            keepEmpty: true,
                        },
                        {
                            title: "Fruit beers",
                            iconToken: "FRUIT_BEERS",
                            buckets: ["FRUIT_CLASSIC"],
                            keepEmpty: true,
                        },
                        {
                            title: "Radlers",
                            iconToken: "RADLERS",
                            buckets: ["RADLER_ALL"],
                            keepEmpty: true,
                        },
                        {
                            title: "Flavoured & Hard",
                            iconToken: "SPIRIT_FLAVOURED_BEERS",
                            buckets: ["FLAVOURED_ALL"],
                            keepEmpty: true,
                        },
                        {
                            title: "Special beers",
                            iconToken: "BEERS_SPECIAL",
                            buckets: ["SPECIAL_ALL", "SPECIAL_BEERS_ALL", "MALT_LIQUOR_ALL", "KELLERBIER", "SAISON", "SOUR_FARMHOUSE"],
                            keepEmpty: true,
                        },
                        {
                            title: "Other / Unclassified",
                            iconToken: "BEERS_OTHER",
                            buckets: ["BEERS_OTHER_ALL"],
                            keepEmpty: true,
                        },
                    ],
                },
                // NO aggregateTop → triggers rowsOnlyMode in SummaryGrid
            },

            rollups: [
                // ===== LAGERS =====
                // Pils: clean pale lagers, pilsners
                { match: { baseIn: ["PILSNER_CZECH_/_BOHEMIAN","PILSNER_GERMAN","PILSNER_OTHER","LAGER_SVETLE_(CZECH_PALE)","LAGER_AMERICAN_LIGHT","LAGER_AMERICAN","LAGER_LEICHTBIER","LAGER_CORE","LAGER_PALE"] }, into: "LAGER_PILS", keepZero: true },
                // Individual lager sub-types
                { match: { baseIn: ["LAGER_HELLES"] }, into: "HELLES", keepZero: true },
                { match: { baseIn: ["LAGER_DORTMUNDER_/_EXPORT"] }, into: "DORTMUNDER", keepZero: true },
                { match: { baseIn: ["LAGER_MEXICAN"] }, into: "LAGER_MEXICAN", keepZero: true },
                { match: { baseIn: ["INDIA_PALE_LAGER","IPL"] }, into: "IPL", keepZero: true },
                { match: { baseIn: ["KOLSCH"] }, into: "KOLSCH", keepZero: true },
                { match: { baseIn: ["LAGER_STRONG"] }, into: "LAGER_STRONG", keepZero: true },
                { match: { baseIn: ["KELLERBIER_/_ZWICKELBIER"] }, into: "KELLERBIER", keepZero: true },
                // Ale-adjacent lagers: märzen, festbier (bocks, kölsch, kellerbier, lager-strong split out)
                { match: { baseIn: ["MARZEN","FESTBIER","LAGER_SPECIALS","LAGER_WINTER","LAGER_OTHER"] }, into: "LAGER_ALE", keepZero: true },
                // Bocks — own bucket so they can live in Dark · Malt & Sweet
                { match: { baseIn: ["BOCK_SINGLE_/_TRADITIONAL","BOCK_HELL_/_MAIBOCK_/_LENTEBOCK","BOCK_DOPPELBOCK","BOCK_EISBOCK"] }, into: "BOCKS_ALL", keepZero: true },
                // Rotbier: amber, red, vienna, dark, schwarzbier
                { match: { baseIn: ["LAGER_AMBER_/_RED","LAGER_AMERICAN_AMBER_/_RED","LAGER_VIENNA","LAGER_POLOTMAVE_(CZECH_AMBER)","LAGER_ROTBIER","RAUCHBIER","LAGER_DARK","LAGER_MUNICH_DUNKEL","SCHWARZBIER","LAGER_TMAVE_(CZECH_DARK)"] }, into: "RAUCHBIER", keepZero: true },

                // ===== WHEAT BEERS =====
                // Wit: Belgian witbier/blanche
                { match: { baseIn: ["WHEAT_BEER_WITBIER_/_BLANCHE","NON-ALCOHOLIC_BEER_WHEAT_BEER"] }, into: "WHEAT_WIT", keepZero: true },
                // Weizen: German hefeweizen family
                { match: { baseIn: ["WHEAT_BEER_HEFEWEIZEN","WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT","WHEAT_BEER_KRISTALLWEIZEN","WHEAT_BEER_AMERICAN_PALE_WHEAT","WHEAT_CLASSIC"] }, into: "WHEAT_WEIZEN", keepZero: true },
                // Dunkelweizen: dark wheat & specials
                { match: { baseIn: ["WHEAT_BEER_DUNKELWEIZEN","WHEAT_BEER_HOPFENWEISSE","ROGGENBIER","WHEAT_BEER_FRUITED","WHEAT_BEER_WHEAT_WINE","WHEAT_BEER_OTHER","WHEAT_OTHER"] }, into: "WHEAT_DUNKEL", keepZero: true },
                // Weizenbock: wheat bocks (split out of dunkelweizen)
                { match: { baseIn: ["BOCK_WEIZENBOCK","BOCK_WEIZENDOPPELBOCK"] }, into: "WEIZENBOCK", keepZero: true },

                // ===== NORMAL BLOND / AMBER =====
                // Enkel: patersbier only (speciale belge split out to Malt & Sweet)
                { match: { baseIn: ["BELGIAN_ENKEL_/_PATERSBIER"] }, into: "BLOND_ENKEL", keepZero: true },
                { match: { baseIn: ["SPECIALE_BELGE"] }, into: "SPECIALE_BELGE", keepZero: true },
                // Blond: split into Belgian Blonde vs Golden Ales
                { match: { baseIn: ["BELGIAN_BLONDE"] }, into: "BELGIAN_BLONDE", keepZero: true },
                { match: { baseIn: ["BLONDE_/_GOLDEN_ALE_AMERICAN","BLONDE_/_GOLDEN_ALE_ENGLISH","BLONDE_/_GOLDEN_ALE_OTHER","GOLDEN_ALE_UKRAINIAN"] }, into: "GOLDEN_ALES", keepZero: true },
                { match: { baseIn: ["BELGIAN_STRONG_GOLDEN_ALE","BELGIAN_TRIPEL","BIERE_DE_CHAMPAGNE_/_BIERE_BRUT"] }, into: "BLOND_STRONG", keepZero: true },
                { match: { baseIn: ["RED_ALE_AMERICAN_AMBER_/_RED","RED_ALE_IRISH","RED_ALE_OTHER","TRADITIONAL_ALE","WINTER_ALE","WINTER_WARMER"] }, into: "AMBER_ALE", keepZero: true },
                { match: { baseIn: ["BELGE_AMBREE"] }, into: "BELGE_AMBREE", keepZero: true },
                { match: { baseIn: ["BITTER_SESSION_/_ORDINARY","BITTER_BEST","BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)","CALIFORNIA_COMMON","AUSTRALIAN_SPARKLING_ALE","CREAM_ALE","CREAM_ALE_IMPERIAL_/_DOUBLE"] }, into: "BLOND_OTHER", keepZero: true },

                // ===== HOPPY & BITTER (Pale Ales) =====
                { match: { baseIn: ["PALE_ALE_SESSION","SESSION_ALE"] }, into: "SESSION_PALE_ALE", keepZero: true },
                { match: { baseIn: ["PALE_ALE_BELGIAN","PALE_ALE_ENGLISH"] }, into: "PALE_ALE_BELGIAN_EU", keepZero: true },
                { match: { baseIn: ["PALE_ALE_AMERICAN"] }, into: "APA", keepZero: true },
                { match: { baseIn: ["PALE_ALE_NEW_ENGLAND_/_HAZY"] }, into: "PALE_ALE_HAZY_NE", keepZero: true },
                { match: { baseIn: ["PALE_ALE_XPA_(EXTRA_PALE)","PALE_ALE_FRUITED","PALE_ALE_MILKSHAKE","PALE_ALE_AUSTRALIAN","PALE_ALE_NEW_ZEALAND","PALE_ALE_OTHER","RYE_BEER","RED_ALE_IMPERIAL_/_DOUBLE"] }, into: "PALE_ALE_OTHER", keepZero: true },
                { match: { baseIn: ["NON-ALCOHOLIC_BEER_PALE_ALE"] }, into: "PALE_ALE_BELGIAN_EU", keepZero: true },

                // ===== HOPPY & BITTER (IPAs) =====
                { match: { baseIn: ["IPA_SESSION"] }, into: "SESSION_IPA", keepZero: true },
                { match: { baseIn: ["IPA_AMERICAN","IPA_ENGLISH","IPA_NEW_ZEALAND"] }, into: "IPA_CLASSIC", keepZero: true },
                { match: { baseIn: ["IPA_BELGIAN"] }, into: "BIPA", keepZero: true },
                { match: { baseIn: ["IPA_NEW_ENGLAND_/_HAZY","IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY","IPA_TRIPLE_NEW_ENGLAND_/_HAZY"] }, into: "IPA_HAZY_NE", keepZero: true },
                { match: { baseIn: ["IPA_IMPERIAL_/_DOUBLE","IPA_TRIPLE","IPA_QUADRUPLE"] }, into: "IPA_STRONG", keepZero: true },
                { match: { baseIn: ["IPA_WHITE_/_WHEAT","IPA_COLD","IPA_BRUT","IPA_BLACK_/_CASCADIAN_DARK_ALE","IPA_RED","IPA_FRUITED","IPA_RYE","IPA_BRETT","IPA_BROWN","IPA_FARMHOUSE","IPA_OTHER","IPA_IMPERIAL_/_DOUBLE_BLACK","IPA_IMPERIAL_/_DOUBLE_MILKSHAKE"] }, into: "IPA_OTHER", keepZero: true },
                { match: { baseIn: ["NON-ALCOHOLIC_BEER_IPA"] }, into: "IPA_CLASSIC", keepZero: true },

                // ===== DARK · MALT & SWEET =====
                { match: { baseIn: ["BELGIAN_DUBBEL"] }, into: "DARK_DUBBEL", keepZero: true },
                { match: { baseIn: ["BELGIAN_STRONG_DARK_ALE","BELGIAN_QUADRUPEL","BARLEYWINE_AMERICAN","BARLEYWINE_ENGLISH","BARLEYWINE_OTHER","SCOTCH_ALE_/_WEE_HEAVY","SCOTTISH_ALE","SCOTTISH_EXPORT_ALE","STRONG_ALE_AMERICAN","STRONG_ALE_ENGLISH","STRONG_ALE_OTHER","OLD_/_STOCK_ALE","RYE_WINE"] }, into: "DARK_STRONG_QUAD", keepZero: true },
                { match: { baseIn: ["ALTBIER_TRADITIONAL","ALTBIER_STICKE"] }, into: "ALTBIER", keepZero: true },
                { match: { baseIn: ["BROWN_ALE_AMERICAN","BROWN_ALE_BELGIAN","BROWN_ALE_ENGLISH","BROWN_ALE_IMPERIAL_/_DOUBLE","BROWN_ALE_OTHER","MILD_LIGHT","MILD_DARK","MILD_OTHER","DARK_ALE"] }, into: "DARK_BROWN_ALE", keepZero: true },
                { match: { baseIn: ["BELGIAN_STRONG_DARK_ALE_WINTER","CHRISTMAS_ALE","DARK_STRONG"] }, into: "DARK_BARLEYWINE", keepZero: true },
                { match: { baseIn: ["DARK_BEER_OTHER"] }, into: "DARK_OTHER", keepZero: true },

                // ===== DARK · COFFEE & ROAST =====
                { match: { baseIn: ["PORTER_ENGLISH","PORTER_AMERICAN","PORTER_BALTIC","PORTER_COFFEE","PORTER_SMOKED","PORTER_OTHER","PORTER_STOUT_CLASSIC"] }, into: "ROAST_PORTER", keepZero: true },
                { match: { baseIn: ["STOUT_IRISH_DRY","STOUT_ENGLISH","STOUT_FOREIGN_/_EXPORT","STOUT_OATMEAL","STOUT_MILK_/_SWEET","STOUT_COFFEE","STOUT_PASTRY","STOUT_OYSTER","STOUT_OTHER"] }, into: "ROAST_STOUT", keepZero: true },
                { match: { baseIn: ["STOUT_RUSSIAN_IMPERIAL","STOUT_IMPERIAL_/_DOUBLE","STOUT_IMPERIAL_/_DOUBLE_COFFEE","STOUT_IMPERIAL_/_DOUBLE_MILK","STOUT_IMPERIAL_/_DOUBLE_OATMEAL","STOUT_IMPERIAL_/_DOUBLE_PASTRY","STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN","IMPERIAL_STOUTS","PASTRY_STOUTS"] }, into: "ROAST_IMPERIAL", keepZero: true },
                { match: { baseIn: ["SCHWARZBIER"] }, into: "ROAST_SPECIALTY", keepZero: true },

                // ===== SOURS & SAISONS =====
                { match: { baseIn: ["SOUR_BERLINER_WEISSE","SOUR_TRADITIONAL_GOSE","SOUR_OTHER_GOSE","SOUR_FRUITED_GOSE","SOUR_FRUITED_BERLINER_WEISSE","SOUR_CATHARINA","SOUR_TOMATO_/_VEGETABLE_GOSE","NON-ALCOHOLIC_BEER_SOUR"] }, into: "SOUR_LIGHT", keepZero: true },
                { match: { baseIn: ["SOUR_FLANDERS_OUD_BRUIN","SOUR_FLANDERS_RED_ALE","SOUR_FRUITED","SOUR_OTHER","SOUR_FAMILY","SOUR_SMOOTHIE_/_PASTRY","SMOOTHIE_SOUR","SMOOTHIE_SOUR_IG","IPA_SOUR","WILD_ALE_AMERICAN","WILD_ALE_OTHER","WILD_BRETT","BRETT_BEER"] }, into: "SOUR_DARK", keepZero: true },
                { match: { baseIn: ["LAMBIC_TRADITIONAL","LAMBIC_GUEUZE","LAMBIC_OTHER"] }, into: "OUDE_GEUZE", keepZero: true },
                { match: { baseIn: ["LAMBIC_KRIEK"] }, into: "OUDE_KRIEK", keepZero: true },
                { match: { baseIn: ["FARMHOUSE_ALE_SAISON","FARMHOUSE_ALE_BIERE_DE_GARDE","FARMHOUSE_ALE_BIERE_DE_MARS","FARMHOUSE_ALE_BIERE_DE_COUPAGE","FARMHOUSE_ALE_GRISETTE","FARMHOUSE_ALE_BRETT","FARMHOUSE_ALE_OTHER","FARMHOUSE_ALE_SAHTI","FARMHOUSE_ALE_KORNOL"] }, into: "SOUR_FARMHOUSE", keepZero: true },
                { match: { baseIn: ["SOUR_BEER_OTHER"] }, into: "SOUR_OTHER", keepZero: true },

                // ===== FRUIT BEERS =====
                { match: { baseIn: ["FRUIT_BEER","BLOND_FRUITED","FRUIT_DOMINANT","FRUIT_BEER_IG"] }, into: "FRUIT_CLASSIC", keepZero: true },
                { match: { baseIn: ["LAMBIC_FRUIT","LAMBIC_FRAMBOISE","LAMBIC_FARO"] }, into: "FRUIT_LAMBIC", keepZero: true },

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
                { match: { baseIn: ["SPECIAL_BEERS"] }, into: "SPECIAL_BEERS_ALL", keepZero: true },
                { match: { baseIn: ["MALT_LIQUOR","MALT_BEER"] }, into: "MALT_LIQUOR_ALL", keepZero: true },

                // ===== OTHER / CATCH-ALL =====
                { match: { baseIn: ["KVASS","BEER_SODA_MIX","CORN_BEER_/_CHICHA_DE_JORA","SORGHUM_/_MILLET_BEER","KOJI_/_GINJO_BEER","MAKGEOLLI","SPECIALTY_GRAIN","SPICED_/_HERBED_BEER","PUMPKIN_/_YAM_BEER","CHILLI_/_CHILE_BEER","HONEY_BEER","GRAPE_ALE_ITALIAN","GRAPE_ALE_OTHER","HAPPOSHU","SMOKED_BEER","HISTORICAL_BEER_OTHER","HISTORICAL_ODDITIES"] }, into: "BEERS_OTHER_ALL", keepZero: true },
            ],

            sortPriority: [],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De <strong>stijlkaart</strong> — alle bierfamilies als rijen</>,
                line2: <> <strong>subsubcategorie</strong> per familie </>,
            },
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
            showItemsInline: false,
            aggregateRows: {
                enabled: true,
                deterministic: true,
                layout: 'cards',
                suppressUnassigned: true,
                rows: [
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
                        keepEmpty: true,
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
                        keepEmpty: true,
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
                        keepEmpty: true,
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
            willyOff: true,
            name: <>Herkomst — stijlen per land</>,
            section: "beers",
            groupBy: "subsubcategory",
            within: { category: "BEERS" },
            predicates: [{ field: "is_zero", op: "eq", value: 0 }],
            includeEmpty: false,

            forceShow: [],

            ui: {
                columns: 3,
                showItemsInline: false,
                aggregateRows: {
                    enabled: true,
                    deterministic: true,
                    layout: 'cards',
                    rows: [
                        {
                            title: "Belgium",
                            iconToken: "BELGIUM",
                            buckets: ["BE_BLOND", "BE_WHITE", "BE_BELGIAN_ALE_MISC", "BE_DUBBEL", "BE_TRIPEL_STRONG_GOLDEN", "BE_STRONG_DARK_QUAD", "BE_SAISON_GRISETTE", "BE_BELGIAN_IPA", "BE_FLANDERS_SOURS", "BE_LAMBIC_FAMILY"],
                            keepEmpty: true,
                        },
                        {
                            title: "Germany",
                            iconToken: "GERMANY",
                            buckets: ["DE_PILS", "DE_LAGER_CLASSIC", "DE_KOLSCH", "DE_WEIZEN", "DE_MARZEN_FESTBIER", "DE_BOCK_FAMILY", "DE_SMOKED", "DE_DARK_SPECIALTY", "DE_GERMAN_SOURS"],
                            keepEmpty: true,
                        },
                        {
                            title: "United Kingdom",
                            iconToken: "UK",
                            buckets: ["UK_BITTER", "UK_PALE_GOLDEN", "UK_BROWN_MILD", "UK_PORTER_STOUT", "UK_SCOTTISH", "UK_BARLEYWINE_STOCK", "UK_IPA"],
                            keepEmpty: true,
                        },
                        {
                            title: "United States",
                            iconToken: "US",
                            buckets: ["US_LAGER", "US_CRAFT_PALE", "US_IPA", "US_DARK", "US_AMBER_STRONG", "US_SOUR_WILD"],
                            keepEmpty: true,
                        },
                        {
                            title: "Czech Republic",
                            iconToken: "EUROPE",
                            buckets: ["CZ_PALE", "CZ_AMBER_DARK"],
                        },
                        {
                            title: "Other",
                            iconToken: "WORLD",
                            catchAll: true,
                        },
                    ],
                },
            },

            rollups: [
                // ===== BELGIUM =====
                { match: { baseIn: ["BELGIAN_BLONDE"] }, into: "BE_BLOND", keepZero: true },
                { match: { baseIn: ["WHEAT_BEER_WITBIER_/_BLANCHE"] }, into: "BE_WHITE", keepZero: true },
                { match: { baseIn: ["BELGIAN_DUBBEL"] }, into: "BE_DUBBEL", keepZero: true },
                { match: { baseIn: ["BELGIAN_TRIPEL", "BELGIAN_STRONG_GOLDEN_ALE", "BIERE_DE_CHAMPAGNE_/_BIERE_BRUT"] }, into: "BE_TRIPEL_STRONG_GOLDEN", keepZero: true },
                { match: { baseIn: ["BELGIAN_STRONG_DARK_ALE", "BELGIAN_QUADRUPEL", "BELGIAN_STRONG_DARK_ALE_WINTER", "CHRISTMAS_ALE"] }, into: "BE_STRONG_DARK_QUAD", keepZero: true },
                { match: { baseIn: ["LAMBIC_TRADITIONAL", "LAMBIC_GUEUZE", "LAMBIC_KRIEK", "LAMBIC_FARO", "LAMBIC_FRUIT", "LAMBIC_FRAMBOISE", "LAMBIC_OTHER"] }, into: "BE_LAMBIC_FAMILY", keepZero: false },
                { match: { baseIn: ["FARMHOUSE_ALE_SAISON", "FARMHOUSE_ALE_GRISETTE"] }, into: "BE_SAISON_GRISETTE", keepZero: false },
                { match: { baseIn: ["SOUR_FLANDERS_OUD_BRUIN", "SOUR_FLANDERS_RED_ALE"] }, into: "BE_FLANDERS_SOURS", keepZero: false },
                { match: { baseIn: ["IPA_BELGIAN"] }, into: "BE_BELGIAN_IPA", keepZero: true },
                { match: { baseIn: ["BELGIAN_ENKEL_/_PATERSBIER", "PALE_ALE_BELGIAN", "BROWN_ALE_BELGIAN", "STOUT_BELGIAN", "SPECIALE_BELGE", "BELGE_AMBREE"] }, into: "BE_BELGIAN_ALE_MISC", keepZero: true },

                // ===== GERMANY =====
                { match: { baseIn: ["PILSNER_GERMAN", "LAGER_LEICHTBIER"] }, into: "DE_PILS", keepZero: true },
                { match: { baseIn: ["LAGER_HELLES", "LAGER_DORTMUNDER_/_EXPORT", "KELLERBIER_/_ZWICKELBIER"] }, into: "DE_LAGER_CLASSIC", keepZero: true },
                { match: { baseIn: ["KOLSCH"] }, into: "DE_KOLSCH", keepZero: true },
                { match: { baseIn: ["WHEAT_BEER_HEFEWEIZEN", "WHEAT_BEER_HEFEWEIZEN_LIGHT_/_LEICHT", "WHEAT_BEER_DUNKELWEIZEN", "WHEAT_BEER_KRISTALLWEIZEN", "WHEAT_BEER_HOPFENWEISSE", "ROGGENBIER"] }, into: "DE_WEIZEN", keepZero: true },
                { match: { baseIn: ["MARZEN", "FESTBIER", "LAGER_AMBER_/_RED", "LAGER_ROTBIER"] }, into: "DE_MARZEN_FESTBIER", keepZero: true },
                { match: { baseIn: ["BOCK_SINGLE_/_TRADITIONAL", "BOCK_HELL_/_MAIBOCK_/_LENTEBOCK", "BOCK_DOPPELBOCK", "BOCK_WEIZENBOCK", "BOCK_WEIZENDOPPELBOCK", "BOCK_EISBOCK"] }, into: "DE_BOCK_FAMILY", keepZero: true },
                { match: { baseIn: ["RAUCHBIER"] }, into: "DE_SMOKED", keepZero: true },
                { match: { baseIn: ["SCHWARZBIER", "LAGER_MUNICH_DUNKEL", "LAGER_DARK"] }, into: "DE_DARK_SPECIALTY", keepZero: true },
                { match: { baseIn: ["SOUR_BERLINER_WEISSE", "SOUR_TRADITIONAL_GOSE", "SOUR_OTHER_GOSE"] }, into: "DE_GERMAN_SOURS", keepZero: true },

                // ===== UNITED KINGDOM =====
                { match: { baseIn: ["BITTER_SESSION_/_ORDINARY", "BITTER_BEST", "BITTER_EXTRA_SPECIAL_/_STRONG_(ESB)"] }, into: "UK_BITTER", keepZero: true },
                { match: { baseIn: ["PALE_ALE_ENGLISH", "BLONDE_/_GOLDEN_ALE_ENGLISH"] }, into: "UK_PALE_GOLDEN", keepZero: true },
                { match: { baseIn: ["BROWN_ALE_ENGLISH", "MILD_LIGHT", "MILD_DARK", "MILD_OTHER", "TRADITIONAL_ALE"] }, into: "UK_BROWN_MILD", keepZero: true },
                { match: { baseIn: ["PORTER_ENGLISH", "STOUT_ENGLISH", "PORTER_STOUT_CLASSIC"] }, into: "UK_PORTER_STOUT", keepZero: true },
                { match: { baseIn: ["BARLEYWINE_ENGLISH", "OLD_/_STOCK_ALE", "STRONG_ALE_ENGLISH"] }, into: "UK_BARLEYWINE_STOCK", keepZero: true },
                { match: { baseIn: ["SCOTCH_ALE_/_WEE_HEAVY", "SCOTTISH_ALE", "SCOTTISH_EXPORT_ALE"] }, into: "UK_SCOTTISH", keepZero: true },
                { match: { baseIn: ["IPA_ENGLISH"] }, into: "UK_IPA", keepZero: true },

                // ===== UNITED STATES =====
                { match: { baseIn: ["LAGER_AMERICAN", "LAGER_AMERICAN_LIGHT", "PILSNER_OTHER", "LAGER_AMERICAN_AMBER_/_RED"] }, into: "US_LAGER", keepZero: true },
                { match: { baseIn: ["PALE_ALE_AMERICAN", "BLONDE_/_GOLDEN_ALE_AMERICAN", "CREAM_ALE", "CREAM_ALE_IMPERIAL_/_DOUBLE", "CALIFORNIA_COMMON", "PALE_ALE_SESSION", "SESSION_ALE", "PALE_ALE_HAZY_NE", "PALE_ALE_MILKSHAKE", "PALE_ALE_XPA_(EXTRA_PALE)", "PALE_ALE_FRUITED", "PALE_ALE_OTHER", "NON-ALCOHOLIC_BEER_PALE_ALE"] }, into: "US_CRAFT_PALE", keepZero: true },
                { match: { baseIn: ["IPA_AMERICAN", "IPA_NEW_ENGLAND_/_HAZY", "IPA_IMPERIAL_/_DOUBLE", "IPA_IMPERIAL_/_DOUBLE_NEW_ENGLAND_/_HAZY", "IPA_TRIPLE_NEW_ENGLAND_/_HAZY", "IPA_COLD", "IPA_BRUT", "IPA_BLACK_/_CASCADIAN_DARK_ALE", "IPA_RED", "IPA_WHITE_/_WHEAT", "IPA_FRUITED", "IPA_RYE", "IPA_BRETT", "IPA_FARMHOUSE", "IPA_OTHER", "IPA_TRIPLE", "IPA_QUADRUPLE", "IPA_SESSION", "IPA_IMPERIAL_/_DOUBLE_BLACK", "IPA_IMPERIAL_/_DOUBLE_MILKSHAKE", "IPA_NEW_ZEALAND", "NON-ALCOHOLIC_BEER_IPA"] }, into: "US_IPA", keepZero: true },
                { match: { baseIn: ["PORTER_AMERICAN", "PORTER_COFFEE", "PORTER_SMOKED", "PORTER_OTHER", "PORTER_BALTIC", "STOUT_RUSSIAN_IMPERIAL", "STOUT_IMPERIAL_/_DOUBLE", "STOUT_IMPERIAL_/_DOUBLE_COFFEE", "STOUT_IMPERIAL_/_DOUBLE_MILK", "STOUT_IMPERIAL_/_DOUBLE_OATMEAL", "STOUT_IMPERIAL_/_DOUBLE_PASTRY", "STOUT_IMPERIAL_/_DOUBLE_WHITE_/_GOLDEN", "IMPERIAL_STOUTS", "PASTRY_STOUTS", "STOUT_MILK_/_SWEET", "STOUT_OATMEAL", "STOUT_PASTRY", "STOUT_COFFEE", "STOUT_OYSTER", "STOUT_OTHER"] }, into: "US_DARK", keepZero: true },
                { match: { baseIn: ["RED_ALE_AMERICAN_AMBER_/_RED", "STRONG_ALE_AMERICAN", "BARLEYWINE_AMERICAN", "RYE_WINE", "STRONG_ALE_OTHER"] }, into: "US_AMBER_STRONG", keepZero: true },
                { match: { baseIn: ["WILD_ALE_AMERICAN", "BRETT_BEER", "WILD_BRETT", "WILD_ALE_OTHER", "IPA_SOUR", "SOUR_CATHARINA", "SOUR_SMOOTHIE_/_PASTRY", "SMOOTHIE_SOUR", "SMOOTHIE_SOUR_IG", "SOUR_FRUITED", "SOUR_FRUITED_BERLINER_WEISSE", "SOUR_FRUITED_GOSE", "SOUR_TOMATO_/_VEGETABLE_GOSE", "SOUR_OTHER", "SOUR_BEER_OTHER", "SOUR_FAMILY", "NON-ALCOHOLIC_BEER_SOUR"] }, into: "US_SOUR_WILD", keepZero: true },

                // ===== CZECH REPUBLIC =====
                { match: { baseIn: ["PILSNER_CZECH_/_BOHEMIAN", "LAGER_SVETLE_(CZECH_PALE)", "LAGER_CORE"] }, into: "CZ_PALE", keepZero: true },
                { match: { baseIn: ["LAGER_POLOTMAVE_(CZECH_AMBER)", "LAGER_TMAVE_(CZECH_DARK)"] }, into: "CZ_AMBER_DARK", keepZero: true },

                // ===== OTHER =====
                { match: { baseIn: ["STOUT_IRISH_DRY", "STOUT_FOREIGN_/_EXPORT", "RED_ALE_IRISH"] }, into: "OTHER_IRISH", keepZero: true },
                { match: { baseIn: ["PALE_ALE_AUSTRALIAN", "PALE_ALE_NEW_ZEALAND", "AUSTRALIAN_SPARKLING_ALE", "BLONDE_/_GOLDEN_ALE_OTHER", "GOLDEN_ALE_UKRAINIAN", "LAGER_MEXICAN"] }, into: "OTHER_GLOBAL", keepZero: true },
                { match: { baseIn: ["LAGER_VIENNA", "LAGER_SPECIALS", "LAGER_WINTER", "LAGER_OTHER", "LAGER_PALE", "RED_ALE_OTHER", "WINTER_ALE", "WINTER_WARMER", "FARMHOUSE_ALE_BIERE_DE_GARDE", "FARMHOUSE_ALE_BIERE_DE_MARS", "FARMHOUSE_ALE_BIERE_DE_COUPAGE", "FARMHOUSE_ALE_OTHER", "FARMHOUSE_ALE_SAHTI", "FARMHOUSE_ALE_KORNOL", "FARMHOUSE_ALE_BRETT", "BARLEYWINE_OTHER", "BROWN_ALE_AMERICAN", "BROWN_ALE_OTHER", "BROWN_ALE_IMPERIAL_/_DOUBLE", "DARK_ALE", "DARK_STRONG", "DARK_BEER_OTHER"] }, into: "OTHER_INTL", keepZero: false },
            ],

            sortPriority: [],

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

