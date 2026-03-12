// src/Dashboard/ToAdd/hooks/useCountsByCategory.js
import { useEffect, useMemo, useState } from "react";
import { menuCounts } from "../../../apiService";
import { fetchPartitionedMenuCounts } from "../utils/fetchPartitionedMenuCounts";

const norm = (s) => String(s || "").trim();

// ---------- predicate helpers ----------
const fieldKey = (p) => String(p?.field || "").trim().toLowerCase();

// Override preset predicates on the SAME field(s) with rollup predicates.
// Example: preset has is_zero=0, rollup has is_zero=1 => rollup wins for is_zero.
const mergePredicatesOverride = (basePreds = [], overridePreds = []) => {
    const o = Array.isArray(overridePreds) ? overridePreds.filter(Boolean) : [];
    const base = Array.isArray(basePreds) ? basePreds.filter(Boolean) : [];
    const oFields = new Set(o.map(fieldKey).filter(Boolean));
    const keptBase = base.filter((p) => !oFields.has(fieldKey(p)));
    return [...keptBase, ...o];
};

// ---------- rollups (local) ----------
/**
 * Apply "local rollups" to an already-fetched counts map.
 * (No extra API calls; only regroup existing keys.)
 */
export const applyRollups = (map, rules) => {
    if (!map || typeof map !== "object") return map;
    if (!Array.isArray(rules) || !rules.length) return map;

    const out = { ...map };
    const originalKeys = new Set(Object.keys(out)); // only these may be rolled up

    const split = (k) => {
        const parts = String(k).split(" · ").map((s) => s.trim());
        const base = parts[0] || k;
        const part = parts[parts.length - 1] || "";
        return { base, part };
    };

    const matches = (rule, key) => {
        if (!originalKeys.has(key)) return false; // prevents swallowing rollup outputs

        const { base, part } = split(key);
        const m = rule?.match || {};

        if (m.partitionLabel != null && String(part) !== String(m.partitionLabel)) return false;
        if (m.basePrefix != null && !String(base).startsWith(String(m.basePrefix))) return false;
        if (Array.isArray(m.baseNotIn) && m.baseNotIn.length && m.baseNotIn.includes(base)) return false;
        if (Array.isArray(m.baseIn) && m.baseIn.length && !m.baseIn.includes(base)) return false;

        return true;
    };

    for (const rule of rules) {
        const into = String(rule?.into ?? "").trim();
        if (!into) continue;

        let sum = 0;
        let hit = false;

        for (const key of Object.keys(out)) {
            if (!matches(rule, key)) continue;
            hit = true;
            sum += Number(out[key] ?? 0);
            delete out[key];
        }

        if (hit) {
            out[into] = Number(out[into] ?? 0) + sum;
        } else if (rule?.keepZero === true && !(into in out)) {
            out[into] = 0;
        }
    }

    return out;
};

// ---------- rollups (overlay via API) ----------
/**
 * Given a counts-map for a specific predicate-slice, compute rollup sums.
 * This does NOT delete keys; it only returns { into: sum }.
 */
const computeOverlayRollupAdds = (countsMap, rules) => {
    const adds = {};
    if (!countsMap || typeof countsMap !== "object") return adds;
    if (!Array.isArray(rules) || !rules.length) return adds;

    const split = (k) => {
        const parts = String(k).split(" · ").map((s) => s.trim());
        const base = parts[0] || k;
        const part = parts[parts.length - 1] || "";
        return { base, part };
    };

    const matches = (rule, key) => {
        const { base, part } = split(key);
        const m = rule?.match || {};

        if (m.partitionLabel != null && String(part) !== String(m.partitionLabel)) return false;
        if (m.basePrefix != null && !String(base).startsWith(String(m.basePrefix))) return false;
        if (Array.isArray(m.baseNotIn) && m.baseNotIn.length && m.baseNotIn.includes(base)) return false;
        if (Array.isArray(m.baseIn) && m.baseIn.length && !m.baseIn.includes(base)) return false;

        return true;
    };

    for (const rule of rules) {
        const into = String(rule?.into ?? "").trim();
        if (!into) continue;

        let sum = 0;
        let hit = false;

        for (const key of Object.keys(countsMap)) {
            if (!matches(rule, key)) continue;
            hit = true;
            sum += Number(countsMap[key] ?? 0);
        }

        if (hit) {
            adds[into] = Number(adds[into] ?? 0) + sum;
        } else if (rule?.keepZero === true && !(into in adds)) {
            adds[into] = 0;
        }
    }

    return adds;
};

const hasOverlayPredicates = (rule) => {
    const p1 = Array.isArray(rule?.predicates) && rule.predicates.length;
    const p2 = Array.isArray(rule?.match?.predicates) && rule.match.predicates.length;
    return !!(p1 || p2);
};

