export const PARENT_BY_SECTION = {
  beers: "BEERS",
  sodas: "REFRESHMENTS",
  refreshments: "REFRESHMENTS",
  wines: "WINES",
  cocktails: "COCKTAILS",
  liquors: "LIQUORS",
  snacks: "SNACKS",
  meals: "MEALS",
};

export const SELECT_COLS_PRODUCTS_WITH_RELATIONS = `
  id_product,
  name,
  brand,
  production_city,
  production_country,
  eco_friendly,
  season,
  low_price,
  high_price,
  is_zero,
  is_sparkling,
  heritage,
  categories ( category_name ),
  subcategories!left ( subcat_name ),
  subsubcategories!left ( subsubcat_name ),
  
  is_protein,
  is_prebiotic,
  is_magnesium,
  is_vitamin,
  is_collagen,
  is_trending,
  is_high_margin
`;

export function prettifyLabel(t) {
  return (t || "")
    .replace(/_/g, " ")
    .replace(/\bNFC\b/g, "NFC")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function notInList(ids) {
  const list = (ids || []).filter((x) => x != null);
  return list.length ? `(${list.join(",")})` : null;
}

export function flattenProductRow(p) {
  return {
    id:               p.id_product,
    id_product:       p.id_product,
    name:             p.name,
    brand:            p.brand,

    category_name:    p.categories?.category_name ?? null,
    subcat_name:      p.subcategories?.subcat_name ?? null,
    subsubcat_name:   p.subsubcategories?.subsubcat_name ?? null,

    category:         p.subcategories?.subcat_name || p.categories?.category_name || "",

    prodCity:         p.production_city,
    prodCountry:      p.production_country,


    eco_friendly:     p.eco_friendly,
    season:           p.season,
    low_price:        p.low_price,
    high_price:       p.high_price,

    // filters
    is_zero:          p.is_zero ?? 0,
    is_sparkling:     p.is_sparkling ?? 0,
    heritage:         (p.heritage || "normal"),

    // NEW functional flags
    is_protein:       p.is_protein ?? 0,
    is_prebiotic:     p.is_prebiotic ?? 0,
    is_magnesium:     p.is_magnesium ?? 0,
    is_vitamin:       p.is_vitamin ?? 0,
    is_collagen:      p.is_collagen ?? 0,

// ALSO include these
    is_trending:      p.is_trending ?? 0,
    is_high_margin:   p.is_high_margin ?? 0,
  };
}
