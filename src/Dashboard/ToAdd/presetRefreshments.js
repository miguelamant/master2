import { presetImg } from './utils/presetImages';

export const PRESET_FILTERS_REFRESHMENTS = [

    {
        id: 1001,
        name: <> <strong> </strong>!<br/> Iedereen die op zoek is naar iets verfrissends. </>,
        section: "refreshments",
        groupBy: "subcategory",
        within: {},
        predicates: [],
        includeEmpty: false,
        forceShow: ["COLA",
            "ICE_TEA",
            "LEMONADES",
            "GINGER_DRINKS",
            "TONICS",
            "JUICES_CONCENTRATE",
            "KOMBUCHA",
            "SPORTDRINKS",
            "ENERGY_DRINKS",
            "MILK_BASED",
            "NFC"
        ],
        info: {
            image: presetImg("Fijn-proever.png"),
            line1: <>De verdeling tussen <strong> smaken </strong> voor je <br/> </>,
            line2: <> <strong> verfrissende dranken </strong> is <strong>  </strong> </>
        }
    },
        {
            id: 1002,
            name: <> <strong> Zonder suiker aub </strong>!<br/> Suikervrij producten zijn in opmars. </>,
            section: "refreshments",
            groupBy: "category",

            // Count only REFRESHMENTS items in these subcategories
            within: {
                category: "REFRESHMENTS",

            },
            // keep it strictly to beers

            filters: { category: "REFRESHMENTS" },

            predicates: [],

            partitionBy: [
                { label: "With sugar", predicates: [{ field: "is_zero", op: "eq", value: 0 }] },
                { label: "Zero",       predicates: [{ field: "is_zero", op: "eq", value: 1 }] }
            ],

            forceShow: [
                "REFRESHMENTS · Zero",
                "REFRESHMENTS · With sugar"
            ],

            sortPriority: [
                "REFRESHMENTS · Zero",
                "REFRESHMENTS · With sugar"
            ],

            includeEmpty: false,

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> suikervrij </strong> en normaal  <br/>  voor je</>,
                line2: <> <strong> verfrissende dranken </strong> is <strong>  </strong> </>
            }
        }
        /*
         subcategory_in: [
                            "COLA",
                            "ICE_TEA",
                            "LEMONADES",
                            "GINGER_DRINKS",
                            "TONICS",
                            "SPORTDRINKS",
                            "ENERGY_DRINKS"
                        ]
         */
        ,
        {
            id: 1003,
            name: <> <strong> Zonder suiker aub </strong>!<br/> Suikervrij producten zijn in opmars. </>,
            section: "refreshments",
            groupBy: "subcategory",

            // Show ONLY these five subcategories (hides all others)
            within: {
                subcategory_in: ["COLA", "ICE_TEA", "LEMONADES", "GINGER_DRINKS", "TONICS"]
            },

            // No is_zero predicate → includes both 0 and 1
            predicates: [],
            includeEmpty: false,

            // Optional: show both buckets per subcategory
            partitionBy: [

                { label: "With sugar",  predicates: [{ field: "is_zero", op: "eq", value: 0 }] },
                { label: "Zero",        predicates: [{ field: "is_zero", op: "eq", value: 1 }] }
            ],

            // Keep these visible even if their count is 0
            forceShow: [
                "COLA · Zero", "COLA · With sugar",
                "ICE_TEA · Zero", "ICE_TEA · With sugar",
                "LEMONADES · Zero", "LEMONADES · With sugar",
                "GINGER_DRINKS · Zero", "GINGER_DRINKS · With sugar",
                "TONICS · Zero", "TONICS · With sugar"
            ],

            // Control rendering order
            sortPriority: [
                "COLA · Zero", "COLA · With sugar",
                "ICE_TEA · Zero", "ICE_TEA · With sugar",
                "LEMONADES · Zero", "LEMONADES · With sugar",
                "GINGER_DRINKS · Zero", "GINGER_DRINKS · With sugar",
                "TONICS · Zero", "TONICS · With sugar"
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> smaken </strong> en normaal, <br/> voor deze </>,
                line2: <> <strong> dranken </strong> is <strong>  </strong> </>
            }
        }
        ,

        {
            id: 1004,
            name: <> <strong>Ice tea's </strong>!<br/> De ice-tea lovers. </>,
            section: "refreshments",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["ICE_TEA"] },
            predicates: [],
            partitionBy: [
                { field: "is_sparkling", value: 1, label: "Sparkling" },
                { field: "is_sparkling", value: 0, label: "Still" }
            ],

            // ensure these 4 rows render even if count is 0
            forceShow: [
                "ICE_TEA_BLACK · Sparkling",
                "ICE_TEA_BLACK · Still",
                "ICE_TEA_GREEN · Sparkling",
                "ICE_TEA_GREEN · Still"
            ],

            // render order
            sortPriority: [
                "ICE_TEA_BLACK · Sparkling",
                "ICE_TEA_BLACK · Still",
                "ICE_TEA_GREEN · Sparkling",
                "ICE_TEA_GREEN · Still"
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> bruisend vs plat </strong> voor je <br/> </>,
                line2: <> <strong> ice-tea's </strong> is <strong>  </strong> </>
            }
        }
        ,

        // 4) Ice-tea, groupBy subsubcategory, partitionBy is_sparkling (0 & 1) AND is_zero
        // Ice Tea × carbonation & sugar (4 buckets)
        {
            id: 1005,
            name: <> <strong>Ice tea's </strong>!<br/> De ice-tea lovers. </>,
            section: "refreshments",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["ICE_TEA"] },
            predicates: [],
            partitionBy: [
                { field: "is_zero", value: 1, label: "Zero" },
                { field: "is_zero", value: 0, label: "With sugar" }
            ],

            // ensure these render even when their counts are 0
            forceShow: [
                "ICE_TEA_BLACK · Zero",
                "ICE_TEA_BLACK · With sugar",
                "ICE_TEA_GREEN · Zero",
                "ICE_TEA_GREEN · With sugar"
            ],

            // desired order
            sortPriority: [
                "ICE_TEA_BLACK · Zero",
                "ICE_TEA_BLACK · With sugar",
                "ICE_TEA_GREEN · Zero",
                "ICE_TEA_GREEN · With sugar"
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> zero vs normaal </strong> voor je <br/> </>,
                line2: <> <strong> ice-tea's </strong> is <strong>  </strong> </>
            }
        }

        ,

        {
            id: 1006,
            name: <> <strong> Lemonades </strong>!<br/> De lemonade lovers. </>,
            section: "refreshments",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["LEMONADES"] },
            predicates: [],
            forceShow: [
                "LEMONADES_AGRUM",
                "LEMONADES_APPLE",
                "LEMONADES_BERRY",
                "LEMONADES_LEMON_LIME",
                "LEMONADES_ORANGE",
                "LEMONADES_TROPICAL"
            ],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> smaken </strong> voor je <br/> </>,
                line2: <> <strong> lemonades </strong> is <strong>  </strong> </>
            }
        }
        ,

        // 6.Lemonades × carbonation & sugar (4 buckets)
        {
            id: 1007,
            name: <> <strong> Lemonades </strong>!<br/> De lemonade lovers die het graag suikervrij willen</>,
            section: "refreshments",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["LEMONADES"] },
            predicates: [],
            partitionBy: [
                { field: "is_zero", value: 1, label: "Zero" },
                { field: "is_zero", value: 0, label: "With sugar" }
            ],

            // ensure these render even when empty
            forceShow: [
                "LEMONADES_AGRUM · Zero",
                "LEMONADES_AGRUM · With sugar",
                "LEMONADES_LEMON_LIME · Zero",
                "LEMONADES_LEMON_LIME · With sugar",
                "LEMONADES_ORANGE · Zero",
                "LEMONADES_ORANGE · With sugar"
            ],

            // preferred ordering in the grid
            sortPriority: [
                "LEMONADES_AGRUM · Zero",
                "LEMONADES_AGRUM · With sugar",
                "LEMONADES_LEMON_LIME · Zero",
                "LEMONADES_LEMON_LIME · With sugar",
                "LEMONADES_ORANGE · Zero",
                "LEMONADES_ORANGE · With sugar"
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> suikervrij </strong> en normaal, <br/> voor jouw </>,
                line2: <> <strong> lemonades </strong> is <strong>  </strong> </>
            }
        },



