// src/Dashboard/ToAdd/components/ui/HoverInfoPopover.jsx
import React from "react";

export default function HoverInfoPopover({ hoverBucket }) {
    return (
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
            <div style={{ color: "#334155", lineHeight: 1.25, whiteSpace: "pre-line" }}>
                {hoverBucket.text}
            </div>
        </div>
    );
}
