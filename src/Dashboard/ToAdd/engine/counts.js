// src/Dashboard/ToAdd/engine/counts.js
import { addressFor } from './marginals';

const clone = (x) => JSON.parse(JSON.stringify(x || {}));

/**
 * Build per-layer, per-bucket/cell depths from the current viewGroups.
 * Shape: counts["L<layer_id>"][bucketOrCellKey] = integer depth m
 * Also publishes a human trace to window.__COUNT_TRACE__ unconditionally so
 * you can always inspect who contributed to each bucket/cell.
 */
export function buildPerLayerCounts({ layers = [], groups = [] }) {
    const counts = {};
    for (const layer of layers) counts[`L${layer.layer_id}`] = {};

    // --- trace: always record (cheap objects) ---
    const trace = {}; // trace[Lid][key] = [{groupId, label, add}]
    const touchTrace = (lid, key, g, add) => {
        trace[lid] = trace[lid] || {};
        trace[lid][key] = trace[lid][key] || [];
        trace[lid][key].push({
            groupId: g?.id ?? null,
            label: g?.label ?? null,
            add: Number(add || 0),
        });
    };

    for (const g of groups) {
        const cnt = Number(g?.count || 0);
        if (!cnt) continue;

        for (const layer of layers) {
            const lid = `L${layer.layer_id}`;
            const addr = addressFor(layer, g);
            if (!addr) continue;

            const key = (layer.type === '1D') ? addr.bucketKey : addr.cellKey;
            counts[lid][key] = (counts[lid][key] || 0) + cnt;
            touchTrace(lid, key, g, cnt);
        }
    }

    // publish mirrors + trace (no gating, so you can read them immediately)
    try {
        if (typeof window !== 'undefined') {
            window.__COUNTS_FROM_MIRROR__ = clone(counts);
            window.__COUNT_TRACE__ = trace;
        }
    } catch {}

    return counts;
}
