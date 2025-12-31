// src/Dashboard/ToAdd/utils/presetId.js
function djb2(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return (h >>> 0);
}

export function stableSignature(preset) {
    const within = preset.within ? Object.entries(preset.within)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([k,v]) => [k, Array.isArray(v) ? [...v].sort() : v]) : [];
    const predicates = Array.isArray(preset.predicates)
        ? [...preset.predicates].map(x => ({
            field: x.field,
            op: String(x.op || "").toLowerCase(),
            value: x.value
        }))
            .sort((a,b) => (a.field+a.op).localeCompare(b.field+b.op))
        : [];

    return JSON.stringify({
        section: (preset.section || "").toLowerCase(),
        groupBy: (preset.groupBy || "").toLowerCase(),
        within,
        predicates,
    });
}

export function getPresetId(preset) {
    if (Number.isInteger(preset.id)) return preset.id;
    return djb2(stableSignature(preset)) % 100000000; // 8-digit
}
