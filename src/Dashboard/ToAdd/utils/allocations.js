// NEW: read the global willy mode (0 = easy/sleepy, 1 = medium/chilly, 2 = hard/stern)
import { getWillyMode } from '../ui/uiPrefs';

// Normalize any group label to PARAM key style: UPPER + underscores
export function toKey(label) {
    return String(label || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

/* ------------------------------------------
   Subtraction factor tables by willy mode
   Edit thresholds/factors here only.
   Rule is applied to the FINAL allocated total.
------------------------------------------- */

// Format: [ [maxTotalInclusive, factor], ... ] (ascending)
const SUBTRACTION_TABLES = {
    // 0 = easy/sleepy (gentlest — no subtraction table, use default)
    0: [
        [15, 1],
        [30, 2],
        [45, 3],
    ],

    // 1 = medium/chilly (normal)
    1: [
        [15, 1],
        [30, 2],
        [45, 3],
    ],

    // 2 = hard/stern (strictest)
    2: [
        [8, 1],
        [15, 2],
        [30, 3],
    ],
};

function subtractionFactorForTotal(total, willyMode) {
    // Global rule: if total < 8 → no subtraction at all
    if (total < 8) return 0;

    const mode = (willyMode === 2) ? 2 : (willyMode === 1) ? 1 : 0;
    const table = SUBTRACTION_TABLES[mode] || SUBTRACTION_TABLES[0];

    for (const [maxIncl, factor] of table) {
        if (total <= maxIncl) return factor;
    }
    return 0;
}

/**
 * Greedy coverage allocator (unchanged)
 */
export function greedyAllocate(families, K) {
    const alloc = Object.create(null);
    const minSum = families.reduce((s, f) => s + (f.min_sku ?? 0), 0);

    for (const f of families) {
        alloc[f.key] = Math.max(0, f.min_sku || 0);
    }

    let total = minSum;
    if (total > K) {
        const keys = families.map(f => f.key);
        let i = 0;
        while (total > K) {
            const k = keys[i % keys.length];
            if (alloc[k] > 0) { alloc[k] -= 1; total -= 1; }
            i++;
            if (i > 100000) break;
        }
        return { alloc, total };
    }

    const maxOf = (f) => (f.max_sku == null ? Infinity : Math.max(f.max_sku, alloc[f.key] || 0));

    while (total < K) {
        let bestKey = null;
        let bestMB  = -Infinity;

        for (const f of families) {
            const n = alloc[f.key] || 0;
            if (n >= maxOf(f)) continue;
            const alpha = Math.max(0, Math.min(1, Number(f.alpha ?? 0.5)));
            const ros   = Math.max(0, Number(f.ros ?? 0));
            if (alpha === 0 || ros === 0) continue;

            const mb = ros * alpha * Math.pow(1 - alpha, n);
            if (mb > bestMB) { bestMB = mb; bestKey = f.key; }
        }

        if (!bestKey || bestMB <= 0) break;
        alloc[bestKey] = (alloc[bestKey] || 0) + 1;
        total += 1;
    }

    return { alloc, total };
}

/**
 * Build recommended deltas (with willy-based subtraction lists).
 */
export function buildRecommendations({ countsByCategory, presetParams, defaults, K, willy = null }) {
    const families = [];
    const keys = Object.keys(countsByCategory || {});
    for (const label of keys) {
        const key = toKey(label);
        const cfg = (presetParams && presetParams[key]) || defaults || {};
        families.push({
            key,
            ros:      Number(cfg.ros ?? 1),
            alpha:    Number(cfg.alpha ?? 0.5),
            min_sku:  Number(cfg.min_sku ?? 0),
            max_sku:  cfg.max_sku == null ? null : Number(cfg.max_sku),
        });
    }

    const { alloc: idealMap, total } =
        greedyAllocate(families, Math.max(0, Math.floor(Number(K) || 0)));

    // Pick willy mode (explicit arg wins; else global)
    const willyMode = (willy === 0 || willy === 1) ? willy : getWillyMode();

    // Compute subtraction factor from the final total and willy mode
    const subtractionFactor = subtractionFactorForTotal(total, willyMode);

    const out = {};
    for (const label of keys) {
        const key = toKey(label);
        const current = Number(countsByCategory[label] || 0);
        const ideal   = Number(idealMap[key] || 0);
        const diff    = ideal - current;

        let recommended = 0;
        if (Math.abs(diff) > 0) {
            const mag = Math.max(0, Math.abs(diff) - subtractionFactor);
            recommended = diff > 0 ? mag : -mag;
        }
        out[key] = { ideal, current, diff, recommended };
    }

    return out;
}
