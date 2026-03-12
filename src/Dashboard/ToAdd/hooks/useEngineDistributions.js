import { useEffect, useState, useMemo } from "react";
import { api } from "../../../apiService";
import { applyRollups } from "./useCountsByCategory";

const DECAY = 0.75;

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

// Normalize pct (0–100) to fraction (0–1) so MB values match the static-layer
// scale (geometric4 curves top out at ~0.45). Weight is also divided by 100
// so the combined scale keeps gains in the ~0.01–0.50 range that Willy-mode
// thresholds (0.10 / 0.20 / 0.90) are calibrated for.
function buildSeries(pct) {
  const v = pct / 100;            // normalize to 0–1
  const len = Math.max(10, Math.ceil(v * 300));  // same proportional length
  const out = [];
  for (let i = 0; i < len; i++) {
    out.push(Math.round(v * Math.pow(DECAY, i) * 1000) / 1000);
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

function buildLayer({ personaName, layerId, field, weight, distribution }) {
  const buckets = {};
  for (const [bucketKey, pct] of Object.entries(distribution)) {
    if (pct <= 0) continue;
    buckets[bucketKey] = { bucket: buildSeries(pct) };
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
 * Each bucket's MB series uses exponential decay: v[i] = pct * 0.75^i
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
  enabled = true,
}) {
  const [dynamicLayers, setDynamicLayers] = useState([]);

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
      const { weights = {}, distributions = {} } = data;

      const layers = [];
      for (const [persona, layerId] of Object.entries(PERSONA_LAYER_IDS)) {
        const weight = Number(weights[persona] ?? 0);
        if (!weight) continue;

        const rawDist = distributions[persona] || {};
        // Apply same rollup logic as countsByCategory so bucket names match
        const dist = applyRollups(rawDist, rollups);

        // Bucket-level layer (weight 1×)
        const bucketLayer = buildLayer({ personaName: persona, layerId, field: groupBy, weight: weight / 100, distribution: dist });
        if (Object.keys(bucketLayer.buckets).length > 0) layers.push(bucketLayer);

        // Row-level layer (weight 2×): aggregates buckets belonging to same row
        const rowLayerId = PERSONA_ROW_LAYER_IDS[persona];
        const rowDist = buildRowDist(dist, rowDefs);
        const rowLayer = buildLayer({ personaName: `${persona} (rows)`, layerId: rowLayerId, field: "rowLabel", weight: (weight / 100) * 2, distribution: rowDist });
        if (Object.keys(rowLayer.buckets).length > 0) layers.push(rowLayer);
      }

      setDynamicLayers(layers);
    }).catch(err => {
      console.error("[useEngineDistributions]", err?.response?.data || err);
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, enabled]);

  return dynamicLayers;
}
