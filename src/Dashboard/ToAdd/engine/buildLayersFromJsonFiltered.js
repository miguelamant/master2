// src/Dashboard/ToAdd/engine/buildLayersFromJsonFiltered.js
import { buildLayersForView } from './layersLoader';

/**
 * Normalize groups and assign a canonical, stable group.id used by
 * the planner and counts maps. Prefer explicit IDs, otherwise build
 * from available fields (2D, ranges, or plain subcategory).
 *
 * @param {Array<number|string>} layerIds
 * @param {Array<object>} groups
 * @param {"refreshments"|"beers"|string|null} activeCategory
 */
export function buildLayersFromJsonFiltered(layerIds, groups = [], activeCategory = null) {
    const canonCat = (x) => String(x ?? '').trim().toUpperCase();

    const to01 = (v) =>
        v === 1 || v === '1' || v === true || (typeof v === 'string' && v.toLowerCase() === 'true')
            ? 1
            : v === 0 || v === '0' || v === false || (typeof v === 'string' && v.toLowerCase() === 'false')
                ? 0
                : null;

    const TOKEN = (s) =>
        String(s ?? '')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');

    // Parse pretty labels like "BASE · 5.6–7.5%" or "BASE · 7.6% +"
    // Returns { base, lo, hi, openEnded } or null
    function parsePrettyBandLabel(label) {
        if (!label) return null;
        const m = String(label).match(/^(.+?)\s·\s(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)(\s*%\s*\+)?$/);
        if (m) {
            return {
                base: m[1].trim(),
                lo: m[2],
                hi: m[3],
                openEnded: !!m[4],
            };
        }
        return null;
    }

    /**
     * Build a canonical id for a group.
     * Priority:
     *  1) explicit g.id / g.key
     *  2) 2D keys (subcategory × is_zero):  "SUBCAT::0/1"
     *  3) band/range label:                 "BASE::[lo,hi]" (hi=100 if open-ended)
     *  4) subcategory                       "SUBCAT"
     *  5) category                          "CATEGORY"
     *  6) tokenized label                   "TOKEN(LABEL)"
     */
    function canonicalGroupId(g) {
        if (!g) return null;
        if (g.id)  return String(g.id);
        if (g.key) return String(g.key);

        const subcat = g.subcategory ? String(g.subcategory).trim() : null;
        const cat    = g.category ? String(g.category).trim() : null;

        // 2D: subcategory × is_zero (or any boolean col already normalized to 0/1)
        // produce "SUBCATEGORY::0" / "SUBCATEGORY::1"
        if (subcat && (g.is_zero === 0 || g.is_zero === 1)) {
            return `${subcat}::${g.is_zero}`;
        }

        // Try parsing a pretty "BASE · RANGE" label into canonical "BASE::[lo,hi]"
        const parsed = parsePrettyBandLabel(g.label);
        if (parsed) {
            const baseTok = TOKEN(parsed.base);
            const lo = parsed.lo;
            const hi = parsed.openEnded ? '100' : parsed.hi;
            return `${baseTok}::[${lo},${hi}]`;
        }

        // Plain 1D subcategory
        if (subcat) return subcat;

        // Fallback: category
        if (cat) return cat;

        // Last resort: tokenized label
        if (g.label) return TOKEN(g.label);

        return null;
    }

    const activeCatCanon = activeCategory ? canonCat(activeCategory) : null;

    if (!Array.isArray(layerIds) || layerIds.length === 0) {
        console.warn('[layers] No allowlist layerIds provided to buildLayersFromJsonFiltered');
    }

    const normalizedGroups = (Array.isArray(groups) ? groups : []).map((g, idx) => {
        const ng = { ...g };

        // normalize category (fall back to active)
        ng.category = ng.category ? canonCat(ng.category) : activeCatCanon;

        // ensure label exists & normalize a token version for fallbacks
        const labelRaw = ng.label != null ? String(ng.label) : '';
        const labelTok = TOKEN(labelRaw);

        // normalize subcategory / subsubcategory to tokenized uppercase
        if (typeof ng.subcategory === 'string')   ng.subcategory   = TOKEN(ng.subcategory);
        if (typeof ng.subsubcategory === 'string') ng.subsubcategory = TOKEN(ng.subsubcategory);

        // If missing, fall back to label token (helps when view partitions inject pretty labels)
        if (!ng.subcategory)   ng.subcategory   = labelTok;
        if (!ng.subsubcategory) ng.subsubcategory = labelTok;

        // normalize booleans to 0/1
        if ('is_zero' in ng) {
            const v = to01(ng.is_zero);
            if (v !== null) ng.is_zero = v;
        }
        if ('is_sparkling' in ng) {
            const v = to01(ng.is_sparkling);
            if (v !== null) ng.is_sparkling = v;
        }

        // numeric count
        if ('count' in ng) ng.count = Number(ng.count ?? 0);

        // assign canonical id & set key for backward compatibility
        ng.id  = canonicalGroupId(ng) ?? labelTok;
        ng.key = ng.id;

        // optional debug for the first few groups
        if (idx < 3) {
            console.debug('[layers.normalize group]', {
                id: ng.id,
                key: ng.key,
                label: ng.label,
                category: ng.category,
                subcategory: ng.subcategory,
                is_zero: ng.is_zero,
                count: ng.count,
            });
        }

        return ng;
    });

    console.debug('[pre-build layers] sample groups', normalizedGroups.slice(0, 8));

    // Hand off to the real builder with canonical category
    return buildLayersForView({
        allowIds: layerIds,
        groups: normalizedGroups,
        activeCategory: activeCatCanon, // "BEERS" / "REFRESHMENTS"
    });
}
