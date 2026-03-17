import { presetImg } from './utils/presetImages';

export const PRESET_FILTERS_REFRESHMENTS = [
        {
            id: 2814,
            name: <> Sporter - lvl 4 </>,
            section: "refreshments",
            groupBy: "subcategory",
            showOnlyRollups: true,
            within: {
                category: "REFRESHMENTS",
            },
            predicates: [],
            includeEmpty: true,
            ui: {
                columns: 3  ,              // 2 or 3
                showItemsInline: false,  // default false
                aggregateTop: {
                    enabled: true,
                    columns: [
                        { title: "Protein", iconToken: "SPORTER" },
                        { title: "Cafeine", iconToken: "SPORTER" },
                        { title: "Electrolytes", iconToken: "SPORTER" },

                        // if columns=3, add a third
                    ],
                },
            },
            rollups: [
                // 1) With protein
            // Refreshments filter (grouped on subcategory) with the mappings you described.
// NOTE: replace the subcategory enum strings below with your exact values
// (e.g. "MILK_BASED" vs "MILK-BASED" etc.)


                    {
                        match: { baseIn: ["MILK_BASED"] },
                        into: "PROTEIN",
                        keepZero: true,
                    },

                    // Sportdrinks -> electrolytes
                    {
                        match: { baseIn: ["PROTEIN_WATER"] },
                        into: "PROTEIN_WATER_SPORT",
                        keepZero: true,
                    },

                    // Sportdrinks -> electrolytes
                    {
                        match: { baseIn: ["LEMONADES"] },
                        into: "PROTEIN_LEMONADE_SPORT",
                        predicates: [{ field: "is_protein", op: "eq", value: 1 }],
                        keepZero: true,
                    },


                    // Energy drinks -> caffeine drinks
                    {
                        match: { baseIn: ["ENERGY_DRINKS"] },
                        into: "CLASSIC_ENERGY_DRINK",
                        keepZero: true,
                    },

                // Energy drinks -> caffeine drinks
                {
                    match: { baseIn: ["COLA"] },
                    predicates: [{ field: "caffeine", op: "gte", value: 1 }],
                    into: "COLAS",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["ICE_TEA"] },
                    predicates: [{ field: "caffeine", op: "gte", value: 1 }],
                    into: "ICE_TEA",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["LEMONADES"] },
                    predicates: [{ field: "caffeine", op: "eq", value: 1 }],
                    into: "LEMONADES",
                    keepZero: true,
                },

                // Sportdrinks -> electrolytes
                {
                    match: { baseIn: ["SPORTDRINKS"] },
                    into: "WITH_ELECTROLYTES",
                    keepZero: true,
                },

                // Sportdrinks -> electrolytes
                {
                    match: { baseIn: ["VITAMIN_WATER"] },
                    into: "VITAMIN_WATER_HEALTH",
                    keepZero: true,
                },

            ],

                forceShow: [],
            sortPriority: [
                "PROTEIN",
                "PROTEIN_WATER_SPORT",
                "PROTEIN_LEMONADE_SPORT",
                "CLASSIC_ENERGY_DRINK",
                "COLAS",
                "ICE_TEA",
                "LEMONADES",
                "WITH_ELECTROLYTES",
                "VITAMIN_WATER_HEALTH",
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> van sport vs normaal</strong> van jouw</>,
                line2: <> <strong> non-alcoholische bieren </strong> is</>
            }
        }
