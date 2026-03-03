/* server/services/engine.js (ESM) */
const toInt = v => (v === '' || v == null ? undefined : Number(v));
const toArr = v => Array.isArray(v) ? v : String(v ?? '').split(',').map(s => s.trim()).filter(Boolean);
const toBool = v => (v === true || v === 'true' || v === 1 || v === '1' || v === 't' || v === 'T');
const escapeOr = s => String(s).replace(/[,]/g, ' ');

export const FILTERS = {
  is_high_margin: { path: 'products.is_high_margin', op: 'eq', coerce: toInt },
  is_trending:    { path: 'products.is_trending',    op: 'eq', coerce: toInt },
  is_zero:        { path: 'products.is_zero',        op: 'eq', coerce: toInt },
  is_sparkling:   { path: 'products.is_sparkling',   op: 'eq', coerce: toInt },
  brand:          { path: 'products.brand', op: 'in', coerce: toArr },

  // NEW functional flags
  is_protein:     { path: 'products.is_protein',     op: 'eq', coerce: toInt },
  is_prebiotic:   { path: 'products.is_prebiotic',   op: 'eq', coerce: toInt },
  is_magnesium:   { path: 'products.is_magnesium',   op: 'eq', coerce: toInt },
  is_vitamin:     { path: 'products.is_vitamin',     op: 'eq', coerce: toInt },
  is_collagen:    { path: 'products.is_collagen',    op: 'eq', coerce: toInt },

  category:          { path: 'products.categories.category_name',            op: 'eq' },
  category_ilike:    { path: 'products.categories.category_name',            op: 'ilike', coerce: v => `%${v}%` },
  subcategory:       { path: 'products.subcategories.subcat_name',           op: 'eq' },
  subcategory_ilike: { path: 'products.subcategories.subcat_name',           op: 'ilike', coerce: v => `%${v}%` },
  subsubcategory:       { path: 'products.subsubcategories.subsubcat_name',  op: 'eq' },
  subsubcategory_ilike: { path: 'products.subsubcategories.subsubcat_name',  op: 'ilike', coerce: v => `%${v}%` },

  subcategory_in:    { path: 'products.subcategories.subcat_name',           op: 'in',  coerce: toArr },
  subsubcategory_in: { path: 'products.subsubcategories.subsubcat_name',     op: 'in',  coerce: toArr },

  search: { op: 'search', fields: ['products.name','products.brand'] },

  'products.is_high_margin': { aliasOf: 'is_high_margin' },
  'products.is_trending':    { aliasOf: 'is_trending' },
  'products.is_zero':        { aliasOf: 'is_zero' },
  'products.is_sparkling':   { aliasOf: 'is_sparkling' },
  'products.category':       { aliasOf: 'category' },
  'products.subcategory':    { aliasOf: 'subcategory' },
  'products.subsubcategory': { aliasOf: 'subsubcategory' },

  // NEW functional flags
  'products.is_protein':     { aliasOf: 'is_protein' },
  'products.is_prebiotic':   { aliasOf: 'is_prebiotic' },
  'products.is_magnesium':   { aliasOf: 'is_magnesium' },
  'products.is_vitamin':     { aliasOf: 'is_vitamin' },
  'products.is_collagen':    { aliasOf: 'is_collagen' },
};

const resolveAlias = key => (FILTERS[key] && FILTERS[key].aliasOf) || key;

export function applyFilters(baseQuery, rawFilters = {}, options = {}) {
  const {
    includeProducts = false,
    includeCategories = false,
    includeSubcategories = false,
    includeSubsubcategories = false,
  } = options;

  let needProducts    = includeProducts;
  let needCategories  = includeCategories;
  let needSubcats     = includeSubcategories;
  let needSubsubcats  = includeSubsubcategories;

  const filters = {};
  let catFiltersUsed     = false;
  let subcatFiltersUsed  = false;
  let subsubFiltersUsed  = false;
  let pendingSearchExpr  = null;

  for (const [rawK, rawV] of Object.entries(rawFilters || {})) {
    const key  = resolveAlias(rawK);
    const rule = FILTERS[key];
    if (!rule || rule.aliasOf) continue;

    const val = rule.coerce ? rule.coerce(rawV) : rawV;
    if (val === undefined) continue;
    filters[key] = val;

    const path = rule.path || '';
    if (path.startsWith('products')) needProducts = true;
    if (path.includes('categories'))       { needCategories = true;   needProducts = true; catFiltersUsed    = true; }
    if (path.includes('subcategories'))    { needSubcats    = true;   needProducts = true; subcatFiltersUsed = true; }
    if (path.includes('subsubcategories')) { needSubsubcats = true;   needProducts = true; subsubFiltersUsed = true; }

    if (rule.op === 'search') {
      const q = (val && (val.q ?? val) || '').toString().trim();
      if (q) {
        const fields = Array.isArray(val.fields) && val.fields.length ? val.fields : (rule.fields || []);
        pendingSearchExpr = fields.map(f => `${f}.ilike.*${escapeOr(q)}*`).join(',');
        if (fields.some(f => f.startsWith('products'))) needProducts = true;
      }
    }
  }
  if (needCategories || needSubcats || needSubsubcats) needProducts = true;

  const productsJoin   = needProducts   ? '!inner' : '';
  const categoriesJoin = (catFiltersUsed    || includeCategories)       ? '!inner' : '';
  const subcatsJoin    = (subcatFiltersUsed || includeSubcategories)    ? '!inner' : '';
  const subsubJoin     = (subsubFiltersUsed || includeSubsubcategories) ? '!inner' : '';

  const baseCols = 'id_menu_item,price,created_at';

  // ✅ FIX: include price band fields so they don't come back null
  const productCols =
      (needProducts || needCategories || needSubcats || needSubsubcats)
          ? `,products${productsJoin}(
           id_product,
           name,
           brand,

           floor_price,
           low_price,
           high_price,
           ceiling_price,

           price_retail,
           sugar_content,

           is_high_margin,
           is_trending,
           is_zero,
           is_sparkling,
           is_protein,
           is_prebiotic,
           is_magnesium,
           is_vitamin,
           is_collagen,
           is_lactose_free,
           is_gluten_free,
           caffeine,
           abv,
           ibu,
           heritage
           ${needCategories  ? `,categories${categoriesJoin}(category_name)` : ''}
           ${needSubcats     ? `,subcategories${subcatsJoin}(subcat_name,id_subcat)` : ''}
           ${needSubsubcats  ? `,subsubcategories${subsubJoin}(subsubcat_name,id_subsubcat)` : ''}
         )`
          : '';

  baseQuery = baseQuery.select(`${baseCols}${productCols}`);

  for (const [key, val] of Object.entries(filters)) {
    const rule = FILTERS[key];
    switch (rule.op) {
      case 'eq':    baseQuery = baseQuery.eq(rule.path, val); break;
      case 'bool':  baseQuery = baseQuery.eq(rule.path, toBool(val)); break;
      case 'in': {
        const arr = Array.isArray(val) ? val : [val];
        if (arr.length) baseQuery = baseQuery.in(rule.path, arr);
        break;
      }
      case 'ilike': baseQuery = baseQuery.ilike(rule.path, val); break;
      case 'gte':   baseQuery = baseQuery.gte(rule.path, val); break;
      case 'lte':   baseQuery = baseQuery.lte(rule.path, val); break;
      case 'search': break;
      default: break;
    }
  }
  if (pendingSearchExpr) baseQuery = baseQuery.or(pendingSearchExpr);

  return baseQuery;
}
