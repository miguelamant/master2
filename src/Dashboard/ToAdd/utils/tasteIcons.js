/**
 * Load all SVGs in src/Icons so we can fetch them by NAME.svg.
 * Works with CRA/Webpack via require.context.
 */
const ctx = require.context("../../Icons", false, /\.svg$/);

const ALL_SVGS = ctx.keys().reduce((acc, key) => {
  const token = key.replace("./", "").replace(".svg", "").toUpperCase();
  acc[token] = ctx(key).default;
  return acc;
}, {});

/** Normalize labels -> tokens like "Ice Tea Green" => "ICE_TEA_GREEN" */
export function normToken(s) {
  return String(s || "")
    .replace(/[ &/]/g, "_")
    .replace(/-+/g, "_")
    .toUpperCase();
}

/** Return the URL for an SVG matching the normalized token (or null). */
export function iconFor(labelOrToken) {
  const t = normToken(labelOrToken);
  return ALL_SVGS[t] || null;
}

/** Useful for debugging */
export function debugAvailableIcons() {
  return Object.keys(ALL_SVGS);
}