// 7) Cola, groupBy Subcategory, partitionBy is_zero
        {
            id: 1008,
            name: <> <strong> Cola </strong>!<br/> De cola lovers. </>,
            section: "refreshments",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["COLA"] }, // <-- restrict strictly to COLAS
            predicates: [],
            partitionBy: [
                { field: "is_zero", value: 1, label: "Zero" },
                { field: "is_zero", value: 0, label: "With sugar" }
            ],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> smaken en suikervrij </strong> <br/> voor je </>,
                line2: <> <strong> cola's </strong> is <strong>  </strong> </>
            }
        },


        // 8) Juices, group by subsubcategory
        {
            id: 1009,
            name: <> <strong> Sappen </strong>!<br/> Zij die graag sappen drinken. </>,
            section: "refreshments",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["JUICES_NFC", "JUICES_CONCENTRATE"] },
            predicates: [],
            forceShow: [
                "JUICES_CONCENTRATE_APPLE",
                "JUICES_CONCENTRATE_MULTI_JUICE",
                "JUICES_CONCENTRATE_ORANGE",
                "JUICES_CONCENTRATE_APPLE_CHERRY",
                "JUICES_CONCENTRATE_GRAPEFRUIT",
                "JUICES_CONCENTRATE_TOMATO",

            ],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> smaken </strong> <br/> voor jouw </>,
                line2: <> <strong> sappen </strong> is <strong>  </strong> </>
            }
        },

