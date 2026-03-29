import { presetImg } from './utils/presetImages';

export const PRESET_FILTERS_DEEP_FRIED_SNACKS = [
    // ── Preset 1: Subcategories overview ────────────────────────────
    {
        id: 2801,
        name: <><strong>Frituur — alle subcategorieën</strong><br/>Overzicht van jouw snack-aanbod per type.</>,
        section: "deep_fried_snacks",
        groupBy: "subcategory",

        within:  { category: "DEEP_FRIED_SNACKS" },
        filters: { category: "DEEP_FRIED_SNACKS" },

        predicates: [],
        showOnlyRollups: true,
        includeEmpty: false,

        forceShow: [
            "MINCED", "BURGER", "SEAFOOD", "CRISPY_CHICKEN",
            "CHUNK_STICK", "RAGOUT_CROQUETTE", "CHEESE_CROQUETTE",
            "STUFFED_ROLLS", "SOFT_STICK", "BAMI_NASI", "OTHER",
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
                        title: "Gehakt & Sticks",
                        iconToken: "MINCED",
                        buckets: ["MINCED"],
                        keepEmpty: true,
                    },
                    {
                        title: "Burgers",
                        iconToken: "BURGER",
                        buckets: ["BURGER"],
                        keepEmpty: true,
                    },
                    {
                        title: "Vis & Zeevruchten",
                        iconToken: "SEAFOOD",
                        buckets: ["SEAFOOD"],
                        keepEmpty: true,
                    },
                    {
                        title: "Krokante Kip",
                        iconToken: "CRISPY_CHICKEN",
                        buckets: ["CRISPY_CHICKEN"],
                        keepEmpty: true,
                    },
                    {
                        title: "Saté & Sticks",
                        iconToken: "CHUNK_STICK",
                        buckets: ["CHUNK_STICK"],
                        keepEmpty: true,
                    },
                    {
                        title: "Ragout & Kroket",
                        iconToken: "RAGOUT_CROQUETTE",
                        buckets: ["RAGOUT_CROQUETTE"],
                        keepEmpty: true,
                    },
                    {
                        title: "Kaas & Soufflé",
                        iconToken: "CHEESE_CROQUETTE",
                        buckets: ["CHEESE_CROQUETTE"],
                        keepEmpty: true,
                    },
                    {
                        title: "Loempia & Rolls",
                        iconToken: "STUFFED_ROLLS",
                        buckets: ["STUFFED_ROLLS"],
                        keepEmpty: true,
                    },
                    {
                        title: "Zachte Sticks",
                        iconToken: "SOFT_STICK",
                        buckets: ["SOFT_STICK"],
                        keepEmpty: true,
                    },
                    {
                        title: "Bami & Nasi",
                        iconToken: "BAMI_NASI",
                        buckets: ["BAMI_NASI"],
                        keepEmpty: true,
                    },
                    {
                        title: "Overig",
                        iconToken: "DEEP_FRIED_SNACKS",
                        buckets: ["OTHER"],
                        keepEmpty: true,
                    },
                ],
            },
        },

        info: {
            image: null,
            line1: <>Overzicht van jouw <strong>frituur-aanbod</strong> per type snack.</>,
            line2: <>Tip: zorg voor een goede <strong>mix</strong> van vleessnacks, vis, kip en veggie.</>,
        },
    },

    // ── Preset 2: Subsubcategories (alle snacks uitgesplitst) ───────
    {
        id: 2802,
        name: <><strong>Snackkaart — alle snacktypes</strong></>,
        section: "deep_fried_snacks",
        groupBy: "subsubcategory",

        within:  { category: "DEEP_FRIED_SNACKS" },
        predicates: [],
        includeEmpty: false,

        forceShow: [
            // Minced
            "FRIKANDEL", "VIANDEL", "MEXICANO", "BOULET", "RIBSTER", "BERENHAP",
            // Burger
            "HAMBURGER", "CHEESEBURGER", "CHICKENBURGER", "FISHBURGER",
            // Seafood
            "GARNAALKROKET", "CALAMARES",
            // Chicken
            "KIPCORN", "KIPKROKET", "CHICKEN_NUGGETS",
            // Saté
            "SATE", "DRUMSTICK",
            // Ragout
            "BITTERBALLEN", "VLEESKROKET", "GOULASHKROKET",
            // Cheese
            "KAASSOUFFLE", "KAASKROKET", "MOZZARELLA_STICKS",
            // Rolls
            "LOEMPIA", "VLAMMETJES", "SMULROL",
            // Soft
            "ZIGEUNERSTICK",
            // Bami/Nasi
            "BAMISCHIJF", "NASISCHIJF",
        ],

        rollups: [
            // ── Minced ──
            { match: { baseIn: ["FRIKANDEL", "FRIKANDEL_SPECIAAL"] }, into: "FRIKANDEL", keepZero: true },
            { match: { baseIn: ["VIANDEL"] }, into: "VIANDEL", keepZero: true },
            { match: { baseIn: ["MEXICANO", "MEXICANO_XL", "MEXICANO_BURGER"] }, into: "MEXICANO", keepZero: true },
            { match: { baseIn: ["BOULET", "BOULET_SPECIAAL", "PLATTE_BOULET"] }, into: "BOULET", keepZero: true },
            { match: { baseIn: ["RIBSTER"] }, into: "RIBSTER", keepZero: true },
            { match: { baseIn: ["BERENHAP"] }, into: "BERENHAP", keepZero: true },
            { match: { baseIn: ["BEREPOOT"] }, into: "BEREPOOT", keepZero: true },
            { match: { baseIn: ["PLAYBOY"] }, into: "PLAYBOY", keepZero: true },
            { match: { baseIn: ["CERVELA_ROOD", "CERVELA_BRUIN"] }, into: "CERVELA", keepZero: true },
            { match: { baseIn: ["BOCKWORST", "LOOK_WORST"] }, into: "WORST", keepZero: true },
            { match: { baseIn: ["GRIZZLY", "JOSKE", "KROKETBURGER", "PLATTE_HAMBURGER"] }, into: "MINCED_OTHER", keepZero: true },

            // ── Burgers ──
            { match: { baseIn: ["HAMBURGER"] }, into: "HAMBURGER", keepZero: true },
            { match: { baseIn: ["CHEESEBURGER", "BACONBURGER"] }, into: "CHEESEBURGER", keepZero: true },
            { match: { baseIn: ["CHICKENBURGER"] }, into: "CHICKENBURGER", keepZero: true },
            { match: { baseIn: ["FISHBURGER"] }, into: "FISHBURGER", keepZero: true },
            { match: { baseIn: ["RIB_BURGER", "RIB_SANDWICH"] }, into: "RIB_BURGER", keepZero: true },
            { match: { baseIn: ["SATE_BURGER", "SITO_BURGER", "VIANDEL_BURGER", "KROKETBURGER"] }, into: "BURGER_OTHER", keepZero: true },

            // ── Seafood ──
            { match: { baseIn: ["GARNAALKROKET"] }, into: "GARNAALKROKET", keepZero: true },
            { match: { baseIn: ["CALAMARES"] }, into: "CALAMARES", keepZero: true },
            { match: { baseIn: ["FISH_STICK", "PICK_NICKER", "MOSSELEN"] }, into: "SEAFOOD_OTHER", keepZero: true },

            // ── Chicken ──
            { match: { baseIn: ["KIPCORN"] }, into: "KIPCORN", keepZero: true },
            { match: { baseIn: ["KIPKROKET"] }, into: "KIPKROKET", keepZero: true },
            { match: { baseIn: ["CHICKEN_NUGGETS", "CHICKEN_FINGERS"] }, into: "CHICKEN_NUGGETS", keepZero: true },
            { match: { baseIn: ["LUCIFER", "MINI_LUCIFER"] }, into: "LUCIFER", keepZero: true },

            // ── Saté / Sticks ──
            { match: { baseIn: ["SATE", "ARDEENSE_SATE"] }, into: "SATE", keepZero: true },
            { match: { baseIn: ["DRUMSTICK"] }, into: "DRUMSTICK", keepZero: true },

            // ── Ragout / Croquette ──
            { match: { baseIn: ["BITTERBALLEN"] }, into: "BITTERBALLEN", keepZero: true },
            { match: { baseIn: ["VLEESKROKET"] }, into: "VLEESKROKET", keepZero: true },
            { match: { baseIn: ["GOULASHKROKET", "RAGOUZI", "LUCIFER"] }, into: "GOULASHKROKET", keepZero: true },

            // ── Cheese ──
            { match: { baseIn: ["KAASSOUFFLE"] }, into: "KAASSOUFFLE", keepZero: true },
            { match: { baseIn: ["KAASKROKET"] }, into: "KAASKROKET", keepZero: true },
            { match: { baseIn: ["MOZZARELLA_STICKS", "CHEESE_BALLS", "CHILI_CHEESE_NUGGETS"] }, into: "MOZZARELLA_STICKS", keepZero: true },

            // ── Stuffed Rolls ──
            { match: { baseIn: ["LOEMPIA", "MINI_LOEMPIA"] }, into: "LOEMPIA", keepZero: true },
            { match: { baseIn: ["VLAMMETJES", "VLAMPIJP", "VUURVRETER"] }, into: "VLAMMETJES", keepZero: true },
            { match: { baseIn: ["SMULROL", "BERENHAP"] }, into: "SMULROL", keepZero: true },

            // ── Soft Sticks ──
            { match: { baseIn: ["GYPSY_STICK", "SITO_STICK", "ZIGEUNERSTICK"] }, into: "ZIGEUNERSTICK", keepZero: true },

            // ── Bami / Nasi ──
            { match: { baseIn: ["BAMISCHIJF", "BAMIBAL", "BAMI_BURGER"] }, into: "BAMISCHIJF", keepZero: true },
            { match: { baseIn: ["NASISCHIJF"] }, into: "NASISCHIJF", keepZero: true },

            // ── Other ──
            { match: { baseIn: ["TWIJFELAAR", "ZIGEUNERSAUS", "KROKETTEN", "STOOFVLEES"] }, into: "FRITUUR_OTHER", keepZero: true },
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
                        title: "Gehakt & Sticks",
                        iconToken: "MINCED",
                        buckets: [
                            "FRIKANDEL", "VIANDEL", "MEXICANO", "BOULET", "RIBSTER",
                            "BERENHAP", "BEREPOOT", "PLAYBOY", "CERVELA", "WORST", "MINCED_OTHER",
                        ],
                        keepEmpty: true,
                    },
                    {
                        title: "Burgers",
                        iconToken: "BURGER",
                        buckets: [
                            "HAMBURGER", "CHEESEBURGER", "CHICKENBURGER", "FISHBURGER",
                            "RIB_BURGER", "BURGER_OTHER",
                        ],
                        keepEmpty: true,
                    },
                    {
                        title: "Vis & Zeevruchten",
                        iconToken: "SEAFOOD",
                        buckets: ["GARNAALKROKET", "CALAMARES", "SEAFOOD_OTHER"],
                        keepEmpty: true,
                    },
                    {
                        title: "Krokante Kip",
                        iconToken: "CRISPY_CHICKEN",
                        buckets: ["KIPCORN", "KIPKROKET", "CHICKEN_NUGGETS", "LUCIFER"],
                        keepEmpty: true,
                    },
                    {
                        title: "Saté & Sticks",
                        iconToken: "CHUNK_STICK",
                        buckets: ["SATE", "DRUMSTICK"],
                        keepEmpty: true,
                    },
                    {
                        title: "Ragout & Kroket",
                        iconToken: "RAGOUT_CROQUETTE",
                        buckets: ["BITTERBALLEN", "VLEESKROKET", "GOULASHKROKET"],
                        keepEmpty: true,
                    },
                    {
                        title: "Kaas & Soufflé",
                        iconToken: "CHEESE_CROQUETTE",
                        buckets: ["KAASSOUFFLE", "KAASKROKET", "MOZZARELLA_STICKS"],
                        keepEmpty: true,
                    },
                    {
                        title: "Loempia & Rolls",
                        iconToken: "STUFFED_ROLLS",
                        buckets: ["LOEMPIA", "VLAMMETJES", "SMULROL"],
                        keepEmpty: true,
                    },
                    {
                        title: "Zachte Sticks",
                        iconToken: "SOFT_STICK",
                        buckets: ["ZIGEUNERSTICK"],
                        keepEmpty: true,
                    },
                    {
                        title: "Bami & Nasi",
                        iconToken: "BAMI_NASI",
                        buckets: ["BAMISCHIJF", "NASISCHIJF"],
                        keepEmpty: true,
                    },
                    {
                        title: "Overig",
                        iconToken: "DEEP_FRIED_SNACKS",
                        buckets: ["FRITUUR_OTHER"],
                        keepEmpty: true,
                    },
                ],
            },
        },

        info: {
            image: null,
            line1: <>Alle <strong>snacktypes</strong> uitgesplitst per product.</>,
            line2: <>Tip: bekijk welke <strong>specifieke snacks</strong> je mist of dubbel hebt.</>,
        },
    },

    // ── Preset 3: Spice level ───────────────────────────────────────
    {
        id: 2803,
        name: <><strong>Pittig vs Mild</strong><br/>Verdeling van jouw snacks op pittigheid.</>,
        section: "deep_fried_snacks",
        groupBy: "subcategory",

        within:  { category: "DEEP_FRIED_SNACKS" },
        filters: { category: "DEEP_FRIED_SNACKS" },

        predicates: [],
        showOnlyRollups: true,
        includeEmpty: false,

        partitionBy: [
            { label: "Niet pittig", predicates: [{ field: "spice_level", op: "eq", value: "not_spicy" }] },
            { label: "Mild",        predicates: [{ field: "spice_level", op: "eq", value: "mild" }] },
            { label: "Pittig",      predicates: [{ field: "spice_level", op: "eq", value: "very_spicy" }] },
        ],

        forceShow: [
            "MINCED · Niet pittig", "MINCED · Mild", "MINCED · Pittig",
            "BURGER · Niet pittig", "BURGER · Mild", "BURGER · Pittig",
            "STUFFED_ROLLS · Niet pittig", "STUFFED_ROLLS · Mild", "STUFFED_ROLLS · Pittig",
            "CRISPY_CHICKEN · Niet pittig", "CRISPY_CHICKEN · Mild", "CRISPY_CHICKEN · Pittig",
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
                        title: "Niet pittige snacks",
                        iconToken: "DEEP_FRIED_SNACKS",
                        buckets: [
                            "MINCED · Niet pittig", "BURGER · Niet pittig", "SEAFOOD · Niet pittig",
                            "CRISPY_CHICKEN · Niet pittig", "CHUNK_STICK · Niet pittig",
                            "RAGOUT_CROQUETTE · Niet pittig", "CHEESE_CROQUETTE · Niet pittig",
                            "STUFFED_ROLLS · Niet pittig", "SOFT_STICK · Niet pittig",
                            "BAMI_NASI · Niet pittig", "OTHER · Niet pittig",
                        ],
                        keepEmpty: true,
                    },
                    {
                        title: "Milde snacks",
                        iconToken: "DEEP_FRIED_SNACKS",
                        buckets: [
                            "MINCED · Mild", "BURGER · Mild", "SEAFOOD · Mild",
                            "CRISPY_CHICKEN · Mild", "CHUNK_STICK · Mild",
                            "RAGOUT_CROQUETTE · Mild", "CHEESE_CROQUETTE · Mild",
                            "STUFFED_ROLLS · Mild", "SOFT_STICK · Mild",
                            "BAMI_NASI · Mild", "OTHER · Mild",
                        ],
                        keepEmpty: true,
                    },
                    {
                        title: "Pittige snacks",
                        iconToken: "DEEP_FRIED_SNACKS",
                        buckets: [
                            "MINCED · Pittig", "BURGER · Pittig", "SEAFOOD · Pittig",
                            "CRISPY_CHICKEN · Pittig", "CHUNK_STICK · Pittig",
                            "RAGOUT_CROQUETTE · Pittig", "CHEESE_CROQUETTE · Pittig",
                            "STUFFED_ROLLS · Pittig", "SOFT_STICK · Pittig",
                            "BAMI_NASI · Pittig", "OTHER · Pittig",
                        ],
                        keepEmpty: true,
                    },
                ],
            },
        },

        info: {
            image: null,
            line1: <>Verdeling <strong>pittig vs mild</strong> van jouw frituursnacks.</>,
            line2: <>Tip: zorg voor minstens <strong>1-2 pittige opties</strong> voor liefhebbers.</>,
        },
    },

    // ── Preset 4: Vegetarisch / Vegan ───────────────────────────────
    {
        id: 2804,
        name: <><strong>Veggie & Vegan</strong><br/>Vegetarische en veganistische opties.</>,
        section: "deep_fried_snacks",
        groupBy: "subcategory",

        within:  { category: "DEEP_FRIED_SNACKS" },
        filters: { category: "DEEP_FRIED_SNACKS" },

        predicates: [],
        showOnlyRollups: true,
        includeEmpty: false,

        partitionBy: [
            { label: "Vegan",       predicates: [{ field: "is_vegan", op: "eq", value: 1 }] },
            { label: "Vegetarisch", predicates: [{ field: "is_vegetarian", op: "eq", value: 1 }, { field: "is_vegan", op: "eq", value: 0 }] },
            { label: "Vlees / Vis", predicates: [{ field: "is_vegetarian", op: "eq", value: 0 }] },
        ],

        forceShow: [
            "CHEESE_CROQUETTE · Vegetarisch", "BAMI_NASI · Vegetarisch",
            "STUFFED_ROLLS · Vegan", "BAMI_NASI · Vegan",
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
                        title: "Veganistische snacks",
                        iconToken: "DEEP_FRIED_SNACKS",
                        buckets: [
                            "MINCED · Vegan", "BURGER · Vegan", "CRISPY_CHICKEN · Vegan",
                            "RAGOUT_CROQUETTE · Vegan", "CHEESE_CROQUETTE · Vegan",
                            "STUFFED_ROLLS · Vegan", "BAMI_NASI · Vegan", "OTHER · Vegan",
                        ],
                        keepEmpty: true,
                    },
                    {
                        title: "Vegetarische snacks",
                        iconToken: "CHEESE_CROQUETTE",
                        buckets: [
                            "MINCED · Vegetarisch", "BURGER · Vegetarisch", "CRISPY_CHICKEN · Vegetarisch",
                            "RAGOUT_CROQUETTE · Vegetarisch", "CHEESE_CROQUETTE · Vegetarisch",
                            "STUFFED_ROLLS · Vegetarisch", "BAMI_NASI · Vegetarisch", "OTHER · Vegetarisch",
                        ],
                        keepEmpty: true,
                    },
                    {
                        title: "Vlees & Vis",
                        iconToken: "MINCED",
                        buckets: [
                            "MINCED · Vlees / Vis", "BURGER · Vlees / Vis", "SEAFOOD · Vlees / Vis",
                            "CRISPY_CHICKEN · Vlees / Vis", "CHUNK_STICK · Vlees / Vis",
                            "RAGOUT_CROQUETTE · Vlees / Vis", "CHEESE_CROQUETTE · Vlees / Vis",
                            "STUFFED_ROLLS · Vlees / Vis", "SOFT_STICK · Vlees / Vis",
                            "BAMI_NASI · Vlees / Vis", "OTHER · Vlees / Vis",
                        ],
                        keepEmpty: true,
                    },
                ],
            },
        },

        info: {
            image: null,
            line1: <>Verdeling <strong>veggie vs vlees</strong> in je frituur.</>,
            line2: <>Tip: vegetarische snacks zijn een groeimarkt — <strong>kaas- en groentensnacks</strong> doen het goed.</>,
        },
    },
];
