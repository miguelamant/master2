import catalog from './layersForPreset.catalog.json';

function asObjectMap() {
    // tolerate either object or array form
    if (catalog?.presets && !Array.isArray(catalog.presets)) return catalog.presets;
    if (Array.isArray(catalog?.presets)) {
        const m = {};
        for (const p of catalog.presets) {
            if (!p) continue;
            const id = String(p.id ?? p.presetId ?? '');
            if (!id) continue;
            m[id] = { category: p.category, layers: p.layers || [] };
        }
        return m;
    }
    return {};
}

export function getAllowlistForPreset(presetId) {
    const map = asObjectMap();
    const entry = map[String(presetId ?? '')];
    return Array.isArray(entry?.layers) ? entry.layers : [];
}

export function getCategoryForPreset(presetId) {
    const map = asObjectMap();
    const entry = map[String(presetId ?? '')];
    return entry?.category ?? null;
}
