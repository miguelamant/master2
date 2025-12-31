// normalize.js
export const DISPLAY_LABELS = {};
export const makeCategoryLabeler = () => (dbCat) => DISPLAY_LABELS[dbCat] ?? dbCat;

export const normToken = (s) =>
    (s ?? "")
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

export const to01 = (v) => {
    if (v === 1 || v === "1" || v === true || (typeof v === "string" && v.toLowerCase() === "true")) return 1;
    return 0;
};
