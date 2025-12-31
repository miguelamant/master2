// src/Dashboard/ToAdd/engine/pairSearch.js
import { addressFor } from './marginals';

// --- helpers to read raw tabulated MBs exactly as defined in layer JSON ---

// --- add this near the top of pairSearch.js ---
function seriesForGroupAndLayer(layer, group, addr) {
    // current addressFor result
    const key1 = (layer?.type === '1D') ? addr?.bucketKey : addr?.cellKey;

    // candidate 2: exact UI label (composite)
    const key2 = typeof group?.label === 'string' ? group.label : null;

    // candidate 3: subcategory + partition label if present
    const key3 = (group?.subcategory && group?.partitionLabel)
        ? `${group.subcategory} · ${group.partitionLabel}`
        : null;

    // helper to fetch series for a key
    const getSeries = (k) => {
        if (!k) return null;
        const rec = (layer?.type === '1D')
            ? layer?.buckets?.[k]
            : (layer?.buckets?.[k] || layer?.cells?.[k]);
        const arr = Array.isArray(rec?.bucket) ? rec.bucket : null;
        return (arr && arr.length) ? arr : null;
    };

    return getSeries(key1) || getSeries(key2) || getSeries(key3) || null;
}

function rawSeriesFor(layer, addr) {
    if (!addr) return null;
    const rec =
        (layer.type === '1D' ? layer.buckets?.[addr.bucketKey] : null) ||
        (layer.type === '2D' ? (layer.buckets?.[addr.cellKey] || layer.cells?.[addr.cellKey]) : null) ||
        null;
    const arr = Array.isArray(rec?.bucket) ? rec.bucket : null;
    return arr && arr.length ? arr : null;
}

function mbAddAtDepth(series, n) {
    if (!series) return 0;
    const i = Math.max(0, Math.min(n, series.length - 1)); // add uses index n
    return Number(series[i] || 0);
}

function mbRemoveAtDepth(series, n) {
    if (!series) return 0;
    const prev = Math.max(0, n - 1);                        // remove uses index n-1
    const i = Math.min(prev, series.length - 1);
    return Number(series[i] || 0);
}

// depth helper: read live depth for a given layer+group from counts mirror
function depthFor(counts, layer, addr) {
    if (!counts || !layer || !addr) return 0;
    const lid = `L${layer.layer_id}`;
    const key = layer.type === '1D' ? addr.bucketKey : addr.cellKey;
    return Number(counts?.[lid]?.[key] ?? 0);
}

// group is removable if it has >0 depth in ANY scoring layer
function isRemovableInAnyLayer(counts, layers, group) {
    for (const layer of layers || []) {
        const addr = addressFor(layer, group);
        if (!addr) continue;
        const d = depthFor(counts, layer, addr);
        if (d > 0) return true;
    }
    return false;
}

