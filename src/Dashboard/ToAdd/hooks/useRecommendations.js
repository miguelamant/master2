// src/Dashboard/ToAdd/hooks/useRecommendations.js
import React from 'react';
import { buildPlanToThreshold } from '../engine/sequential';
import { aggregatePlan } from '../engine/aggregatePlan';
import checkGreen from '../../Icons/check_green.svg';
import checkOrange from '../../Icons/check_orange.svg';
import cross from '../../Icons/not_check.svg';
import { buildPerLayerCounts } from '../engine/counts';


// ⬇️ import Willy mode
import { getWillyMode, subscribeUIPrefs } from '../ui/uiPrefs';

// --- add near the top of the file (helpers) ---
function buildMirrorGroupsFromCountsMap(countsMap, groupBy = 'subcategory') {
    if (!countsMap) return [];
    return Object.keys(countsMap).map((label, i) => ({
        id: `mirror_${i}`,
        label,
        count: Number(countsMap[label] || 0),
        // provide fields so addressFor(layer, group) can resolve for 1D subcategory layers
        category: null,
        subcategory: label,
        subsubcategory: label,
        is_zero: null,
        is_sparkling: null,
    }));
}

function diffGroups(a = [], b = []) {
    const k = (g) => String(g?.label ?? g?.subcategory ?? '');
    const mA = new Map(a.map(g => [k(g), Number(g.count || 0)]));
    const mB = new Map(b.map(g => [k(g), Number(g.count || 0)]));
    const keys = new Set([...mA.keys(), ...mB.keys()]);
    let delta = 0;
    for (const key of keys) {
        const da = mA.get(key) ?? 0;
        const db = mB.get(key) ?? 0;
        delta += Math.abs(da - db);
    }
    return delta;
}


