// PriceBar.jsx
import React, { useMemo } from "react";
import "./ToReprice.css";

export default function PriceBar({
                                     currentPrice,
                                     lowPrice,
                                     highPrice,
                                     minPrice,
                                     maxPrice,
                                     pad = 0.10,    // 10% padding if floor/ceiling missing
                                     showLabels = false, // 🔥 turn off by default
                                     className = "",
                                 }) {
    const m = useMemo(() => {
        if (
            currentPrice == null ||
            lowPrice == null ||
            highPrice == null
        ) {
            return { valid: false };
        }

        const floor   = (minPrice ?? lowPrice);
        const ceiling = (maxPrice ?? highPrice);
        const range   = Math.max(ceiling - floor, 0.01);

        const start   = Math.min(floor - pad * range, currentPrice);
        const end     = Math.max(ceiling + pad * range, currentPrice);

        const optimal = (lowPrice + highPrice) / 2;

        const thresholds = [start, floor, lowPrice, highPrice, ceiling, end];
        const segmentWeights = thresholds.slice(1).map((v, i) => v - thresholds[i]);

        const toPct = (v) => ((v - start) / (end - start)) * 100;

        return {
            valid: true,
            thresholds,
            segmentWeights,
            optimalPrice: optimal.toFixed(2),
            positionPercentOptimal: toPct(optimal),
            positionPercentCurrent: toPct(currentPrice),
            toPct,
        };
    }, [currentPrice, lowPrice, highPrice, minPrice, maxPrice, pad]);

    if (!m.valid) return null;

    const segmentClasses = [
        "segment--low",
        "segment--below-optimal",
        "segment--optimal",
        "segment--above-optimal",
        "segment--high",
    ];

    return (
        <div className={`price-bar-wrapper ${className}`}>
            {/* Threshold labels removed */}
            {/* Indicators and labels removed */}

            <div className="price-bar">
                <div
                    className="price-indicator top"
                    style={{left: `calc(${m.positionPercentCurrent}% - 8px)`}}
                />


                {m.segmentWeights.map((w, idx) => (
                    <div
                        key={idx}
                        className={`segment ${segmentClasses[idx]}`}
                        style={{flex: w}}
                    />
                ))}
            </div>
        </div>
    );
}
/*

// PriceBar.jsx
import React, { useMemo } from "react";
import "./ToReprice.css";

export default function PriceBar({
                                     currentPrice,
                                     lowPrice,
                                     highPrice,
                                     minPrice,      // optional (floor)
                                     maxPrice,      // optional (ceiling)
                                     pad = 0.10,    // 10% padding if floor/ceiling missing
                                     showLabels = true,
                                     className = "",
                                 }) {
    const m = useMemo(() => {
        // Guard inside the memo to keep hooks unconditionally called
        if (
            currentPrice == null ||
            lowPrice == null ||
            highPrice == null
        ) {
            return { valid: false };
        }

        const floor   = (minPrice ?? lowPrice);
        const ceiling = (maxPrice ?? highPrice);
        const range   = Math.max(ceiling - floor, 0.01);

        // Extend range a bit and ensure current fits in the rail
        const start   = Math.min(floor - pad * range, currentPrice);
        const end     = Math.max(ceiling + pad * range, currentPrice);

        const optimal = (lowPrice + highPrice) / 2;

        const thresholds = [start, floor, lowPrice, highPrice, ceiling, end];
        const segmentWeights = thresholds.slice(1).map((v, i) => v - thresholds[i]);

        const toPct = (v) => ((v - start) / (end - start)) * 100;

        return {
            valid: true,
            thresholds,
            segmentWeights,
            optimalPrice: optimal.toFixed(2),
            positionPercentOptimal: toPct(optimal),
            positionPercentCurrent: toPct(currentPrice),
            toPct,
        };
    }, [currentPrice, lowPrice, highPrice, minPrice, maxPrice, pad]);

    if (!m.valid) return null;

    const segmentClasses = [
        "segment--low",
        "segment--below-optimal",
        "segment--optimal",
        "segment--above-optimal",
        "segment--high",
    ];

    return (
        <div className={`price-bar-wrapper ${className}`}>
            {m.thresholds.map((t, i) =>
                showLabels ? (
                    <div
                        key={i}
                        className={`price-threshold-label ${
                            i === 0 || i === m.thresholds.length - 1 ? "end" : ""
                        }`}
                        style={{ left: `calc(${m.toPct(t)}% - 12px)` }}
                    >
                        €{Number(t).toFixed(2)}
                    </div>
                ) : null
            )}

            <div
                className="price-indicator top"
                style={{ left: `calc(${m.positionPercentOptimal}% - 8px)` }}
            />
            {showLabels && (
                <div
                    className="price-label top"
                    style={{ left: `calc(${m.positionPercentOptimal}% - 8px)` }}
                >
                    €{m.optimalPrice} best price
                </div>
            )}

            <div className="price-bar">
                {m.segmentWeights.map((w, idx) => (
                    <div
                        key={idx}
                        className={`segment ${segmentClasses[idx]}`}
                        style={{ flex: w }}
                    />
                ))}
            </div>

            <div
                className="price-indicator bottom"
                style={{ left: `calc(${m.positionPercentCurrent}% - 8px)` }}
            />
            {showLabels && (
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
*/