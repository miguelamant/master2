// src/Dashboard/ToAdd/components/SummaryGridRow.jsx
import React from "react";
import PriceBar from "../../PriceBar";
import TasteIconWithBadges from "../../components/TasteIconWithBadges";
import magnifyIcon from "../../Icons/magnifying_glass.svg";
import checkIcon from "../../Icons/check.svg";
import { convertItemLabel } from "../utils/itemLabelMap";
import { convertDisplayLabel } from "../utils/labelMap";
import { getGroupExplanation } from "../utils/explanations";
import { makeHoverKey } from "../utils/hoverKey";

// Parse composite labels like "COLA · Still", "LEMONADES · Sparkling", etc.
function parseCompositeMulti(val) {
    const s = String(val || "");
    const parts = s.split(" · ").map((p) => (p || "").trim());
    const base = parts[0] || s;
    const suffixes = parts.slice(1).map((p) => p.toLowerCase());

    let is_sparkling = null;
    let is_zero = null;
    let is_prebiotic = null;
    let heritage = null; // "NORMAL" | "ABBEY" | "TRAPPIST" | ["NORMAL","ABBEY"]

    if (suffixes.includes("sparkling")) is_sparkling = 1;
    if (suffixes.includes("still") || suffixes.includes("not sparkling")) is_sparkling = 0;

    if (suffixes.includes("prebiotic") || suffixes.includes("prebiotica")) is_prebiotic = 1;

    if (suffixes.includes("zero") || suffixes.includes("non-alcoholic") || suffixes.includes("alcohol-free")) {
        is_zero = 1;
    }
    if (suffixes.includes("with sugar") || suffixes.includes("with alcohol") || suffixes.includes("alcoholic")) {
        is_zero = 0;
    }

    // ✅ heritage partitions
    if (suffixes.includes("trappist")) heritage = "TRAPPIST";
    else if (suffixes.includes("abbey")) heritage = "ABBEY";
    else if (suffixes.includes("normal")) heritage = "NORMAL";
    else if (suffixes.includes("normal/abbey") || suffixes.includes("abbey/normal")) heritage = ["NORMAL", "ABBEY"];

    return { base, is_sparkling, is_zero, is_prebiotic, heritage };
}


/**
 * Build a hover descriptor that useHoverLists understands.
 * - Rollup override wins (hoverOverrides[groupValue])
 * - Otherwise partitioned label -> base value + predicates
 */
function buildHoverGroupDescriptor({ groupValue, groupBy, hoverOverrides }) {
    const label = String(groupValue || "");

    const normalizePreds = (arr) =>
        (Array.isArray(arr) ? arr : [])
            .filter(Boolean)
            .map((p) => ({
                ...p,
                op: p.op ? String(p.op).toLowerCase() : "eq",
            }));

    // 1) rollup override
    const ov = hoverOverrides && hoverOverrides[label] ? hoverOverrides[label] : null;
    if (ov) {
        return {
            value: String(ov.value ?? label),
            groupBy: ov.groupBy || groupBy,
            within: ov.within || {},
            predicates: normalizePreds(ov.predicates || []),
            // ✅ critical: rollup labels are virtual, so don't force f.subsubcategory="IPA (all)"
            noGroupFilter: ov.noGroupFilter !== undefined ? !!ov.noGroupFilter : true,
        };
    }

    // 2) partitioned label -> base dimension + predicates
    const { base, is_sparkling, is_zero, is_prebiotic, heritage } = parseCompositeMulti(label);

    const preds = [];
    if (is_zero === 0 || is_zero === 1) preds.push({ field: "is_zero", op: "eq", value: is_zero });
    if (is_sparkling === 0 || is_sparkling === 1) preds.push({ field: "is_sparkling", op: "eq", value: is_sparkling });
    if (is_prebiotic === 0 || is_prebiotic === 1) preds.push({ field: "is_prebiotic", op: "eq", value: is_prebiotic });

    if (heritage) {
        if (Array.isArray(heritage)) preds.push({ field: "heritage", op: "in", value: heritage });
        else preds.push({ field: "heritage", op: "eq", value: heritage });
    }

    return {
        value: String(base || label),
        groupBy,
        within: {},
        predicates: preds,
        noGroupFilter: false,
    };
}


