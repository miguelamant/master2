// src/Dashboard/ToAdd/utils/hoverDescriptor.js

export function buildHoverDescriptor({ groupValue, groupBy, hoverOverrides, parseCompositeMulti }) {
    const label = String(groupValue || "");

    // 1) rollup override wins
    const ov = hoverOverrides && hoverOverrides[label] ? hoverOverrides[label] : null;
    if (ov) {
        return {
            value: label,
            groupBy: ov.groupBy || groupBy,
            within: ov.within || {},
            predicates: ov.predicates || [],
        };
    }

    // 2) partition flags inferred from label suffix
    const { base, is_sparkling, is_zero, is_prebiotic } = parseCompositeMulti(label);

    const preds = [];
    if (is_zero === 0 || is_zero === 1) preds.push({ field: "is_zero", value: is_zero });
    if (is_sparkling === 0 || is_sparkling === 1) preds.push({ field: "is_sparkling", value: is_sparkling });
    if (is_prebiotic === 0 || is_prebiotic === 1) preds.push({ field: "is_prebiotic", value: is_prebiotic });

    return {
        value: String(base || label).toUpperCase(),
        groupBy,
        predicates: preds,
        within: {},
    };
}

// This produces ONE canonical key.
// It must match useHoverLists.makeKey().
export function computeHoverKey({ makeKey, groupBy, groupValue, filterKey, hoverDesc }) {
    if (makeKey) {
        // if your makeKey expects descriptor directly, keep it that way
        // (your hook currently: makeKey(groupValue) -> `${groupBy}:${groupValue}:${filterKey}`
        // In the refactor, we'll store "value" in the descriptor and pass the descriptor.)
        return makeKey(hoverDesc);
    }
    // fallback (legacy)
    return `${groupBy}:${String(groupValue)}:${String(filterKey || "")}`;
}