,
        {
            id: 2813,
            name: <>Sporter vs healthy vs trendy - lvl 4 </>,
            section: "refreshments",
            showOnlyRollups: true,
            groupBy: "subcategory",
            within: {
                category: "REFRESHMENTS",
            },
            predicates: [],
            includeEmpty: true,
            ui: {
                columns: 3  ,              // 2 or 3
                showItemsInline: false,  // default false
                aggregateTop: {
                    enabled: true,
                    columns: [
                        { title: "Sporter", iconToken: "SPORTER" },
                        { title: "Healthy", iconToken: "HEALTH" },
                        { title: "Trendy", iconToken: "TRENDY" },

                        // if columns=3, add a third
                    ],
                },
            },
            rollups: [
                // 1) With protein
                // Refreshments filter (grouped on subcategory) with the mappings you described.
// NOTE: replace the subcategory enum strings below with your exact values
// (e.g. "MILK_BASED" vs "MILK-BASED" etc.)



                // Sportdrinks -> electrolytes
                {
                    match: { baseIn: ["LEMONADES"] },
                    into: "PROTEIN_DRINKS",
                    predicates: [{ field: "is_protein", op: "eq", value: 1 }],
                    keepZero: true,
                },

                // Sportdrinks -> electrolytes
                {
                    match: { baseIn: ["SPORTDRINKS"] },
                    into: "WITH_ELECTROLYTES",
                    keepZero: true,
                },

                // Energy drinks -> caffeine drinks
                {
                    match: { baseIn: ["ENERGY_DRINKS"] },
                    into: "CAFFEINE_DRINKS",
                    keepZero: true,
                },

                //HEALTHY


                // Sportdrinks -> electrolytes
                {
                    match: { baseIn: ["VITAMIN_WATER","VITAMIN_DRINKS"] },
                    into: "VITAMIN_WATER_HEALTH",
                    keepZero: true,
                },

                // Kombucha -> probiotica
                {
                    match: { baseIn: ["KOMBUCHA"] },
                    into: "PROBIOTICA",
                    keepZero: true,
                },

                // Lemonades & Ice teas -> ONLY if is_prebiotic = true
                // (all other lemonades/ice-teas are left out because they won't match any rollup)

                {
                    match: { baseIn: ["LEMONADES", "ICE_TEA"] },
                    predicates: [{ field: "is_prebiotic", op: "eq", value: 1 }],
                    into: "PREBIOTIC",
                    keepZero: true,
                },

                {
                    match: { baseIn: ["JELLY_DRINKS"] },
                    into: "TRENDY1",
                    keepZero: true,
                },

                // Sportdrinks -> electrolytes
                {
                    match: { baseIn: ["PROTEIN_WATER"] },
                    into: "TRENDY2",
                    keepZero: true,
                },

                // Sportdrinks -> electrolytes
                {
                    match: { baseIn: ["LEMONADES"] },
                    into: "TRENDY3",
                    predicates: [{ field: "is_protein", op: "eq", value: 1 }],
                    keepZero: true,
                },


            ],

            forceShow: [],
            sortPriority: [
                "PROTEIN_DRINKS",
                "WITH_ELECTROLYTES",
                "CAFFEINE_DRINKS",
                "VITAMIN_WATER_HEALTH",
                "PROBIOTICA",
                "PREBIOTIC",
                "TRENDY1",
                "TRENDY2",
                "TRENDY3",
            ],






            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling <strong> van sport vs normaal</strong> van jouw</>,
                line2: <> <strong> non-alcoholische bieren </strong> is</>
            }
        }
        ,

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
            line1: <>De verdeling tussen <strong> smaken </strong> voor je </>,
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
                line1: <>De verdeling tussen <strong> suikervrij </strong> en normaal   voor je</>,
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
                line1: <>De verdeling tussen <strong> smaken </strong> en normaal, voor deze </>,
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
                line1: <>De verdeling tussen <strong> bruisend vs plat </strong> voor je </>,
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
                line1: <>De verdeling tussen <strong> zero vs normaal </strong> voor je </>,
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
                "LEMONADES_LEMON",
                "LEMONADES_ORANGE",

            ],
            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> smaken </strong> voor je </>,
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
                            title: "Sugar-free lemonades",
                            iconToken: "SUGAR_FREE",
                            buckets: [
                                "LEMONADES_AGRUM · Zero",
                                "LEMONADES_LEMON_LIME · Zero",
                                "LEMONADES_ORANGE · Zero",
                                "LEMONADES_LEMON · Zero",
                            ],
                        },
                        {
                            title: "Sugar containing",
                            iconToken: "SUGAR",
                            buckets: [
                                "LEMONADES_AGRUM · With sugar",
                                "LEMONADES_LEMON_LIME · With sugar",
                                "LEMONADES_ORANGE · With sugar",
                                "LEMONADES_LEMON · With sugar"
                            ],
                        },
                    ],
                },
            },

            rollups: [
                // LEMONADES_AGRUM
                {
                    match: { baseIn: ["LEMONADES_AGRUM"] },
                    predicates: [{ field: "is_zero", op: "eq", value: 1 }],
                    into: "LEMONADES_AGRUM · Zero",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["LEMONADES_AGRUM"] },
                    predicates: [{ field: "is_zero", op: "eq", value: 0 }],
                    into: "LEMONADES_AGRUM · With sugar",
                    keepZero: true,
                },

                // LEMONADES_LEMON_LIME
                {
                    match: { baseIn: ["LEMONADES_LEMON_LIME"] },
                    predicates: [{ field: "is_zero", op: "eq", value: 1 }],
                    into: "LEMONADES_LEMON_LIME · Zero",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["LEMONADES_LEMON_LIME"] },
                    predicates: [{ field: "is_zero", op: "eq", value: 0 }],
                    into: "LEMONADES_LEMON_LIME · With sugar",
                    keepZero: true,
                },

                // LEMONADES_ORANGE
                {
                    match: { baseIn: ["LEMONADES_ORANGE"] },
                    predicates: [{ field: "is_zero", op: "eq", value: 1 }],
                    into: "LEMONADES_ORANGE · Zero",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["LEMONADES_ORANGE"] },
                    predicates: [{ field: "is_zero", op: "eq", value: 0 }],
                    into: "LEMONADES_ORANGE · With sugar",
                    keepZero: true,
                },

                // LEMONADES_LEMON
                {
                    match: { baseIn: ["LEMONADES_LEMON"] },
                    predicates: [{ field: "is_zero", op: "eq", value: 1 }],
                    into: "LEMONADES_LEMON · Zero",
                    keepZero: false,
                },
                {
                    match: { baseIn: ["LEMONADES_LEMON"] },
                    predicates: [{ field: "is_zero", op: "eq", value: 0 }],
                    into: "LEMONADES_LEMON · With sugar",
                    keepZero: false,
                },
            ],


            // ensure these render even when empty
            forceShow: [
                "LEMONADES_AGRUM · Zero",
                "LEMONADES_LEMON_LIME · Zero",
                "LEMONADES_ORANGE · Zero",
                "LEMONADES_LEMON · Zero",

                "LEMONADES_AGRUM · With sugar",
                "LEMONADES_LEMON_LIME · With sugar",
                "LEMONADES_ORANGE · With sugar",
                "LEMONADES_LEMON · With sugar"
            ],

            // preferred ordering in the grid
            sortPriority: [
                "LEMONADES_AGRUM · Zero",
                "LEMONADES_LEMON_LIME · Zero",
                "LEMONADES_ORANGE · Zero",
                "LEMONADES_LEMON · Zero",

                "LEMONADES_AGRUM · With sugar",
                "LEMONADES_LEMON_LIME · With sugar",
                "LEMONADES_ORANGE · With sugar",
                "LEMONADES_LEMON · With sugar"
            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> suikervrij </strong> en normaal, voor jouw </>,
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
                line1: <>De verdeling tussen <strong> smaken en suikervrij </strong> voor je </>,
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
                line1: <>De verdeling tussen <strong> smaken </strong> voor jouw </>,
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
            ui: {
                columns: 2,
                aggregateTop: {
                    enabled: true,
                    deterministic: true,
                    unassigned: "append",
                    columns: [
                        {
                            title: "Sugar-free",
                            iconToken: "SUGAR_FREE",
                            buckets: [
                                "GINGER_ALE · Zero",
                                "GINGER_BEER · Zero",
                                "GINGER_LEMON · Zero",
                                "GINGER_LEMONADES_OTHER · Zero",
                            ],
                        },
                        {
                            title: "With sugar",
                            iconToken: "SUGAR",
                            buckets: [
                                "GINGER_ALE · With sugar",
                                "GINGER_BEER · With sugar",
                                "GINGER_LEMON · With sugar",
                                "GINGER_LEMONADES_OTHER · With sugar",
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
                            title: "Ginger ale",
                            iconToken: "GINGER_ALE",
                            buckets: ["GINGER_ALE · Zero", "GINGER_ALE · With sugar"],
                        },
                        {
                            title: "Ginger beer",
                            iconToken: "GINGER_BEER",
                            buckets: ["GINGER_BEER · Zero", "GINGER_BEER · With sugar"],
                        },
                        {
                            title: "Ginger + lemon",
                            iconToken: "GINGER_LEMON",
                            buckets: ["GINGER_LEMON · Zero", "GINGER_LEMON · With sugar"],
                        },
                        {
                            title: "Other ginger lemonades",
                            iconToken: "GINGER_LEMONADES_OTHER",
                            buckets: ["GINGER_LEMONADES_OTHER · Zero", "GINGER_LEMONADES_OTHER · With sugar"],
                        },
                    ],
                },
            },

            rollups: [
                // ---- GINGER_ALE ----
                {
                    match: { baseIn: ["GINGER_ALE"], partitionLabel: "Zero" },
                    into: "GINGER_ALE · Zero",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["GINGER_ALE"], partitionLabel: "With sugar" },
                    into: "GINGER_ALE · With sugar",
                    keepZero: true,
                },

                // ---- GINGER_BEER ----
                {
                    match: { baseIn: ["GINGER_BEER"], partitionLabel: "Zero" },
                    into: "GINGER_BEER · Zero",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["GINGER_BEER"], partitionLabel: "With sugar" },
                    into: "GINGER_BEER · With sugar",
                    keepZero: true,
                },

                // ---- GINGER_LEMON ----
                {
                    match: { baseIn: ["GINGER_LEMON"], partitionLabel: "Zero" },
                    into: "GINGER_LEMON · Zero",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["GINGER_LEMON"], partitionLabel: "With sugar" },
                    into: "GINGER_LEMON · With sugar",
                    keepZero: true,
                },

                // ---- GINGER_LEMONADES_OTHER ----
                {
                    match: { baseIn: ["GINGER_LEMONADES_OTHER"], partitionLabel: "Zero" },
                    into: "GINGER_LEMONADES_OTHER · Zero",
                    keepZero: true,
                },
                {
                    match: { baseIn: ["GINGER_LEMONADES_OTHER"], partitionLabel: "With sugar" },
                    into: "GINGER_LEMONADES_OTHER · With sugar",
                    keepZero: true,
                },
            ],


            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> smaken en suikergehaltes </strong> voor je </>,
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
                line1: <>De verdeling tussen <strong> smaken en suikergehaltes  </strong> voor je </>,
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
                line1: <>De verdeling tussen <strong> homemade </strong> en normaal, voor jouw </>,
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
            includeEmpty: false,
            showOnlyRollups: true,
            ui: {
                columns: 3,
                aggregateTop: {
                    enabled: true,
                    deterministic: true, // ✅ NEW
                    unassigned: "hide", // "append" (default) | "hide"
                    columns: [
                        {
                            title: "KIDS",
                            iconToken: "WINTER",
                            buckets: [
                                "JELLY_DRINKS",
                            ],
                        },
                        {
                            title: "ALL_AGES",
                            iconToken: "SPRING",
                            buckets: [

                            ],
                        },
                        {
                            title: "ADULT",
                            iconToken: "SUMMER",
                            buckets: [
                                "GINGER_DRINKS","TONICS",
                            ],
                        },
                    ],
                },
            },

            // Rollups:
            // 1) KOMBUCHA should be rolled up as one bucket (regardless of 0/1)
            // 2) VITAMIN_WATER should be rolled up as one bucket (regardless of 0/1)
            // 3) Everything else grouped into two totals:
            //    - All remaining subcategories where prebiotica = 0
            //    - All remaining subcategories where prebiotica = 1
            rollups: [
                // KOMBUCHA total (regardless of partition)
                {
                    match: { baseIn: ["TONICS"] },
                    into: "TONICS",
                    keepZero: true
                },

                // VITAMIN_WATER total (regardless of partition)
                {
                    match: { baseIn: ["GINGER_DRINKS"] },
                    into: "GINGER_DRINKS",
                    keepZero: true
                },


                // VITAMIN_WATER total (regardless of partition)
                {
                    match: { baseIn: ["JELLY_DRINKS"] },
                    into: "JELLY_DRINKS",
                    keepZero: true
                },



            ],

            // Make sure your totals always show up even when empty
            forceShow: [


            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> gezond </strong> en normaal, voor jouw </>,
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
            showOnlyRollups: true,
            ui: {
                columns: 3,
                aggregateTop: {
                    enabled: true,
                    deterministic: true, // ✅ NEW
                    unassigned: "hide", // "append" (default) | "hide"
                    columns: [
                        {
                            title: "CHEAP",
                            iconToken: "CHEAP",
                            buckets: [

                            ],
                        },
                        {
                            title: "NORMAL",
                            iconToken: "NORMAL",
                            buckets: [

                            ],
                        },
                        {
                            title: "PREMIUM",
                            iconToken: "PREMIUM",
                            buckets: [

                            ],
                        },
                    ],
                },
            },

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

            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> sport </strong> en normaal, voor jouw </>,
                line2: <> <strong> dranken </strong> is <strong>  </strong> </>
            }
        },

        {
            id: 1016,
            name: <>
                <strong>taste</strong>!<br/>
                Toon sport/energy/vitamin apart, en bundel de rest op protein.
            </>,
            section: "refreshments",
            groupBy: "subcategory",
            within: {},
            predicates: [],
            showOnlyRollups: true,
            ui: {
                columns: 3,
                aggregateTop: {
                    enabled: true,
                    deterministic: true, // ✅ NEW
                    unassigned: "hide", // "append" (default) | "hide"
                    columns: [
                        {
                            title: "SWEET",
                            iconToken: "CHEAP",
                            buckets: [

                            ],
                        },
                        {
                            title: "SOUR",
                            iconToken: "NORMAL",
                            buckets: [

                            ],
                        },
                        {
                            title: "BITTER",
                            iconToken: "PREMIUM",
                            buckets: [

                            ],
                        },
                    ],
                },
            },

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

            ],

            info: {
                image: presetImg("Fijn-proever.png"),
                line1: <>De verdeling tussen <strong> sport </strong> en normaal, voor jouw </>,
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

