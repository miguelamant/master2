import { useEffect, useState, useMemo } from "react";
import { api } from "../../../apiService";
import { applyRollups } from "./useCountsByCategory";

const DEFAULT_STEREOTYPES = ["Belgian", "French", "German", "Dutch"];

/**
 * Fetches stereotype benchmark values for the current filter view.
 *
 * When `partitionBy` is provided, one benchmark request is made per partition
 * and results are merged into composite keys ("LAGERS · With alcohol") to
 * match the partitioned counts produced by fetchPartitionedMenuCounts.
 */
export default function useStereotypeBenchmarks({
  assortmentId,
  groupBy,
  section,
  within = {},
  filters = {},
  predicates = [],
  stereotypes = DEFAULT_STEREOTYPES,
  rollups = [],
  partitionBy = null,
  enabled = true,
}) {
  const [result, setResult] = useState({ benchmarks: {}, currentTotal: 0, personaWeights: {} });

  const depsKey = useMemo(
    () => JSON.stringify({ assortmentId, groupBy, section, within, filters, predicates, stereotypes, rollups, partitionBy }),
    [assortmentId, groupBy, section, within, filters, predicates, stereotypes, rollups, partitionBy]
  );

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    const isCiderKey = (k) => /^CIDER/i.test(k) || /· CIDER/i.test(k);

    const postProcess = (rawBenchmarks) => {
      return Object.fromEntries(
        Object.entries(rawBenchmarks).map(([name, byBucket]) => {
          const rolled = applyRollups(byBucket, rollups);
          const filtered = Object.fromEntries(
            Object.entries(rolled).filter(([k]) => !isCiderKey(k))
          );
          return [name, filtered];
        })
      );
    };

    const partitions = Array.isArray(partitionBy) && partitionBy.length > 0
      ? partitionBy
      : null;

    if (!partitions) {
      // ── No partitions — single request (original path) ──
      api.post("/api/stereotype-benchmarks", {
        assortmentId, groupBy, section, within, filters, predicates, stereotypes,
      }).then(({ data }) => {
        if (!alive) return;
        setResult({
          benchmarks: postProcess(data.benchmarks || {}),
          currentTotal: data.currentTotal || 0,
          personaWeights: data.personaWeights || {},
        });
      }).catch(err => {
        console.error("[useStereotypeBenchmarks]", err?.response?.data || err);
      });
    } else {
      // ── Partitioned — one request per partition, merge with composite keys ──
      const requests = partitions.map((p) => {
        const label = String(p.label ?? "").trim();
        const partPreds = Array.isArray(p.predicates) ? p.predicates : [];
        const mergedPreds = [...(predicates || []), ...partPreds];

        return api.post("/api/stereotype-benchmarks", {
          assortmentId, groupBy, section, within, filters,
          predicates: mergedPreds,
          stereotypes,
        }).then(({ data }) => ({ label, data }));
      });

      Promise.all(requests).then((responses) => {
        if (!alive) return;

        // Merge benchmarks across partitions
        const mergedBenchmarks = {};
        let totalCurrentTotal = 0;
        let personaWeights = {};

        for (const { label, data } of responses) {
          totalCurrentTotal += data.currentTotal || 0;
          if (data.personaWeights) personaWeights = data.personaWeights;

          const rawBenchmarks = data.benchmarks || {};
          for (const [stereotype, byBucket] of Object.entries(rawBenchmarks)) {
            if (!mergedBenchmarks[stereotype]) mergedBenchmarks[stereotype] = {};
            for (const [bucket, value] of Object.entries(byBucket)) {
              const compositeKey = `${bucket} · ${label}`;
              mergedBenchmarks[stereotype][compositeKey] = value;
            }
          }
        }

        setResult({
          benchmarks: postProcess(mergedBenchmarks),
          currentTotal: totalCurrentTotal,
          personaWeights,
        });
      }).catch(err => {
        console.error("[useStereotypeBenchmarks]", err?.response?.data || err);
      });
    }

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, enabled]);

  return result;
}
