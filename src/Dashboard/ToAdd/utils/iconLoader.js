// src/Dashboard/ToAdd/utils/iconLoader.js

function normToken(s) {
    return String(s ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

let _CTX = null;
let _MAP = null;

function ensureMap() {
    if (!_CTX) {
        // recursive = true so Icons/**.svg get included
        _CTX = require.context("../../Icons/taste_group/", true, /\.svg$/);
    }
    if (!_MAP) {
        _MAP = _CTX.keys().reduce((acc, key) => {
            const base = key.replace(/^\.\/+/, "").replace(/\.svg$/i, "");
            const parts = base.split("/");
            const filenameToken = normToken(parts[parts.length - 1]);
            const fullToken = normToken(base);
            const url = _CTX(key);

            acc[filenameToken] = url;
            acc[fullToken] = url;
            return acc;
        }, {});
    }
}

// Parent bucket for labels like "IPA | NEW_ENGLAND_/_HAZY" → "IPA"
function parentFromLabel(label) {
    const s = String(label ?? "").trim();
    if (!s) return null;

    // If it uses your " | " format, take the left side.
    if (s.includes(" | ")) {
        return normToken(s.split(" | ")[0]);
    }

    // If it's like BELGIAN_BLONDE, map Belgian* into BELGIAN bucket
    const tok = normToken(s);
    if (tok.startsWith("BELGIAN_")) return "BELGIAN";
    if (tok.startsWith("NON_ALCOHOLIC_BEER_")) return "NON_ALCOHOLIC_BEER";

    // If it's like "SOUR | ..." we already handled via " | "
    // Otherwise no clear parent
    return null;
}

export function iconFor(tokenOrLabel) {
    ensureMap();

    const key = normToken(tokenOrLabel);

    // 1) exact
    if (_MAP[key]) return _MAP[key];

    // 2) fallback by parent (IPA, LAMBIC, STOUT, SOUR, ...)
    const parent = parentFromLabel(tokenOrLabel);
    if (parent && _MAP[parent]) return _MAP[parent];

    // 3) final generic fallback (if you have these icons)
    // pick whichever exists in your taste_group folder
    if (_MAP["BEERS_OTHER"]) return _MAP["BEERS_OTHER"];
    if (_MAP["OTHER"]) return _MAP["OTHER"];

    return null;
}
