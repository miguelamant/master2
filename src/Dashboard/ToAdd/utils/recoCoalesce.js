// src/Dashboard/ToAdd/utils/recoCoalesce.js

/**
 * We get a recommendations/index object keyed like:
 *   "BASE"
 *   "BASE::0" / "BASE::1"
 *   "BASE::1::0" (order may vary)
 * …and values like { recommended, ideal, current, ... }.
 *
 * This utility collapses everything down to BASE-level totals so the
 * SummaryGrid can show the same numbers as the net-summary header.
 */
export function coalesceRecommendationsByBase(recommendations = {}) {
    const out = Object.create(null);

    const parseKey = (k) => {
        // First part is the base token, ignore any flags
        const base = String(k).split('::')[0] || String(k);
        return base.toUpperCase();
    };

    for (const [k, v] of Object.entries(recommendations)) {
        if (!v || typeof v !== 'object') continue;
        const base = parseKey(k);

        const delta = Number(v.recommended ?? 0);
        // We only care about the delta for the small chip in the grid.
        // If you want to also combine ideal/current, you could keep running
        // sums and/or averages here as needed.
        if (!out[base]) {
            out[base] = { recommended: 0 };
        }
        out[base].recommended += delta;
    }

    return out;
}
