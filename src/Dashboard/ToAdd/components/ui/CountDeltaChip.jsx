// src/Dashboard/ToAdd/components/ui/CountDeltaChip.jsx
import React from "react";

export default function CountDeltaChip({ chosen, checkIcon }) {
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
    const color = "#dc2626"; // your current logic uses red either way

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
}
