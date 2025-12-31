// src/Dashboard/ToAdd/utils/dumpAllPresetParams.js
import { PRESET_FILTERS } from "../presets";
import PRESET_PARAMS from "../preset-params.json"; // existing file (can be empty {} initially)
import { menuCounts } from "../../../apiService";

// defaults for any new key-value (family) we discover
export const PARAM_DEFAULTS = { ros: 1, alpha: 0.5, min_sku: 0, max_sku: null };

/** stable-ish numeric hash so IDs don’t rely on list order */
function djb2(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    // make positive 32-bit
    return (h >>> 0);
}

/** build a stable signature for a preset (independent of array order) */
function stableSignature(p) {
    const within = p.within ? Object.entries(p.within)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([k,v]) => [k, Array.isArray(v) ? [...v].sort() : v]) : [];
    const predicates = Array.isArray(p.predicates)
        ? [...p.predicates].map(x => ({ field: x.field, op: String(x.op||"").toLowerCase(), value: x.value }))
            .sort((a,b) => (a.field+a.op).localeCompare(b.field+b.op))
        : [];
    return JSON.stringify({
        section: (p.section||"").toLowerCase(),
        groupBy: (p.groupBy||"").toLowerCase(),
        within,
        predicates,
    });
}

/** numeric id (preserve p.id if you later add one) */
export function getPresetId(p, idx) {
    if (Number.isInteger(p.id)) return p.id;
    return djb2(stableSignature(p)) % 100000000; // 8-digit cap
}

/** normalize a group label to a safe key */
function keyOf(row, groupBy) {
    const raw = (row?.[groupBy] ?? row?.group ?? row?.category ?? row?.label ?? "")
        .toString();
    return raw.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

/**
 * Iterates all presets, fetches complete group lists (incl. zero),
 * merges into existing preset-params.json, copies to clipboard,
 * and triggers a download.
 */
export async function dumpAllPresetParams() {
    const merged = deepClone(PRESET_PARAMS || {});
    for (let i = 0; i < PRESET_FILTERS.length; i++) {
        const p = PRESET_FILTERS[i];
        const presetId = String(getPresetId(p, i));
        // prepare target bucket
        if (!merged[presetId]) merged[presetId] = {};

        const { groupBy = "subcategory", section, within = {}, predicates = [], filters = {} } = p;

        const { results } = await menuCounts({
            groupBy,
            section,
            includeEmpty: true,
            within,
            filters,
            predicates,
        });

        for (const row of (results || [])) {
            const k = keyOf(row, groupBy);
            if (!k) continue;
            if (!merged[presetId][k]) {
                merged[presetId][k] = { ...PARAM_DEFAULTS };
            }
        }
    }

    const text = JSON.stringify(merged, null, 2);

    // copy to clipboard
    try { await navigator.clipboard.writeText(text); } catch (_) {}

    // trigger download
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preset-params.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("[Dump ALL] merged preset-params.json:", merged);
    alert("Dumped ALL presets.\nCopied to clipboard and downloaded preset-params.json");
}
