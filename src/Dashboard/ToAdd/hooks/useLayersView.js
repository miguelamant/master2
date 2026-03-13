import React from 'react';
import { getPresetId } from '../utils/presetId';
import { getAllowlistForPreset } from '../layersForPreset';
import { buildLayersFromJsonFiltered } from '../engine/buildLayersFromJsonFiltered';
import { buildPerLayerCounts } from '../engine/counts';

const readBool = (v, def = 0) => {
    if (v === 1 || v === '1' || v === true) return 1;
    if (v === 0 || v === '0' || v === false) return 0;
    return def;
};

const parseCompositeMulti = (label) => {
    const parts = String(label).split(' · ').map(p => (p || '').trim());
    const base = parts[0] || String(label);
    const suffixes = parts.slice(1).map(p => p.toLowerCase());

    let is_sparkling = null, is_zero = null;

    // sparkling / still
    if (suffixes.includes('sparkling')) is_sparkling = 1;
    if (suffixes.includes('still') || suffixes.includes('not sparkling')) is_sparkling = 0;

    // sugar vs zero (refreshments)
    if (suffixes.includes('zero')) is_zero = 1;
    if (suffixes.includes('with sugar')) is_zero = 0;

    // beers: "With alcohol" should imply non-zero
    if (suffixes.includes('with alcohol')) is_zero = 0;

    return { base, is_sparkling, is_zero };
};


const inferSubcat = (ssub) => {
    const t = String(ssub || '').toUpperCase();
    if (t.startsWith('ICE_TEA')) return 'ICE_TEA';
    if (t.startsWith('LEMONADES')) return 'LEMONADES';
    if (t.startsWith('COLA')) return 'COLA';
    if (t.startsWith('GINGER')) return 'GINGER_DRINKS';
    if (t.startsWith('TONIC')) return 'TONICS';
    if (t.startsWith('NFC')) return 'NFC';
    if (t.startsWith('JUICES_NFC')) return 'JUICES_NFC';
    if (t.startsWith('JUICES_CONCENTRATE')) return 'JUICES_CONCENTRATE';
    return null;
};

const layerScopeMatchesGroup = (L, g) => {
    const sc = L?.scope || {};
    if (sc.subcategory && String(sc.subcategory).toUpperCase() !== String(g.subcategory || '').toUpperCase()) return false;
    if (sc.category && String(sc.category).toUpperCase() !== String(g.category || '').toUpperCase()) return false;
    return true;
};

const pickHideFlag1D = (L, bucketKey) => {
    const layerFlag = readBool(L?.hide_if_zero, null);
    const b = L?.buckets?.[bucketKey];
    const bucketFlag = readBool(b?.curve?.hide_if_zero ?? b?.hide_if_zero, null);
    if (bucketFlag !== null) return bucketFlag === 1;
    if (layerFlag !== null) return layerFlag === 1;
    return false;
};

const pickHideFlag2D = (L, rowKey, colKey) => {
    const layerFlag = readBool(L?.hide_if_zero, null);
    const key = `${rowKey}::${colKey}`;
    const cell =
        (L?.cells && L.cells[key]) ||
        (L?.buckets && L.buckets[key]) ||
        null;

    const cellFlag = readBool(cell?.curve?.hide_if_zero ?? cell?.hide_if_zero, null);
    if (cellFlag !== null) return cellFlag === 1;
    if (layerFlag !== null) return layerFlag === 1;
    return false;
};


