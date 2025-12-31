// src/Dashboard/ToAdd/hooks/useCountsByCategory.js
import { useEffect, useMemo, useState } from 'react';
import { menuCounts } from '../../../apiService';
import { fetchPartitionedMenuCounts } from '../utils/fetchPartitionedMenuCounts';

const norm = (s) => String(s || '').trim();

/**
 * Apply "rollups" to a partitioned counts map.
 * Example rule:
 * {
 *   match: { partitionLabel: "With sugar", basePrefix: "LEMONADES_" },
 *   into: "LEMONADES (With sugar)",
 *   keepZero: true
 * }
 *
 * - partitionLabel matches the suffix part after the last " · "
 * - basePrefix matches the base part before the first " · "
 * - baseIn (optional) matches specific base values
 */
const applyRollups = (map, rules) => {
    if (!map || typeof map !== 'object') return map;
    if (!Array.isArray(rules) || !rules.length) return map;

    const out = { ...map };
    const originalKeys = new Set(Object.keys(out)); // 👈 only these may be rolled up

    const split = (k) => {
        const parts = String(k).split(' · ').map((s) => s.trim());
        const base = parts[0] || k;
        const part = parts[parts.length - 1] || '';
        return { base, part };
    };

    const matches = (rule, key) => {
        if (!originalKeys.has(key)) return false; // 👈 prevents swallowing rollup outputs

        const { base, part } = split(key);
        const m = rule?.match || {};

        if (m.partitionLabel != null && String(part) !== String(m.partitionLabel)) return false;
        if (m.basePrefix != null && !String(base).startsWith(String(m.basePrefix))) return false;
        if (Array.isArray(m.baseNotIn) && m.baseNotIn.length && m.baseNotIn.includes(base)) return false;
        if (Array.isArray(m.baseIn) && m.baseIn.length && !m.baseIn.includes(base)) return false;

        return true;
    };

    for (const rule of rules) {
        const into = String(rule?.into ?? '').trim();
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

/**
 * Builds a map { "<LABEL>": count }.
 * Handles both simple and partitioned queries, applies rollups ensured keys (forceShow),
 * and includeEmpty padding.
 */
export function useCountsByCategory({
                                        groupBy,
                                        effectiveSection,
                                        includeEmpty = false,
                                        within = {},
                                        apiFilters = {},
                                        presetPredicates = [],
                                        partitionBy = [],
                                        forceShow = [],
                                        rollups = [], // NEW: optional rollup rules for partitioned counts
                                        presetId = '',
                                        filterKey = '',
                                    }) {
    const [counts, setCounts] = useState({});

    // stable deps to avoid noisy reruns
    const filtersKey = useMemo(() => JSON.stringify(apiFilters), [apiFilters]);
    const predsKey = useMemo(() => JSON.stringify(presetPredicates), [presetPredicates]);
    const partsKey = useMemo(() => JSON.stringify(partitionBy), [partitionBy]);
    const forceKey = useMemo(() => JSON.stringify(forceShow), [forceShow]);
    const withinKey = useMemo(() => JSON.stringify(within), [within]);
    const rollupsKey = useMemo(() => JSON.stringify(rollups), [rollups]);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const baseArgs = {
                    groupBy,
                    section: effectiveSection,
                    includeEmpty, // pass through to API (if backend supports it)
                    within,
                    filters: apiFilters,
                    predicates: presetPredicates,
                };

                let byGroup = {};

                if (Array.isArray(partitionBy) && partitionBy.length) {
                    // Partitioned fetch (e.g., Sparkling/Still, Zero/With sugar)
                    byGroup = await fetchPartitionedMenuCounts({
                        baseArgs,
                        partitions: partitionBy,
                    });
                } else {
                    // Simple fetch
                    const { results } = await menuCounts(baseArgs);
                    byGroup = (results || []).reduce((acc, row) => {
                        const key = row[groupBy] ?? row.group ?? row.category ?? row.label;
                        const count = row.count_on_menu ?? row.count ?? 0;
                        if (key != null) acc[norm(key)] = count;
                        return acc;
                    }, {});
                }

                byGroup = applyRollups(byGroup, rollups);

                // --- forceShow: add zeros for any labels we want visible even if missing ---
                const out = { ...(byGroup || {}) };
                if (Array.isArray(forceShow)) {
                    for (const raw of forceShow) {
                        const k = norm(raw);
                        if (!(k in out)) out[k] = 0;
                    }
                }

                // --- includeEmpty padding for partitioned views ---
                // IMPORTANT: do NOT pad rolled-up labels
                if (includeEmpty && Array.isArray(partitionBy) && partitionBy.length) {
                    const rollupTargets = new Set(
                        (rollups || []).map(r => String(r.into).trim())
                    );

                    const bases = new Set(
                        Object.keys(out)
                            .filter(k => !rollupTargets.has(norm(k))) // exclude rolled-up buckets
                            .map(k => norm(k).split(' · ')[0])
                    );

                    for (const raw of forceShow || []) {
                        const b = norm(raw).split(' · ')[0];
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
                console.error('[useCountsByCategory] failed', e);
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
        presetId,
        filterKey,
    ]);

    return counts;
}
