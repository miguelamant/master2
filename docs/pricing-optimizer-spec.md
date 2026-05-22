# Pricing Optimizer — v1 Spec

Status: draft v2, rewritten 2026-04-17 against the live Supabase schema. Replaces the previous spec which was written without DB access.

---

## 1. Purpose

Give venue operators a quarterly, per-category review of their menu prices. For each item the engine identifies:

- **Opportunities** — items priced below cost-based ideal, leaving margin on the table.
- **Risks** — items priced above the zone where customers with a reference price will start to perceive the venue as expensive.
- **Cannibalisation** — items in the same subsubcategory where a cheap, low-margin option is eating the sales of a higher-margin sibling.

Output is a set of **suggestions for human review**, never auto-applied. The operator accepts, edits, or rejects each suggestion. Accepted changes update `menu_items.price` directly; rejected suggestions are suppressed on the next rerun unless the underlying inputs change.

### What this is not

- Not a layout / positioning optimizer (that's the "Herpositioneren" action — separate spec).
- Not a wine-pricing engine. Wines (category 19) are excluded from v1.
- Not a forecasting system. No volume, elasticity, or revenue predictions. Deterministic suggestions from current state.

---

## 2. Scope

### In scope for v1

- Cost-based ideal price per item using the affine model (`cost × ratio + addition`).
- Three-band quality zones (green / orange / red) with direction (too-low vs too-high).
- Asymmetric action rule: always raise underpriced items; only lower overpriced items when they have a strong reference price (commodity_score = 3).
- Cannibalisation detection within subsubcategory, same assortment.
- Sibling coherence for `brand_variants` and `price_variants` display rows.
- Charm-price snapping with per-venue configurable grid.
- Recommendation persistence with `inputs_hash` so rejected suggestions don't resurface unless inputs change.
- Commodity score (reference price strength, 0–3) on `products`, default 2.
- Per-category engine runs scoped by the action picker UI.

### Explicitly deferred

- Peer-venue band pricing (WTP from market price distributions — v2 upgrade).
- Brand-strength modifiers (a Duvel can sit above generic blonds because the brand justifies it).
- Per-category cost-model constants (different `ratio`/`addition` per category — see §11).
- Empirical price sensitivity from cross-venue variance.
- Cross-category cannibalisation (house wine vs draft beer, etc.).
- Layout / positioning scoring (separate "Herpositioneren" action).
- Volume-weighted diagnostics (no ROS / POS data available).

---

## 3. Existing schema (reference)

All IDs are `bigint`. No UUIDs in this schema.

### Key tables

| table | PK | role |
|---|---|---|
| `business_info` | `id` (integer) | Business entity (person/team). One business can have multiple locations. |
| `assortments` | `id` (bigint) | One menu / location for a business. Links to `business_info` via `business_id`. Has `lat`, `lng`. |
| `menu_items` | `id_menu_item` (bigint) | One item on a menu. Links to `assortments` via `assortment_id`, to `products` via `product_id` (nullable). Stores `price` (numeric, in euro-cents), `display_name`, `volume` (text, nullable), `display_row_id` (nullable). |
| `products` | `id_product` (bigint) | Global product catalog. Has `name`, `brand`, `id_category`, `id_subcategory`, `id_subsubcategory`, `heritage`, `abv`, `commodity_score` (integer, currently 0 everywhere), `price_foodservice`, `volume_foodservice`, `price_retail`, `volume_retail`. |
| `categories` | `id_category` (integer) | 11 top-level categories (REFRESHMENTS, BEERS, WINES, COCKTAILS, LIQUORS, SNACKS, MEALS, HOT_DRINKS, MEADS, CIDERS, DEEP_FRIED_SNACKS). |
| `subcategories` | `id_subcat` (bigint) | ~48 subcategories. |
| `subsubcategories` | `id_subsubcat` (bigint) | ~75 subsubcategories. Cannibalisation cohort key. |
| `menu_display_rows` | `id` (bigint) | Display-layer grouping. `row_type` values: `single`, `price_variants`, `brand_variants`, `multi_inline`, `single_described`, `note`, `supplement`. Items link via `menu_items.display_row_id`. |
| `menu_sections` | `id` (bigint) | Sections within a menu_config. Links to `menu_configs` via `menu_config_id`. |
| `menu_configs` | `id` (bigint) | Menu layout configuration per assortment. |

### Cost derivation (current state)

`products.price_foodservice` and `products.volume_foodservice` are 100% populated but contain **dummy data** (€2.00 / 0.330L for all beers). Real wholesale cost seeding is a separate project. For v1, the engine operates on whatever cost data is present — if cost is wrong, the recommendation is wrong, and the drill-in surfaces the cost so the operator can spot and correct it.

Serving cost per menu item:

```
unit_cost     = products.price_foodservice / products.volume_foodservice   -- €/L
serving_vol   = parse_volume(menu_items.volume) ?? products.volume_foodservice  -- liters
ex_factory    = unit_cost × serving_vol
```

Volume parsing: `"25cl" → 0.25`, `"50cl" → 0.50`, `"33cl" → 0.33`, `"glas" → products.volume_foodservice`, `"shot" → 0.04`, `null → products.volume_foodservice`.

### Commodity score (current state)

`products.commodity_score` exists (integer) but is `0` for all 6,761 products. The engine treats `0` and `null` as equivalent to score `2` (moderate reference). Operators refine per-item through the drill-in review flow. Bulk seeding is a separate project.

**Semantics of the score — reference price strength:**

| score | meaning | zone δ | examples |
|---|---|---|---|
| 3 | strong reference — customer knows what this costs everywhere | 0.05 | Jupiler, Coca-Cola, tap water |
| 2 | moderate reference — known brand, price varies by venue type | 0.10 | Duvel, Leffe, Fanta |
| 1 | weak/no reference — venue sets the anchor | 0.15 | craft one-offs, house specialties, obscure imports |
| 0 / null | unscored — treated as 2 | 0.10 | — |

The score captures: "if I charge more than expected, will the customer perceive this venue as expensive?" It does NOT capture brand strength (a Duvel justifiably costs more than a generic blond — that's a v2 brand modifier, not a reference-price issue).

### Categories in scope

All categories except WINES (id_category = 19). Food categories (SNACKS, MEALS, DEEP_FRIED_SNACKS) are included but limited to product-based items (wholesale cost available). Recipe-based dishes with no product link will naturally be excluded because they have no `product_id` → no cost → no recommendation.

---

## 4. New tables

### `pricing_config`

Per-venue (assortment-level) pricing parameters.

```sql
CREATE TABLE pricing_config (
  assortment_id     bigint PRIMARY KEY REFERENCES assortments(id),
  ratio             numeric      DEFAULT 1.75,
  addition          numeric      DEFAULT 0.80,
  overhead_per_item numeric      DEFAULT 0.70,
  snap_to_charm     boolean      DEFAULT true,
  charm_grid        numeric[]    DEFAULT '{0.1,0.3,0.5,0.9}',
  rounding_grain    numeric      DEFAULT 0.10,
  margin_low_threshold  numeric  DEFAULT 100,   -- euro-cents
  margin_good_threshold numeric  DEFAULT 250,   -- euro-cents
  updated_at        timestamptz  DEFAULT now()
);
```

Note: all monetary values in this table are in **euro-cents** to match `menu_items.price`.

### `venue_product_costs`

Per-venue cost overrides on top of the global catalog.

```sql
CREATE TABLE venue_product_costs (
  assortment_id     bigint REFERENCES assortments(id),
  product_id        bigint REFERENCES products(id_product),
  ex_factory_cost   numeric NOT NULL,  -- euro-cents per serving
  updated_at        timestamptz DEFAULT now(),
  PRIMARY KEY (assortment_id, product_id)
);
```

### `pricing_recommendations`

One row per (item, compute run) that produced a non-null recommendation.

```sql
CREATE TABLE pricing_recommendations (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assortment_id         bigint NOT NULL REFERENCES assortments(id),
  category_id           integer NOT NULL,   -- scoped per category run
  menu_item_id          bigint NOT NULL,    -- menu_items.id_menu_item
  product_id            bigint,             -- denormalized for fast lookup
  sibling_group_id      bigint,             -- menu_display_rows.id when row_type is variant
  computed_at           timestamptz NOT NULL,
  inputs_hash           text NOT NULL,
  -- cost model outputs
  ex_factory_cost       numeric,            -- the cost used (venue override or global)
  total_cost            numeric,            -- ex_factory + overhead
  ideal_price           numeric,
  -- zones
  green_zone_lo         numeric,
  green_zone_hi         numeric,
  orange_zone_lo        numeric,
  orange_zone_hi        numeric,
  -- recommendation
  recommended_price     numeric,
  previous_price        numeric NOT NULL,   -- menu_items.price at compute time, for undo
  direction             text NOT NULL,      -- 'raise' | 'lower' | 'none'
  binding_constraint    text,               -- 'cost' | 'cannibalisation'
  -- signals
  margin_euro           numeric,
  margin_band           text,               -- 'low' | 'ok' | 'good'
  sensitivity_band      text,               -- 'low' | 'moderate' | 'high'
  cannib_risk           text DEFAULT 'none',-- 'none' | 'moderate' | 'high'
  cannib_victim_item_id bigint,
  -- decision
  status                text NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected' | 'superseded'
  decided_at            timestamptz,
  decided_by            bigint,             -- users.id
  decision_note         text,
  -- breakdown + rationale stored as jsonb to avoid column sprawl
  breakdown             jsonb,
  rationale             jsonb
);

CREATE INDEX idx_pr_assortment_category ON pricing_recommendations(assortment_id, category_id);
CREATE INDEX idx_pr_menu_item ON pricing_recommendations(menu_item_id);
CREATE INDEX idx_pr_status ON pricing_recommendations(status) WHERE status = 'pending';
```

### Existing table changes

- `products.commodity_score`: already exists (integer). No schema change needed — just needs data.
- No new columns on `menu_items` for v1.

---

## 5. Engine contract

Single entry point:

```
computePricingRecommendations(assortmentId, categoryId) → PricingRunResult
```

Scoped to one category at a time (matches the UI action-picker flow).

Returns:

```js
{
  assortmentId,
  categoryId,
  computedAt,
  items: [{
    menuItemId,
    productId,
    siblingGroupId,        // menu_display_rows.id or null
    displayName,
    currentPrice,          // euro-cents
    idealPrice,
    zones: { green: [lo, hi], orange: [lo, hi] },
    recommendedPrice,      // euro-cents, or null when direction='none'
    direction,             // 'raise' | 'lower' | 'none'
    bindingConstraint,     // 'cost' | 'cannibalisation' | null
    margin: { euro, band },
    sensitivityBand,
    cannibalisation: {
      risk,                // 'none' | 'moderate' | 'high'
      victimItemId,
      explanation
    },
    breakdown: {
      exFactoryCost,       // per serving, euro-cents
      costSource,          // 'venue_override' | 'global_catalog'
      overhead,
      totalCost,
      currentMargin,
      recommendedMargin,
      currentMarkup,       // currentPrice / exFactoryCost (null if 0)
      idealMarkup,
      recommendedMarkup
    },
    rationale: {
      primaryReason,       // 'in_zone' | 'underpriced' | 'overpriced_sensitive' |
                           // 'overpriced_accepted' | 'cannibalisation'
      factors: [
        { kind: 'cost', zone, side, idealPrice, greenLo, greenHi },
        { kind: 'cannibalisation', risk, victimItemId, victimPrice,
          victimMargin, selfMargin, marginGap, raiseNeeded },
        { kind: 'sensitivity', band, commodityScore, delta },
        { kind: 'margin', currentEuro, recommendedEuro, band }
      ]
    },
    action,                // 'pending' | 'suppressed'
    prior                  // { status, decidedAt, note } when suppressed
  }]
}
```

The function is pure and deterministic. No side effects. Persistence is a separate `saveRun(result)` call.

---

## 6. Algorithm

Five passes, each testable in isolation.

### 6.1 Cost model (per item)

```
ex_factory   = venue_product_costs.ex_factory_cost
            ?? compute_from_product(product)   -- price_foodservice/volume_foodservice × serving_volume
overhead     = pricing_config.overhead_per_item
total_cost   = ex_factory + overhead
ideal_price  = total_cost × pricing_config.ratio + pricing_config.addition
```

Items with null or zero ex_factory are skipped (no recommendation emitted).

`addition` is in euro-cents to match `menu_items.price`. Default: 80 (€0.80).

### 6.2 Zone computation (per item)

Zone width `delta` based on `products.commodity_score` (reference price strength):

| commodity_score | sensitivity band | delta (fraction of ideal) |
|---|---|---|
| 3 | high | 0.05 |
| 2 | moderate | 0.10 |
| 1 | low | 0.15 |
| 0 / null | moderate | 0.10 |

```
green  = [ideal × (1 - delta), ideal × (1 + delta)]
orange = [ideal × (1 - 2×delta), ideal × (1 + 2×delta)]
red    = everything outside orange
```

Direction (too-low vs too-high) is read from position relative to ideal, not from the color.

### 6.3 Cost-based target (per item)

```
if current in green:
    cost_target = null, direction = 'none'

elif current < green_lo:               // underpriced — always raise
    cost_target = green_lo
    direction   = 'raise'

elif current > green_hi:               // overpriced
    if commodity_score == 3:           // strong reference — customers notice
        cost_target = green_hi
        direction   = 'lower'
    else:                              // weak reference — pocket the margin
        cost_target = null
        direction   = 'none'
```

This is the asymmetric rule: always flag underpriced. Only flag overpriced when the customer has a strong reference price and will perceive the venue as expensive.

### 6.4 Cannibalisation pass (per subsubcategory cohort)

Within the category being audited, group items by `products.id_subsubcategory`. For each cohort with ≥ 2 items with valid cost data:

```
margin(I) = I.current_price - I.total_cost

for X, Y in cohort, X != Y:
  if X.current_price < Y.current_price
 and margin(X)       < margin(Y):
    // X is cannibalising Y — cheaper AND lower margin
    raise_needed = min(
      margin(Y) - margin(X),
      Y.current_price - X.current_price
    )
    pair_risk = { victim: Y, raise: raise_needed, margin_gap: margin(Y) - margin(X) }
```

Per item X, pick the worst pair (largest margin gap). That defines the cannibalisation output.

**Note on Belgian market context:** In Belgian cafes, many subsubcategories have only one item (one pils, one cola). Cannibalisation only fires for categories where the venue carries multiple options in the same subsubcategory — typically specialty beers, cocktails, flavored lemonades.

Risk banding:

| condition | risk |
|---|---|
| margin gap >= 100 cents AND raise >= 10% of current_price | high |
| margin gap >= 40 cents | moderate |
| otherwise | none |

### 6.5 Combine cost + cannibalisation (per item)

```
candidates = [cost_target, cannib_target].filter(not null)

if empty:
    recommended_raw = null, direction = 'none'
else:
    recommended_raw    = max(candidates)
    binding_constraint = (recommended_raw == cannib_target) ? 'cannibalisation' : 'cost'
    direction          = recommended_raw > current ? 'raise' : 'lower'
```

Taking the max means cannibalisation can push a recommendation past the green zone. The drill-in shows this tension visually (marker in orange/red territory, cannibalisation chip explains why).

### 6.6 Sibling coherence (per sibling group)

For each `menu_display_rows.id` where `row_type IN ('brand_variants', 'price_variants')`, collect all linked `menu_items` (via `display_row_id`).

1. Compute individual `recommended_raw` for each member.
2. If all agree on direction → apply average delta uniformly.
3. If members disagree on direction → mark group conflicted, emit no recommendation, log for manual review.

Only ~36 display rows are sibling-type across the whole DB today. This pass is a near-no-op for most venues but correct for enriched venues like FARAO (29 sibling groups).

### 6.7 Charm snapping (post-processing)

```
if pricing_config.snap_to_charm:
    recommended_price = snap_to_grid(recommended_raw, charm_grid)
else:
    recommended_price = round_to(recommended_raw, rounding_grain)
```

`snap_to_grid` with default `[0.1, 0.3, 0.5, 0.9]`: a raw of 437 cents → 430 (nearest .3 ending), a raw of 475 → 490 (nearest .9).

All values in euro-cents. Charm grid values represent the tens+units digit (e.g., 0.1 → prices ending in x10, 0.3 → x30, etc.).

### 6.8 Margin band (at the recommended price)

```
margin_euro = recommended_price - total_cost
margin_band = 'low'  if margin_euro < margin_low_threshold     // default 100 (€1)
              'ok'   if margin_euro < margin_good_threshold    // default 250 (€2.50)
              'good' otherwise
```

### 6.9 Rationale (per item)

Structured `rationale` emitted per item. Only consumed by the drill-in — the list view never reads it.

`primaryReason` values:

| condition | primaryReason |
|---|---|
| current in green, no cannib signal | `in_zone` |
| binding_constraint = 'cannibalisation' | `cannibalisation` |
| cost target set, current < green_lo | `underpriced` |
| cost target set, current > green_hi, score = 3 | `overpriced_sensitive` |
| current > green_hi but cost target null | `overpriced_accepted` |

Victim names are NOT resolved by the engine — only `victimItemId`. The UI component looks up the display name from its own item cache.

The UI composes the Dutch sentence at render time from `primaryReason` + the relevant factor. Templating lives in the UI layer, not the engine.

---

## 7. Persistence and rerun semantics

### Inputs hash

```
inputs_hash = hash(
  ex_factory_cost,
  commodity_score,
  current_price,
  sorted(cohort_current_prices),   // subsubcategory siblings
  pricing_config_snapshot
)
```

### Rerun flow

1. Compute fresh recommendations (pure function, no DB writes).
2. For each fresh recommendation, look up the most recent prior decision on `(assortment_id, menu_item_id)`.
3. Resolve:
   - **No prior**: insert as `pending`.
   - **Prior `accepted`**: the accepted price is the new baseline. Fresh computation uses `current_price = menu_items.price` (which was already updated on accept). If the recommendation still fires, insert as `pending`.
   - **Prior `rejected`, matching `inputs_hash`**: suppress. Show under "previously rejected" with `action = 'suppressed'` and the prior note.
   - **Prior `rejected`, different `inputs_hash`**: mark prior as `superseded`, insert fresh as `pending`, tag as "inputs changed since last review."
4. Recommendations from the prior run with no corresponding fresh recommendation are marked `superseded`.

### Accept / Reject / Undo

- **Accept**: write `status='accepted'`, update `menu_items.price` to `recommended_price`. The `previous_price` column on the recommendation row enables undo.
- **Accept with edit**: same as accept, but operator types a different price. Store the operator's price as the final `recommended_price`.
- **Reject**: write `status='rejected'`, optional `decision_note`. `menu_items.price` is unchanged.
- **Undo** (nice-to-have): read `previous_price` from the accepted recommendation, write it back to `menu_items.price`, flip status back to `pending`.

---

## 8. UI flow

### 8.1 Entry point — category action picker

When the operator clicks a category (e.g., "Bieren") on their menu dashboard, they land on an action picker:

```
┌─────────────────────────────┐
│  Bieren                     │
│                             │
│  ┌─────────────────────┐    │
│  │ Toevoegen/Verwijderen│   │  → existing add/remove page
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Herprijzen          │    │  → pricing optimizer (this spec)
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Herpositioneren     │    │  → layout optimizer (future)
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Promoten            │    │  → promotion engine (future)
│  └─────────────────────┘    │
└─────────────────────────────┘
```

"Herprijzen" triggers a pricing run for this category + assortment and navigates to the review screen.

### 8.2 List view (every pending item in the category)

Minimal. Per item:

- Item name (display_name) + subcategory breadcrumb.
- **Price delta** — `current → recommended` with arrow glyph colored by direction.
- **Status pill** — `Te laag` / `Te hoog` / `Goed`, derived from direction + zone.
- **Quick accept / reject** buttons.

No chips, no gradient bar, no rationale. The list is a triage surface.

Items resolving to `Goed` are hidden by default behind a toggle ("toon items in de groene zone").

Default sort: `|recommended - current|` descending — biggest moves first.

### 8.3 Drill-in (clicked item)

Panel or overlay showing the full action summary for one item:

1. **Header** — item name, category, cost source badge (`venue override` / `global catalog`).
2. **Gradient bar** — green/orange/red zones, markers for ideal, current, and recommended.
3. **Price breakdown**:
   ```
   Aankoop           €1.20      [venue override >]
   Overhead          €0.70
   ─────────────────
   Kostprijs         €1.90
   Marge             €2.90      (ok)
   Verkoop           €4.80
   (×4.0 op aankoop)
   ```
   Margin in euro is primary and bold. Markup factor is parenthetical. "Venue override" is clickable to correct the cost.

4. **Three chips**: Cannibalisation risk, Price sensitivity (reference score), Margin band.
5. **Rationale paragraph** — 1–3 sentences, Dutch, composed from `primaryReason` + factors.
6. **Reference score slider** — commodity_score (1–3) for this product. Operator can adjust here; saves to `products.commodity_score` and persists for future runs.
7. **Decision controls** — Accept / Edit (accept with different price) / Reject (with optional note).

### 8.4 Header summary

Always-visible top bar: `N te laag | M te hoog | K goed | C met kannibalisatie-risico`. Updates live as operator decides.

---

## 9. Constants and tunables

| constant | default | stored on | notes |
|---|---|---|---|
| `ratio` | 1.75 | pricing_config | affine multiplier |
| `addition` | 80 | pricing_config | affine constant, euro-cents |
| `overhead_per_item` | 70 | pricing_config | euro-cents |
| `delta(score=3)` | 0.05 | engine constants | narrow zone for commodities |
| `delta(score=2)` | 0.10 | engine constants | default |
| `delta(score=1)` | 0.15 | engine constants | wide zone for niche |
| `delta(score=0/null)` | 0.10 | engine constants | treated as moderate |
| `cannib_high_margin_gap` | 100 | engine constants | euro-cents |
| `cannib_high_raise_pct` | 0.10 | engine constants | 10% of current |
| `cannib_moderate_margin_gap` | 40 | engine constants | euro-cents |
| `margin_low_threshold` | 100 | pricing_config | euro-cents |
| `margin_good_threshold` | 250 | pricing_config | euro-cents |
| `snap_to_charm` | true | pricing_config | — |
| `charm_grid` | [0.1,0.3,0.5,0.9] | pricing_config | — |
| `rounding_grain` | 10 | pricing_config | euro-cents |

---

## 10. Reference fixture — FARAO

Assortment ID `6714`, business "FARAO" (business_id 381). 175 items, 144 display rows, 29 sibling groups (price_variants + brand_variants).

**Current blocker**: all 175 items have `product_id = null`. Product linking must be done before the engine can run. Once linked, FARAO is the ideal test venue because it has the richest display-row coverage of any venue in the DB.

Prices are in euro-cents (Cava = 2500, Porto glas = 400, Malibu shot = 300).

---

## 11. Future upgrade paths

Called out so v1 doesn't paint us into a corner.

- **Peer-venue band pricing (WTP v2)**: compute per-product price distribution across venues in the region. Green zone becomes the p25–p75 band instead of the cost-based zone. Combined with a venue positioning vector (0–1 on cheap-to-expensive scale), interpolate the ideal for that specific venue. The engine interface stays the same — only the zone and ideal computations change.
- **Per-category cost-model constants**: move `ratio`, `addition`, `overhead_per_item` to a `(assortment_id, category_id)` lookup with `category_id IS NULL` as the venue default. Cocktails get `ratio=3.5`, soft drinks get higher `addition` floor, etc. Engine interface unchanged.
- **Brand-strength modifiers**: within a subsubcategory, a premium brand (Duvel) justifies a higher price than a generic. Per-product modifier on top of the zone so the engine doesn't flag premium brands as overpriced.
- **Automated commodity scoring**: replace the manual 0–3 score with a computed reference-price-strength from the coefficient of variation of the product's price across peer venues. Tight CV = strong reference = score 3.
- **Richer cannibalisation**: move from binary "same subsubcategory" to continuous similarity (flavour, ABV, lifestyle tags).
- **Layout scoring**: separate pass after pricing, consuming margin × sensitivity. Different endpoint, different review flow.

---

## 12. Implementation plan

### Files

| file | purpose |
|---|---|
| `server/services/pricingEngine.js` | Pure engine — `computePricingRecommendations()`. No DB writes. |
| `server/services/pricingPersistence.js` | `saveRun()`, `acceptRecommendation()`, `rejectRecommendation()`, `undoAccept()`. |
| `server/routes/pricing.routes.js` | REST endpoints for the UI. |
| `src/Pricing/PricingReview.js` | List view + drill-in React component. |
| `src/Pricing/PricingActionPicker.js` | Category action picker (shared with future Reposition/Promote). |

### Engine conventions

- All monetary values in euro-cents (integers). No floating-point euro amounts.
- English field names in engine and DB. Dutch only in the React UI layer.
- `computePricingRecommendations()` takes a DB-fetched input bundle, not raw Supabase calls. This keeps the engine pure and testable against fixture data.

### Migration

Via Supabase MCP `apply_migration`. Three new tables: `pricing_config`, `venue_product_costs`, `pricing_recommendations`. No changes to existing tables.

---

## 13. Review checklist before writing code

- [ ] Product IDs linked for FARAO (175 items, currently all null).
- [ ] Wholesale cost data seeded (at least for FARAO's products) — separate project, can proceed with dummy data if needed.
- [ ] Confirm `menu_items.price` is consistently in euro-cents across all assortments.
- [ ] Confirm the action-picker UI location in the existing React routing (`src/App.js`).
- [ ] Commodity score seeding approach decided (manual per-product, category defaults, or flat 2).
