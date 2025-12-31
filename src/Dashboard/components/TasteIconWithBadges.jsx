// TasteIconWithBadges.jsx
import React from "react";
import "./IconComposer.css";
import { iconFor } from "../ToAdd/utils/iconLoader.js";

import { ReactComponent as BadgeZero } from "../Icons/badges/badge_zero.svg";
import { ReactComponent as BadgeSparkling } from "../Icons/badges/badge_sparkling.svg";
import { ReactComponent as BadgeLactoseFree } from "../Icons/badges/badge_lactose_free.svg";
import { ReactComponent as BadgeGlutenFree } from "../Icons/badges/badge_gluten_free.svg";

// Map each badge token to its component AND a corner class
const BADGE_META = {
    // bottom-right
    zero:              { Comp: BadgeZero,        corner: "ic-br" },
    badge_zero:        { Comp: BadgeZero,        corner: "ic-br" },
    gluten:            { Comp: BadgeGlutenFree,  corner: "ic-br" },
    badge_gluten_free: { Comp: BadgeGlutenFree,  corner: "ic-br" },

    // top-left
    sparkling:         { Comp: BadgeSparkling,   corner: "ic-tl" },
    badge_sparkling:   { Comp: BadgeSparkling,   corner: "ic-tl" },

    // bottom-left
    lactose:           { Comp: BadgeLactoseFree, corner: "ic-bl" },
    badge_lactose_free:{ Comp: BadgeLactoseFree, corner: "ic-bl" },
};

export default function TasteIconWithBadges({
                                                token,
                                                badges = [],
                                                size = 22,
                                                title,
                                            }) {
    const src = iconFor(token);
    if (!src) return null;

    // keep first badge per corner (ignore duplicates targeting same corner)
    const seenCorners = new Set();
    const toRender = [];
    for (const raw of badges) {
        const key = String(raw);
        const meta = BADGE_META[key];
        if (!meta) continue;
        if (seenCorners.has(meta.corner)) continue;
        seenCorners.add(meta.corner);
        toRender.push(meta);
    }

    return (
        <span
            className="ic"
            style={{ width: size, height: size, position: "relative", display: "inline-block" }}
            title={title || token}
            aria-label={title || token}
        >
      <img
          src={src}
          alt=""
          aria-hidden="true"
          className="ic-base"
          style={{ width: "100%", height: "100%", display: "block" }}
      />

            {toRender.map(({ Comp, corner }, i) => (
                <Comp key={i} className={`ic-svg ic-badge ${corner}`} />
            ))}
    </span>
    );
}