export function useRecommendations({
                                       viewGroups,
                                       activeLayers,
                                       layerCounts,
                                       countsByCategory,
                                       displayedCountsByCategory,
                                   }) {
    // ---- Willy mode (0=chilly, 1=stern, 2=sleepy)
    const [willyMode, setWillyMode] = React.useState(getWillyMode());
    React.useEffect(() => subscribeUIPrefs((s) => setWillyMode(s.willyMode)), []);

    // ---- Map Willy → thresholdAbs
    // stern  → 0.05
    // chilly → 0.30
    // sleepy → 0.99
    const thresholdAbs = React.useMemo(() => {
        switch (willyMode) {
            case 1: return 0.10; // stern 0.15
            case 2: return 0.90; // sleepy 0.99
            case 0:
            default: return 0.20; // chilly (default) 0.15
        }
    }, [willyMode]);

    const recoOptions = React.useMemo(() => ({
        kMax: 1,
        thresholdAbs,
        topN: 50,
        requireRemovalDelta: true,
        minRemoveMag: 1e-6,
        requireAddPositive: true,
    }), [thresholdAbs]);

    // ---- ensure engine plans against the same counts as the UI ----
    const engineGroups = React.useMemo(() => {
        // mirror from what's actually displayed
        const mirrored = buildMirrorGroupsFromCountsMap(displayedCountsByCategory, 'subcategory');

        // keep original grouping if there is no meaningful difference
        const delta = diffGroups(mirrored, viewGroups || []);
        if (delta > 0) {
            // log once to help you see mismatches
            console.warn('[ENGINE] Using mirrored groups from displayedCounts; delta =', delta);
            window.__GROUPS_MIRRORED__ = { delta, mirrored, original: viewGroups };
            return mirrored;
        }
        return viewGroups;
    }, [viewGroups, displayedCountsByCategory]);

    const engineCounts = React.useMemo(() => {
        if (!Array.isArray(activeLayers) || !activeLayers.length) return layerCounts || {};
        // Always rebuild from the groups we actually plan on
        const rebuilt = buildPerLayerCounts({ layers: activeLayers, groups: engineGroups || [] });
        // For visibility while you debug:
        if (typeof window !== 'undefined') {
            window.__COUNTS_FROM_MIRROR__ = rebuilt;
        }
        return rebuilt;
    }, [activeLayers, engineGroups, layerCounts]);



    const stepSuggestions = React.useMemo(() => {
        if (!activeLayers?.length || !viewGroups?.length) return [];
        console.debug('[DBG L1001 depths]', layerCounts?.L1001);

        // just before buildPlanToThreshold(...)
        if (typeof window !== 'undefined') {
            window.__COUNTS_FROM_HOOK__ = JSON.parse(JSON.stringify(layerCounts || {}));
        }

        try {
            if (typeof window !== 'undefined') {
                window.__PLAN_INPUT_GROUPS__  = JSON.parse(JSON.stringify(viewGroups || []));
                window.__PLAN_INPUT_LAYERS__  = JSON.parse(JSON.stringify(activeLayers || []));
                window.__PLAN_INPUT_COUNTS__  = JSON.parse(JSON.stringify(layerCounts || {}));
                window.__PLAN_INPUT_OPTIONS__ = JSON.parse(JSON.stringify(recoOptions || {}));
            }
        } catch {}


        const { plan } = buildPlanToThreshold({
            groups: engineGroups,       // ← mirrored groups
            layers: activeLayers,
            counts: engineCounts,       // ← rebuilt counts from those groups
            options: recoOptions,
            maxSteps: 2000,
        });
        try {
            // compact, stable view of what the planner *actually* decided
            const table = (plan || []).map((s, i) => ({
                i,
                k: s?.pair?.k,
                gain: +(s?.gain ?? 0).toFixed(3),
                add: s?.pair?.add?.label,
                remove: s?.pair?.remove?.label,
            }));
            console.log('[RECO][PLAN]', table);

            // make it grab-able from the console
            window.__RECO_PLAN__ = plan;
        } catch {}
        return plan;
    }, [viewGroups, activeLayers, layerCounts, recoOptions]);

    const alloc = React.useMemo(() => aggregatePlan(stepSuggestions), [stepSuggestions]);
    try { if (typeof window !== 'undefined') window.__PLAN_FINAL_ALLOC__ = alloc; } catch {}



    try {
        const rows = Object.values(alloc?.byId || {}).map(r => ({
            label: r.label,
            delta: r.delta,
            add: r.add,
            remove: r.remove,
            subcategory: r.subcategory ?? null,
            is_zero: r.is_zero,
            is_sparkling: r.is_sparkling,
        }));
        console.log('[RECO][ALLOC]', rows);
        window.__RECO_ALLOC__ = alloc;
    } catch {}

    const headerKPI = React.useMemo(() => {
        const totalFromCounts    = Object.values(countsByCategory || {}).reduce((sum, n) => sum + (n ?? 0), 0);
        const totalFromDisplayed = Object.values(displayedCountsByCategory || {}).reduce((a, b) => a + Number(b || 0), 0);
        const total = Number(totalFromCounts || totalFromDisplayed || 0);

        const rows = alloc?.byId ? Object.values(alloc.byId) : [];
        const absDelta = rows.reduce((acc, r) => acc + Math.abs(Number(r?.delta || 0)), 0);

        const pct = total > 0 ? absDelta / total : 0;
        let status = 'green';
        if (absDelta === 0) status = 'green';
        else if (pct <= 0.15) status = 'orange';
        else status = 'red';

        const bg =
            status === 'green'  ? '#E8F5E9' :
                status === 'orange' ? '#FFF3E0' :
                    '#FDE7E7';

        const icon =
            status === 'green'  ? checkGreen :
                status === 'orange' ? checkOrange :
                    cross;

        const badgeText =
            status === 'green'  ? '+1'   :
                status === 'orange' ? '+0.5' :
                    '+0';

        const badgeColor =
            status === 'green'  ? '#137333' :
                status === 'orange' ? '#b45309' :
                    '#b91c1c';

        return { absDelta, total, pct, status, bg, icon, badgeText, badgeColor };
    }, [alloc, countsByCategory, displayedCountsByCategory]);

    const { adds = [], removes = [] } = alloc || {};
    return { stepSuggestions, alloc, adds, removes, headerKPI };
}
