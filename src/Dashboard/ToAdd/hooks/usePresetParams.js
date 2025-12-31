import React from 'react';
import { serializeKey } from '../../../apiService';

export function usePresetParams(currentPreset, effectiveSection) {
    const groupBy = React.useMemo(() => currentPreset?.groupBy ?? 'subcategory', [currentPreset]);
    const apiFilters = React.useMemo(() => currentPreset?.filters ?? {}, [currentPreset]);
    const presetPredicates = React.useMemo(() => currentPreset?.predicates ?? [], [currentPreset]);

    const within = React.useMemo(() => {
        if (currentPreset?.within?.subcategory_in) {
            return { subcategory_in: currentPreset.within.subcategory_in.map(t => t.toUpperCase()) };
        }
        return currentPreset?.within ?? {};
    }, [currentPreset]);

    const filterKey = React.useMemo(
        () => serializeKey({ groupBy, apiFilters, within, presetPredicates, section: effectiveSection }),
        [groupBy, apiFilters, within, presetPredicates, effectiveSection]
    );

    const partitionPredicateMap = React.useMemo(() => {
        const arr = currentPreset?.partitionBy || [];
        const m = new Map();
        for (const p of arr) {
            const label = String(p.label || '').trim().toLowerCase();
            m.set(label, Array.isArray(p.predicates) ? p.predicates : []);
        }
        return m;
    }, [currentPreset?.id]);

    const partitionBy  = React.useMemo(() => currentPreset?.partitionBy ?? [], [currentPreset?.id]);
    const forceShow    = React.useMemo(() => currentPreset?.forceShow   ?? [], [currentPreset?.id]);

    return {
        groupBy, apiFilters, presetPredicates, within, filterKey,
        partitionPredicateMap, partitionBy, forceShow
    };
}