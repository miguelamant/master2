// src/Dashboard/ToAdd/engine/marginals.js

// ---- small helpers ----
const asKey = (v) => (v == null ? '' : String(v));


// ——— tolerant label normalizer ———
// Makes "0.6–5.5%" == "0.6-5.5%" and normalizes middot spacing, etc.
// Also keeps one space before trailing " +", and no space around '%'.
function normLabelKey(s) {
    return String(s ?? '')
        .toUpperCase()
        // Unicode dashes → ASCII hyphen
        .replace(/\u2012|\u2013|\u2014|\u2212/g, '-')
        // collapse spaces
        .replace(/\s+/g, ' ')
        // normalize middot spacing
        .replace(/\s*·\s*/g, ' · ')
        // no spaces around '%'
        .replace(/\s*%\s*/g, '%')
        // exactly one space before a trailing plus
        .replace(/\s*\+\s*$/g, ' +')
        .trim();
}

// ---------- address resolution ----------
export function addressFor(layer, group) {
    if (!layer || !group) return null;

    if (layer.type === '1D') {
        const field = layer.field;
        if (!field) return null;

        const buckets = layer.buckets || {};

        // Helper: try exact key, then tolerant (normLabelKey) against all bucket keys.
        const tryMatch = (candidate) => {
            if (!candidate) return null;
            const key = String(candidate);
            if (buckets[key]) return { bucketKey: key, rec: buckets[key] }; // exact

            const want = normLabelKey(key);
            for (const k of Object.keys(buckets)) {
                if (normLabelKey(k) === want) {
                    return { bucketKey: k, rec: buckets[k] }; // return the *actual* bucket key
                }
            }
            return null;
        };

        // Primary key = group[field] (e.g., "subcategory")
        const primary = group[field] == null ? '' : String(group[field]);

        // Fallbacks that cover partitioned views / composite labels:
        //  - exact UI label (if present)
        //  - "SUBCATEGORY · partitionLabel" when a partition label exists
        const label = typeof group.label === 'string' ? group.label : null;
        const composite = (group.subcategory && group.partitionLabel)
            ? `${group.subcategory} · ${group.partitionLabel}`
            : null;

        // Try in order: primary -> label -> composite
        return (
            tryMatch(primary) ||
            tryMatch(label)   ||
            tryMatch(composite) ||
            null
        );
    }


    if (layer.type === '2D') {
        const rf = layer.rows_field;
        const cf = layer.cols_field;
        if (!rf || !cf) return null;

        let row = group[rf];
        let col = group[cf];

        // Coerce booleans for columns if needed
        if (cf === 'is_zero' || cf === 'is_sparkling') {
            if (col === 0 || col === '0' || col === false) col = '0';
            else if (col === 1 || col === '1' || col === true) col = '1';
            else col = '';
        }

        const rowKey = asKey(row);
        const colKey = asKey(col);
        const cellKey = rowKey && colKey ? `${rowKey}::${colKey}` : '';
        if (!cellKey) return null;

        // 1) exact (support legacy cells or buckets)
        let rec =
            (layer.cells && layer.cells[cellKey]) ||
            (layer.buckets && layer.buckets[cellKey]) ||
            null;
        if (rec) return { rowKey, colKey, cellKey, rec };

        // 2) tolerant row/col match
        const wantRow = normLabelKey(rowKey);
        const wantCol = normLabelKey(colKey);
        const cellDict = (layer.buckets || layer.cells || {});
        for (const k of Object.keys(cellDict)) {
            const [rk, ck] = k.split('::');
            if (normLabelKey(rk) === wantRow && normLabelKey(ck) === wantCol) {
                return { rowKey: rk, colKey: ck, cellKey: `${rk}::${ck}`, rec: cellDict[k] };
            }
        }
        return null;
    }

    return null;
}

// ---------- phase-aware geometric MB (with knee monotonicity clamp) ----------
// ---------- RAW MB ONLY (no geometric fallback) ----------

// Read raw MB sequence from the record; if missing, use empty.
function resolveMBParams(rec) {
    const seq = Array.isArray(rec?.bucket) ? rec.bucket.map((x) => Number(x) || 0) : [];
    return { series: seq };
}

// Return MB at depth m from a raw series (clamped to last index)
function MB_atDepth_raw(m, series) {
    const i = Math.max(0, Math.floor(m || 0));
    if (!Array.isArray(series) || series.length === 0) return 0;
    return Number(series[Math.min(i, series.length - 1)] || 0);
}

// Sequences for +k / -k using only raw arrays
function addSequencePhase(m, k, params) {
    const out = [];
    let cur = Math.max(0, Math.floor(m || 0));
    const series = params.series || [];
    for (let i = 0; i < k; i++) {
        out.push(MB_atDepth_raw(cur, series));
        cur += 1;
    }
    return out;
}

function removeSequencePhase(m, k, params) {
    const out = [];
    let cur = Math.max(0, Math.floor(m || 0));
    const series = params.series || [];
    for (let i = 0; i < k; i++) {
        const prev = cur - 1;
        out.push(prev < 0 ? 0 : -MB_atDepth_raw(prev, series));
        cur -= 1;
    }
    return out;
}

/**
 * Geometric marginal benefit stack across all active layers.
 * counts["L<layer_id>"][bucket|cell] = m
 */
