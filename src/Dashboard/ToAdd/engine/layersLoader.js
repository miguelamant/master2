// Loads layers from layers.all.v1.json (+matrix), expands 2D cell templates,
// and filters layers to the current view (allowlist + category + scope + fields).

import ALL from './layers.all.v1.json';
import MATRIX from './layers.all.matrix.v1.json';
import BEERS from './layers.beers.v1.json';

// ---- helpers ---------------------------------------------------------------

function ensureArray(x) { return Array.isArray(x) ? x : (x == null ? [] : [x]); }

function hasField(groups, field) {
    if (!field) return false;
    return (Array.isArray(groups) ? groups : []).some(g => g && Object.prototype.hasOwnProperty.call(g, field));
}

function scopeMatches(layer, groups) {
    // If no scope -> ok
    const sc = layer?.scope;
    if (!sc || typeof sc !== 'object') return true;

    // Scope supports exact-match constraints, e.g. { subcategory: "LEMONADES" }
    // If *none* of the groups satisfy scope, we can early-reject the layer.
    return (groups || []).some(g => {
        for (const [k, v] of Object.entries(sc)) {
            if (String(g?.[k]) !== String(v)) return false;
        }
        return true;
    });
}

function expandCellCurve(layer) {
    // If it's a 2D layer and `cells` is empty but `cell_curve` exists → stamp to all row×col
    if (layer.type !== '2D') return layer;
    const rows = ensureArray(layer.rows);
    const cols = ensureArray(layer.cols);
    const cells = layer.cells || {};
    if (Object.keys(cells).length > 0) return layer;

    const cc = layer.cell_curve;
    if (!cc) return layer;

    const stamped = {};
    for (const r of rows) {
        for (const c of cols) {
            stamped[`${r}::${c}`] = { curve: cc };
        }
    }
    return { ...layer, cells: stamped };
}

function toUsable(layer, groups) {
    // 1D needs its field present in at least one group
    if (layer.type === '1D') {
        if (!hasField(groups, layer.field)) return null;
        return layer;
    }

    // 2D needs both row/col fields present in at least one group
    if (layer.type === '2D') {
        const { rows_field, cols_field } = layer;
        if (!hasField(groups, rows_field) || !hasField(groups, cols_field)) return null;
        return expandCellCurve(layer);
    }

    // Unknown types are ignored
    return null;
}

// ---- public API ------------------------------------------------------------

export function loadAllLayers() {
    // Merge legacy + beers + matrix sets (all optional)
    const layers = [].concat(
        ensureArray(ALL?.layers),
        ensureArray(BEERS?.layers),
        ensureArray(MATRIX?.layers)
    );
    const defaults = {
        ...(ALL?.defaults || {}),
        ...(BEERS?.defaults || {}),
        ...(MATRIX?.defaults || {}),
    };
    return { layers, defaults };
}

/**
 * Build layers for a particular view.
 * @param {Array<number|string>} allowIds - allowlist from preset
 * @param {Array<object>} groups - viewGroups (so we can test fields/scope)
 * @param {"sodas"|"beers"|string|null} activeCategory - optional category filter
 */
export function buildLayersForView({ allowIds = [], groups = [], activeCategory = null }) {
    const { layers: all, defaults } = loadAllLayers();

    // 1) allowlist filter
    const allow = new Set(ensureArray(allowIds).map(String));
    let cand = all.filter(L => allow.size === 0 || allow.has(String(L.layer_id)));

    // 2) category filter (if layer has an explicit "category")
    if (activeCategory) {
        cand = cand.filter(L => {
            const cat = (L.category || '').toString().toLowerCase();
            return !cat || cat === String(activeCategory).toLowerCase();
        });
    }

    // 3) scope + field presence checks
    const usable = [];
    for (const L of cand) {
        if (!scopeMatches(L, groups)) continue;
        const U = toUsable(L, groups);
        if (U) usable.push(U);
    }

    return { layers: usable, defaults };
}
