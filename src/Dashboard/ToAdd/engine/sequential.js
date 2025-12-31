// src/Dashboard/ToAdd/engine/sequential.js
import { findBestPairs } from './pairSearch';
import { addressFor } from './marginals';

/**
 * Mutate `counts` in place for the given group by +1 or -1
 * across all active layers that address this group.
 */
// ---- planner debug gate (simple console + optional UI mirror) -------------





function dbgEnabled() {
    const g = (typeof window !== 'undefined' && window.__DBG_PLAN__) || {};
    return !!g.enabled;
}

// Keep a rolling buffer so the UI (or you) can inspect it later
function __ensurePlanLogBuffer() {
    if (typeof window === 'undefined') return null;
    if (!Array.isArray(window.__PLAN_LOGS__)) window.__PLAN_LOGS__ = [];
    return window.__PLAN_LOGS__;
}



function bumpCountsFor({ layers, counts, group, delta }) {
    if (!group) return;
    for (const layer of layers || []) {
        const addr = addressFor(layer, group);
        if (!addr) continue;

        const lid = `L${layer.layer_id}`;
        counts[lid] = counts[lid] || {};

        if (layer.type === '1D') {
            const key = addr.bucketKey;
            counts[lid][key] = (counts[lid][key] || 0) + delta;
            if (counts[lid][key] < 0) counts[lid][key] = 0;
        } else {
            const key = addr.cellKey;
            counts[lid][key] = (counts[lid][key] || 0) + delta;
            if (counts[lid][key] < 0) counts[lid][key] = 0;
        }
    }
}

/**
 * Greedy sequential plan (pairs-only): pick best pair, apply virtually, repeat.
 * Stops when no valid pair remains (i.e., all gains < threshold) or maxSteps reached.
 *
 * options are passed to findBestPairs; useful defaults enforce pairs-only:
 *   - kMax: 1
 *   - thresholdAbs: 0.0 (you typically set > 0)
 *   - topN: 10
 *   - requireRemovalDelta: true
 *   - minRemoveMag: 1e-6
 *   - requireAddPositive: true
 */
// --- helpers at top of file (add if missing) ---
// put near the top of sequential.js if not present already
const deepClone = (x) => JSON.parse(JSON.stringify(x || {}));
function publish(key, val) { try { if (typeof window !== 'undefined') window[key] = val; } catch {} }


// ─────────────────────────────────────────────────────────────────────────────
// Greedy, fixed number of steps
export function buildSequentialPlan({ groups, steps = 5, options = {}, layers, counts }) {
    const workingGroups = (groups || []).map(g => ({ ...g, count: Number(g.count || 0) }));
    if (!Array.isArray(layers) || !counts) {
        console.warn('[sequential] missing layers or counts; pass both in.');
        return { plan: [], finalCounts: counts || {}, layers: layers || [] };
    }

    const dbg = (typeof window !== 'undefined' && window.__DBG_PLAN__) || {};
    const workCounts = deepClone(counts);
    const plan = [];

    const baseOpts = {
        kMax: 1,
        topN: 10,
        requireRemovalDelta: false,
        minRemoveMag: 0,
        requireAddPositive: true,
        ...options,
    };

    // publish initial snapshots once
    publish('__PLAN_INIT_COUNTS__', deepClone(workCounts));
    publish('__PLAN_INPUT_GROUPS__', deepClone(workingGroups));
    publish('__PLAN_INPUT_LAYERS__', deepClone(layers));
    publish('__PLAN_INPUT_COUNTS__', deepClone(counts));
    publish('__PLAN_INPUT_OPTIONS__', deepClone(baseOpts));

    // step 0 “pre” peek (before any bump)
    if (dbg && dbg.enabled) {
        const first = findBestPairs({ layers, groups: workingGroups, counts: workCounts, options: baseOpts });
        publish('__PLAN_PEEK0__', (first || []).map(c => ({
            gain: +c.gain.toFixed(3),
            add: c.pair.add?.label, remove: c.pair.remove?.label, k: c.pair.k,
            addMB: +(c.breakdown?.add?.total ?? 0).toFixed(3),
            remMB: +(-(c.breakdown?.remove?.total ?? 0)).toFixed(3),
        })));
    }

    for (let s = 0; s < steps; s++) {
        // compute candidates against the *current* workCounts snapshot
        const results = findBestPairs({ layers, groups: workingGroups, counts: workCounts, options: baseOpts });
        publish('__PLAN_LAST_CANDIDATES__', (results || []).map(r => ({
            gain: r.gain,
            add: r.pair.add?.label,
            remove: r.pair.remove?.label,
            k: r.pair.k,
            addMB: r.breakdown?.add?.total ?? 0,
            remMB: -(r.breakdown?.remove?.total ?? 0),
        })));

        const best = results[0];
        if (!best) {
            if (dbg && dbg.enabled) {
                console.warn('[PLAN][STOP]', { step: s, reason: 'no-candidates', thresholdAbs: baseOpts.thresholdAbs });
            }
            break;
        }

        // publish a step “peek” BEFORE applying bumps so you see the true MBs used
        if (dbg && dbg.enabled) {
            const dump = results.slice(0, 12).map(c => ({
                step: s,
                gain: +c.gain.toFixed(3),
                add: c.pair.add?.label,
                remove: c.pair.remove?.label,
                k: c.pair.k,
                addMB: +(c.breakdown?.add?.total ?? 0).toFixed(3),
                remMB: +(-(c.breakdown?.remove?.total ?? 0)).toFixed(3),
            }));
            publish(`__PLAN_PEEK_STEP_${s}__`, dump);
            try { console.table(dump); } catch { console.log(dump); }
        }

        const { add, remove, k } = best.pair;

        // apply bumps to the local workCounts
        bumpCountsFor({ layers, counts: workCounts, group: add, delta: +k });
        bumpCountsFor({ layers, counts: workCounts, group: remove, delta: -k });

        // mirror group totals for UI side-effects
        const addRef = add ? workingGroups.find(g => g.id === add.id) : null;
        const remRef = remove ? workingGroups.find(g => g.id === remove.id) : null;
        if (addRef) addRef.count = Number(addRef.count || 0) + k;
        if (remRef) remRef.count = Math.max(0, Number(remRef.count || 0) - k);

        // keep “last counts” so you can inspect the state *after* this step
        publish('__PLAN_LAST_COUNTS__', deepClone(workCounts));

        plan.push(best);
    }

    return { plan, finalCounts: workCounts, layers };
}

