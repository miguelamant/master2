import { useEffect, useState, useMemo } from "react";
import { api } from "../../../apiService";
import { applyRollups } from "./useCountsByCategory";

const PERSONA_LAYER_IDS = {
  Belgian: 9001,
  French:  9002,
  German:  9003,
  Dutch:   9004,
};

// Row-aggregate layers — same personas, 2× weight, field = "rowLabel"
const PERSONA_ROW_LAYER_IDS = {
  Belgian: 9011,
  French:  9012,
  German:  9013,
  Dutch:   9014,
};

// Adaptive decay: at `idealCount` items, ~50% of total benefit captured.
// This ensures meaningful MB values remain at realistic depths and score
// discrimination between personas holds even for large menus (100–160 items).
function buildSeries(pct, totalMenuCount = 75) {
  const v = pct / 100;
  const idealCount = Math.max(1, Math.round(v * totalMenuCount));
  const decay = Math.min(0.97, Math.max(0.50, Math.pow(0.5, 1 / idealCount)));
  const len = Math.max(10, Math.ceil(idealCount * 4));
  const out = [];
  for (let i = 0; i < len; i++) {
    if (i < idealCount) {
      // Original geometric decay within the ideal range
      out.push(Math.round(v * Math.pow(decay, i) * 1000) / 1000);
    } else {
      // Rapid 10× collapse past idealCount: over-represented buckets become
      // near-free to remove, preventing them from "protecting" their excess items.
      const lastInIdeal = v * Math.pow(decay, idealCount - 1);
      const overshoot = i - idealCount + 1;
      out.push(Math.round(lastInIdeal * Math.pow(0.1, overshoot) * 1000) / 1000);
    }
  }
  return out;
}

/**
 * Collapse bucket-level distribution into row-level distribution.
 * Each rowDef has a title and an array of bucket keys. We sum their pcts.
 * Buckets not covered by any row become their own row (key = bucket key).
 */
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
  // Unassigned buckets become their own row
  for (const [b, pct] of Object.entries(dist)) {
    if (!covered.has(b) && pct > 0) rowDist[b] = pct;
  }
  return rowDist;
}

function buildLayer({ personaName, layerId, field, weight, distribution, totalMenuCount = 75 }) {
  const buckets = {};
  for (const [bucketKey, pct] of Object.entries(distribution)) {
    if (pct <= 0) continue;
    const idealCount = Math.round((pct / 100) * totalMenuCount);
    buckets[bucketKey] = { bucket: buildSeries(pct, totalMenuCount), idealCount };
  }
  return {
    layer_id: layerId,
    name: `${personaName} (dynamic)`,
    type: "1D",
    field,
    weight,
    buckets,
  };
}

/**
 * Fetches stereotype distribution percentages and builds dynamic engine layers.
 * One layer per persona (Belgian/French/German/Dutch), weighted by the bar's persona weights.
 * Each bucket's MB series uses adaptive exponential decay calibrated to totalMenuCount.
 */
export default function useEngineDistributions({
  assortmentId,
  groupBy,
  section,
  within = {},
  filters = {},
  predicates = [],
  rollups = [],
  rowDefs = [],
  totalMenuCount = 75,
  enabled = true,
}) {
  const [rawData, setRawData] = useState(null);

  const depsKey = useMemo(
    () => JSON.stringify({ assortmentId, groupBy, section, within, filters, predicates }),
    [assortmentId, groupBy, section, within, filters, predicates]
  );

  // Stage 1: fetch raw weights + distributions only when filters/section change
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
      setRawData(data);
    }).catch(err => {
      console.error("[useEngineDistributions]", err?.response?.data || err);
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, enabled]);

  // Stage 2: rebuild layer objects when rawData or totalMenuCount changes
  return useMemo(() => {
    if (!rawData) return [];
    const { weights = {}, distributions = {} } = rawData;

    const layers = [];
    for (const [persona, layerId] of Object.entries(PERSONA_LAYER_IDS)) {
      const weight = Number(weights[persona] ?? 0);
      if (!weight) continue;

      const rawDist = distributions[persona] || {};
      // Apply same rollup logic as countsByCategory so bucket names match
      const dist = applyRollups(rawDist, rollups);

      // Bucket-level layer (weight 1×)
      const bucketLayer = buildLayer({ personaName: persona, layerId, field: groupBy, weight: weight / 100, distribution: dist, totalMenuCount });
      if (Object.keys(bucketLayer.buckets).length > 0) layers.push(bucketLayer);

      // Row-level layer (weight 2×): aggregates buckets belonging to same row
      const rowLayerId = PERSONA_ROW_LAYER_IDS[persona];
      const rowDist = buildRowDist(dist, rowDefs);
      const rowLayer = buildLayer({ personaName: `${persona} (rows)`, layerId: rowLayerId, field: "rowLabel", weight: (weight / 100) * 2, distribution: rowDist, totalMenuCount });
      if (Object.keys(rowLayer.buckets).length > 0) layers.push(rowLayer);
    }

    return layers;
  }, [rawData, totalMenuCount, rollups, rowDefs, groupBy]);
}
