// src/Dashboard/ToAdd/components/SummaryGrid.jsx
import React from "react";
import SummaryGridRow from "./SummaryGridRow";
import { iconFor } from "../utils/iconLoader";

function sumBenchmarks(stereotypeBenchmarks, buckets) {
    const result = {};
    for (const [name, byBucket] of Object.entries(stereotypeBenchmarks || {})) {
        result[name] = (buckets || []).reduce((s, b) => s + Number(byBucket?.[b] ?? 0), 0);
    }
    return result;
}

export default function SummaryGrid(props) {
    const {
        countsByCategory = {},
        sortPriority = [],

        // recommendation inputs
        summaryAdds = [],
        summaryRemoves = [],
        groupBy = "subcategory",
        stereotypeBenchmarks = {},
    } = props;

    // ✅ Allow config either via props.ui (preferred) or direct props
    const ui = props.ui || {};
    const columns = props.columns ?? ui.columns ?? 2;
    const showItemsInline = props.showItemsInline ?? ui.showItemsInline ?? false;
    const aggregateTop = props.aggregateTop ?? ui.aggregateTop ?? { enabled: false };
    const aggregateRows = props.aggregateRows ?? ui.aggregateRows ?? { enabled: false };

    const safeCols = columns === 3 ? 3 : 2;

    // ---- sorting ----
    const rankMap = React.useMemo(
        () => new Map((sortPriority || []).map((k, i) => [String(k), i])),
        [sortPriority]
    );

    const keys = React.useMemo(() => {
        const arr = Object.keys(countsByCategory || {});
        const rank = (k) => (rankMap.has(k) ? rankMap.get(k) : 1e9);
        return arr.sort((a, b) => {
            const ra = rank(a);
            const rb = rank(b);
            if (ra !== rb) return ra - rb;
            return a.localeCompare(b);
        });
    }, [countsByCategory, rankMap]);

    // ---- build summary pool once ----
    const summaryPool = React.useMemo(() => {
        const norm = (arr) => (Array.isArray(arr) ? arr : []);
        return [
            ...norm(summaryAdds).map((r) => ({ ...r, delta: Number(r.delta || 0) })),
            ...norm(summaryRemoves).map((r) => ({ ...r, delta: Number(r.delta || 0) })),
        ];
    }, [summaryAdds, summaryRemoves]);

    // ---- helper: normalize label ----
    const normLabelKey = (s) =>
        String(s ?? "")
            .toUpperCase()
            .replace(/\u2012|\u2013|\u2014|\u2212/g, "-")
            .replace(/\s+/g, " ")
            .replace(/\s*·\s*/g, " · ")
            .replace(/\s*%\s*/g, "%")
            .replace(/\s*\+\s*$/g, " +")
            .trim();

    // ---- find recommendation for one row ----
    const findSummaryFor = React.useCallback(
        (groupValue) => {
            const rowNorm = normLabelKey(groupValue);

            // 1) exact label match
            let candidates = summaryPool.filter((r) => normLabelKey(r.label) === rowNorm);

            // 2) fallback: match by subcategory token (only for unpartitioned rows typically)
            if (!candidates.length && groupBy === "subcategory") {
                const base = String(groupValue).split(" · ")[0].toUpperCase();
                candidates = summaryPool.filter((r) => String(r.subcategory || "").toUpperCase() === base);
            }

            return candidates[0] || null;
        },
        [summaryPool, groupBy]
    );

    // -------------------------
    // ✅ NEW: hide-empty logic (applies to assigned buckets too)
    // -------------------------
    const hideEmptyBuckets = !!aggregateTop?.hideEmptyBuckets; // 👈 new flag
    const keepZeroBuckets = React.useMemo(() => {
        const arr = Array.isArray(aggregateTop?.keepZeroBuckets) ? aggregateTop.keepZeroBuckets : [];
        return new Set(arr.map(String));
    }, [aggregateTop]);

    const shouldShowBucket = React.useCallback(
        (bucket) => {
            const b = String(bucket);
            if (!hideEmptyBuckets) return true;

            // keep specific buckets even if 0
            if (keepZeroBuckets.has(b)) return true;

            const n = Number(countsByCategory?.[b] ?? 0);
            return n > 0;
        },
        [hideEmptyBuckets, keepZeroBuckets, countsByCategory]
    );

    // -------------------------
    // ✅ Deterministic MATRIX mode
    // -------------------------
    const detCols = !!aggregateTop?.enabled && !!aggregateTop?.deterministic;
    const detRows = !!aggregateRows?.enabled && !!aggregateRows?.deterministic;

    const matrixMode = detCols && detRows;
    const rowsOnlyMode = detRows && !matrixMode;

    const colDefs = React.useMemo(() => {
        const cols = Array.isArray(aggregateTop?.columns) ? aggregateTop.columns : [];
        return cols.slice(0, safeCols);
    }, [aggregateTop, safeCols]);

    const rowDefs = React.useMemo(() => {
        const rows = Array.isArray(aggregateRows?.rows) ? aggregateRows.rows : [];
        return rows;
    }, [aggregateRows]);

    const bucketToCol = React.useMemo(() => {
        const m = new Map();
        colDefs.forEach((c, idx) => {
            (c?.buckets || []).forEach((b) => m.set(String(b), idx));
        });
        return m;
    }, [colDefs]);

    const bucketToRow = React.useMemo(() => {
        const m = new Map();
        rowDefs.forEach((r, idx) => {
            (r?.buckets || []).forEach((b) => m.set(String(b), idx));
        });
        return m;
    }, [rowDefs]);

    const allBucketsInCounts = keys;

    const assignedBuckets = React.useMemo(() => {
        const set = new Set();
        if (rowsOnlyMode) {
            for (const b of allBucketsInCounts) {
                if (bucketToRow.has(b)) set.add(b);
            }
            for (const [b] of bucketToRow.entries()) {
                set.add(b);
            }
        } else {
            for (const b of allBucketsInCounts) {
                if (bucketToCol.has(b) && bucketToRow.has(b)) set.add(b);
            }
            // also consider buckets that exist in defs even if count is 0 / missing from counts
            for (const [b] of bucketToCol.entries()) {
                if (bucketToRow.has(b)) set.add(b);
            }
        }
        return set;
    }, [allBucketsInCounts, bucketToCol, bucketToRow, rowsOnlyMode]);

    const unassignedBuckets = React.useMemo(() => {
        const out = [];
        for (const b of allBucketsInCounts) {
            if (!assignedBuckets.has(b)) out.push(b);
        }
        // (optional) apply hideEmptyBuckets to unassigned list too
        return out.filter(shouldShowBucket);
    }, [allBucketsInCounts, assignedBuckets, shouldShowBucket]);

    // Matrix cells: row x col -> array of bucket labels (normally 1)
    const cells = React.useMemo(() => {
        if (!matrixMode) return null;

        const grid = Array.from({ length: rowDefs.length }, () =>
            Array.from({ length: safeCols }, () => [])
        );

        // include buckets from defs (even if 0) BUT optionally filter empties here
        const all = new Set();
        allBucketsInCounts.forEach((b) => all.add(b));
        bucketToCol.forEach((_v, b) => all.add(b));

        for (const b0 of all) {
            const b = String(b0);
            if (!shouldShowBucket(b)) continue; // ✅ hide assigned empties too (if enabled)

            const r = bucketToRow.get(b);
            const c = bucketToCol.get(b);
            if (r == null || c == null) continue;
            if (!grid[r] || !grid[r][c]) continue;
            grid[r][c].push(b);
        }

        return grid;
    }, [matrixMode, rowDefs.length, safeCols, allBucketsInCounts, bucketToRow, bucketToCol, shouldShowBucket]);

    const [aggTooltip, setAggTooltip] = React.useState(null);

    const colTotals = React.useMemo(() => {
        return colDefs.map((c) =>
            (c?.buckets || []).reduce((sum, b) => sum + Number(countsByCategory?.[b] ?? 0), 0)
        );
    }, [colDefs, countsByCategory]);

    const rowTotals = React.useMemo(() => {
        return rowDefs.map((r) =>
            (r?.buckets || []).reduce((sum, b) => sum + Number(countsByCategory?.[b] ?? 0), 0)
        );
    }, [rowDefs, countsByCategory]);

    // -------------------------
    // ✅ Fallback: deterministic columns (non-matrix)
    // -------------------------
    const colKeysDet = React.useMemo(() => {
        if (!aggregateTop?.enabled || !aggregateTop?.deterministic) return null;

        const cols = Array.isArray(aggregateTop?.columns) ? aggregateTop.columns : [];
        const out = Array.from({ length: safeCols }, () => []);

        // place configured buckets
        for (let i = 0; i < safeCols; i++) {
            const buckets = Array.isArray(cols[i]?.buckets) ? cols[i].buckets : [];
            // ✅ filter assigned buckets by shouldShowBucket when hideEmptyBuckets is enabled
            out[i] = buckets.map(String).filter(shouldShowBucket);
        }

        // handle unassigned
        const assigned = new Set(out.flat());
        const unassigned = keys
            .map(String)
            .filter((k) => !assigned.has(k))
            .filter(shouldShowBucket);

        const mode = aggregateTop?.unassigned || "append"; // "append" | "hide"
        if (mode === "append" && unassigned.length) {
            // append unassigned to the shortest column
            for (const k of unassigned) {
                let best = 0;
                for (let c = 1; c < safeCols; c++) if (out[c].length < out[best].length) best = c;
                out[best].push(String(k));
            }
        }
        // if "hide": do nothing with unassigned

        return out;
    }, [aggregateTop, safeCols, keys, shouldShowBucket]);

    // -------------------------
    // ✅ Dynamic column layout
    // -------------------------
    const colKeysDynamic = React.useMemo(() => {
        const n = safeCols;
        const out = Array.from({ length: n }, () => []);
        if (!keys.length) return out;

        const perCol = Math.ceil(keys.length / n);
        for (let c = 0; c < n; c++) {
            out[c] = keys.slice(c * perCol, (c + 1) * perCol);
        }

        // (optional) hide empties in dynamic mode too (usually you don't want this)
        // return hideEmptyBuckets ? out.map(col => col.filter(shouldShowBucket)) : out;

        return out;
    }, [keys, safeCols]);

    const colKeysUsed = colKeysDet || colKeysDynamic;

    const colTotalsUsed = React.useMemo(() => {
        return colKeysUsed.map((arr) =>
            (arr || []).reduce((sum, k) => sum + Number(countsByCategory?.[k] ?? 0), 0)
        );
    }, [colKeysUsed, countsByCategory]);

    // -------------------------
    // RENDER
    // -------------------------
    return (
        <div style={{ minHeight: 300, alignContent: "start" }}>
            {/* ✅ Column aggregate headers */}
            {aggregateTop?.enabled && (
                <div
                    className="segment-agg-top"
                    style={{
                        display: "grid",
                        gridTemplateColumns: matrixMode
                            ? `240px repeat(${safeCols}, minmax(0, 1fr))`
                            : `repeat(${safeCols}, minmax(0, 1fr))`,
                        gap: 14,
                        marginBottom: 14,
                        alignItems: "stretch",
                    }}
                >
                    {matrixMode ? <div /> : null}

                    {Array.from({ length: safeCols }).map((_, colIdx) => {
                        const cfg = (colDefs[colIdx] || aggregateTop?.columns?.[colIdx] || {}) ?? {};
                        const title = cfg.title || `Column ${colIdx + 1}`;
                        const iconToken = cfg.iconToken || null;
                        const iconUrl = iconToken ? iconFor(iconToken) : null;
                        const total = colTotalsUsed[colIdx] ?? 0;

                        return (
                            <div
                                key={colIdx}
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                    borderRadius: 14,
                                    padding: "10px 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                {/* left group: icon + text */}
                                <div style={{display: "flex", alignItems: "center", gap: 10, minWidth: 0}}>

                                    <div style={{minWidth: 0}}>
                                        <div
                                            style={{
                                                fontWeight: 800,
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {title}
                                        </div>
                                        <div style={{opacity: 0.8, fontSize: 12}}>Total items</div>
                                    </div>

                                    {iconUrl ? (
                                        <img
                                            src={iconUrl}
                                            alt=""
                                            aria-hidden="true"
                                            style={{width: 28, height: 28}}
                                        />
                                    ) : null}


                                </div>

                                {/* ✅ total: right of the left group, but still "left aligned" */}
                                <div
                                    style={{ fontWeight: 900, fontSize: 20, marginLeft: 8, cursor: 'default' }}
                                    onMouseEnter={(e) => {
                                        const colBuckets = colDefs[colIdx]?.buckets || colKeysUsed[colIdx] || [];
                                        const data = sumBenchmarks(stereotypeBenchmarks, colBuckets);
                                        if (Object.values(data).some(v => v > 0))
                                            setAggTooltip({ rect: e.currentTarget.getBoundingClientRect(), data });
                                    }}
                                    onMouseLeave={() => setAggTooltip(null)}
                                >
                                    {total}
                                </div>
                            </div>

                        );

                    })}
                </div>
            )}

            {/* ✅ ROWS-ONLY VIEW */}
            {rowsOnlyMode ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {rowDefs.map((row, rowIdx) => {
                        const rTotal = rowTotals[rowIdx] ?? 0;
                        // TODO: temporary — show all rows even if rTotal === 0
                        // if (rTotal === 0) return null;

                        // hide zero-count sub-buckets by default, unless row has keepEmpty: true
                        const rowBuckets = row?.keepEmpty
                            ? (row?.buckets || [])
                            : (row?.buckets || []).filter(
                                (b) => Number(countsByCategory?.[b] ?? 0) > 0
                              );
                        const rowIcon = row?.iconToken ? iconFor(row.iconToken) : null;
                        const rowDelta = (row?.buckets || []).reduce((sum, b) => {
                            const s = findSummaryFor(b);
                            return sum + (s ? Number(s.delta || 0) : 0);
                        }, 0);
                        const rowSuggested = Math.max(0, rTotal + rowDelta);

                        return (
                            <div key={rowIdx} style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(0,0,0,0.25)",
                                borderRadius: 14,
                                padding: "10px 12px",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}>
                                {/* Left: count + icon + title */}
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    justifyContent: "center",
                                    minWidth: 90,
                                    gap: 4,
                                    flexShrink: 0,
                                }}>
                                    {/* count left of icon, on same line */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div
                                            style={{ fontWeight: 900, fontSize: 22, lineHeight: 1, cursor: 'default' }}
                                            onMouseEnter={(e) => {
                                                const data = sumBenchmarks(stereotypeBenchmarks, row?.buckets || []);
                                                if (Object.values(data).some(v => v > 0))
                                                    setAggTooltip({ rect: e.currentTarget.getBoundingClientRect(), data });
                                            }}
                                            onMouseLeave={() => setAggTooltip(null)}
                                        >
                                            {rTotal}
                                            {rowDelta !== 0 && (
                                                <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 6, color: rowDelta > 0 ? '#16a34a' : '#dc2626' }}>
                                                    {rowDelta > 0 ? '+' : ''}{rowDelta}
                                                </span>
                                            )}
                                        </div>
                                        {rowIcon && <img src={rowIcon} alt="" aria-hidden="true" style={{ width: 24, height: 24 }} />}
                                    </div>
                                    {rowDelta !== 0 && (
                                        <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.2 }}>→ {rowSuggested}</div>
                                    )}
                                    <div style={{ fontWeight: 700, fontSize: 11, opacity: 0.75, lineHeight: 1.2 }}>{row.title}</div>
                                </div>

                                {/* Divider */}
                                <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

                                {/* Right: sub-buckets — free-flowing, wraps after ~10 icons wide */}
                                <div style={{
                                    flex: 1,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 14,
                                    alignItems: "flex-start",
                                    alignContent: "flex-start",
                                }}>
                                    {rowBuckets.map((bucket) => {
                                        const chosen = findSummaryFor(bucket);
                                        return (
                                            <SummaryGridRow
                                                key={bucket}
                                                {...props}
                                                groupValue={bucket}
                                                chosen={chosen}
                                                showItemsInline={showItemsInline}
                                                compact
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Unassigned buckets fall through to a normal column layout */}
                    {unassignedBuckets.length > 0 && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))`,
                            gap: 10,
                        }}>
                            {unassignedBuckets.map((k) => {
                                const chosen = findSummaryFor(k);
                                return (
                                    <SummaryGridRow key={k} {...props} groupValue={k} chosen={chosen} showItemsInline={showItemsInline} />
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : matrixMode ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `240px repeat(${safeCols}, minmax(0, 1fr))`,
                        gap: 14,
                        alignItems: "start",
                    }}
                >
                    {rowDefs.map((row, rowIdx) => {
                        const rowTitle = row?.title || `Row ${rowIdx + 1}`;
                        const rowIcon = row?.iconToken ? iconFor(row.iconToken) : null;
                        const rTotal = rowTotals[rowIdx] ?? 0;
                        const rowDelta = (row?.buckets || []).reduce((sum, b) => {
                            const s = findSummaryFor(b);
                            return sum + (s ? Number(s.delta || 0) : 0);
                        }, 0);
                        const rowSuggested = Math.max(0, rTotal + rowDelta);

                        return (
                            <React.Fragment key={rowIdx}>
                                {/* Row aggregate cell */}
                                <div
                                    style={{
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.10)",
                                        borderRadius: 14,
                                        padding: "10px 12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        minHeight: 86,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                        {rowIcon ? (
                                            <img src={rowIcon} alt="" aria-hidden="true" style={{ width: 28, height: 28 }} />
                                        ) : null}
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: 14,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {rowTitle}
                                            </div>
                                            <div style={{ opacity: 0.8, fontSize: 12 }}>Row total</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                                        <div
                                            style={{ fontWeight: 900, fontSize: 20, cursor: 'default' }}
                                            onMouseEnter={(e) => {
                                                const data = sumBenchmarks(stereotypeBenchmarks, row?.buckets || []);
                                                if (Object.values(data).some(v => v > 0))
                                                    setAggTooltip({ rect: e.currentTarget.getBoundingClientRect(), data });
                                            }}
                                            onMouseLeave={() => setAggTooltip(null)}
                                        >
                                            {rTotal}
                                            {rowDelta !== 0 && (
                                                <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 6, color: rowDelta > 0 ? '#16a34a' : '#dc2626' }}>
                                                    {rowDelta > 0 ? '+' : ''}{rowDelta}
                                                </span>
                                            )}
                                        </div>
                                        {rowDelta !== 0 && (
                                            <div style={{ fontSize: 11, opacity: 0.7 }}>→ {rowSuggested}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Row cells */}
                                {Array.from({ length: safeCols }).map((_, colIdx) => {
                                    const bucketList = (cells?.[rowIdx]?.[colIdx] || []).slice();
                                    const empty = bucketList.length === 0;

                                    return (
                                        <div
                                            key={`${rowIdx}-${colIdx}`}
                                            style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.06)",
                                                borderRadius: 14,
                                                padding: 10,
                                                minHeight: 86,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 10,
                                            }}
                                        >
                                            {empty ? (
                                                <div style={{ opacity: 0.35, fontSize: 12 }} />
                                            ) : (
                                                bucketList.map((bucket) => {
                                                    const chosen = findSummaryFor(bucket);
                                                    return (
                                                        <SummaryGridRow
                                                            key={bucket}
                                                            {...props}
                                                            groupValue={bucket}
                                                            chosen={chosen}
                                                            showItemsInline={showItemsInline}
                                                            compact
                                                        />
                                                    );
                                                })
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}

                    {/* Unassigned buckets handling */}
                    {aggregateTop?.unassigned === "append" && unassignedBuckets.length > 0 ? (
                        <div style={{ gridColumn: `1 / span ${safeCols + 1}`, marginTop: 10 }}>
                            <div style={{ opacity: 0.8, fontWeight: 800, margin: "6px 0 10px" }}>
                                Unassigned
                            </div>
                            <div
                                className="segment-icons-grid"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))`,
                                    gap: 16,
                                }}
                            >
                                {unassignedBuckets.map((k) => {
                                    const chosen = findSummaryFor(k);
                                    return (
                                        <SummaryGridRow
                                            key={k}
                                            {...props}
                                            groupValue={k}
                                            chosen={chosen}
                                            showItemsInline={showItemsInline}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : (
                // ✅ DEFAULT column layout
                <div
                    className="segment-icons-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))`,
                        gap: 16,
                        alignContent: "start",
                    }}
                >
                    {colKeysUsed.map((col, colIdx) => (
                        <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {(col || []).map((groupValue) => {
                                const chosen = findSummaryFor(groupValue);
                                return (
                                    <SummaryGridRow
                                        key={groupValue}
                                        {...props}
                                        groupValue={groupValue}
                                        chosen={chosen}
                                        showItemsInline={showItemsInline}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {aggTooltip && Object.keys(aggTooltip.data).length > 0 && (
                <div style={{
                    position: 'fixed',
                    top: aggTooltip.rect.bottom + 4,
                    left: aggTooltip.rect.left,
                    zIndex: 50,
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    pointerEvents: 'none',
                    minWidth: 160,
                    fontSize: 13,
                }}>
                    {Object.entries(aggTooltip.data).map(([name, val]) => (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '1px 0' }}>
                            <span style={{ opacity: 0.75 }}>{name}</span>
                            <span style={{ fontWeight: 700 }}>{Math.round(val * 10) / 10}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