// 9) Ginger-drinks, groupBy subsubcategory, partitionBy is_zero
        {
            id: 1010,
            name: <> <strong> Ginger drinks </strong>!<br/> Zij die graag gembersmaak drinken. </>,
            section: "refreshments",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["GINGER_DRINKS"] }, // <-- correct key
            predicates: [],
            partitionBy: [
                { field: "is_zero", value: 1, label: "Zero" },
                { field: "is_zero", value: 0, label: "With sugar" }
            ],
            forceShow: [
                "GINGER_ALE · With sugar",
                "GINGER_BEER · With sugar",
                "GINGER_ALE · Zero",
                "GINGER_BEER · Zero",


            ],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> smaken en suikergehaltes </strong> <br/> voor je </>,
                line2: <> <strong> gemberdranken </strong> is <strong>  </strong> </>
            }
        },


        // 10) Tonics, groupBy subsubcategory, partitionBy is_zero
        {
            id: 1011,
            name: <> <strong> Sappen </strong>!<br/> Zij die kinine lekker vinden. </>,
            section: "refreshments",
            groupBy: "subsubcategory",
            within: { subcategory_in: ["TONICS"] },
            predicates: [],
            forceShow: [

                "TONIC_LEMONADES · With sugar",
                "TONIC_WATER · With sugar",
                "TONIC_LEMONADES · Zero",
                "TONIC_WATER · Zero",



            ],
            partitionBy: [
                { field: "is_zero", value: 1, label: "Zero" },
                { field: "is_zero", value: 0, label: "With sugar" }
            ],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> smaken en suikergehaltes  </strong> <br/> voor je </>,
                line2: <> <strong> tonics </strong> is <strong>  </strong> </>
            }
        },


       //Eco-lovers & local-lovers
        {
            id: 1014,
            name: (
                <>
                    <strong>Local & eco-bewuste gasten:</strong>!<br />
                    Drinken graag iets gemaakt van het huis, zonder verpakking. Dat is een eco-friendly en heeft goede marges
                </>
            ),
            section: "refreshments",

            // ✅ split per SUBCATEGORY
            groupBy: "subcategory",

            // ✅ no within / no partitionBy (as requested)
            within: {},
            predicates: [],

            // ✅ roll up every subcategory into one bucket, except "NFC"
            // This assumes the *group label* returned by your API is exactly "NFC" for that subcategory.
            // Everything else collapses into "TONICS_OTHER".
            rollups: [
                {
                    match: { baseNotIn: ["NFC"] },
                    into: "Ready-to-drink",
                    keepZero: true
                }
            ],

            // ✅ ensure both appear even if missing
            forceShow: ["NFC", "Ready-to-drink"],

            // ✅ ordering
            sortPriority: ["NFC", "TONICS_OTHER"],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> homemade </strong> en normaal, <br/> voor jouw </>,
                line2: <> <strong> dranken </strong> is <strong>  </strong> </>
            }
        }

        ,


        // 10) Tonics, groupBy subsubcategory, partitionBy is_zero
        {
            id: 1015,
            name: <>
                <strong>Healthy</strong>!<br/>
                Bied je voldoende gezonde drankjes aan?
            </>,
            section: "refreshments",

            // We want counts per subcategory across ALL refreshments
            groupBy: "subcategory",
            within: {},

            // no preset-level predicates; we’ll do the split via partitionBy
            predicates: [],

            // Split into Prebiotica vs No prebiotica
            partitionBy: [
                { field: "is_prebiotic", value: 1, label: "With prebiotics" },
                { field: "is_prebiotic", value: 0, label: "No prebiotics" },
            ],

            // Rollups:
            // 1) KOMBUCHA should be rolled up as one bucket (regardless of 0/1)
            // 2) VITAMIN_WATER should be rolled up as one bucket (regardless of 0/1)
            // 3) Everything else grouped into two totals:
            //    - All remaining subcategories where prebiotica = 0
            //    - All remaining subcategories where prebiotica = 1
            rollups: [
                // KOMBUCHA total (regardless of partition)
                {
                    match: { baseIn: ["KOMBUCHA"] },
                    into: "KOMBUCHA (total)",
                    keepZero: true
                },

                // VITAMIN_WATER total (regardless of partition)
                {
                    match: { baseIn: ["VITAMIN_WATER"] },
                    into: "VITAMIN_WATER (total)",
                    keepZero: true
                },

                // Remaining WITH prebiotica (exclude kombucha + vitamin water)
                {
                    match: {
                        partitionLabel: "With prebiotics",
                        baseNotIn: ["KOMBUCHA", "VITAMIN_WATER"]
                    },
                    into: "Prebiotic drinks",
                    keepZero: true
                },

                // Remaining WITHOUT prebiotica (exclude kombucha + vitamin water)
                {
                    match: {
                        partitionLabel: "No prebiotics",
                        baseNotIn: ["KOMBUCHA", "VITAMIN_WATER"]
                    },
                    into: "ALL OTHER - No prebiotics",
                    keepZero: true
                }
            ],

            // Make sure your totals always show up even when empty
            forceShow: [
                "KOMBUCHA (total)",
                "VITAMIN_WATER (total)",
                "Prebiotic drinks",

            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> gezond </strong> en normaal, <br/> voor jouw </>,
                line2: <> <strong> dranken </strong> is <strong>  </strong> </>
            }
        }

