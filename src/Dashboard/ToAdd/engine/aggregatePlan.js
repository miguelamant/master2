// src/Dashboard/ToAdd/engine/aggregatePlan.js

/**
 * Roll up a sequential plan into net deltas per item-group.
 * plan: [{ pair:{ add, remove, k }, gain, breakdown }]
 *
 * Returns:
 * {
 *   byId: {
 *     [groupId]: {
 *       id, label,
 *       category, subcategory, subsubcategory, is_zero, is_sparkling,
 *       add: number, remove: number, delta: number
 *     }
 *   },
 *   adds:   [ same objects with delta > 0 ]  sorted by delta desc
 *   removes:[ same objects with delta < 0 ]  sorted by |delta| desc
 * }
 */
export function aggregatePlan(plan = []) {
    const byId = {};

    const baseFromLabel = (label) => {
        const s = String(label ?? '');
        const base = s.split(' · ')[0] || s;
        return base.toUpperCase();
    };

    const touch = (g) => {
        if (!g) return null;
        const id = g.id ?? g.label; // fallback if no stable id
        if (!byId[id]) {
            const label = g.label ?? id;
            byId[id] = {
                id,
                label,
                // ✅ include category (needed for groupBy: 'category' matching in SummaryGrid)
                category: (g.category != null ? String(g.category).toUpperCase() : baseFromLabel(label)) || null,
                subcategory: g.subcategory ?? null,
                subsubcategory: g.subsubcategory ?? null,
                is_zero: g.is_zero ?? null,
                is_sparkling: g.is_sparkling ?? null,
                add: 0,
                remove: 0,
                delta: 0,
            };
        }
        return byId[id];
    };

    for (const step of plan) {
        const { pair } = step || {};
        if (!pair) continue;
        const k = Number(pair.k || 0) || 0;

        const A = touch(pair.add);
        const R = touch(pair.remove);

        if (A && k > 0) {
            A.add += k;
            A.delta += k;
        }
        if (R && k > 0) {
            R.remove += k;
            R.delta -= k;
        }
    }

    const rows = Object.values(byId);
    const adds = rows.filter(r => r.delta > 0).sort((a, b) => b.delta - a.delta);
    const removes = rows.filter(r => r.delta < 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return { byId, adds, removes };
}
