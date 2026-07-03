// GTIN → product lookup table
// Images live in /products/ (public folder, bg-removed PNGs)

const PRODUCTS = {
  "7350000158281": { name: "Cherry",              brand: "PĀNDY", image: "/products/pandy-cherry.png" },
  "7350000152821": { name: "Fuzzy Bottles",       brand: "PĀNDY", image: "/products/pandy-fuzzy-bottles.png" },
  "7350000152838": { name: "Watermelon",          brand: "PĀNDY", image: "/products/pandy-watermelon.png" },
  "7350000159288": { name: "Fluffy Clouds",       brand: "PĀNDY", image: "/products/pandy-fluffy-clouds.png" },
  "7350000153637": { name: "Sour Skulls",         brand: "PĀNDY", image: "/products/pandy-sour-skulls.png" },
  "7350000153446": { name: "Peach Rings",         brand: "PĀNDY", image: "/products/pandy-peach-rings.png" },
  "7350000159318": { name: "Strawberry Liquorice",brand: "PĀNDY", image: "/products/pandy-strawberry-liquorice.png" },
  "4260562943726": { name: "Gummy Bears",         brand: "ahead", image: "/products/ahead-gummy-bears.png" },
  "4260562940930": { name: "Sour Cherries",       brand: "ahead", image: "/products/ahead-sour-cherries.png" },
  "4260562940947": { name: "Green Apples",        brand: "ahead", image: "/products/ahead-green-apples.png" },
  "4260562940923": { name: "Sweet Peaches",       brand: "ahead", image: "/products/ahead-sweet-peaches.png" },
  "4260562940909": { name: "Cola Bottles",        brand: "ahead", image: "/products/ahead-cola-bottles.png" },
  "4260562940916": { name: "Fluffy Hearts",       brand: "ahead", image: "/products/ahead-fluffy-hearts.png" },
  "5060139432555": { name: "Fruit Rolls Strawberry", brand: "BEAR", image: "/products/bear-fruit-rolls-strawberry.png" },
  "8720618786906": { name: "Frucht Spaghetti Forest Berry", brand: "Fruit Funk", image: "/products/fruitfunk-spaghetti-forest-berry.png" },
  "8779325866155": { name: "Banana Bites",        brand: "Fruit Funk", image: "/products/fruitfunk-banana-bites.png" },
  "8719325866148": { name: "Peach Bites",         brand: "Fruit Funk", image: "/products/fruitfunk-peach-bites.png" },
  "8720618786845": { name: "Fruit Spaghetti Mango", brand: "Fruit Funk", image: "/products/fruitfunk-spaghetti-mango.png" },
  "8719189354928": { name: "Fruit Stick XXL",     brand: "Bebeto",  image: "/products/fruit-stick-xxl.png" },
  "3770028156351": { name: "Pink & Blue Bottles", brand: "Rebelle", image: "/products/rebelle-bottles-pink-blue.png" },
};

export function lookupProduct(gtin) {
  return PRODUCTS[gtin] ?? null;
}

export default PRODUCTS;