const shouldHideZeroForLabel = (label, n, groupBy, groupLookup, layers) => {
    if (Number(n) !== 0) return false;
    const g = groupLookup(label);
    if (!g) return false;

    for (const L of (layers || [])) {
        if (!layerScopeMatchesGroup(L, g)) continue;

        if (L.type === '1D' && L.field) {
            if (L.field === 'subcategory') {
                if (pickHideFlag1D(L, g.subcategory)) return true;
            } else if (L.field === 'subsubcategory') {
                if (pickHideFlag1D(L, g.subsubcategory)) return true;
            } else if (L.field === 'is_zero') {
                if (g.is_zero != null && pickHideFlag1D(L, String(g.is_zero))) return true;
            } else if (L.field === 'is_sparkling') {
                if (g.is_sparkling != null && pickHideFlag1D(L, String(g.is_sparkling))) return true;
            }
        }

        if (L.type === '2D' && L.rows_field && L.cols_field) {
            const rowKey = L.rows_field === 'subcategory' ? g.subcategory
                : L.rows_field === 'subsubcategory' ? g.subsubcategory
                    : L.rows_field === 'is_zero' ? String(g.is_zero)
                        : L.rows_field === 'is_sparkling' ? String(g.is_sparkling)
                            : null;

            const colKey = L.cols_field === 'subcategory' ? g.subcategory
                : L.cols_field === 'subsubcategory' ? g.subsubcategory
                    : L.cols_field === 'is_zero' ? String(g.is_zero)
                        : L.cols_field === 'is_sparkling' ? String(g.is_sparkling)
                            : null;

            if (rowKey != null && colKey != null) {
                if (pickHideFlag2D(L, rowKey, colKey)) return true;
            }
        }
    }
    return false;
};

