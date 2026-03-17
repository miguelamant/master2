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
                                       enabled = true,
                                   }) {
    // ---- Willy mode (0=easy/sleepy, 1=medium/chilly, 2=hard/stern)
    const [willyMode, setWillyMode] = React.useState(getWillyMode());
    React.useEffect(() => subscribeUIPrefs((s) => setWillyMode(s.willyMode)), []);

    // ---- Map Willy → thresholdAbs
    // Thresholds are calibrated against the bucket+row addMB scale (~3×pct/100).
    // A 2.4% Dutch bucket (e.g. ciders) has addMB≈0.072 at depth=0, so chilly
    // must be below that to catch it.
    const thresholdAbs = React.useMemo(() => {
        // Thresholds calibrated for log(1 + pct/10) MB scale:
        // 1% bucket → 0.095, 3% → 0.26, 10% → 0.69, 30% → 1.39
        switch (willyMode) {
            case 2: return 0.04; // hard/stern   — catches ≥0.5% underpresence
            case 0: return 0.50; // easy/sleepy  — catches only large imbalances (≥10%)
            case 1:
            default: return 0.08; // medium/chilly — catches ≥1% underpresence
        }
    }, [willyMode]);

    const recoOptions = React.useMemo(() => ({
        kMax: 1,
        thresholdAbs,
        topN: 50,
        requireRemovalDelta: false, // over-ideal removals have remMB≈0 by design; isRemovableInAnyLayer already guards
        minRemoveMag: 0,
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
        if (typeof window !== 'undefined') {
            window.__COUNTS_FROM_MIRROR__ = rebuilt;
        }
        return rebuilt;
    }, [activeLayers, engineGroups, layerCounts]);

    // Inject zero-count groups for distribution buckets not present in the
    // current menu.  The current menu only returns categories with ≥1 item, so
    // groups with 0 items are invisible to the planner.
    // These phantom groups have depth=0 in all layers → never removable, but
    // they do have a positive addMB (series[0]) so the engine can recommend them.
    const isCiderKey = (k) => /^CIDER/i.test(k);
    const allAddableGroups = React.useMemo(() => {
        if (!Array.isArray(activeLayers) || !activeLayers.length) return engineGroups || [];
        const existingKeys = new Set(
            (engineGroups || []).map(g => String(g.subcategory || g.label || '').toUpperCase())
        );
        const category = (engineGroups || [])[0]?.category || '';
        const extras = [];
        for (const layer of activeLayers) {
            if (layer.field === 'rowLabel') continue; // row-aggregate layers, skip
            for (const bucketKey of Object.keys(layer.buckets || {})) {
                const norm = String(bucketKey).toUpperCase();
                if (isCiderKey(norm)) continue; // CIDERS moved to own category
                if (!existingKeys.has(norm)) {
                    existingKeys.add(norm);
                    extras.push({
                        id: `zero_${bucketKey}`,
                        label: bucketKey,
                        count: 0,
                        subcategory: bucketKey,
                        subsubcategory: bucketKey,
                        category,
                        is_sparkling: null,
                        is_zero: null,
                        rowLabel: bucketKey,
                    });
                }
            }
        }
        return extras.length > 0 ? [...(engineGroups || []), ...extras] : (engineGroups || []);
    }, [engineGroups, activeLayers]);

    // Debounce planning inputs: always keep a ref current, fire the planner
    // at most once per 2 s of inactivity.  Using a ref avoids false restarts
    // caused by unstable object references from upstream memos.
    const planSnapshotRef = React.useRef({ groups: allAddableGroups, layers: activeLayers, counts: engineCounts });
    planSnapshotRef.current = { groups: allAddableGroups, layers: activeLayers, counts: engineCounts };

    // Stable key: only reset the timer when layer IDs or group counts actually change.
    const planDepsKey = React.useMemo(() => {
        try {
            return JSON.stringify({
                layerIds: (activeLayers || []).map(L => L.layer_id),
                groupCounts: (engineGroups || []).map(g => `${g.id}:${g.count}`),
                extraCount: allAddableGroups.length - (engineGroups || []).length,
            });
        } catch { return ''; }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLayers, engineGroups, allAddableGroups]);

    // ---- Skip engine entirely when disabled (willyOff / willy toggle off) ----
    const emptyHeaderKPI = React.useMemo(() => {
        const totalFromDisplayed = Object.values(displayedCountsByCategory || {}).reduce((a, b) => a + Number(b || 0), 0);
        const totalFromCounts    = Object.values(countsByCategory || {}).reduce((sum, n) => sum + (n ?? 0), 0);
        const total = Number(totalFromDisplayed || totalFromCounts || 0);
        return { absDelta: 0, total, pct: 0, status: 'green', bg: '#E8F5E9', icon: checkGreen, badgeText: '+0', badgeColor: '#137333' };
    }, [countsByCategory, displayedCountsByCategory]);

    const [planInputs, setPlanInputs] = React.useState(null);
    const [computing, setComputing] = React.useState(false);
    const computeRunIdRef = React.useRef(0);

    React.useEffect(() => {
        if (!enabled) { setPlanInputs(null); setComputing(false); return; }
        const thisRun = ++computeRunIdRef.current;
        setComputing(true);
        const t = setTimeout(() => {
            if (thisRun === computeRunIdRef.current) {
                setPlanInputs({ ...planSnapshotRef.current });
            }
        }, 2000);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planDepsKey, enabled]);

    const stepSuggestions = React.useMemo(() => {
        if (!enabled) return [];
        const { groups: dGroups, layers: dLayers, counts: dCounts } = planInputs || {};
        if (!dLayers?.length || !dGroups?.length) return [];

        try {
            if (typeof window !== 'undefined') {
                window.__PLAN_INPUT_GROUPS__  = JSON.parse(JSON.stringify(dGroups || []));
                window.__PLAN_INPUT_LAYERS__  = JSON.parse(JSON.stringify(dLayers || []));
                window.__PLAN_INPUT_COUNTS__  = JSON.parse(JSON.stringify(dCounts || {}));
                window.__PLAN_INPUT_OPTIONS__ = JSON.parse(JSON.stringify(recoOptions || {}));
            }
        } catch {}

        const { plan } = buildPlanToThreshold({
            groups: dGroups,
            layers: dLayers,
            counts: dCounts,
            options: recoOptions,
            maxSteps: 2000,
        });
        try { window.__RECO_PLAN__ = plan; } catch {}
        return plan;
    }, [planInputs, recoOptions, enabled]);

    // Clear computing flag after plan resolves
    React.useEffect(() => {
        if (planInputs != null && enabled) {
            setComputing(false);
        }
    }, [stepSuggestions, planInputs, enabled]);

    const alloc = React.useMemo(() => enabled ? aggregatePlan(stepSuggestions) : null, [stepSuggestions, enabled]);
    try { if (typeof window !== 'undefined') window.__PLAN_FINAL_ALLOC__ = alloc; } catch {}



    try { window.__RECO_ALLOC__ = alloc; } catch {}

    const headerKPI = React.useMemo(() => {
        if (!enabled) return emptyHeaderKPI;

        const totalFromDisplayed = Object.values(displayedCountsByCategory || {}).reduce((a, b) => a + Number(b || 0), 0);
        const totalFromCounts    = Object.values(countsByCategory || {}).reduce((sum, n) => sum + (n ?? 0), 0);
        const total = Number(totalFromDisplayed || totalFromCounts || 0);

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
    }, [enabled, emptyHeaderKPI, alloc, countsByCategory, displayedCountsByCategory]);

    const { adds = [], removes = [] } = alloc || {};
    return { stepSuggestions, alloc, adds, removes, headerKPI, computing: enabled && computing };
}
