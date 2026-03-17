// src/Dashboard/ToAdd/utils/itemLabelMap.js

// Manual overrides (exact raw keys; applied BEFORE prettifying)
export const ITEM_LABEL_MAP = {
    // "LIEGEOISE | CORE |": "Liégeoise",
    // "ST_BERNARDUS_ABT_12": "St. Bernardus Abt 12",
};

function normalizeKey(s = "") {
    return String(s).trim();
}

// Acronyms we want to keep uppercase in Title Case
const ACRONYMS = new Set(["IPA", "ABV", "IBU", "NFC", "NA", "N/A"]);

function titleCaseWords(s = "") {
    return s
        .split(/\s+/)
        .map((w) => {
            const up = w.toUpperCase();
            if (ACRONYMS.has(up)) return up;
            if (!w) return w;

            // Mc / O' niceties
            const m = w.match(/^([oO]')([a-zA-Z].*)$/);
            if (m) return `${m[1]}${m[2].charAt(0).toUpperCase()}${m[2].slice(1).toLowerCase()}`;
            if (w.toLowerCase().startsWith("mc") && w.length > 2) {
                return `Mc${w.charAt(2).toUpperCase()}${w.slice(3).toLowerCase()}`;
            }

            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        })
        .join(" ");
}

/** Convert a raw item display name using the override table + prettifier */
export function convertItemLabel(raw) {
    const key = normalizeKey(raw);

    // 1) Hard override first (exact match on raw input)
    if (ITEM_LABEL_MAP[key]) return ITEM_LABEL_MAP[key];

    // 2) Clean + normalize
    // - repair broken Unicode (replacement char → best-guess accented letter)
    // - remove pipes
    // - split on pipes (if any) and drop any "core" tokens
    // - replace underscores with spaces
    // - collapse whitespace
    // - Title Case each word
    let s = String(key)
        .replace(/\uFFFD/g, "\u00e8") // � → è (most common: Bière, Liégeoise, etc.)
        .replace(/\|/g, " ")         // remove all pipes
        .replace(/_/g, " ");         // underscores → space

    // Drop standalone "core" tokens
    s = s
        .split(/\s+/)
        .filter((tok) => tok.toLowerCase() !== "core")
        .join(" ");

    // Collapse leftover whitespace
    s = s.replace(/\s+/g, " ").trim();

    // Title Case the result
    return titleCaseWords(s);
}