export function useLayersView({
                                  countsByCategory, groupBy, apiFilters, presetPredicates, within, activeCategory, effectiveSection, currentPreset, layersOverride, dynamicLayers
                              }) {
    // 0) bucket → rowLabel map (from preset's aggregateRows.rows)
    const bucketToRowLabel = React.useMemo(() => {
        const m = new Map();
        for (const row of (currentPreset?.ui?.aggregateRows?.rows || [])) {
            const label = row.title;
            if (!label) continue;
            for (const b of (row.buckets || [])) m.set(String(b), label);
        }
        return m;
    }, [currentPreset]);

    // 1) BASE groups
    const baseGroups = React.useMemo(() => {
        const entries = Object.entries(countsByCategory || {});
        const groups = entries.map(([label, count], i) => {
            const { base, is_sparkling: partSpark, is_zero: partZero } = parseCompositeMulti(label);

            const getEq = (field) => {
                const p = (presetPredicates || []).find(pr => pr.field === field && String(pr.op || '').toLowerCase() === 'eq');
                if (p && (p.value === 0 || p.value === 1 || p.value === '0' || p.value === '1')) return Number(p.value);
                const v = apiFilters ? apiFilters[field] : undefined;
                if (v === 0 || v === 1 || v === '0' || v === '1') return Number(v);
                return null;
            };
            const globalZero  = getEq('is_zero');
            const globalSpark = getEq('is_sparkling');

            const spark = (partSpark ?? globalSpark ?? null);
            const zero  = (partZero  ?? globalZero  ?? null);

            const baseTok = String(base).toUpperCase();
            const inferredSubcat = inferSubcat(baseTok);
            const subcatTok = inferredSubcat || baseTok; // ✅ always present

            const g = {
                id: `bg_${i}`,
                label,
                count: Number(count || 0),
                is_sparkling: spark,
                is_zero: zero,
                subsubcategory: baseTok,
                subcategory: subcatTok, // ✅ always present (important for layer usability checks)
            };

            const inferredCategory =
                (apiFilters?.category && String(apiFilters.category).toUpperCase()) ||
                (within?.category && String(within.category).toUpperCase()) ||
                (effectiveSection === 'beers' ? 'BEERS'
                    : effectiveSection === 'refreshments' ? 'REFRESHMENTS'
                        : null);

            if (!g.category && inferredCategory) g.category = inferredCategory;

            if (groupBy === 'subcategory')    g.subcategory    = g.subcategory || baseTok;
            if (groupBy === 'subsubcategory') g.subsubcategory = baseTok;

            // rowLabel: the row-aggregate this bucket belongs to (used by row-level engine layers)
            g.rowLabel = bucketToRowLabel.get(label) || label;

            return g;
        });
        return groups;
    }, [countsByCategory, groupBy, apiFilters, presetPredicates, within, effectiveSection, bucketToRowLabel]);

    // 2) Load layers
// 2) Load layers (supports per-business override via layersOverride)
    const allowIds = React.useMemo(() => {
        const pid = String(getPresetId?.(currentPreset) ?? currentPreset?.id ?? '');
        const ids = getAllowlistForPreset(pid);
        return ids.length ? ids : [1001];
    }, [currentPreset]);

    const { layers: usableLayers } = React.useMemo(() => {
        const ids = Array.isArray(allowIds) ? allowIds.map(String) : [String(allowIds)];

        // Helper checks (local to this memo)
        const hasField = (groups, field) =>
            field && (Array.isArray(groups) ? groups : []).some(g => g && Object.prototype.hasOwnProperty.call(g, field));

        const scopeMatches = (layer, groups) => {
            const sc = layer?.scope;
            if (!sc || typeof sc !== 'object') return true;
            return (groups || []).some(g => {
                for (const [k, v] of Object.entries(sc)) {
                    if (String(g?.[k]) !== String(v)) return false;
                }
                return true;
            });
        };

        const toUsable = (L, groups) => {
            if (L.type === '1D') {
                if (!hasField(groups, L.field)) return null;
                return L;
            }
            if (L.type === '2D') {
                const { rows_field, cols_field } = L;
                if (!hasField(groups, rows_field) || !hasField(groups, cols_field)) return null;
                return L;
            }
            return null;
        };

        // --- dynamic layers path (runtime-computed from persona distributions) ---
        if (Array.isArray(dynamicLayers) && dynamicLayers.length > 0) {
            const usable = dynamicLayers
                .map(L => toUsable(L, baseGroups))
                .filter(Boolean);
            return { layers: usable };
        }

        // Prefer per-business merged layers if provided
        // --- override/sessionStorage path ---
        if (layersOverride && Array.isArray(layersOverride.layers)) {
            const allowSet = new Set(ids.map(String));
            let cand = layersOverride.layers.filter(L => allowSet.has(String(L.layer_id)));

            if (activeCategory) {
                cand = cand.filter(L => {
                    const cat = (L.category || '').toString().toLowerCase();
                    return !cat || cat === String(activeCategory).toLowerCase();
                });
            }

            const usable = [];
            for (const L of cand) {
                if (!scopeMatches(L, baseGroups)) continue;
                const U = toUsable(L, baseGroups);
                if (U) usable.push(U);
            }

            // keep allowlist order
            usable.sort((a, b) => ids.indexOf(String(a.layer_id)) - ids.indexOf(String(b.layer_id)));

            // ✅ NEW: fallback to 1001 if allowlisted layers are missing
            if (usable.length === 0) {
                const fallback = layersOverride.layers.find(L => String(L.layer_id) === "1001");
                if (fallback && (!activeCategory || !fallback.category || String(fallback.category).toLowerCase() === String(activeCategory).toLowerCase())) {
                    if (scopeMatches(fallback, baseGroups)) {
                        const U = toUsable(fallback, baseGroups);
                        if (U) usable.push(U);
                    }
                }
            }

            return { layers: usable };
        }

// --- file-based path ---
        const result = buildLayersFromJsonFiltered(ids, baseGroups, activeCategory);
        let arr = Array.isArray(result?.layers) ? result.layers : [];

// ✅ NEW: fallback to 1001 if allowlisted layers are missing
        if (arr.length === 0) {
            const fb = buildLayersFromJsonFiltered(["1001"], baseGroups, activeCategory);
            const fbArr = Array.isArray(fb?.layers) ? fb.layers : [];
            if (fbArr.length) arr = fbArr;
        }

        return { layers: arr };
    }, [allowIds, baseGroups, activeCategory, layersOverride, dynamicLayers]);



    const activeLayers = React.useMemo(() => {
        const order = new Map((Array.isArray(allowIds) ? allowIds : []).map((id, i) => [String(id), i]));
        const arr = Array.isArray(usableLayers) ? usableLayers.slice() : [];
        arr.sort((a, b) => (order.get(String(a.layer_id)) ?? 1e9) - (order.get(String(b.layer_id)) ?? 1e9));
        return arr;
    }, [usableLayers, allowIds]);






    // 3) hide_if_zero → displayedCountsByCategory
    // ⬇️ put this near the other memos inside useLayersView()

// Build a fast lookup for "forceShow" coming from the current preset
    const forceSet = new Set(
        Array.isArray(currentPreset?.forceShow) ? currentPreset.forceShow : []
    );

// ---------- 3) Apply hide_if_zero to produce displayedCountsByCategory ----------
    // TODO: temporary — show all buckets regardless of zero. Remove this flag once
    // the user has identified which zero buckets to keep via forceShow.
    const SHOW_ALL_ZEROS = true;

    const displayedCountsByCategory = React.useMemo(() => {
        if (!baseGroups.length) return countsByCategory || {};

        if (SHOW_ALL_ZEROS) return { ...(countsByCategory || {}) };

        // for shouldHideZeroForLabel → we need a label→group lookup
        const groupMap = new Map(baseGroups.map(g => [g.label, g]));
        const lookup = (label) => groupMap.get(label) || null;

        const out = {};
        for (const [label, n] of Object.entries(countsByCategory || {})) {
            // ✅ if label is explicitly forced, never hide it (even when 0)
            if (forceSet.has(label)) {
                out[label] = n ?? 0;
                continue;
            }

            const hide = shouldHideZeroForLabel(label, n, groupBy, lookup, activeLayers);
            if (!hide) out[label] = n;
        }
        // Inject forceShow items that are missing entirely (e.g. rolled-up or never
        // returned by the API when count = 0). This ensures they always appear.
        for (const label of forceSet) {
            if (!(label in out)) out[label] = 0;
        }
        return out;
    }, [
        countsByCategory,
        baseGroups,
        activeLayers,
        groupBy,
        currentPreset?.forceShow, // keep this in deps
    ]);


    // 4) viewGroups (expose both subcategory & subsubcategory)
    const viewGroups = React.useMemo(() => {
        const entries = Object.entries(displayedCountsByCategory || {});
        return entries.map(([label, count], i) => {
            const { base, is_sparkling: partSpark, is_zero: partZero } = parseCompositeMulti(label);
            const baseTok = String(base).toUpperCase();
            const inferredSubcat = inferSubcat(baseTok);

            const g = {
                id: `vg_${i}`,
                label,
                count: Number(count || 0),
                is_sparkling: partSpark ?? null,
                is_zero: partZero ?? null,
                subsubcategory: baseTok,
                subcategory: inferredSubcat || baseTok,
                category: (activeCategory || '').toString().toUpperCase(),
            };

            if (groupBy === 'subcategory')    g.subcategory    = g.subcategory || baseTok;
            if (groupBy === 'subsubcategory') g.subsubcategory = baseTok;
            g.rowLabel = bucketToRowLabel.get(label) || label;
            return g;
        });
    }, [displayedCountsByCategory, groupBy, activeCategory, bucketToRowLabel]);

    // Debug: log a sample of viewGroups whenever they change
    React.useEffect(() => {
        if (!Array.isArray(viewGroups)) return;

        // small sample to avoid console spam
        const sample = viewGroups.slice(0, 5).map(g => ({
            id: g.id,
            label: g.label,
            count: g.count,
            category: g.category,
            subcategory: g.subcategory,
            subsubcategory: g.subsubcategory,
            is_zero: g.is_zero,
            is_sparkling: g.is_sparkling,
        }));

        // stable stamp so we only log meaningful changes
        const stamp = JSON.stringify({
            len: viewGroups.length,
            ids: sample.map(s => s.id),
        });

        if (window.__DBG_VIEWGROUPS_STAMP__ !== stamp) {
            window.__DBG_VIEWGROUPS_STAMP__ = stamp;
            console.groupCollapsed(
                `[useLayersView] viewGroups → ${viewGroups.length} rows (showing ${sample.length})`
            );
            console.table(sample);
            console.groupEnd();
        }
    }, [viewGroups]);


    // 5) counts per layer
    const layerCounts = React.useMemo(() => {
        return buildPerLayerCounts({ layers: activeLayers, groups: viewGroups });
    }, [viewGroups, activeLayers]);

    return {
        baseGroups,
        activeLayers,
        displayedCountsByCategory,
        viewGroups,
        layerCounts
    };
}