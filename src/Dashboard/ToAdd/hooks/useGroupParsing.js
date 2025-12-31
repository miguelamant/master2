// src/Dashboard/ToAdd/hooks/useGroupParsing.js
import React from "react";

export function useGroupParsing() {
    const normLabelKey = React.useCallback((s) => {
        return String(s ?? "")
            .toUpperCase()
            .replace(/\u2012|\u2013|\u2014|\u2212/g, "-") // unicode dashes → "-"
            .replace(/\s+/g, " ") // collapse spaces
            .replace(/\s*·\s*/g, " · ") // normalize middot spacing
            .replace(/\s*%\s*/g, "%") // no spaces around '%'
            .replace(/\s*\+\s*$/g, " +") // exactly one space before trailing '+'
            .trim();
    }, []);

    const parseCompositeMulti = React.useCallback((val) => {
        const s = String(val || "");
        const parts = s.split(" · ").map((p) => (p || "").trim());
        const base = parts[0] || s;
        const suffixes = parts.slice(1).map((p) => p.toLowerCase());

        let is_sparkling = null;
        let is_zero = null;
        let is_prebiotic = null;

        if (suffixes.includes("sparkling")) is_sparkling = 1;
        if (suffixes.includes("still") || suffixes.includes("not sparkling")) is_sparkling = 0;
        if (suffixes.includes("prebiotic") || suffixes.includes("prebiotica")) is_prebiotic = 1;

        if (suffixes.includes("zero") || suffixes.includes("non-alcoholic") || suffixes.includes("alcohol-free")) {
            is_zero = 1;
        }
        if (suffixes.includes("with sugar") || suffixes.includes("with alcohol") || suffixes.includes("alcoholic")) {
            is_zero = 0;
        }

        return { base, is_sparkling, is_zero, is_prebiotic };
    }, []);

    return { normLabelKey, parseCompositeMulti };
}
