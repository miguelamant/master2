import { useMemo } from "react";

const BUCKET_LAYER_IDS = { Belgian: 9001, French: 9002, German: 9003, Dutch: 9004 };
const ROW_LAYER_IDS    = { Belgian: 9011, French: 9012, German: 9013, Dutch: 9014 };
const PERSONAS = ["Belgian", "French", "German", "Dutch"];

function accumulatedBenefit(series, depth) {
  let s = 0;
  const lim = Math.min(depth, series.length);
  for (let i = 0; i < lim; i++) s += series[i];
  return s;
}

function totalBenefit(series) {
  return series.reduce((s, v) => s + v, 0);
}

/**
 * Computes 0–100 persona fit scores given the dynamic layers and current counts.
 *
 * Score for one persona =
 *   (accumulated bucket-level benefit + 2 × accumulated row-level benefit)
 *   ─────────────────────────────────────────────────────────────────────────
 *   (max bucket-level benefit + 2 × max row-level benefit)
 *
 * @param {object[]} dynamicLayers - layers from useEngineDistributions (9001–9004 + 9011–9014)
 * @param {object}   countsByCategory - { [bucketKey]: count }
 * @param {object[]} rowDefs - from currentPreset.ui.aggregateRows.rows: [{ title, buckets[] }]
 */
export function usePersonaFit({ dynamicLayers, countsByCategory, rowDefs }) {
  // Pre-compute row depths once: rowLabel → sum of counts for all buckets in that row
  const rowDepths = useMemo(() => {
    const m = {};
    for (const row of (rowDefs || [])) {
      const label = row.title;
      if (!label) continue;
      m[label] = (row.buckets || []).reduce(
        (s, b) => s + Number(countsByCategory?.[b] || 0), 0
      );
    }
    return m;
  }, [rowDefs, countsByCategory]);

  return useMemo(() => {
    if (!Array.isArray(dynamicLayers) || !dynamicLayers.length) return {};

    const scores = {};

    for (const persona of PERSONAS) {
      const bucketLayer = dynamicLayers.find(L => L.layer_id === BUCKET_LAYER_IDS[persona]);
      const rowLayer    = dynamicLayers.find(L => L.layer_id === ROW_LAYER_IDS[persona]);

      let actual = 0;
      let max    = 0;

      // --- bucket-level (weight factor 1) ---
      for (const [key, rec] of Object.entries(bucketLayer?.buckets || {})) {
        const series = Array.isArray(rec?.bucket) ? rec.bucket : [];
        const depth  = Number(countsByCategory?.[key] || 0);
        actual += accumulatedBenefit(series, depth);
        max    += totalBenefit(series);
      }

      // --- row-level (weight factor 2) ---
      for (const [rowLabel, rec] of Object.entries(rowLayer?.buckets || {})) {
        const series = Array.isArray(rec?.bucket) ? rec.bucket : [];
        const depth  = rowDepths[rowLabel] ?? Number(countsByCategory?.[rowLabel] || 0);
        actual += 2 * accumulatedBenefit(series, depth);
        max    += 2 * totalBenefit(series);
      }

      scores[persona] = max > 0 ? Math.round((actual / max) * 100) : 0;
    }

    return scores;
  }, [dynamicLayers, countsByCategory, rowDepths]);
}
