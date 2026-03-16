// src/Dashboard/ToAdd/ui/uiPrefs.js
// Lightweight global UI state with subscription.

let state = {
    // 0 = easy, 1 = medium, 2 = hard
    willyMode: Number(localStorage.getItem('willyMode') ?? 0) % 3,
    willyEnabled: (localStorage.getItem('willyEnabled') ?? '1') === '1',
};

const subs = new Set();

function emit() {
    for (const fn of subs) fn({ ...state });
}

export function subscribeUIPrefs(fn) {
    subs.add(fn);
    // emit current on subscribe
    try { fn({ ...state }); } catch {}
    return () => subs.delete(fn);
}

export function getWillyMode() {
    return state.willyMode;
}

export function setWillyMode(v) {
    const n = Math.max(0, Math.min(2, Number(v) || 0)); // clamp 0..2
    state = { ...state, willyMode: n };
    try { localStorage.setItem('willyMode', String(n)); } catch {}
    emit();
}

export function getWillyEnabled() {
    return state.willyEnabled;
}

export function setWillyEnabled(v) {
    state = { ...state, willyEnabled: !!v };
    try { localStorage.setItem('willyEnabled', v ? '1' : '0'); } catch {}
    emit();
}

// handy helpers
export function nextWillyMode() {
    setWillyMode((getWillyMode() + 1) % 3);
}
export function prevWillyMode() {
    setWillyMode((getWillyMode() + 2) % 3);
}
