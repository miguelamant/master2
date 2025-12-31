// src/Dashboard/ToAdd/components/SummaryGrid.jsx
import React from "react";
import SummaryGridRow from "./SummaryGridRow";

export default function SummaryGrid(props) {
    const {
        countsByCategory = {},
        sortPriority = [],

        // recommendation inputs
        summaryAdds = [],
        summaryRemoves = [],
        groupBy = "subcategory",
    } = props;

    // ---- sorting ----
    const rankMap = React.useMemo(
        () => new Map(sortPriority.map((k, i) => [String(k), i])),
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
                candidates = summaryPool.filter(
                    (r) => String(r.subcategory || "").toUpperCase() === base
                );
            }

            return candidates[0] || null;
        },
        [summaryPool, groupBy]
    );

    return (
        <div className="segment-icons-grid" style={{ minHeight: 300, alignContent: "start" }}>
            {keys.map((groupValue) => {
                const chosen = findSummaryFor(groupValue);

                return (
                    <SummaryGridRow
                        key={groupValue}
                        {...props}
                        groupValue={groupValue}
                        chosen={chosen}
                    />
                );
            })}
        </div>
    );
}