export default function SummaryGridRow(props) {
    const {
        // identity
        groupValue,
        groupBy = "subcategory",
        filterKey,

        // data
        countsByCategory = {},

        // recommendations
        chosen = null,

        // hover
        hoverLists = {},
        hoverCat,
        setHoverCat,
        loadHoverList,
        hoverOverrides = {},
        makeKey, // optional; if you pass hook's makeKey, we can use it, else we use makeHoverKey util

        // UX
        onFocusGroup,
        showPriceBars = true,
        activeBadges = [],
    } = props;

    const actual = countsByCategory[groupValue] ?? 0;
    const displayLabel = convertDisplayLabel(groupValue);

    const { base, is_sparkling, is_zero } = parseCompositeMulti(groupValue);

    // row-level badges
    const rowBadges = [...activeBadges];
    if (is_zero === 1) rowBadges.push("zero");
    if (is_sparkling === 1) rowBadges.push("sparkling");
    if (is_sparkling === 0) rowBadges.push("badge_still");

    // icons
    const icons = [];
    for (let i = 0; i < Math.max(0, actual); i++) {
        icons.push(
            <span key={`${groupValue}-${i}`} className="segment-icon-wrapper">
        <TasteIconWithBadges token={base} badges={rowBadges} size={20} title={`${displayLabel} (${actual})`} />
      </span>
        );
    }

    // hover descriptor + key (MUST match useHoverLists key building)
    const hoverDesc = buildHoverGroupDescriptor({ groupValue, groupBy, hoverOverrides });

    const extra = {
        effGroupBy: hoverDesc.groupBy || groupBy,
        extraWithin: hoverDesc.within || {},
        extraPreds: hoverDesc.predicates || [],
        noGroupFilter: !!hoverDesc.noGroupFilter,
    };

    const hoverKey =
        typeof makeKey === "function"
            ? makeKey(String(hoverDesc.value || ""), extra)
            : makeHoverKey(groupBy, filterKey, String(hoverDesc.value || ""), extra);

    const itemsForHover = hoverLists[hoverKey] || [];
    const isOpen = hoverCat === hoverKey;

    const dbgRow = (typeof window !== "undefined" && window.__DBG_HOVER_ROW__) || null;
    if (dbgRow?.enabled) {
        console.log("[HOVER][ROW]", {
            groupValue,
            base,
            actual,
            hoverDesc,
            hoverKey,
            hoverCat,
            isOpen,
            itemsLen: itemsForHover.length,
        });
    }

    const CountDeltaChip = ({ chosen }) => {
        const d = chosen ? Number(chosen.delta || 0) : 0;
        if (!chosen || d === 0) {
            return (
                <img
                    src={checkIcon}
                    alt=""
                    aria-hidden="true"
                    style={{ width: 14, height: 14, marginLeft: 6, opacity: 0.9, verticalAlign: "text-bottom" }}
                />
            );
        }
        const sign = d > 0 ? "+" : "";
        const color = "#dc2626";
        return (
            <span
                style={{
                    all: "unset",
                    display: "inline-block",
                    marginLeft: 6,
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: "18px",
                    color,
                    WebkitTextFillColor: color,
                }}
                title={`Net change: ${sign}${d}`}
            >
        {sign}
                {d}
      </span>
        );
    };

    const [hoverBucket, setHoverBucket] = React.useState(null);

    return (
        <div className="segment-row">
      <span className="segment-label">
        <strong className="segment-title-name">{displayLabel}</strong>

        <button
            type="button"
            className="segment-focus-btn"
            title="Focus this group"
            aria-label={`Focus ${displayLabel}`}
            onClick={() => onFocusGroup && onFocusGroup(groupValue)}
            style={{
                marginLeft: 8,
                padding: 2,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
            }}
        >
          <img src={magnifyIcon} alt="" aria-hidden="true" style={{ width: 18, height: 18 }} />

          <span
              onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const info = getGroupExplanation(base);
                  setHoverBucket({ anchorRect: rect, title: info.title, text: info.text });
              }}
              onMouseLeave={() => setHoverBucket(null)}
              style={{ display: "inline-flex" }}
          >
            <TasteIconWithBadges token={base} badges={rowBadges} size={30} />
          </span>
        </button>
      </span>

            <div className="segment-inline" style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div
                    className={`segment-icons ${icons.length > 15 ? "segment-icons--multiline" : ""}`}
                    onMouseEnter={() => {
                        console.log("[HOVER][ENTER]", { groupValue, hoverDesc, extra, hoverKey });
                        const dbg = typeof window !== "undefined" && window.__DBG_HOVER__?.enabled;


                        if (dbg) console.log("[HOVER][ENTER]", { groupValue, hoverKey, hoverDesc, extra });

                        // IMPORTANT: store the FULL key (so partitions/rollups don't collide)
                        setHoverCat && setHoverCat(hoverKey);

                        // IMPORTANT: this only works if index.jsx passes the hook's loadHoverList down
                        loadHoverList && loadHoverList(hoverDesc);
                    }}
                    onMouseLeave={() => setHoverCat && setHoverCat(null)}
                >
                    {icons}

                    {isOpen && (
                        <div className="hover-list-popover">
                            {itemsForHover.length === 0 ? (
                                <div className="hover-empty">No items</div>
                            ) : (
                                <ul className="hover-list">
                                    {itemsForHover.map((p) => (
                                        <li key={p.id_menu_item}>
                                            <span className="hover-name">{convertItemLabel(p.item_name || p.name)}</span>
                                            {p.price != null && <span className="hover-price">€{Number(p.price).toFixed(2)}</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div className="segment-meta" style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "center" }}>
          <span className="segment-count" style={{ fontWeight: 600 }}>
            {actual}
          </span>

                    {(() => {
                        const delta = chosen ? Number(chosen.delta || 0) : 0;
                        const recommended = Math.max(0, Number(actual || 0) + delta);
                        return delta !== 0 ? <span style={{ opacity: 0.85 }}>→ {recommended}</span> : null;
                    })()}

                    <CountDeltaChip chosen={chosen} />
                </div>
            </div>

            {hoverBucket && (
                <div
                    className="hover-popover"
                    style={{
                        position: "fixed",
                        top: hoverBucket.anchorRect.bottom + 8,
                        left: hoverBucket.anchorRect.left,
                        zIndex: 30,
                        background: "#fff",
                        border: "1px solid rgba(0,0,0,0.1)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                        maxWidth: 520,
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{hoverBucket.title}</div>
                    <div style={{ color: "#334155", lineHeight: 1.25, whiteSpace: "pre-line" }}>{hoverBucket.text}</div>
                </div>
            )}

            {showPriceBars && (
                <PriceBar
                    currentPrice={4.5}
                    lowPrice={4.0}
                    highPrice={5.0}
                    minPrice={3.0}
                    maxPrice={6.0}
                    showLabels={false}
                />
            )}
        </div>
    );
}