export function findBestPairs({ layers, groups, counts, options = {} }) {
    const {
        kMax = 1,
        thresholdAbs = 0.0,
        topN = 10,
        // allow zero-cost removals by default
        requireRemovalDelta = false,
        // keep this at 0 so remMB === 0 is allowed when requireRemovalDelta=true
        minRemoveMag = 0,
        requireAddPositive = true,
    } = options;

    const dbg = (typeof window !== 'undefined' && window.__DBG_PLAN__) || {};
    const targetLayerId = dbg && dbg.layerId ? String(dbg.layerId) : null;
    const scoringLayers = targetLayerId
        ? (layers || []).filter(L => String(L.layer_id) === targetLayerId)
        : (layers || []);

    const addables = Array.isArray(groups) ? groups : [];
    // ✅ crucial change: compute removables from counts, not from g.count
    const removables = (Array.isArray(groups) ? groups : []).filter(g =>
        isRemovableInAnyLayer(counts, scoringLayers, g)
    );

    const candidates = [];

    // ----- debug peek (unchanged logic, uses counts mirror) -----
    try {
        const K = 6, M = 8;

        function nextAddMBFor(group) {
            let mb = 0;
            for (const layer of (layers || [])) {
                const addr = addressFor(layer, group);
                if (!addr) continue;
                const d = depthFor(counts, layer, addr);
                const series = rawSeriesFor(layer, addr) || [];
                const i = Math.max(0, Math.min(d, series.length - 1));
                mb += Number(series[i] || 0) * (Number(layer.weight) || 1);
            }
            return mb;
        }

        function removalMBFor(group) {
            let mb = 0;
            for (const layer of (layers || [])) {
                const addr = addressFor(layer, group);
                if (!addr) continue;
                const d = depthFor(counts, layer, addr);
                const series = rawSeriesFor(layer, addr) || [];
                const prev = Math.max(0, d - 1);
                const i = Math.min(prev, series.length - 1);
                mb += Number(series[i] || 0) * (Number(layer.weight) || 1);
            }
            return mb;
        }

        const addRanked = [...(addables || [])]
            .map(g => ({ g, addMB: nextAddMBFor(g) }))
            .sort((a, b) => b.addMB - a.addMB)
            .slice(0, K);

        const remRanked = [...(removables || [])]
            .map(g => ({ g, remMB: removalMBFor(g) }))
            .sort((a, b) => a.remMB - b.remMB)
            .slice(0, M);

        const peek = [];
        for (const A of addRanked) {
            for (const R of remRanked) {
                peek.push({
                    add: A.g?.label,
                    remove: R.g?.label,
                    addMB: +A.addMB.toFixed(3),
                    remMB: +R.remMB.toFixed(3),
                    net: +((A.addMB - R.remMB).toFixed(3)),
                });
            }
        }
        peek.sort((x, y) => y.net - x.net);
        //window.__PLAN_PEEK__ = peek;
        //try { console.table(peek.slice(0, 20)); } catch {}
    } catch {}

    // ----- scoring -----
    for (const addG of addables) {
        for (const remG of removables) {
            if (!addG || !remG) continue;
            if (addG.id === remG.id) continue;

            for (let k = 1; k <= kMax; k++) {
                let addMB = 0;
                let remMB = 0;

                for (const layer of scoringLayers) {
                    // ADD
                    const addAddr = addressFor(layer, addG);
                    if (addAddr) {
                        const d = depthFor(counts, layer, addAddr);
                        const series = seriesForGroupAndLayer(layer, addG, addAddr);
                        addMB += mbAddAtDepth(series, d) * (Number(layer.weight) || 1);
                    }
                    // REMOVE
                    const remAddr = addressFor(layer, remG);
                    if (remAddr) {
                        const d = depthFor(counts, layer, remAddr);
                        const series = seriesForGroupAndLayer(layer, remG, remAddr);
                        remMB += mbRemoveAtDepth(series, d) * (Number(layer.weight) || 1);
                    }
                }

                if (requireAddPositive && !(addMB > 0)) continue;
                if (requireRemovalDelta && !(remMB >= minRemoveMag)) continue;

                const gain = addMB - remMB;
                if (gain >= thresholdAbs) {
                    candidates.push({
                        pair: { add: addG, remove: remG, k },
                        gain,
                        breakdown: { add: { total: addMB }, remove: { total: -remMB } },
                    });
                }
            }
        }
    }

    // optional: simple debug dump
    const dbg2 = (typeof window !== 'undefined' && window.__DBG_PLAN__) || {};
    if (dbg2 && dbg2.enabled && dbg2.simple) {
        const dump = [...candidates]
            .sort((a, b) => Number(b.gain) - Number(a.gain))
            .slice(0, 8)
            .map(c => ({
                gain: Number(c.gain).toFixed(3),
                add: c.pair.add?.label,
                remove: c.pair.remove?.label,
                k: c.pair.k,
                addMB: Number(c.breakdown?.add?.total || 0).toFixed(3),
                remMB: Number(-(c.breakdown?.remove?.total || 0)).toFixed(3),
            }));
        window.__PAIR_LOGS__ = dump;
        try { console.table(dump); } catch { console.log(dump); }
    }

    // stash for inspection
    if (typeof window !== 'undefined') {
        window.__PLAN_LAST_CANDIDATES__ = (candidates || []).map(r => ({
            gain: r.gain,
            add: r.pair.add?.label,
            remove: r.pair.remove?.label,
            k: r.pair.k,
            addMB: r.breakdown?.add?.total ?? 0,
            remMB: -(r.breakdown?.remove?.total ?? 0),
        }));
    }

    candidates.sort((a, b) => Number(b.gain) - Number(a.gain));
    return candidates.slice(0, topN);
}
