import { useEffect, useState, useMemo } from "react";
import { api } from "../../../apiService";
import { applyRollups } from "./useCountsByCategory";

const DEFAULT_STEREOTYPES = ["Belgian", "French", "German", "Dutch"];

/**
 * Fetches stereotype benchmark values for the current filter view.
 *
 * Returns:
 *   { benchmarks: { Belgian: { IPA: 2.3, LAGER: 5.1 }, ... }, currentTotal: N }
 *
 * Each value = what the count for that bucket WOULD be if this assortment
 * had the same distribution as the stereotype's child assortments.
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
  enabled = true,
}) {
  const [result, setResult] = useState({ benchmarks: {}, currentTotal: 0, personaWeights: {} });

  const depsKey = useMemo(
    () => JSON.stringify({ assortmentId, groupBy, section, within, filters, predicates, stereotypes, rollups }),
    [assortmentId, groupBy, section, within, filters, predicates, stereotypes, rollups]
  );

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    api.post("/api/stereotype-benchmarks", {
      assortmentId,
      groupBy,
      section,
      within,
      filters,
      predicates,
      stereotypes,
    }).then(({ data }) => {
      if (!alive) return;
      const rawBenchmarks = data.benchmarks || {};
      // Apply the same rollup logic as countsByCategory so bucket names match
      const rolledBenchmarks = Object.fromEntries(
        Object.entries(rawBenchmarks).map(([name, byBucket]) => [
          name,
          applyRollups(byBucket, rollups),
        ])
      );
      setResult({ benchmarks: rolledBenchmarks, currentTotal: data.currentTotal || 0, personaWeights: data.personaWeights || {} });
    }).catch(err => {
      console.error("[useStereotypeBenchmarks]", err?.response?.data || err);
    });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, enabled]);

  return result;
}