// ---------- main hook ----------
export function useCountsByCategory({
                                        groupBy,
                                        effectiveSection,
                                        includeEmpty = false,
                                        within = {},
                                        apiFilters = {},
                                        presetPredicates = [],
                                        partitionBy = [],
                                        forceShow = [],
                                        rollups = [],
                                        showOnlyRollups = false,
                                        presetId = "",
                                        filterKey = "",
                                        assortmentId,
                                    }) {
    const [counts, setCounts] = useState({});

    // stable deps
    const filtersKey = useMemo(() => JSON.stringify(apiFilters), [apiFilters]);
    const predsKey = useMemo(() => JSON.stringify(presetPredicates), [presetPredicates]);
    const partsKey = useMemo(() => JSON.stringify(partitionBy), [partitionBy]);
    const forceKey = useMemo(() => JSON.stringify(forceShow), [forceShow]);
    const withinKey = useMemo(() => JSON.stringify(within), [within]);
    const rollupsKey = useMemo(() => JSON.stringify(rollups), [rollups]);
    const rollupOnlyKey = useMemo(() => String(!!showOnlyRollups), [showOnlyRollups]);


    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const baseArgs = {
                    groupBy,
                    section: effectiveSection,
                    includeEmpty,
                    within,
                    filters: apiFilters,
                    predicates: presetPredicates,
                    ...(assortmentId != null && { assortmentId }),
                };

                // 1) fetch base counts (preset predicates)
                let byGroup = {};

                if (Array.isArray(partitionBy) && partitionBy.length) {
                    byGroup = await fetchPartitionedMenuCounts({
                        baseArgs,
                        partitions: partitionBy,
                    });
                } else {
                    const { results } = await menuCounts(baseArgs);
                    byGroup = (results || []).reduce((acc, row) => {
                        const key = row[groupBy] ?? row.group ?? row.category ?? row.label;
                        const count = row.count_on_menu ?? row.count ?? 0;
                        if (key != null) acc[norm(key)] = count;
                        return acc;
                    }, {});
                }

                // 2) split rollups:
                //    - local rollups: regroup the current map
                //    - overlay rollups: require an extra fetch with rollup predicates
                const allRollups = Array.isArray(rollups) ? rollups : [];
                const localRollups = allRollups.filter((r) => !hasOverlayPredicates(r));
                const overlayRollups = allRollups.filter((r) => hasOverlayPredicates(r));


                // Apply local regrouping
                byGroup = applyRollups(byGroup, localRollups);

// ✅ NEW: only keep rollup buckets (the "into" labels)
                if (showOnlyRollups && Array.isArray(localRollups) && localRollups.length) {
                    const rollupTargets = new Set(
                        localRollups.map(r => norm(r?.into)).filter(Boolean)
                    );

                    byGroup = Object.keys(byGroup).reduce((acc, k) => {
                        if (rollupTargets.has(norm(k))) acc[k] = byGroup[k];
                        return acc;
                    }, {});
                }


                // 3) overlay rollups (extra fetch per rollup *predicate slice*)
                // We compute each overlay rollup in its own predicate slice, then add into byGroup.
                // NOTE: we do NOT delete any base keys here (different predicate slice).
                if (overlayRollups.length) {
                    for (const r of overlayRollups) {
                        const into = String(r?.into ?? "").trim();
                        if (!into) continue;

                        const rollPreds = [
                            ...(Array.isArray(r.predicates) ? r.predicates : []),
                            ...(Array.isArray(r?.match?.predicates) ? r.match.predicates : []),
                        ];

                        const mergedPreds = mergePredicatesOverride(presetPredicates, rollPreds);

                        const sliceArgs = {
                            ...baseArgs,
                            includeEmpty: false, // overlay rollups usually should not pad
                            within: { ...(within || {}), ...(r.within || {}) },
                            predicates: mergedPreds,
                        };

                        let sliceMap = {};

                        if (Array.isArray(partitionBy) && partitionBy.length) {
                            sliceMap = await fetchPartitionedMenuCounts({
                                baseArgs: sliceArgs,
                                partitions: partitionBy,
                            });
                        } else {
                            const { results } = await menuCounts(sliceArgs);
                            sliceMap = (results || []).reduce((acc, row) => {
                                const key = row[groupBy] ?? row.group ?? row.category ?? row.label;
                                const count = row.count_on_menu ?? row.count ?? 0;
                                if (key != null) acc[norm(key)] = count;
                                return acc;
                            }, {});
                        }

                        const adds = computeOverlayRollupAdds(sliceMap, [r]);
                        if (Object.prototype.hasOwnProperty.call(adds, into)) {
                            byGroup[into] = Number(byGroup[into] ?? 0) + Number(adds[into] ?? 0);
                        } else if (r.keepZero === true && !(into in byGroup)) {
                            byGroup[into] = 0;
                        }
                    }
                }

                // 4) forceShow
                const out = { ...(byGroup || {}) };
                if (Array.isArray(forceShow)) {
                    for (const raw of forceShow) {
                        const k = norm(raw);
                        if (!(k in out)) out[k] = 0;
                    }
                }

                // 5) includeEmpty padding for partitioned views
                // IMPORTANT: do NOT pad rolled-up labels
                if (includeEmpty && Array.isArray(partitionBy) && partitionBy.length) {
                    const rollupTargets = new Set((rollups || []).map((r) => String(r.into).trim()));

                    const bases = new Set(
                        Object.keys(out)
                            .filter((k) => !rollupTargets.has(norm(k)))
                            .map((k) => norm(k).split(" · ")[0])
                    );

                    for (const raw of forceShow || []) {
                        const b = norm(raw).split(" · ")[0];
                        if (!rollupTargets.has(b)) bases.add(b);
                    }

                    const partLabels = partitionBy.map((p) => norm(p.label)).filter(Boolean);

                    for (const base of bases) {
                        for (const pl of partLabels) {
                            const mk = `${base} · ${pl}`;
                            if (!(mk in out)) out[mk] = 0;
                        }
                    }
                }

                if (!alive) return;
                setCounts(out);
            } catch (e) {
                console.error("[useCountsByCategory] failed", e);
                if (!alive) return;
                setCounts({});
            }
        })();

        return () => {
            alive = false;
        };
    }, [
        groupBy,
        effectiveSection,
        includeEmpty,
        filtersKey,
        predsKey,
        partsKey,
        forceKey,
        withinKey,
        rollupsKey,
        rollupOnlyKey,
        presetId,
        filterKey,
        assortmentId,
    ]);

    return counts;
}
