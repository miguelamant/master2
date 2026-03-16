// src/Dashboard/ToAdd/components/SummaryGridRow.jsx
import React from "react";
import PriceBar from "../../PriceBar";
import TasteIconWithBadges from "../../components/TasteIconWithBadges";
import magnifyIcon from "../../Icons/magnifying_glass.svg";
import checkIcon from "../../Icons/check.svg";
import { convertItemLabel } from "../utils/itemLabelMap";
import { convertDisplayLabel } from "../utils/labelMap";
import { getGroupExplanation, hasHardCodedExplanation } from "../utils/explanations";
import { makeHoverKey } from "../utils/hoverKey";
import { convertBaseLabel } from "../utils/labelMap";
import { normToken } from "../utils/normalize";
import { api } from "../../../apiService";
import { iconFor } from "../utils/iconLoader";

const PERSONA_FLAG_TOKEN = {
    Belgian: 'BELGIUM', French: 'FRANCE', German: 'GERMANY', Dutch: 'NETHERLANDS',
};

const _aiExplCache = new Map(); // key -> { text } | '__loading__'

// Parse composite labels like "COLA · Still", "LEMONADES · Sparkling", etc.
function parseCompositeMulti(val) {
    const s = String(val || "");
    const parts = s.split(" · ").map((p) => (p || "").trim());
    const base = parts[0] || s;
    const suffixes = parts.slice(1).map((p) => p.toLowerCase());

    let is_sparkling = null;
    let is_zero = null;
    let is_prebiotic = null;
    let heritage = null;

    if (suffixes.includes("sparkling")) is_sparkling = 1;
    if (suffixes.includes("still") || suffixes.includes("not sparkling")) is_sparkling = 0;

    if (suffixes.includes("prebiotic") || suffixes.includes("prebiotica")) is_prebiotic = 1;

    if (suffixes.includes("zero") || suffixes.includes("non-alcoholic") || suffixes.includes("alcohol-free")) {
        is_zero = 1;
    }
    if (suffixes.includes("with sugar") || suffixes.includes("with alcohol") || suffixes.includes("alcoholic")) {
        is_zero = 0;
    }

    if (suffixes.includes("trappist")) heritage = "TRAPPIST";
    else if (suffixes.includes("abbey")) heritage = "ABBEY";
    else if (suffixes.includes("normal")) heritage = "NORMAL";
    else if (suffixes.includes("modern")) heritage = "MODERN";
    else if (suffixes.includes("normal/abbey") || suffixes.includes("abbey/normal")) heritage = ["NORMAL", "ABBEY"];

    return { base, is_sparkling, is_zero, is_prebiotic, heritage };
}

