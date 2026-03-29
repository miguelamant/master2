// src/Dashboard/ToAdd/hooks/useHoverLists.js
import { useCallback, useEffect, useState } from "react";
import { menuItems } from "../../../apiService";

// stable stringify that preserves nested objects (sorts object keys recursively)
export function stableStringify(x) {
    try {
        return JSON.stringify(x, (key, value) => {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                const out = {};
                for (const k of Object.keys(value).sort()) out[k] = value[k];
                return out;
            }
            return value;
        });
    } catch {
        return String(x);
    }
}

function sectionToCategory(section) {
    const s = String(section || "").toLowerCase();
    if (s === "beers" || s === "beer") return "BEERS";
    if (s === "refreshments" || s === "sodas" || s === "soda") return "REFRESHMENTS";
    if (s === "deep_fried_snacks") return "DEEP_FRIED_SNACKS";
    if (s === "wines") return "WINES";
    if (s === "cocktails") return "COCKTAILS";
    if (s === "liquors") return "LIQUORS";
    if (s === "snacks") return "SNACKS";
    if (s === "meals") return "MEALS";
    if (s === "hotdrinks") return "HOT_DRINKS";
    return null;
}

/**
 * loadHoverList supports:
 *  - string groupValue (legacy)
 *  - object { value, groupBy, predicates, within, noGroupFilter } (new)
 */
export default function useHoverLists({
                                          groupBy,
                                          filterKey,
                                          apiFilters = {},
                                          predicates = [],
                                          within = {},
                                          section,
                                          assortmentId,
                                      }) {
    const [hoverLists, setHoverLists] = useState({});
    const [hoverCat, setHoverCat] = useState(null);

    const makeKey = useCallback(
        (groupKey, extra = {}) => `${groupBy}:${groupKey}:${filterKey}:${stableStringify(extra)}`,
        [groupBy, filterKey]
    );

    const loadHoverList = useCallback(
        async (groupOrValue) => {
            const dbg = (typeof window !== "undefined" && window.__DBG_HOVER__) || null;

            const isObj = groupOrValue && typeof groupOrValue === "object";
            const groupValue = isObj ? String(groupOrValue.value || "") : String(groupOrValue || "");
            const effGroupBy = isObj && groupOrValue.groupBy ? groupOrValue.groupBy : groupBy;

            const extraWithin = isObj && groupOrValue.within ? groupOrValue.within : {};
            const extraPreds = isObj && groupOrValue.predicates ? groupOrValue.predicates : [];

            // rollup buckets may set this true to avoid forcing group filters
            const noGroupFilter = !!(isObj && groupOrValue.noGroupFilter);

            const key = makeKey(groupValue, { effGroupBy, extraWithin, extraPreds, noGroupFilter });

            if (dbg?.enabled) {
                console.log("[HOVER][INPUT]", {
                    input: groupOrValue,
                    isObj,
                    groupValue,
                    effGroupBy,
                    extraWithin,
                    extraPreds,
                    noGroupFilter,
                    key,
                });
            }

            if (hoverLists[key]) {
                if (dbg?.enabled) console.log("[HOVER][CACHE HIT]", key);
                return;
            }

            try {
                const f = { ...(apiFilters || {}) };
                const mergedWithin = { ...(within || {}), ...(extraWithin || {}) };
                const mergedPreds = [...(predicates || []), ...(extraPreds || [])];

                // ✅ IMPORTANT: scope menu-items by section if no explicit category filter was provided
                const catFromSection = sectionToCategory(section);
                const hasCategoryAlready =
                    f.category != null || mergedWithin.category != null || (within && within.category != null);
                if (!hasCategoryAlready && catFromSection) {
                    f.category = catFromSection;
                }

                const hasWithinOverride =
                    isObj && groupOrValue.within && Object.keys(groupOrValue.within).length > 0;

                // only force group filter when appropriate
                if (!hasWithinOverride && !noGroupFilter) {
                    if (effGroupBy === "category") f.category = groupValue;
                    else if (effGroupBy === "subcategory") f.subcategory = groupValue;
                    else if (effGroupBy === "subsubcategory") f.subsubcategory = groupValue;
                }

                if (dbg?.enabled) {
                    console.log("[HOVER][REQUEST]", {
                        key,
                        filters: f,
                        mergedWithin,
                        mergedPreds,
                        hasWithinOverride,
                        noGroupFilter,
                    });
                }

                const { items } = await menuItems({
                    filters: f,
                    predicates: mergedPreds,
                    within: mergedWithin,
                    page: 1,
                    pageSize: 200,
                    orderBy: "products.name",
                    ...(assortmentId != null && { assortmentId }),
                    groupBy: effGroupBy,
                });

                if (dbg?.enabled) {
                    console.log("[HOVER][RESPONSE]", {
                        key,
                        itemsLen: Array.isArray(items) ? items.length : 0,
                        sample: Array.isArray(items) ? items.slice(0, 3) : items,
                    });
                }

                setHoverLists((prev) => ({ ...prev, [key]: items || [] }));
            } catch (e) {
                console.error("hover list fetch failed", e);
                setHoverLists((prev) => ({ ...prev, [key]: [] }));
            }
        },
        [apiFilters, groupBy, makeKey, hoverLists, predicates, within, section, assortmentId]
    );

    useEffect(() => {
        setHoverLists({});
    }, [groupBy, filterKey]);

    return { hoverLists, hoverCat, setHoverCat, loadHoverList, makeKey };
}
