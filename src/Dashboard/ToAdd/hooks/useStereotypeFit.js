import { useEffect, useState, useMemo } from "react";
import { api } from "../../../apiService";
import { applyRollups } from "./useCountsByCategory";

const PERSONAS = ["Belgian", "French", "German", "Dutch"];

// Copied from useEngineDistributions — pure functions, no shared state
function buildSeries(pct, totalMenuCount = 75) {
  const v = pct / 100;
  const idealCount = Math.max(1, v * totalMenuCount);
  const decay = Math.min(0.97, Math.max(0.50, Math.pow(0.5, 1 / idealCount)));
  const len = Math.max(10, Math.ceil(idealCount * 4));
  const out = [];
  for (let i = 0; i < len; i++) {
    out.push(Math.round(v * Math.pow(decay, i) * 1000) / 1000);
  }
  return out;
}

function buildRowDist(dist, rowDefs) {
  const covered = new Set();
  const rowDist = {};
  for (const row of (rowDefs || [])) {
    const label = row.title;
    if (!label) continue;
    const pct = (row.buckets || []).reduce((s, b) => s + (dist[b] || 0), 0);
    if (pct > 0) rowDist[label] = pct;
    for (const b of (row.buckets || [])) covered.add(b);
  }
  for (const [b, pct] of Object.entries(dist)) {
    if (!covered.has(b) && pct > 0) rowDist[b] = pct;
  }
  return rowDist;
}

function accumulatedBenefit(series, depth) {
  let s = 0;
  const lim = Math.min(depth, series.length);
  for (let i = 0; i < lim; i++) s += series[i];
  return s;
}

/**
 * Pure scoring function — usable without the hook (e.g. for delta computation).
 * rawDist: { [persona]: { [bucketKey]: pct } }  (un-rolled)
 */
export function computePersonaScores({ rawDist, rollups = [], rowDefs = [], countsByCategory = {}, totalMenuCount = 75 }) {
  if (!rawDist) return {};
  const rowDepths = {};
  for (const row of (rowDefs || [])) {
    const label = row.title;
    if (!label) continue;
    rowDepths[label] = (row.buckets || []).reduce(
      (s, b) => s + Number(countsByCategory?.[b] || 0), 0
    );
  }
  const scores = {};
  for (const persona of PERSONAS) {
    const dist = applyRollups(rawDist[persona] || {}, rollups);
    const rowDist = buildRowDist(dist, rowDefs);
    let actual = 0, max = 0;
    for (const [bucketKey, pct] of Object.entries(dist)) {
      if (pct <= 0) continue;
      const series = buildSeries(pct, totalMenuCount);
      const idealCount = Math.max(1, Math.round((pct / 100) * totalMenuCount));
      const depth = Number(countsByCategory?.[bucketKey] || 0);
      actual += accumulatedBenefit(series, Math.min(depth, idealCount));
      max    += accumulatedBenefit(series, idealCount);
    }
    for (const [rowLabel, pct] of Object.entries(rowDist)) {
      if (pct <= 0) continue;
      const series = buildSeries(pct, totalMenuCount);
      const idealCount = Math.max(1, Math.round((pct / 100) * totalMenuCount));
      const depth = rowDepths[rowLabel] ?? Number(countsByCategory?.[rowLabel] || 0);
      actual += 2 * accumulatedBenefit(series, Math.min(depth, idealCount));
      max    += 2 * accumulatedBenefit(series, idealCount);
    }
    scores[persona] = max > 0 ? Math.round((actual / max) * 100) / 10 : 0.0;
  }
  return scores;
}

/**
 * Self-contained stereotype fit hook.
 * Fetches distributions independently (no onboarding weights bleed-in).
 * Always computes scores for all 4 personas regardless of bar configuration.
 * Returns { scores: { Belgian, French, German, Dutch }, rawDist }.
 */
export function useStereotypeFit({
  assortmentId,
  groupBy,
  section,
  within = {},
  filters = {},
  predicates = [],
  rollups = [],
  rowDefs = [],
  countsByCategory = {},
  totalMenuCount = 75,
  enabled = true,
}) {
  const [rawDist, setRawDist] = useState(null);

  const depsKey = useMemo(
    () => JSON.stringify({ assortmentId, groupBy, section, within, filters, predicates }),
    [assortmentId, groupBy, section, within, filters, predicates]
  );

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    api.post("/api/engine-distributions", {
      assortmentId,
      groupBy,
      section,
      within,
      filters,
      predicates,
    }).then(({ data }) => {
      if (!alive) return;
      setRawDist(data?.distributions ?? null);
    }).catch(err => {
      console.error("[useStereotypeFit]", err?.response?.data || err);
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, enabled]);

  const scores = useMemo(
    () => computePersonaScores({ rawDist, rollups, rowDefs, countsByCategory, totalMenuCount }),
    [rawDist, rollups, rowDefs, countsByCategory, totalMenuCount]
  );

  return { scores, rawDist };
}