// ─────────────────────────────────────────────────────────────────────────────
// Greedy until threshold (max cap)
// put near the top of sequential.js if not present already


// ─────────────────────────────────────────────────────────────────────────────
// Greedy until threshold (max cap)
export function buildPlanToThreshold({ groups, layers, counts, options = {}, maxSteps = 1000 }) {
    const workingGroups = (groups || []).map(g => ({ ...g, count: Number(g.count || 0) }));
    if (!Array.isArray(layers) || !counts) {
        console.warn('[sequential] missing layers or counts; pass both in.');
        return { plan: [], finalCounts: counts || {}, layers: layers || [] };
    }

    const workCounts = deepClone(counts);
    const plan = [];

    const baseOpts = {
        kMax: 1,
        thresholdAbs: 0.0,
        topN: 50,
        requireRemovalDelta: true,
        minRemoveMag: 1e-6,
        requireAddPositive: true,
        ...options,
    };

    // publish inputs once (always)
    publish('__PLAN_INPUT_GROUPS__',  deepClone(workingGroups));
    publish('__PLAN_INPUT_LAYERS__',  deepClone(layers));
    publish('__PLAN_INPUT_COUNTS__',  deepClone(counts));
    publish('__PLAN_INPUT_OPTIONS__', deepClone(baseOpts));
    publish('__PLAN_INIT_COUNTS__',   deepClone(workCounts));

    // === STEP 0 PEEK (before any bumps) — ALWAYS publish ===
    const peek0 = findBestPairs({
        layers,
        groups: workingGroups,
        counts: workCounts,
        options: baseOpts,
    });
    publish('__PLAN_PEEK0__', (peek0 || []).map(c => ({
        gain: +c.gain.toFixed(3),
        add: c.pair.add?.label,
        remove: c.pair.remove?.label,
        k: c.pair.k,
        addMB: +(c.breakdown?.add?.total ?? 0).toFixed(3),
        remMB: +(-(c.breakdown?.remove?.total ?? 0)).toFixed(3),
    })));

    for (let s = 0; s < maxSteps; s++) {
        const results = findBestPairs({
            layers,
            groups: workingGroups,
            counts: workCounts,
            options: baseOpts,
        });

        // keep the full candidate set and a human-friendly slice
        publish('__PLAN_LAST_CANDIDATES__', (results || []).map(r => ({
            gain: r.gain,
            add: r.pair.add?.label,
            remove: r.pair.remove?.label,
            k: r.pair.k,
            addMB: r.breakdown?.add?.total ?? 0,
            remMB: -(r.breakdown?.remove?.total ?? 0),
        })));

        const best = results[0];
        if (!best) {
            console.warn('[PLAN][STOP]', { step: s, reason: 'no-candidates', thresholdAbs: baseOpts.thresholdAbs });
            break;
        }

        // publish top 12 BEFORE we bump counts (so MBs reflect the snapshot used)
        const peekStep = results.slice(0, 12).map(c => ({
            step: s,
            gain: +c.gain.toFixed(3),
            add: c.pair.add?.label,
            remove: c.pair.remove?.label,
            k: c.pair.k,
            addMB: +(c.breakdown?.add?.total ?? 0).toFixed(3),
            remMB: +(-(c.breakdown?.remove?.total ?? 0)).toFixed(3),
        }));
        publish(`__PLAN_PEEK_STEP_${s}__`, peekStep);
        //try { console.table(peekStep); } catch { console.log(peekStep); }

        const { add, remove, k } = best.pair;

        // apply bumps on the working snapshot
        bumpCountsFor({ layers, counts: workCounts, group: add,    delta: +k });
        bumpCountsFor({ layers, counts: workCounts, group: remove, delta: -k });

        // mirror to the group list (for any UI that reads counts from groups)
        const addRef = add ? workingGroups.find(g => g.id === add.id) : null;
        const remRef = remove ? workingGroups.find(g => g.id === remove.id) : null;
        if (addRef) addRef.count = Number(addRef.count || 0) + k;
        if (remRef) remRef.count = Math.max(0, Number(remRef.count || 0) - k);

        // keep “after this step” counts for inspection
        publish('__PLAN_LAST_COUNTS__', deepClone(workCounts));

        plan.push(best);
    }

    return { plan, finalCounts: workCounts, layers };
}

