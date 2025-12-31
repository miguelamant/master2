/**
 * Coerce many truthy/falsey shapes into 1/0.
 * Falls back to def (default 0) if unknown.
 */
export function to01(v, def = 0) {
  if (v === 1 || v === "1" || v === true) return 1;
  if (v === 0 || v === "0" || v === false) return 0;
  if (v == null) return def;

  const n = Number(v);
  if (Number.isFinite(n)) return n ? 1 : 0;

  const s = String(v).trim().toLowerCase();
  if (["yes", "true", "y", "on"].includes(s)) return 1;
  if (["no", "false", "n", "off"].includes(s)) return 0;

  return def;
}
