import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  calcBoundaries,
  calcCenters,
  clamp,
  loadTarget,
  setValueKeep100,
  totalOf,
} from "./distributionMath";

import PIN from "../../Dashboard/Icons/taste_group/PIN.svg";
import TARGET_2 from "../../Dashboard/Icons/taste_group/TARGET_2.svg";

function hexToRgba(hex, alpha) {
  const h = (hex || "#000000").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function edgeTransform(pct) {
  if (pct <= 0) return "translateX(0)";
  if (pct >= 100) return "translateX(-100%)";
  return "translateX(-50%)";
}

function TipWrap({ icon, title, text, children }) {
  if (!text) return children;
  return (
    <div className="dist-tip">
      {children}
      <div className="dist-tip-pop" role="tooltip">
        <div className="dist-tip-pop-row">
          {icon ? <img src={icon} alt={title || ""} className="dist-tip-icon" /> : null}
          <div className="dist-tip-text">
            {title ? <div className="dist-tip-title">{title}</div> : null}
            <div className="dist-tip-body">{text}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DistributionEditor({
  groups,
  current,
  storageKey,
  onNext,
  nextLabel = "Volgende",
  maxGroups = 8,
  leftColWidth = 220,
}) {
  const keys = useMemo(() => groups.map((g) => g.key).slice(0, maxGroups), [groups, maxGroups]);

  const groupByKey = useMemo(() => {
    const m = {};
    for (const g of groups) m[g.key] = g;
    return m;
  }, [groups]);

  const baseTarget = useMemo(() => ({ ...current }), [current]);
  const [target, setTarget] = useState(() => loadTarget(storageKey, baseTarget, keys));

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(target)); } catch {}
  }, [target, storageKey]);

  // per-row target drag
  const barRefs = useRef({});
  const [dragKey, setDragKey] = useState(null);

  const onTargetDown = (e, key) => {
    setDragKey(key);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onTargetMove = (e, key) => {
    if (dragKey !== key) return;
    const el = barRefs.current[key];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
    setTarget((prev) => setValueKeep100(prev, keys, key, pct));
  };

  const onTargetUp = () => setDragKey(null);

  const onTargetKeyDown = (e, key) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const cur = Number(target?.[key] || 0);
    const next = e.key === "ArrowLeft" ? cur - step : cur + step;
    setTarget((prev) => setValueKeep100(prev, keys, key, next));
  };

  // stacked divider drag
  const stackRef = useRef(null);
  const [dragDividerIdx, setDragDividerIdx] = useState(null);

  const boundaries = useMemo(() => calcBoundaries(target, keys), [target, keys]);
  const targetCenters = useMemo(() => calcCenters(target, keys), [target, keys]);
  const currentCenters = useMemo(() => calcCenters(current, keys), [current, keys]);

  const updateFromDividerMove = (idx, newBoundary) => {
    const prevBound = idx === 0 ? 0 : boundaries[idx - 1];
    const nextBound = idx === boundaries.length - 1 ? 100 : boundaries[idx + 1];
    const b = clamp(Math.round(newBoundary), prevBound, nextBound);

    const leftKey = keys[idx];
    const rightKey = keys[idx + 1];

    const leftVal = b - prevBound;
    const rightVal = nextBound - b;

    setTarget((prev) => {
      const next = { ...prev };
      next[leftKey] = leftVal;
      next[rightKey] = rightVal;

      const s = totalOf(next, keys);
      if (s !== 100) {
        const last = keys[keys.length - 1];
        next[last] = (next[last] || 0) + (100 - s);
      }
      return next;
    });
  };

  const onDividerDown = (e, idx) => {
    setDragDividerIdx(idx);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDividerMove = (e, idx) => {
    if (dragDividerIdx !== idx) return;
    const el = stackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
    updateFromDividerMove(idx, pct);
  };

  const onDividerUp = () => setDragDividerIdx(null);

  return (
    <div className="dist-editor" style={{ "--dist-left-col": `${leftColWidth}px` }}>
      {/* Legend pulled into black header via CSS */}
      <div className="dist-legend">
        <div className="dist-legend-item">
          <img src={PIN} alt="PIN" className="dist-legend-icon" />
          <span>Huidig</span>
        </div>
        <div className="dist-legend-item">
          <img src={TARGET_2} alt="TARGET" className="dist-legend-icon" />
          <span>Target</span>
        </div>
      </div>

      {/* ✅ Single centered wrapper fixes all “left anchored” feel */}
      <div className="dist-inner">
        {/* Compare rows */}
        <div className="dist-compare-list">
          {keys.map((k) => {
            const g = groupByKey[k];
            const label = g?.label || k;
            const col = g?.color || "#64748b";
            const faint = hexToRgba(col, 0.18);
            const solid = hexToRgba(col, 1);

            const curr = Number(current?.[k] || 0);
            const targ = Number(target?.[k] || 0);

            const barBg = `linear-gradient(to right,
              ${solid} 0%,
              ${solid} ${curr}%,
              ${faint} ${curr}%,
              ${faint} 100%)`;

            return (
              <div key={k} className="dist-compare-row">
                <TipWrap icon={g?.iconSrc || null} title={label} text={g?.tooltip}>
                  <div className="dist-compare-info">
                    {g?.iconSrc ? (
                      <img className="dist-left-icon" src={g.iconSrc} alt={label} />
                    ) : (
                      <div className="dist-badge">{g?.badge || label.slice(0, 1)}</div>
                    )}
                    <div className="dist-compare-name">{label}</div>
                  </div>
                </TipWrap>

                <div className="dist-compare-barwrap" ref={(el) => (barRefs.current[k] = el)}>
                  <div className="dist-compare-bar" style={{ background: barBg }} />

                  <div className="dist-marker current" style={{ left: `${curr}%`, transform: edgeTransform(curr) }}>
                    <img src={PIN} alt="Current" className="dist-marker-icon" />
                    <div className="dist-marker-pct">{curr}%</div>
                    <div className="dist-marker-line current" />
                  </div>

                  <div
                    className="dist-marker target"
                    style={{ left: `${targ}%`, transform: edgeTransform(targ) }}
                    role="slider"
                    tabIndex={0}
                    aria-label={`${label} target`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={targ}
                    aria-valuetext={`${targ}%`}
                    onPointerDown={(e) => onTargetDown(e, k)}
                    onPointerMove={(e) => onTargetMove(e, k)}
                    onPointerUp={onTargetUp}
                    onKeyDown={(e) => onTargetKeyDown(e, k)}
                  >
                    <img src={TARGET_2} alt="Target" className="dist-marker-icon" />
                    <div className="dist-marker-pct">{targ}%</div>
                    <div className="dist-marker-line target" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stacked section: centered (not pushed right) */}
        <div className="dist-stack-section">
          <div className="dist-stack-center">
            <div className="dist-stack-row">
              <div className="dist-stack-label">Huidig</div>
              <div className="dist-stackbar current">
                {keys.map((k) => (
                  <div key={k} className="dist-seg" style={{ width: `${current?.[k] || 0}%`, background: groupByKey[k]?.color || "#64748b" }} />
                ))}
                <div className="dist-stackbar-overlay">
                  {currentCenters.map(({ key, center, w }) =>
                    w < 10 ? null : (
                      <div key={key} className="dist-stackbar-pct" style={{ left: `${center}%` }}>
                        {Math.round(current?.[key] || 0)}%
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="dist-stack-row">
              <div className="dist-stack-label">Target</div>

              <div className="dist-stackbar" ref={stackRef}>
                {keys.map((k) => (
                  <div key={k} className="dist-seg" style={{ width: `${target?.[k] || 0}%`, background: groupByKey[k]?.color || "#64748b" }} />
                ))}

                <div className="dist-stackbar-overlay">
                  {targetCenters.map(({ key, center, w }) =>
                    w < 10 ? null : (
                      <div key={key} className="dist-stackbar-pct" style={{ left: `${center}%` }}>
                        {Math.round(target?.[key] || 0)}%
                      </div>
                    )
                  )}
                </div>

                {boundaries.map((b, idx) => (
                  <div
                    key={idx}
                    className="dist-divider"
                    style={{ left: `${b}%` }}
                    onPointerDown={(e) => onDividerDown(e, idx)}
                    onPointerMove={(e) => onDividerMove(e, idx)}
                    onPointerUp={onDividerUp}
                    title="Sleep om te verdelen"
                  >
                    <span className="dist-divider-grip">⋮⋮</span>
                  </div>
                ))}
              </div>

              <div className="dist-stackbar-icons-below">
                {targetCenters.map(({ key, center, w }) => {
                  if (w < 6) return null;
                  const g = groupByKey[key];
                  const col = g?.color || "#64748b";
                  const title = g?.label || key;

                  return (
                    <div key={key} style={{ position: "absolute", left: `${center}%`, transform: "translateX(-50%)" }}>
                      <TipWrap icon={g?.iconSrc || null} title={title} text={g?.tooltip}>
                        <div className="dist-stackbar-icon" style={{ borderColor: col, color: col }}>
                          {g?.iconSrc ? <img src={g.iconSrc} alt={title} /> : <span>{(g?.badge || title[0])}</span>}
                        </div>
                      </TipWrap>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="start-button-container">
              <button className="start-button small" onClick={onNext}>{nextLabel}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}