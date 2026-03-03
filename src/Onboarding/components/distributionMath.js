export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function totalOf(obj, keys) {
  return keys.reduce((sum, k) => sum + (Number(obj?.[k]) || 0), 0);
}

export function setValueKeep100(prev, keys, key, nextValue) {
  const next = { ...prev };
  const old = Number(next[key] || 0);
  let v = clamp(Math.round(nextValue), 0, 100);
  if (v === old) return next;

  const others = keys.filter((k) => k !== key);
  next[key] = v;

  const sumNow = totalOf(next, keys);
  let diff = sumNow - 100;

  if (diff > 0) {
    const sorted = [...others].sort((a, b) => (next[b] || 0) - (next[a] || 0));
    for (const k of sorted) {
      if (diff <= 0) break;
      const canTake = Math.min(next[k] || 0, diff);
      next[k] = (next[k] || 0) - canTake;
      diff -= canTake;
    }
    if (diff > 0) next[key] = Math.max(0, (next[key] || 0) - diff);
  } else if (diff < 0) {
    const sorted = [...others].sort((a, b) => (next[b] || 0) - (next[a] || 0));
    const recipient = sorted[0];
    next[recipient] = (next[recipient] || 0) + (-diff);
  }

  const finalSum = totalOf(next, keys);
  if (finalSum !== 100) {
    const sorted = [...keys].sort((a, b) => (next[b] || 0) - (next[a] || 0));
    const k = sorted[0];
    next[k] = (next[k] || 0) + (100 - finalSum);
  }

  for (const k of keys) next[k] = Math.max(0, Math.round(next[k] || 0));

  const s = totalOf(next, keys);
  if (s !== 100) {
    const k = keys[keys.length - 1];
    next[k] = Math.max(0, (next[k] || 0) + (100 - s));
  }

  return next;
}

export function calcBoundaries(values, keys) {
  const b = [];
  let cum = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    cum += Number(values?.[keys[i]] || 0);
    b.push(cum);
  }
  return b;
}

export function calcCenters(values, keys) {
  const out = [];
  let cum = 0;
  for (const k of keys) {
    const w = Number(values?.[k] || 0);
    const center = cum + w / 2;
    out.push({ key: k, center, w });
    cum += w;
  }
  return out;
}

export function loadTarget(storageKey, fallbackTarget, keys) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...fallbackTarget };
    const parsed = JSON.parse(raw);
    const merged = { ...fallbackTarget };
    for (const k of keys) {
      const v = Number(parsed?.[k]);
      if (Number.isFinite(v)) merged[k] = clamp(Math.round(v), 0, 100);
    }
    if (totalOf(merged, keys) !== 100) return { ...fallbackTarget };
    return merged;
  } catch {
    return { ...fallbackTarget };
  }
}