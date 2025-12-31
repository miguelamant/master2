// src/Dashboard/ToAdd/utils/hoverKey.js

// stable stringify that preserves nested objects (sorts object keys recursively)
export function stableStringify(x) {
    try {
        return JSON.stringify(x, (key, value) => {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                const out = {};
                for (const k of Object.keys(value).sort()) out[k] = value[k];
                return out;
            }
            return value;
        });
    } catch {
        return String(x);
    }
}

/**
 * Build the exact hover cache key used by useHoverLists + SummaryGridRow.
 */
export function makeHoverKey(baseGroupBy, filterKey, groupKey, extra = {}) {
    return `${baseGroupBy}:${groupKey}:${filterKey}:${stableStringify(extra)}`;
}
