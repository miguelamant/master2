// Dummy "% who rate this as highly as the reference product" data, keyed by gtin.
// Stand-in until the real comparison pipeline exists — most products have no data yet.
const RATING_STATS = {
    '7350000158281': 82, // PĀNDY Cherry
    '7350000153446': 71, // PĀNDY Peach Rings
    '8720618786906': 89, // Fruit Funk Frucht Spaghetti Forest Berry
    '8720618786845': 64, // Fruit Funk Fruit Spaghetti Mango
};

export const getRatingPercent = (gtin) => RATING_STATS[gtin] ?? null;
