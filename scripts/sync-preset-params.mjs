// scripts/sync-preset-params.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PRESET_FILTERS } from "../src/Dashboard/ToAdd/presets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PARAMS_PATH = path.resolve(__dirname, "../src/Dashboard/ToAdd/preset-params.json");

const DEFAULTS = { ros: 1, alpha: 0.5, min_sku: 0, max_sku: null };

let stored = {};
if (fs.existsSync(PARAMS_PATH)) {
    try { stored = JSON.parse(fs.readFileSync(PARAMS_PATH, "utf-8")); } catch { stored = {}; }
}

for (const p of PRESET_FILTERS) {
    const id = String(p.id);
    if (!id) continue;
    if (!stored[id]) stored[id] = { _defaults: { ...DEFAULTS } };
    else if (!stored[id]._defaults) stored[id]._defaults = { ...DEFAULTS };
}

fs.writeFileSync(PARAMS_PATH, JSON.stringify(stored, null, 2));
console.log(`Wrote ${PARAMS_PATH}`);