/**
 * Build a hover descriptor that useHoverLists understands.
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
        groupValue,
        groupBy = "subcategory",
        filterKey,
        countsByCategory = {},
        chosen = null,

        hoverLists = {},
        hoverCat,
        setHoverCat,
        loadHoverList,
        hoverOverrides = {},
        makeKey,

        onFocusGroup,
        showPriceBars = true,
        activeBadges = [],

        showItemsInline = false,
        inlineItemsLimit = 6,

        // ✅ NEW: compact mode (used in matrix cells)
        compact = false,

        // card grid mode
        cardItem = false,

        stereotypeBenchmarks = {},
        onRecommendationClick = null,
        totalMenuCount = 0,
    } = props;

    const actual = countsByCategory[groupValue] ?? 0;
    const displayLabel = convertDisplayLabel(groupValue);
    const { base, is_sparkling, is_zero } = parseCompositeMulti(groupValue);

    const rowBadges = [...activeBadges];
    if (is_zero === 1) rowBadges.push("zero");
    if (is_sparkling === 1) rowBadges.push("sparkling");
    if (is_sparkling === 0) rowBadges.push("badge_still");

    const iconLimit = compact ? 20 : Infinity;
    const iconCount = Math.max(0, actual);
    const visibleIconCount = Math.min(iconCount, iconLimit);
    const iconOverflow = iconCount - visibleIconCount;

    const icons = [];
    for (let i = 0; i < visibleIconCount; i++) {
        icons.push(
            <span key={`${groupValue}-${i}`} className="segment-icon-wrapper">
        <TasteIconWithBadges token={base} badges={rowBadges} size={20} title={`${displayLabel} (${actual})`} />
      </span>
        );
    }

    const hoverDesc = React.useMemo(
        () => buildHoverGroupDescriptor({ groupValue, groupBy, hoverOverrides }),
        [groupValue, groupBy, hoverOverrides]
    );

    const extra = React.useMemo(
        () => ({
            effGroupBy: hoverDesc.groupBy || groupBy,
            extraWithin: hoverDesc.within || {},
            extraPreds: hoverDesc.predicates || [],
            noGroupFilter: !!hoverDesc.noGroupFilter,
        }),
        [hoverDesc, groupBy]
    );

    const hoverKey =
        typeof makeKey === "function"
            ? makeKey(String(hoverDesc.value || ""), extra)
            : makeHoverKey(groupBy, filterKey, String(hoverDesc.value || ""), extra);

    const itemsForHover = hoverLists[hoverKey] || [];
    const isOpen = hoverCat === hoverKey;

    React.useEffect(() => {
        if (!showItemsInline) return;
        if (!loadHoverList) return;
        if (!hoverLists[hoverKey]) loadHoverList(hoverDesc);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showItemsInline, hoverKey]);

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
        const color = "#3b82f6";
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
    const [expanded, setExpanded] = React.useState(false);
    const [countAnchor, setCountAnchor] = React.useState(null);
    const hideTimerRef = React.useRef(null);

    const startHideTimer = React.useCallback(() => {
        hideTimerRef.current = setTimeout(() => {
            setCountAnchor(null);
            setHoverCat && setHoverCat(null);
        }, 150);
    }, [setHoverCat]);
    const cancelHideTimer = React.useCallback(() => clearTimeout(hideTimerRef.current), []);

    const visibleInlineItems = expanded ? itemsForHover : itemsForHover.slice(0, inlineItemsLimit);
    const canExpand = itemsForHover.length > inlineItemsLimit;

    // ✅ Card item early return (for cardsMode in SummaryGrid)
    if (cardItem) {
        const delta = chosen ? Number(chosen.delta || 0) : 0;

        const handleIconMouseEnter = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (hasHardCodedExplanation(base)) {
                const info = getGroupExplanation(base);
                setHoverBucket({ anchorRect: rect, title: info.title, text: info.text });
                return;
            }
            const cacheKey = String(groupValue);
            const cached = _aiExplCache.get(cacheKey);
            if (cached && cached !== '__loading__') {
                setHoverBucket({ anchorRect: rect, title: convertBaseLabel(normToken(base)), text: cached.text });
                return;
            }
            const title = convertBaseLabel(normToken(base));
            setHoverBucket({ anchorRect: rect, title, text: 'Loading explanation…' });
            if (cached === '__loading__') return;
            _aiExplCache.set(cacheKey, '__loading__');
            const ov = hoverOverrides && hoverOverrides[cacheKey];
            const baseInPred = ov?.predicates?.find(p => p.op === 'in');
            const subsubcategories = baseInPred?.value ?? [];
            api.post('/api/explain-bucket', { label: cacheKey, subsubcategories, section: groupBy })
                .then(({ data }) => {
                    const text = data.text || 'No explanation available.';
                    _aiExplCache.set(cacheKey, { text });
                    setHoverBucket(prev => prev && prev.title === title ? { ...prev, text } : prev);
                })
                .catch(() => {
                    const text = 'Explanation unavailable.';
                    _aiExplCache.set(cacheKey, { text });
                    setHoverBucket(prev => prev && prev.title === title ? { ...prev, text } : prev);
                });
        };

        return (
            <div style={{ display: 'flex', alignItems: 'center',
                          minHeight: 24, padding: '2px 4px',
                          borderRadius: 5,
                          background: actual === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>

                {/* Content — opacity only here, so tooltips (position:fixed siblings) are unaffected */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1,
                              opacity: actual === 0 ? 0.3 : 1 }}>

                    {/* Count with inline delta + benchmark hover */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0, minWidth: 22 }}>
                        <span
                            style={{ fontWeight: 800, fontSize: 14,
                                     fontFamily: "'Space Grotesk', sans-serif", cursor: 'default' }}
                            onMouseEnter={(e) => {
                                cancelHideTimer();
                                const benchData = Object.fromEntries(
                                    Object.entries(stereotypeBenchmarks || {})
                                        .map(([name, byBucket]) => [name, byBucket?.[groupValue] ?? 0])
                                );
                                if (Object.keys(benchData).length > 0)
                                    setCountAnchor({ rect: e.currentTarget.getBoundingClientRect(), data: benchData });
                                setHoverCat && setHoverCat(hoverKey);
                                loadHoverList && loadHoverList(hoverDesc);
                            }}
                            onMouseLeave={startHideTimer}
                        >{actual}</span>
                        {delta !== 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1, color: '#3b82f6' }}>
                                {delta > 0 ? '+' : ''}{delta}
                            </span>
                        )}
                    </div>

                    {/* Icon with hover for AI explanation */}
                    <span
                        onMouseEnter={handleIconMouseEnter}
                        onMouseLeave={() => setHoverBucket(null)}
                        style={{ flexShrink: 0, display: 'inline-flex' }}
                    >
                        <TasteIconWithBadges token={base} badges={rowBadges} size={20} />
                    </span>

                    {/* Label */}
                    <span style={{ flex: 1, fontSize: 11.5, overflow: 'hidden',
                                   textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                   letterSpacing: '0.05em', textTransform: 'uppercase',
                                   opacity: 0.8 }}>
                        {displayLabel}
                    </span>

                    {/* Magnify */}
                    <button
                        type="button"
                        className="segment-focus-btn"
                        onClick={() => onFocusGroup && onFocusGroup(groupValue)}
                        style={{ padding: 2, border: 'none', background: 'transparent',
                                 cursor: 'pointer', flexShrink: 0, display: 'inline-flex' }}
                    >
                        <img src={magnifyIcon} alt="" aria-hidden="true"
                             style={{ width: 14, height: 14, opacity: 0.45 }} />
                    </button>
                </div>

                {/* Explanation popover */}
                {hoverBucket && (
                    <div
                        className="hover-popover"
                        style={{
                            position: 'fixed',
                            top: hoverBucket.anchorRect.bottom + 8,
                            left: hoverBucket.anchorRect.left,
                            zIndex: 30,
                            background: '#fff',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: 10,
                            padding: '10px 12px',
                            boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                            maxWidth: 520,
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{hoverBucket.title}</div>
                        <div style={{ color: '#334155', lineHeight: 1.25, whiteSpace: 'pre-line' }}>{hoverBucket.text}</div>
                    </div>
                )}

                {/* Benchmark / persona tooltip */}
                {countAnchor && (
                    <div
                        onMouseEnter={cancelHideTimer}
                        onMouseLeave={startHideTimer}
                        style={{
                            position: 'fixed',
                            top: countAnchor.rect.bottom + 6,
                            left: countAnchor.rect.left,
                            zIndex: 9999,
                            background: '#fff',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: 12,
                            padding: '10px 14px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            pointerEvents: 'auto',
                            minWidth: 180,
                            fontSize: 12,
                            color: '#000',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8,
                                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                      textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                                <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
                            </svg>
                            Benchmarks
                        </div>
                        {Object.keys(countAnchor.data).length === 0
                            ? <div style={{ opacity: 0.4 }}>No benchmark data</div>
                            : Object.entries(countAnchor.data).map(([name, val]) => {
                                const flagUrl = iconFor(PERSONA_FLAG_TOKEN[name]);
                                return (
                                    <div key={name} style={{ display: 'flex', alignItems: 'center',
                                                             justifyContent: 'space-between', gap: 12, padding: '3px 0' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {flagUrl && <img src={flagUrl} alt={name} style={{ width: 18, height: 12, objectFit: 'cover', borderRadius: 2 }} />}
                                            <span style={{ color: 'rgba(0,0,0,0.65)', fontSize: 12 }}>{name}</span>
                                        </span>
                                        <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: '#000' }}>
                                            {(Math.round((val ?? 0) * 10) / 10).toFixed(1)}
                                            {totalMenuCount > 0 && <span style={{ fontWeight: 400, color: 'rgba(0,0,0,0.4)', fontSize: 11 }}>/{totalMenuCount}</span>}
                                        </span>
                                    </div>
                                );
                            })
                        }
                        {itemsForHover.length > 0 && (
                            <>
                                <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '8px 0' }} />
                                <ul style={{ margin: 0, padding: '0 0 0 16px', maxHeight: 180, overflowY: 'auto' }}>
                                    {itemsForHover.map((p) => (
                                        <li key={p.id_menu_item || p.id_product || p.name} style={{ fontSize: 12, margin: '2px 0', color: '#000' }}>
                                            {convertItemLabel(p.item_name || p.name)}
                                            {p.price != null && <span style={{ marginLeft: 6, color: 'rgba(0,0,0,0.5)' }}>€{Number(p.price).toFixed(2)}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="segment-row" style={compact ? { padding: 0 } : undefined}>
      <span className="segment-label" style={compact ? { marginBottom: 4 } : undefined}>
        <strong className="segment-title-name" style={compact ? { fontSize: 13 } : undefined}>
          {displayLabel}
        </strong>

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

                  // 1. Hard-coded entry → use as-is
                  if (hasHardCodedExplanation(base)) {
                      const info = getGroupExplanation(base);
                      setHoverBucket({ anchorRect: rect, title: info.title, text: info.text });
                      return;
                  }

                  const cacheKey = String(groupValue);
                  const cached = _aiExplCache.get(cacheKey);

                  // 2. Already fetched → show immediately
                  if (cached && cached !== '__loading__') {
                      setHoverBucket({ anchorRect: rect, title: convertBaseLabel(normToken(base)), text: cached.text });
                      return;
                  }

                  // 3. Show loading state
                  const title = convertBaseLabel(normToken(base));
                  setHoverBucket({ anchorRect: rect, title, text: 'Loading explanation…' });

                  if (cached === '__loading__') return; // fetch already in flight

                  // 4. Fetch from backend
                  _aiExplCache.set(cacheKey, '__loading__');

                  const ov = hoverOverrides && hoverOverrides[cacheKey];
                  const baseInPred = ov?.predicates?.find(p => p.op === 'in');
                  const subsubcategories = baseInPred?.value ?? [];

                  api.post('/api/explain-bucket', { label: cacheKey, subsubcategories, section: groupBy })
                      .then(({ data }) => {
                          const text = data.text || 'No explanation available.';
                          _aiExplCache.set(cacheKey, { text });
                          setHoverBucket(prev =>
                              prev && prev.title === title ? { ...prev, text } : prev
                          );
                      })
                      .catch(() => {
                          const text = 'Explanation unavailable.';
                          _aiExplCache.set(cacheKey, { text });
                          setHoverBucket(prev =>
                              prev && prev.title === title ? { ...prev, text } : prev
                          );
                      });
              }}
              onMouseLeave={() => setHoverBucket(null)}
              style={{ display: "inline-flex" }}
          >
            <TasteIconWithBadges token={base} badges={rowBadges} size={compact ? 24 : 30} />
          </span>
        </button>
      </span>

            <div className="segment-inline" style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div
                    className={`segment-icons ${icons.length > 15 ? "segment-icons--multiline" : ""}`}
                    onMouseEnter={() => {
                        setHoverCat && setHoverCat(hoverKey);
                        loadHoverList && loadHoverList(hoverDesc);
                    }}
                    onMouseLeave={() => setHoverCat && setHoverCat(null)}
                >
                    {icons}

                    {iconOverflow > 0 && (
                        <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            opacity: 0.7,
                            marginLeft: 2,
                        }}>
                            +{iconOverflow}
                        </span>
                    )}

                    {isOpen && !showItemsInline && (
                        <div className="hover-list-popover">
                            {itemsForHover.length === 0 ? (
                                <div className="hover-empty">No items</div>
                            ) : (
                                <ul className="hover-list">
                                    {itemsForHover.map((p) => (
                                        <li key={p.id_menu_item || p.id_product || p.name}>
                                            <span className="hover-name">{convertItemLabel(p.item_name || p.name)}</span>
                                            {p.price != null && <span className="hover-price">€{Number(p.price).toFixed(2)}</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {Object.keys(stereotypeBenchmarks || {}).length > 0 && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                                    {Object.entries(stereotypeBenchmarks).map(([name, buckets]) => {
                                        const val = buckets[groupValue];
                                        if (val == null) return null;
                                        return (
                                            <div key={name} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, opacity: 0.8, padding: "1px 0" }}>
                                                <span>{name}</span>
                                                <span style={{ fontWeight: 600 }}>{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="segment-meta" style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "center" }}>
          <span
              className="segment-count"
              style={{ fontWeight: 600, cursor: 'default' }}
              onMouseEnter={(e) => {
                  const benchData = Object.fromEntries(
                      Object.entries(stereotypeBenchmarks || {})
                          .map(([name, byBucket]) => [name, byBucket?.[groupValue] ?? 0])
                  );
                  if (Object.keys(benchData).length > 0)
                      setCountAnchor({ rect: e.currentTarget.getBoundingClientRect(), data: benchData });
              }}
              onMouseLeave={startHideTimer}
          >
            {actual}
          </span>

                    {(() => {
                        const delta = chosen ? Number(chosen.delta || 0) : 0;
                        const recommended = Math.max(0, Number(actual || 0) + delta);
                        return delta !== 0 ? (
                            <span
                                style={{
                                    opacity: 0.85,
                                    cursor: onRecommendationClick ? 'pointer' : 'default',
                                    textDecoration: onRecommendationClick ? 'underline dotted' : 'none',
                                }}
                                onClick={onRecommendationClick ? (e) => {
                                    e.stopPropagation();
                                    const bucketBenchmarks = Object.fromEntries(
                                        Object.entries(stereotypeBenchmarks || {}).map(([persona, byBucket]) => [
                                            persona, byBucket[groupValue] ?? 0
                                        ])
                                    );
                                    onRecommendationClick({ groupValue, displayLabel, delta, actual, recommended, bucketBenchmarks });
                                } : undefined}
                            >
                                → {recommended}
                            </span>
                        ) : null;
                    })()}

                    <CountDeltaChip chosen={chosen} />
                </div>
            </div>

            {showItemsInline && (
                <div
                    style={{
                        marginTop: 8,
                        marginLeft: 6,
                        padding: "8px 10px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    {itemsForHover.length === 0 ? (
                        <div style={{ opacity: 0.75, fontSize: 13 }}>No items</div>
                    ) : (
                        <>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {visibleInlineItems.map((p) => (
                                    <li key={p.id_menu_item || p.id_product || p.name} style={{ margin: "4px 0" }}>
                                        <span style={{ opacity: 0.95 }}>{convertItemLabel(p.item_name || p.name)}</span>
                                        {p.price != null && (
                                            <span style={{ marginLeft: 8, opacity: 0.85 }}>€{Number(p.price).toFixed(2)}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {canExpand && (
                                <button
                                    type="button"
                                    onClick={() => setExpanded((v) => !v)}
                                    style={{
                                        marginTop: 6,
                                        background: "transparent",
                                        border: "none",
                                        padding: 0,
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        opacity: 0.85,
                                    }}
                                >
                                    {expanded ? "Show less" : `Show all (${itemsForHover.length})`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}

            {countAnchor && (
                <div
                    onMouseEnter={cancelHideTimer}
                    onMouseLeave={startHideTimer}
                    style={{
                        position: 'fixed',
                        top: countAnchor.rect.bottom + 6,
                        left: countAnchor.rect.left,
                        zIndex: 9999,
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        pointerEvents: 'auto',
                        minWidth: 180,
                        fontSize: 12,
                        color: '#000',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8,
                                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                  textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                            <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
                        </svg>
                        Benchmarks
                    </div>
                    {Object.keys(countAnchor.data).length === 0
                        ? <div style={{ opacity: 0.4 }}>No benchmark data</div>
                        : Object.entries(countAnchor.data).map(([name, val]) => {
                            const flagUrl = iconFor(PERSONA_FLAG_TOKEN[name]);
                            return (
                                <div key={name} style={{ display: 'flex', alignItems: 'center',
                                                         justifyContent: 'space-between', gap: 12, padding: '3px 0' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {flagUrl && <img src={flagUrl} alt={name} style={{ width: 18, height: 12, objectFit: 'cover', borderRadius: 2 }} />}
                                    </span>
                                    <span style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: '#000' }}>
                                        {(Math.round((val ?? 0) * 10) / 10).toFixed(1)}
                                        {totalMenuCount > 0 && <span style={{ fontWeight: 400, color: 'rgba(0,0,0,0.4)', fontSize: 11 }}>/{totalMenuCount}</span>}
                                    </span>
                                </div>
                            );
                        })
                    }
                </div>
            )}

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
