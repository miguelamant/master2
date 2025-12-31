import React from 'react';
import { PRESET_FILTERS_BEERS } from '../presetBeers';
import { PRESET_FILTERS_REFRESHMENTS } from '../presetRefreshments';
import { registerPack, setCurrentPosition } from '../ui/scoreStore';

const normalizeCategory = (s) => {
    const t = String(s || '').toLowerCase();
    if (['beer','beers','bier'].includes(t)) return 'beers';
    return 'refreshments';
};

export function usePresetNavigation(section = 'beers') {
    const activeCategory = React.useMemo(() => normalizeCategory(section), [section]);

    const PRESET_PACK = React.useMemo(
        () => (activeCategory === 'beers' ? (PRESET_FILTERS_BEERS || []) : (PRESET_FILTERS_REFRESHMENTS || [])),
        [activeCategory]
    );

    const [presetIndex, setPresetIndex] = React.useState(0);
    const PACK_LEN = PRESET_PACK?.length ?? 0;

    // 1) register the full list of view IDs for this category (lets header know "total")
    React.useEffect(() => {
        const ids = (PRESET_PACK || []).map(p => String(p.id));
        registerPack(activeCategory, ids);
    }, [activeCategory, PRESET_PACK]);

    // 2) clamp index when pack changes
    React.useEffect(() => {
        if (!PACK_LEN) { setPresetIndex(0); return; }
        setPresetIndex(i => (i >= 0 && i < PACK_LEN ? i : 0));
    }, [PACK_LEN]);

    // 3) reset to first view when category flips
    React.useEffect(() => { setPresetIndex(0); }, [activeCategory]);

    // 4) write current position so getProgress() can produce marks length
    React.useEffect(() => {
        setCurrentPosition(activeCategory, presetIndex);
    }, [activeCategory, presetIndex]);

    const currentPreset = React.useMemo(
        () => (PACK_LEN ? (PRESET_PACK[presetIndex] || {}) : {}),
        [PRESET_PACK, PACK_LEN, presetIndex]
    );

    const prevPreset = React.useCallback(
        () => setPresetIndex(i => (PACK_LEN ? (i + PACK_LEN - 1) % PACK_LEN : 0)),
        [PACK_LEN]
    );
    const nextPreset = React.useCallback(
        () => setPresetIndex(i => (PACK_LEN ? (i + 1) % PACK_LEN : 0)),
        [PACK_LEN]
    );

    const personaInfo = React.useMemo(() => {
        const info = currentPreset?.info || {};
        const categoryTitle = activeCategory === 'refreshments' ? 'Refreshments' : 'Beers';
        return {
            title: info.title || (currentPreset?.name || categoryTitle),
            image: info.image || null,
            line1: info.line1 || (activeCategory === 'refreshments'
                ? 'Balance your soft drinks: more Zero, right mix of flavors.'
                : 'Balance your beers: right mix by style and ABV.'),
            line2: info.line2 || (activeCategory === 'refreshments'
                ? 'Tip: start by fixing Zero vs With sugar, then sub-flavors.'
                : 'Tip: start with styles, then refine by ABV/format.'),
        };
    }, [currentPreset, activeCategory]);

    const effectiveSection = activeCategory;

    return {
        activeCategory,
        currentPreset,
        presetIndex,
        setPresetIndex,
        effectiveSection,
        prevPreset,
        nextPreset,
        personaInfo,
        PACK_LEN
    };
}
