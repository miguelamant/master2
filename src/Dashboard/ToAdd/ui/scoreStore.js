// scoreStore.js — v2 with pack registration + current position + finalization helpers

let store = {};         // { [category]: { visited: { [viewId]: score }, order: string[], sum: number } }
let packs = {};         // { [category]: { ids: string[], len: number } }
let currentPos = {};    // { [category]: number }  // 0-based index of current view within the pack (optional)

const listeners = new Set();
const LS_KEY = 'scoreStore.v2';
const LS_PACKS = 'scoreStore.packs.v1';
const LS_POS = 'scoreStore.pos.v1';

// ---------- persistence ----------
function load() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) store = JSON.parse(raw);
    } catch {}
    try {
        const rawP = localStorage.getItem(LS_PACKS);
        if (rawP) packs = JSON.parse(rawP);
    } catch {}
    try {
        const rawPos = localStorage.getItem(LS_POS);
        if (rawPos) currentPos = JSON.parse(rawPos);
    } catch {}
}
function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {}
    try { localStorage.setItem(LS_PACKS, JSON.stringify(packs)); } catch {}
    try { localStorage.setItem(LS_POS, JSON.stringify(currentPos)); } catch {}
}
function emit() { listeners.forEach(fn => fn()); save(); }

load();

// ---------- subscriptions ----------
export function subscribeScoreStore(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

// ---------- resets ----------
export function resetAllScores() {
    store = {};
    packs = {};
    currentPos = {};
    try {
        localStorage.removeItem(LS_KEY);
        localStorage.removeItem(LS_PACKS);
        localStorage.removeItem(LS_POS);
    } catch {}
    emit();
}

// ---------- pack wiring ----------
/**
 * Register the list of view IDs for a category.
 * Keeps order (for grey placeholders and finalization).
 */
export function registerPack(category, viewIds = []) {
    if (!category) return;
    const ids = (Array.isArray(viewIds) ? viewIds : []).map(String);
    packs[category] = { ids, len: ids.length };
    emit();
}

/**
 * Optionally track the current index (0-based) within the pack.
 */
export function setCurrentPosition(category, index) {
    if (!category || typeof index !== 'number') return;
    currentPos[category] = index;
    emit();
}

// ---------- scoring API ----------
/**
 * Persist a score for a view (0 | 0.5 | 1). Adds the view to "visited" order on first write.
 */
export function setViewScore(category, viewId, score) {
    if (!category || !viewId) return;
    if (!store[category]) {
        store[category] = { visited: {}, order: [], sum: 0 };
    }
    const bucket = store[category];
    const key = String(viewId);
    const next = Number(score) || 0;
    const prev = bucket.visited[key];

    if (prev == null) {
        bucket.order.push(key);
        bucket.visited[key] = next;
        bucket.sum += next;
    } else if (prev !== next) {
        bucket.sum -= prev;
        bucket.sum += next;
        bucket.visited[key] = next;
    }
    emit();
}

/**
 * Header progress:
 * - earned = sum of visited scores
 * - denom  = count of visited views (dynamic 0 → …)
 * - marks  = array of visited scores in visit order (0|0.5|1)
 */
export function getProgress(category) {
    const b = store[category] || { visited:{}, order:[], sum:0 };
    return {
        earned: b.sum || 0,
        denom: b.order.length,
        marks: b.order.map(id => b.visited[id]),
    };
}

/**
 * Aggregate sum constrained to the category's pack (for final category score on 0–#views scale).
 */
export function getCategoryAggregate(category, viewIds) {
    const b = store[category] || { visited:{}, order:[], sum:0 };
    const ids = Array.isArray(viewIds) ? viewIds.map(String) : (packs[category]?.ids || []);
    let sum = 0;
    for (const id of ids) {
        const v = b.visited[String(id)];
        if (v != null) sum += Number(v) || 0;
    }
    return { sum, visited: b.order.length };
}

/**
 * Finalization helper used by Sidebar:
 * Returns { finished, sum, total } where:
 *  - finished = true when ALL pack views have been visited at least once
 *  - sum      = sum of scores across the FULL pack
 *  - total    = #views in the pack
 */
export function getFinal(category) {
    const pack = packs[category];
    if (!pack) return { finished: false, sum: 0, total: 0 };
    const total = pack.len || 0;
    if (total === 0) return { finished: false, sum: 0, total: 0 };

    const agg = getCategoryAggregate(category, pack.ids);
    const visitedCount = (store[category]?.order?.length || 0);

    // "Finished" = user has visited all views in this pack (at least once)
    const finished = visitedCount >= total;

    return { finished, sum: agg.sum || 0, total };
}
