// src/Dashboard/ToAdd/paramsStore.js
import PARAMS from "./preset-params.json";

const DEFAULTS = { ros: 1, alpha: 0.5, min_sku: 0, max_sku: null };

export function getPresetParamsMap(presetId) {
    const key = String(presetId);
    const block = PARAMS[key] || {};
    const defs = block._defaults || DEFAULTS;
    return { map: block, defaults: defs };
}

/**
 * Returns per-key params (falls back to preset _defaults, then hard defaults).
 */
export function getKeyParams(presetId, groupKey) {
    const { map, defaults } = getPresetParamsMap(presetId);
    return map[groupKey] || defaults || DEFAULTS;
}

/**
 * Dev-time helper: when you fetch counts and learn the group keys,
 * call this to print a ready-to-paste JSON patch for any missing keys.
 * (We can’t write files from the browser.)
 */
export function suggestMissingKeys(presetId, groupKeys) {
    const pid = String(presetId);
    const block = PARAMS[pid] || {};
    const defs = block._defaults || DEFAULTS;

    const missing = groupKeys.filter((k) => !(k in block));
    if (missing.length === 0) return;

    const patch = {};
    for (const k of missing) patch[k] = { ...defs };

    // Pretty console helper so you can paste it into preset-params.json
    // under the matching preset id.
    // Example path: "src/Dashboard/ToAdd/preset-params.json"
    /* eslint-disable no-console */
    console.groupCollapsed(
        `[preset-params] Missing keys for preset ${pid} (${missing.length}) — copy/paste into preset-params.json`
    );
    console.log(JSON.stringify({ [pid]: patch }, null, 2));
    console.groupEnd();
}