,
        {
            id: 1016,
            name: <>
                <strong>Protein focus</strong>!<br/>
                Toon sport/energy/vitamin apart, en bundel de rest op protein.
            </>,
            section: "refreshments",
            groupBy: "subcategory",
            within: {},
            predicates: [],

            partitionBy: [
                { field: "is_protein", value: 1, label: "With protein" },
                { field: "is_protein", value: 0, label: "Without protein" },
            ],

            rollups: [
                // Fixed buckets (regardless of partition)
                {
                    match: { baseIn: ["VITAMIN_WATER"] },
                    into: "VITAMIN_WATER (total)",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["SPORTDRINKS"] },
                    into: "SPORTDRINKS (total)",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["ENERGY_DRINKS"] },
                    into: "ENERGY_DRINKS (total)",
                    keepZero: true,
                },

                // Remaining WITH protein (exclude the fixed buckets)
                {
                    match: {
                        partitionLabel: "With protein",
                        baseNotIn: ["VITAMIN_WATER", "SPORTDRINKS", "ENERGY_DRINKS"],
                    },
                    into: "Protein drinks",
                    keepZero: true,
                },

                // Remaining WITHOUT protein (exclude the fixed buckets)
                {
                    match: {
                        partitionLabel: "Without protein", // ✅ was "No protein"
                        baseNotIn: ["VITAMIN_WATER", "SPORTDRINKS", "ENERGY_DRINKS"],
                    },
                    into: "Other refreshments",
                    keepZero: true,
                },
            ],

            // Force ONLY the final buckets you actually want to display
            forceShow: [
                "VITAMIN_WATER (total)",
                "SPORTDRINKS (total)",
                "ENERGY_DRINKS (total)",
                "Protein drinks",
                "Other refreshments",
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> sport </strong> en normaal, <br/> voor jouw </>,
                line2: <> <strong> dranken </strong> is <strong>  </strong> </>
            }
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

         {
            id: 3002,
            name: <>
                <strong>Refreshments</strong><br/>
                Still vs Sparkling coverage
            </>,
            section: "refreshments",

            groupBy: "subcategory",
            within: {},
            predicates: [],

            partitionBy: [
                { field: "is_sparkling", value: 1, label: "Sparkling" },
                { field: "is_sparkling", value: 0, label: "Still" },
            ],

            rollups: [],

            // optional: ensure these appear even if empty
            forceShow: [
                "COLA · Sparkling",
                "COLA · Still",
                "LEMONADES · Sparkling",
                "LEMONADES · Still",
            ],

            info: {
                image: presetImg("Gezondheidsbewuste.png"),
                line1: <>Bied je genoeg <strong>still vs sparkling</strong> aan?</>,
                line2: <>Check balans per <strong>subcategory</strong>.</>,
            },
        },

 */

