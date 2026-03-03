// src/Dashboard/ToReprice/components/PriceBar.jsx
import React, { useMemo } from "react";
import "./ToReprice.css";

export default function PriceBar({
                                     currentPrice,
                                     lowPrice,
                                     highPrice,
                                     minPrice,
                                     maxPrice,
                                     padFloor = 0.9,     // matches your old minPrice*0.9
                                     padCeiling = 1.1,   // matches your old maxPrice*1.1
                                     showThresholdLabels = true,
                                     showOptimalLabel = true,
                                     showCurrentLabel = true,
                                 }) {
    const m = useMemo(() => {
        const cp = Number(currentPrice);
        const lo = Number(lowPrice);
        const hi = Number(highPrice);
        const mn = minPrice != null ? Number(minPrice) : lo;
        const mx = maxPrice != null ? Number(maxPrice) : hi;

        if (![cp, lo, hi, mn, mx].every((x) => Number.isFinite(x))) {
            return { valid: false };
        }

        const optimal = (lo + hi) / 2;

        const startBar = Math.min(Number((mn * padFloor).toFixed(2)), cp);
        const endBar = Math.max(Number((mx * padCeiling).toFixed(2)), cp);

        const thresholds = [
            startBar,
            mn,
            lo,
            hi,
            mx,
            endBar,
        ];

        const segmentWeights = thresholds.slice(1).map((end, idx) => end - thresholds[idx]);

        const toPct = (v) => ((v - startBar) / (endBar - startBar)) * 100;

        return {
            valid: true,
            thresholds,
            segmentWeights,
            optimal,
            positionPercentCurrent: toPct(cp),
            positionPercentOptimal: toPct(optimal),
            toPct,
        };
    }, [currentPrice, lowPrice, highPrice, minPrice, maxPrice, padFloor, padCeiling]);

    if (!m.valid) return null;

    const segmentClasses = [
        "segment--low",
        "segment--below-optimal",
        "segment--optimal",
        "segment--above-optimal",
        "segment--high",
    ];

    return (
        <div className="price-bar-wrapper">
            {showThresholdLabels &&
                m.thresholds.map((t, i) => (
                    <div
                        key={i}
                        className={`price-threshold-label ${i === 0 || i === m.thresholds.length - 1 ? "end" : ""}`}
                        style={{ left: `calc(${m.toPct(t)}% - 12px)` }}
                    >
                        €{Number(t).toFixed(2)}
                    </div>
                ))}

            {/* optimal marker (top) */}
            <div
                className="price-indicator top"
                style={{ left: `calc(${m.positionPercentOptimal}% - 8px)` }}
            />
            {showOptimalLabel && (
                <div
                    className="price-label top"
                    style={{ left: `calc(${m.positionPercentOptimal}% - 8px)` }}
                >
                    €{m.optimal.toFixed(2)} best price
                </div>
            )}

            {/* colored segments */}
            <div className="price-bar">
                {m.segmentWeights.map((w, idx) => (
                    <div
                        key={idx}
                        className={`segment ${segmentClasses[idx]}`}
                        style={{ flex: w }}
                    />
                ))}
            </div>

            {/* current marker (bottom) */}
            <div
                className="price-indicator bottom"
                style={{ left: `calc(${m.positionPercentCurrent}% - 8px)` }}
            />
            {showCurrentLabel && (
                <div
                    className="price-label bottom"
                    style={{ left: `calc(${m.positionPercentCurrent}% - 8px)` }}
                >
                    €{Number(currentPrice).toFixed(2)} current price
                </div>
            )}
        </div>
    );
}
