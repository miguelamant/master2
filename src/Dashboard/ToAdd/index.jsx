// src/Dashboard/ToAdd/ToReprice.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';

import { api } from "apiService";

import { menuCounts, menuItems, serializeKey } from '../../apiService';
import Optionbar from '../Optionbar';

import '../TopWorstSellers.css';
import './ToAdd.css';

import { PRESET_FILTERS_REFRESHMENTS } from './presetRefreshments';
import { PRESET_FILTERS_BEERS } from './presetBeers';
import { suggestMissingKeys } from './paramsStore';

import AddToMenuModal from './components/AddToMenuModal';

 import ItemsList from './components/memo/ItemsListMemo';
 import SummaryGrid from './components/memo/SummaryGridMemo';

 import KPIHeader from './components/KPIHeader';
 import { usePresetNavigation } from './hooks/usePresetNavigation';
 import { usePresetParams } from './hooks/usePresetParams';
 import { useCountsByCategory } from './hooks/useCountsByCategory';
 import { useLayersView } from './hooks/useLayersView';
 import { useRecommendations } from './hooks/useRecommendations';

import { setViewScore, initScoreStore, getFinal } from './ui/scoreStore';
import { useAssortment } from '../../context/AssortmentContext';




import PRESET_PARAMS from './preset-params.json';
import { getPresetId } from './utils/presetId.js';
import { buildRecommendations, toKey } from './utils/allocations.js';

import { fetchPartitionedMenuCounts } from "./utils/fetchPartitionedMenuCounts";
import PresetInfo from './components/PresetInfo';
import { getWillyMode, setWillyMode, getWillyEnabled, subscribeUIPrefs } from './ui/uiPrefs';

import { convertBaseLabel } from './utils/labelMap';
import { fetchMergedLayers } from './engine/mergedLayersClient';
import useHoverLists from "./hooks/useHoverLists";
import useStereotypeBenchmarks from "./hooks/useStereotypeBenchmarks";
import useEngineDistributions from "./hooks/useEngineDistributions";
import { useStereotypeFit, computePersonaScores } from "./hooks/useStereotypeFit";



//import { getAllowlistForPreset } from './layersForPreset';



// arrows
import arrowLeft  from '../Icons/left-arrow.svg';
import arrowRight from '../Icons/right-arrow.svg';
import checkGreen from '../Icons/check_green.svg';
import checkOrange from '../Icons/check_orange.svg';
import cross from '../Icons/not_check.svg';


import chillyWilly from '../../Images/presets/chilly-willy.png';
import sternWilly  from '../../Images/presets/stern-willy.png';
import sleepyWilly  from '../../Images/presets/sleepy-willy.png';

import SuggestedChanges from './components/SuggestedChanges';

// FIX

import { buildSequentialPlan } from './engine/sequential';
import { findBestPairs } from './engine/pairSearch';
import { buildLayersForView, buildInitialLayerCounts } from './engine/layersLoader';
import { getAllowlistForPreset, getCategoryForPreset } from './layersForPreset';
import { buildLayersFromJsonFiltered } from './engine/buildLayersFromJsonFiltered.js';

// add this
import { buildPerLayerCounts } from './engine/counts';

import { buildPlanToThreshold } from './engine/sequential';
import { aggregatePlan } from './engine/aggregatePlan';
import PlanSummary from './components/PlanSummary';


import { normToken } from './utils/normalize';
import { iconFor } from './utils/iconLoader';
import RemoveFromMenuModal from "./components/RemoveFromMenuModal"; // still used to build tasteOptions icons
import StereotypeSatisfactionPanel from './components/StereotypeSatisfactionPanel';
import SuggestedSwapPanel from './components/SuggestedSwapPanel';

// ---------- helpers ----------
const DISPLAY_LABELS = {};
const makeCategoryLabeler = () => (dbCat) => convertBaseLabel(dbCat);
const idealCounts = {};

// ---- helpers (keep as-is) ----

const normalizeHeritage = (v) => {
  const t = String(v ?? '').trim().toLowerCase();
  if (t === 'abbey' || t === 'trappist') return t;
  // treat everything else ("/", "na", "unknown", "", null) as normal
  return 'normal';
};


// ---- helpers ----
const to01 = (v) => {
  if (v === 1 || v === '1' || v === true || (typeof v === 'string' && v.toLowerCase() === 'true')) return 1;
  return 0;
};



// ---- helpers (keep these near the top) ----
const normalizeCategory = (s) => {
  const t = String(s || '').toLowerCase();
  if (['sodas','refreshments','softs','soft-drinks','softdrinks','nonalcoholic'].includes(t)) return 'refreshments';
  if (['beer','beers','bier'].includes(t)) return 'beers';
  return 'refreshments';
};


  export default function ToAdd({ section = 'beers', onGoBack, onViewMenu, assortmentScores = {}, onScoreUpdate }) {
      const { activeAssortmentId, assortments } = useAssortment() || {};

      const {
         activeCategory, currentPreset, presetIndex, setPresetIndex, effectiveSection,
             prevPreset, nextPreset, personaInfo, PACK_LEN
       } = usePresetNavigation(section);

  // Initialize score store scoped to the active assortment
  React.useEffect(() => {
    if (activeAssortmentId != null) initScoreStore(activeAssortmentId);
  }, [activeAssortmentId]);

  // 5) Also reset index whenever the *category* flips (Sidebar click)
  React.useEffect(() => {
    console.log('[TOADD] activeCategory changed →', activeCategory, 'reset presetIndex to 0');
    setPresetIndex(0);
  }, [activeCategory]);

  // 6) Current preset from the current pack



   const {
      groupBy, apiFilters, presetPredicates, within, filterKey,
          partitionPredicateMap, partitionBy, forceShow
     } = usePresetParams(currentPreset, effectiveSection);
  // 🔎 DEBUG so you can see what’s going on
  React.useEffect(() => {
    console.log('[TOADD] sidebar section =', section);
    console.log('[TOADD] activeCategory  =', activeCategory);
    console.log('[TOADD] PACK_LEN        =', PACK_LEN);
    console.log('[TOADD] presetIndex     =', presetIndex);
    console.log('[TOADD] currentPreset   =', {
      id: currentPreset?.id,
      name: currentPreset?.name,
      section: currentPreset?.section,
      groupBy: currentPreset?.groupBy,
    });
    console.log('[TOADD] effectiveSection (API) =', effectiveSection);
  }, [section, activeCategory, PACK_LEN, presetIndex, currentPreset, effectiveSection]);



  const GEO_ONLY = ['Belgian', 'French', 'German', 'Dutch'];

  const { benchmarks: stereotypeBenchmarks, personaWeights } = useStereotypeBenchmarks({
    assortmentId: activeAssortmentId,
    groupBy,
    section: effectiveSection,
    within,
    filters: apiFilters,
    predicates: presetPredicates,
    stereotypes: GEO_ONLY,
    rollups: currentPreset?.rollups ?? [],
    partitionBy: partitionBy?.length ? partitionBy : null,
    enabled: true,
  });

  const rowDefs = currentPreset?.ui?.aggregateRows?.rows ?? [];

  const [sortOrder] = useState('top');
 // const [setItems] = useState([]);
  const [businessCity, setBusinessCity] = useState('');
  const [businessCountry, setBusinessCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [itemsNotOnMenu, setItemsNotOnMenu] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState(null);

    // modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalPrice, setModalPrice] = useState('');

  const [toAddMode, setToAddMode] = useState(true);     // controls ItemsList switch
  const [onMenuItems, setOnMenuItems] = useState([]);   // raw items currently on menu
  const [layersOverride, setLayersOverride] = useState(null);

  // show/hide price bars
  const [showPriceBars, setShowPriceBars] = useState(false);          // local only
  const [willyMode, setWillyModeLocal] = useState(getWillyMode());   // mirrors global
  const [willyEnabled, setWillyEnabledLocal] = useState(getWillyEnabled());

  const itemsSectionRef = React.useRef(null);
  const skipTasteResetRef = React.useRef(false);

  const presetInfo = currentPreset?.info ?? {};
  const effectiveWillyOn = willyEnabled && !(currentPreset?.willyOff === true);









  const [searchTerm, setSearchTerm] = useState('');

    const { hoverLists, hoverCat, setHoverCat, loadHoverList, makeKey } = useHoverLists({
      groupBy,
      filterKey,
      apiFilters,
      predicates: presetPredicates,
      within,
      section: effectiveSection,
      assortmentId: activeAssortmentId,
    });





    // dynamic taste options for the Optionbar (driven by summary)
  const [mergedLayers, setMergedLayers] = useState(null);








  // —— UI filters (Optionbar) ——
  const [filters, setFilters] = useState({
    tastes: new Set(),
    sugar: { zero_sugar: true, with_sugar: true },
    sparkling: { sparkling: true, not_sparkling: true },
    heritage: new Set(['abbey', 'trappist', 'normal','modern']),
  });

    const [addItem, setAddItem] = useState(null);
    const [removeItem, setRemoveItem] = useState(null);

    const activeLayerIds = React.useMemo(() => {
    const pid = String(getPresetId(currentPreset));
    const ids = getAllowlistForPreset(pid);
    return ids.length ? ids : [1001];
  }, [currentPreset]);


// ---- build hoverOverrides for rollups (so rollup rows can hover) ----
    const hoverOverrides = React.useMemo(() => {
      const preset = currentPreset || {};
      const rollups = Array.isArray(preset.rollups) ? preset.rollups : [];
      const partBy = Array.isArray(preset.partitionBy) ? preset.partitionBy : [];

      // map partition label -> predicate (e.g. "Zero" -> is_zero eq 1)
      const partLabelToPred = new Map(
          partBy
              .filter(
                  (p) =>
                      p &&
                      p.field &&
                      (p.value === 0 || p.value === 1 || p.value === "0" || p.value === "1")
              )
              .map((p) => [
                String(p.label || "").toLowerCase(),
                { field: p.field, op: "eq", value: Number(p.value) },
              ])
      );

      const normalizePreds = (arr) =>
          (Array.isArray(arr) ? arr : [])
              .filter(Boolean)
              .map((p) => ({
                ...p,
                op: p.op ? String(p.op).toLowerCase() : "eq",
              }));

      const out = {};

      for (const r of rollups) {
        const into = String(r?.into || "").trim();
        if (!into) continue;

        const m = r.match || {};
        const preds = [];

        // baseIn/baseNotIn apply to the preset groupBy (usually subsubcategory)
        if (Array.isArray(m.baseIn) && m.baseIn.length) {
          preds.push({
            field: preset.groupBy || "subsubcategory",
            op: "in",
            value: m.baseIn,
          });
        }
        if (Array.isArray(m.baseNotIn) && m.baseNotIn.length) {
          preds.push({
            field: preset.groupBy || "subsubcategory",
            op: "nin",
            value: m.baseNotIn,
          });
        }

        // partition label -> predicate (optional)
        if (m.partitionLabel) {
          const p = partLabelToPred.get(String(m.partitionLabel).toLowerCase());
          if (p) preds.push(p);
        }

        // ✅ NEW: rollup-level predicates (Option B2)
        // Supports both `r.predicates` (recommended) and `match.predicates` (back-compat)
        preds.push(...normalizePreds(r.predicates));
        preds.push(...normalizePreds(m.predicates));

        out[into] = {
          value: into,
          groupBy: preset.groupBy || "subsubcategory",
          within: r.within || {},      // allow rollup-specific within if you want
          predicates: preds,
          noGroupFilter: true,         // ✅ critical for rollups (virtual labels)
        };
      }

      return out;
    }, [currentPreset]);


    const inActiveSection = (it) => {
      const catTok = it._category_token || normToken(it.category_name || it.category);
      if (activeCategory === 'beers') return catTok === 'BEERS';
      if (activeCategory === 'refreshments') return catTok === 'REFRESHMENTS';
      if (activeCategory === 'deep_fried_snacks') return catTok === 'DEEP_FRIED_SNACKS';
      return true;
    };

    const normalizeForFilters = (it) => ({
      ...it,
      heritage: normalizeHeritage(it.heritage),
    });

    // —— bottom list filtering (client-side) ——
    const passesFilters = (item) => {
      // ✅ local search only for 0–1 chars (because backend search only kicks in at >=2)
      // robust search: matches "tripel" against "WESTMALLE_TRIPEL", etc.
      const needle = normToken(searchTerm);
      if (needle) {
        const hay1 = normToken(item.name);
        const hay2 = normToken(item.item_name);
        if (!hay1.includes(needle) && !hay2.includes(needle)) return false;
      }


      // taste (based on current groupBy)
      let tasteId = null;
      const catToken  = item._category_token    || normToken(item.category_name || item.category);
      const subToken  = item._subcat_token      || normToken(item.subcat_name || item.subcategory);
      const ssubToken = item._subsubcat_token   || normToken(item.subsubcat_name || item.subsubcategory);

      if (groupBy === "category") tasteId = catToken;
      else if (groupBy === "subcategory") tasteId = subToken;
      else if (groupBy === "subsubcategory") tasteId = ssubToken;

      if (filters.tastes.size && tasteId && !filters.tastes.has(tasteId)) return false;

      // sugar
      const sugar = filters.sugar || { zero_sugar: true, with_sugar: true };
      const sugarNoRestr =
          (!sugar.zero_sugar && !sugar.with_sugar) ||
          (sugar.zero_sugar && sugar.with_sugar);

      const isZero = Number(item.is_zero ?? 0) === 1;
      if (!sugarNoRestr) {
        if (isZero && !sugar.zero_sugar) return false;
        if (!isZero && !sugar.with_sugar) return false;
      }

      // sparkling
      const sprk = filters.sparkling || { sparkling: true, not_sparkling: true };
      const sprkNoRestr =
          (!sprk.sparkling && !sprk.not_sparkling) ||
          (sprk.sparkling && sprk.not_sparkling);

      const isSpark = Number(item.is_sparkling ?? 0) === 1;
      if (!sprkNoRestr) {
        if (isSpark && !sprk.sparkling) return false;
        if (!isSpark && !sprk.not_sparkling) return false;
      }

      // functional
      const functional = filters.functional || {
        protein: true,
        prebiotic: true,
        magnesium: true,
        vitamin: true,
        collagen: true,
      };

      const funcNoRestr =
          Object.values(functional).every((v) => v === true) ||
          Object.values(functional).every((v) => v === false);

      if (!funcNoRestr) {
        const isProtein   = Number(item.is_protein ?? 0) === 1;
        const isPrebiotic = Number(item.is_prebiotic ?? 0) === 1;
        const isMagnesium = Number(item.is_magnesium ?? 0) === 1;
        const isVitamin   = Number(item.is_vitamin ?? 0) === 1;
        const isCollagen  = Number(item.is_collagen ?? 0) === 1;

        if (isProtein   && !functional.protein) return false;
        if (isPrebiotic && !functional.prebiotic) return false;
        if (isMagnesium && !functional.magnesium) return false;
        if (isVitamin   && !functional.vitamin) return false;
        if (isCollagen  && !functional.collagen) return false;
      }

      // business
      const business = filters.business || { trending: true, high_margin: true };
      const businessNoRestr =
          (!business.trending && !business.high_margin) ||
          (business.trending && business.high_margin);

      if (!businessNoRestr) {
        const isTrending   = Number(item.is_trending ?? 0) === 1;
        const isHighMargin = Number(item.is_high_margin ?? 0) === 1;

        if (isTrending && !business.trending) return false;
        if (isHighMargin && !business.high_margin) return false;
      }

      // heritage
      const hset = filters.heritage instanceof Set
          ? filters.heritage
          : new Set(["abbey", "trappist", "normal","modern"]);

      const hval = (item.heritage || "normal").toLowerCase();
      if (!hset.has(hval)) return false;

      return true;
    };


    useEffect(() => {
      let alive = true;
      fetchMergedLayers().then(m => {
        if (alive) setMergedLayers(m);   // m is always a matrix (API/cache/fallback)
      });
      return () => { alive = false; };
    }, []);

    const items = useMemo(
        () => (Array.isArray(itemsNotOnMenu) ? itemsNotOnMenu : []),
        [itemsNotOnMenu]
    );

    const onMenu = useMemo(
        () => (Array.isArray(onMenuItems) ? onMenuItems : []),
        [onMenuItems]
    );

    const sorted = useMemo(() => {
      const arr = [...items];
      arr.sort((a, b) => {
        const an = String(a.name ?? a.item_name ?? "");
        const bn = String(b.name ?? b.item_name ?? "");
        const ac = String(a.category ?? a.category_name ?? "");
        const bc = String(b.category ?? b.category_name ?? "");

        if (sortOrder === "name") return an.localeCompare(bn);
        if (sortOrder === "category") return ac.localeCompare(bc);
        return 0;
      });
      return arr;
    }, [items, sortOrder]);

    const visible = useMemo(() => {
      return sorted
          .filter(inActiveSection)
          .map(normalizeForFilters)
          .filter(passesFilters);
    }, [sorted, inActiveSection, normalizeForFilters, passesFilters]);

    const visibleOnMenu = useMemo(() => {
      return onMenu
          .filter(inActiveSection)
          .map(normalizeForFilters)
          .filter(passesFilters);
    }, [onMenu, inActiveSection, normalizeForFilters, passesFilters]);

    useEffect(() => {
      let cancelled = false;

      const t = setTimeout(async () => {
        try {
          setLoadingItems(true);
          setItemsError(null);

          const raw = String(searchTerm || "").trim();
          const hasSearch = raw.length >= 2;

          const params = {
            section,
            limit: hasSearch ? 100 : 1000,
            ...(activeAssortmentId != null && { assortmentId: activeAssortmentId }),
          };

          if (hasSearch) params.search = raw;

          const res = await api.get("/api/items-not-on-menu", {
            withCredentials: true,
            params,
          });



          if (!cancelled) setItemsNotOnMenu(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
          if (!cancelled) setItemsError("Kon items niet laden");
          console.error(e);
        } finally {
          if (!cancelled) setLoadingItems(false);
        }
      }, 250);



      return () => {
        cancelled = true;
        clearTimeout(t);
      };


    }, [section, searchTerm]);




    // still in the same file where setLayersOverride is available
    useEffect(() => {
      try {
        const businessId = localStorage.getItem('business_id') || 'anon';
        const key = `layersMatrix:${businessId}`;

        const raw = sessionStorage.getItem(key) || sessionStorage.getItem('layersMatrix'); // back-compat
        if (!raw) return;

        const parsed = JSON.parse(raw);
        // minimal shape check
        const hasLayers = parsed && Array.isArray(parsed.layers);
        const hasMeta = parsed && typeof parsed.meta === 'object';

        if (hasLayers) {
          setLayersOverride({ layers: parsed.layers }); // shape expected by useLayersView
          console.log('[layersOverride] loaded from sessionStorage', {
            sourceKey: raw && key,
            version: parsed.version,
            meta: hasMeta ? parsed.meta : undefined,
          });
        }
      } catch (e) {
        console.warn('[layersOverride] storage parse failed', e);
      }
    }, []);




    useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/api/menu-items', {
          withCredentials: true,
          params: {
            page: 1, pageSize: 500, orderBy: 'products.name',
            ...(activeAssortmentId != null && { assortmentId: activeAssortmentId }),
          }
        });
        if (!alive) return;
        setOnMenuItems(res.data?.items || []);
      } catch (e) {
        console.error('[FE] fetch /api/menu-items failed', e);
      }
    })();
    return () => { alive = false; };
  }, [activeAssortmentId]);

  // —— Business info (for icons in list) ——
  useEffect(() => {
    api
        .get('/api/business-info', { withCredentials: true })
        .then((res) => {
          setBusinessCity(res.data.city || '');
          setBusinessCountry(res.data.country || '');
        })
        .catch((err) => console.error('Business-info error', err));
  }, []);

  // —— Hover lists (respect preset filters/predicates/within) ——
  const makeHoverKey = (groupValue) => `${groupBy}:${groupValue}:${filterKey}`;
  const PART_LABELS = new Map([["Sparkling", 1], ["Still", 0]]); // keep in sync with preset partition labels
  // helper used by loadHoverList: parse suffix like "Sparkling", "Zero", or "ABV 3.5–5.5"
  const splitComposite = (groupValue) => {
    const raw = String(groupValue || '');
    const parts = raw.split(' · ');
    if (parts.length < 2) return { base: raw, partition: null, partitionPredicates: [] };

    const base = parts.slice(0, -1).join(' · ');
    const suf  = (parts[parts.length - 1] || '').trim().toLowerCase();

    // 2a) preset-driven partitions take precedence (e.g., "abbey" | "normal" | "trappist")
    const pPreds = partitionPredicateMap.get(suf);
    if (pPreds && pPreds.length) {
      return { base, partition: null, partitionPredicates: pPreds };
    }

    // 2b) your existing logic (unchanged), but keep as single 'partition' object
    // carbonation
    if (suf === 'sparkling') return { base, partition: { field: 'is_sparkling', op: 'eq', value: 1 }, partitionPredicates: [] };
    if (suf === 'still' || suf === 'not sparkling') return { base, partition: { field: 'is_sparkling', op: 'eq', value: 0 }, partitionPredicates: [] };

    // sugar
    if (suf === 'zero') return { base, partition: { field: 'is_zero', op: 'eq', value: 1 }, partitionPredicates: [] };
    if (suf === 'with sugar') return { base, partition: { field: 'is_zero', op: 'eq', value: 0 }, partitionPredicates: [] };

    // ABV band: supports "abv 0–0.5", "abv 0.5-3.5", "abv 7.5+", etc.
    if (suf.startsWith('abv')) {
      const m = suf.match(/abv\s*([0-9.]+)\s*[–-]\s*([0-9.]+)\s*$/i);
      const plus = suf.match(/abv\s*([0-9.]+)\s*\+\s*$/i);
      if (m) {
        const lo = parseFloat(m[1]);
        const hi = parseFloat(m[2]);
        return { base, partition: { field: 'abv', op: 'between', value: [lo, hi] }, partitionPredicates: [] };
      }
      if (plus) {
        const lo = parseFloat(plus[1]);
        return { base, partition: { field: 'abv', op: 'between', value: [lo, 100] }, partitionPredicates: [] };
      }
    }

    // unknown suffix → no extra predicate
    return { base, partition: null, partitionPredicates: [] };
  };


  // resolve preset id and params bucket
  const presetId = String(getPresetId?.(currentPreset) ?? currentPreset?.id ?? '');
  const paramBucket = PRESET_PARAMS[presetId] || {};
  const defaults = paramBucket._defaults || { ros: 1, alpha: 0.5, min_sku: 0, max_sku: null };



// Keys for deps (avoid putting arrays/objects directly in deps)
  const partitionByKey = React.useMemo(() => JSON.stringify(partitionBy), [partitionBy]);
  const forceShowKey   = React.useMemo(() => JSON.stringify(forceShow),   [forceShow]);


/**/

  useEffect(() => {

    const unsub = subscribeUIPrefs((s) => {
        setWillyModeLocal(s.willyMode);
        setWillyEnabledLocal(s.willyEnabled);
      });
      return unsub;
  }, []);


     const { counts: countsByCategoryRaw, countsLoading } = useCountsByCategory({
           groupBy, effectiveSection,
           includeEmpty: currentPreset.includeEmpty ?? false,
           within, apiFilters, presetPredicates,
           partitionBy, forceShow, rollups: currentPreset.rollups || [], presetId, filterKey, showOnlyRollups: currentPreset.showOnlyRollups ?? false,
           assortmentId: activeAssortmentId,
     });

     // Filter out CIDERS — moved to its own category; stale DB links may still return it under BEERS
     const countsByCategory = useMemo(() => {
       if (!countsByCategoryRaw) return {};
       const out = {};
       for (const [k, v] of Object.entries(countsByCategoryRaw)) {
         if (!/^CIDER/i.test(k) && !/· CIDER/i.test(k)) out[k] = v;
       }
       return out;
     }, [countsByCategoryRaw]);

  const totalMenuCount = useMemo(
    () => Object.values(countsByCategory || {}).reduce((s, n) => s + (n ?? 0), 0) || 75,
    [countsByCategory]
  );

  const dynamicLayers = useEngineDistributions({
    assortmentId: activeAssortmentId,
    groupBy,
    section: effectiveSection,
    within,
    filters: apiFilters,
    predicates: presetPredicates,
    rollups: currentPreset?.rollups ?? [],
    rowDefs,
    totalMenuCount,
    enabled: true,
  });

  const { scores: personaFit, rawDist: personaRawDist } = useStereotypeFit({
    assortmentId: activeAssortmentId,
    groupBy,
    section: effectiveSection,
    within,
    filters: apiFilters,
    predicates: presetPredicates,
    stereotypes: GEO_ONLY,
    rollups: currentPreset?.rollups ?? [],
    rowDefs,
    countsByCategory,
    totalMenuCount,
    enabled: true,
  });

    useEffect(() => {
      if (activeCategory === 'refreshments') {
        console.log('[DBG refreshments] keys:', Object.keys(countsByCategory));
        console.log('[DBG refreshments] forceShow:', currentPreset?.forceShow || []);
        console.log("[DBG apiFilters]", apiFilters);
        console.log("[DBG filterKey]", filterKey);

      }
    }, [activeCategory, countsByCategory, currentPreset?.forceShow]);

    useEffect(() => {
      if (activeCategory === 'beers') {
        console.log('[DBG beers] keys:', Object.keys(countsByCategory));
        console.log('[DBG beers] forceShow:', currentPreset?.forceShow || []);
        console.log("[DBG apiFilters]", apiFilters);
        console.log("[DBG filterKey]", filterKey);

      }
    }, [activeCategory, countsByCategory, currentPreset?.forceShow]);



    const readBool = (v, def = 0) => {
    if (v === 1 || v === '1' || v === true) return 1;
    if (v === 0 || v === '0' || v === false) return 0;
    return def;
  };

  const parseCompositeMulti = (label) => {
    const parts = String(label).split(' · ').map(p => (p || '').trim());
    const base = parts[0] || String(label);
    const suffixes = parts.slice(1).map(p => p.toLowerCase());
    let is_sparkling = null, is_zero = null;
    if (suffixes.includes('sparkling')) is_sparkling = 1;
    if (suffixes.includes('still') || suffixes.includes('not sparkling')) is_sparkling = 0;
    if (suffixes.includes('zero')) is_zero = 1;
    if (suffixes.includes('with sugar')) is_zero = 0;
    return { base, is_sparkling, is_zero };
  };

  const inferSubcat = (ssub) => {
    const t = String(ssub || '').toUpperCase();
    if (t.startsWith('ICE_TEA')) return 'ICE_TEA';
    if (t.startsWith('LEMONADES')) return 'LEMONADES';
    if (t.startsWith('COLA')) return 'COLA';
    if (t.startsWith('GINGER')) return 'GINGER_DRINKS';
    if (t.startsWith('TONIC')) return 'TONICS';
    if (t.startsWith('JUICES_NFC')) return 'JUICES_NFC';
    if (t.startsWith('JUICES_CONCENTRATE')) return 'JUICES_CONCENTRATE';
    return null;
  };






















  const PARENT_BY_PREFIX = [
    'COLA','ENERGY_DRINKS','FLAVORED_WATER','FUNCTIONAL_DRINKS',
    'GINGER_DRINKS','ICE_TEA','JUICES_CONCENTRATE','JUICES_NFC',
    'KOMBUCHA','LEMONADES','MILK_BASED','PLAIN_WATER','SPORTDRINKS',
    'TONICS','SPECIALS','OTHER',
  ];






  // --- helpers to detect homogeneity (all groups same 0/1/null) ---
  const allSame01 = (groups, key) => {
    const vals = new Set(
        (Array.isArray(groups) ? groups : [])
            .map(g => g?.[key])
            .filter(v => v === 0 || v === 1) // ignore null/undefined
    );
    return vals.size === 1;
  };

    const {
      baseGroups, activeLayers,
      displayedCountsByCategory, viewGroups, layerCounts
    } = useLayersView({
      countsByCategory, groupBy, apiFilters, presetPredicates, within,
      activeCategory, effectiveSection, currentPreset, layersOverride,
      dynamicLayers,
    });



    // --- somewhere above your JSX return (inside the component) ---
  const recoOptions = React.useMemo(() => ({
    kMax: 1,
    thresholdAbs: 0.10,   // tune this
    topN: 50,
    requireRemovalDelta: true,
    minRemoveMag: 1e-6,
    requireAddPositive: true,
  }), []);



    const { stepSuggestions, alloc, adds: aggAdds, removes: aggRemoves, headerKPI, computing: recoComputing } =
           useRecommendations({ viewGroups, activeLayers, layerCounts, countsByCategory, displayedCountsByCategory, enabled: effectiveWillyOn });

  // ── Swap pair navigation ───────────────────────────────────────────────────
  const [swapIndex, setSwapIndex] = useState(0);
  const swapPairs = useMemo(() => {
    const len = Math.min((aggAdds?.length ?? 0), (aggRemoves?.length ?? 0));
    return Array.from({ length: len }, (_, i) => ({
      removeRec: aggRemoves[i],
      addRec:    aggAdds[i],
    }));
  }, [aggAdds, aggRemoves]);
  // Reset index when pairs change
  const prevSwapPairsLen = React.useRef(0);
  if (prevSwapPairsLen.current !== swapPairs.length) {
    prevSwapPairsLen.current = swapPairs.length;
    if (swapIndex >= swapPairs.length) setSwapIndex(0);
  }
  const currentSwap = swapPairs[swapIndex] ?? { removeRec: null, addRec: null };

  // ── Weighted satisfaction score ────────────────────────────────────────────
  const satisfactionScore = useMemo(() => {
    const geoP = ['Belgian', 'French', 'German', 'Dutch'];
    const tW = geoP.reduce((s, p) => s + (personaWeights[p] ?? 25), 0);
    const wS = geoP.reduce((s, p) => s + (personaFit[p] ?? 0) * (personaWeights[p] ?? 25), 0);
    if (tW === 0) return null;
    return Math.round((wS / tW) * 10) / 10;
  }, [personaFit, personaWeights]);

  // ── Per-persona score delta for the currently displayed swap ──────────────
  const personaDeltas = useMemo(() => {
    if (!personaRawDist || !currentSwap.removeRec || !currentSwap.addRec) return null;
    const { removeRec, addRec } = currentSwap;
    const modCounts = { ...countsByCategory };
    const removeKey = removeRec.label;
    const addKey    = addRec.label;
    modCounts[removeKey] = Math.max(0, (modCounts[removeKey] ?? 0) - 1);
    modCounts[addKey]    = (modCounts[addKey] ?? 0) + 1;
    const swappedScores = computePersonaScores({
      rawDist: personaRawDist,
      rollups: currentPreset?.rollups ?? [],
      rowDefs,
      countsByCategory: modCounts,
      totalMenuCount,
    });
    return Object.fromEntries(
      GEO_ONLY.map(p => [p, Math.round(((swappedScores[p] ?? 0) - (personaFit[p] ?? 0)) * 10) / 10])
    );
  }, [personaRawDist, currentSwap, countsByCategory, currentPreset, rowDefs, totalMenuCount, personaFit]);


// Map header status → numeric score and persist per view (preset)
    // Map header status → numeric score and persist per view (preset)
    useEffect(() => {
      const viewId = currentPreset?.id;
      if (!viewId) return;

      const status = headerKPI?.status ?? 'red'; // default while loading
      const s =
          status === 'green'  ? 1   :
              status === 'orange' ? 0.5 : 0;

      setViewScore(activeCategory, viewId, s);
      if (onScoreUpdate && activeAssortmentId != null) {
        const { sum, total } = getFinal(activeCategory);
        onScoreUpdate(activeAssortmentId, { sum, total });
      }
    }, [activeCategory, currentPreset?.id, headerKPI?.status]);


    const activeBadges = React.useMemo(() => {
    const hasEq = (field, val) =>
        (presetPredicates || []).some(
            (p) => p.field === field && String(p.op || "").toLowerCase() === "eq" && Number(p.value) === Number(val)
        );

    const b = [];
    if (hasEq("is_zero", 1)) b.push("zero");
    if (hasEq("is_sparkling", 1)) b.push("sparkling");
    else if (hasEq("is_sparkling", 0)) b.push("badge_still"); // optional if you add a still badge
    return b;
  }, [presetPredicates]);

// Build Optionbar "taste" list from current summary keys (memoized, de-duped by base token)
  const tasteOptions = React.useMemo(() => {
    const seen = new Set();
    const out = [];

    const keys = Object.keys(displayedCountsByCategory || {}).sort((a, b) => a.localeCompare(b));
    for (const label of keys) {
      const { base } = parseCompositeMulti(label);    // <-- strip partition/sugar suffixes
      const id = normToken(base);                     // <-- this must match passesFilters(...) tasteId
      if (seen.has(id)) continue;                     // de-duplicate across Sparkling/Still/Zero variants
      seen.add(id);
      out.push({
        id,               // used for filtering (matches passesFilters tasteId)
        label: convertBaseLabel(base),      // show only category/subcategory/subsubcategory in Optionbar
        icon: iconFor(base),
      });
    }
    return out;
  }, [displayedCountsByCategory]);


  const K = Object.values(displayedCountsByCategory).reduce((s, n) => s + (n ?? 0), 0);

  // Only (re)select all tastes when the preset actually changes.
  // Use an updater that bails out (returns prev) when the set content is unchanged,
  // preventing an infinite re-render loop when tasteOptions gets a new reference
  // but contains the same ids.
    // Reset taste selection to "all" only when the preset or category changes,
    // NOT when tasteOptions changes — otherwise unchecking a filter triggers
    // a feedback loop that re-selects everything.
    const tasteOptionsRef = useRef(tasteOptions);
    tasteOptionsRef.current = tasteOptions;

    useEffect(() => {
      if (skipTasteResetRef.current) {
        skipTasteResetRef.current = false;
        return;
      }
      setFilters((prev) => {
        const newIds = (tasteOptionsRef.current || []).map((o) => o.id);
        const old = prev.tastes;
        if (old instanceof Set && old.size === newIds.length && newIds.every(id => old.has(id))) {
          return prev;
        }
        return { ...prev, tastes: new Set(newIds) };
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory, presetIndex]);


  // —— Items not on menu (bottom list) ——
  useEffect(() => {
    setLoading(true);
    api
        .get('/api/items-not-on-menu', {
          withCredentials: true,
          params: { section: effectiveSection }, // ✅ NEW
        })
        .then((res) => {
          const mapped = res.data.map((i) => ({
            id: i.id_product,
            id_product: i.id_product,
            name: i.name,
            category: i.subcat_name ?? i.category_name ?? i.category,

            _category_token: normToken(i.category_name ?? i.category),
            _subcat_token: normToken(i.subcat_name),
            _subsubcat_token: normToken(i.subsubcat_name),

            // attributes for filtering
            is_zero: to01(i.is_zero ?? i.zero ?? i.zero_sugar ?? 0),
            is_sparkling: to01(i.is_sparkling ?? i.sparkling ?? 0),
            heritage: normalizeHeritage(i.heritage),


            // NEW functional flags
            is_protein:     to01(i.is_protein ?? 0),
            is_prebiotic:   to01(i.is_prebiotic ?? 0),
            is_magnesium:   to01(i.is_magnesium ?? 0),
            is_vitamin:     to01(i.is_vitamin ?? 0),
            is_collagen:    to01(i.is_collagen ?? 0),

// ALSO include these
            is_trending:    to01(i.is_trending ?? 0),
            is_high_margin: to01(i.is_high_margin ?? 0),

            // misc (for icons in ItemsList)

            eco_friendly: (i.eco_friendly ?? '').toString().toLowerCase() === 'yes',
            season: i.season,
            prodCity: i.prodCity,
            prodCountry: i.prodCountry,
            recommendedPrice:
                i.low_price != null && i.high_price != null
                    ? (Number(i.low_price) + Number(i.high_price)) / 2
                    : null,
          }));
          setItemsNotOnMenu(mapped);
        })
        .catch((err) => {
          console.error(err);
          setError('Kon items niet laden');
        })
        .finally(() => setLoading(false));
  }, [effectiveSection]);

  // Log optimal counts once per (preset + counts) change
  const loggedStampRef = useRef(null);

    useEffect(() => {
      const presetId = getPresetId(currentPreset);
      const countsMap = countsByCategory || {};

      // prefer the preset's forceShow order for deterministic tables
      const displayLabels = Array.isArray(currentPreset?.forceShow) && currentPreset.forceShow.length
          ? currentPreset.forceShow
          : Object.keys(countsMap);

      if (!presetId || displayLabels.length === 0) return;

      // ---- map display label -> bucket key ("0" | "1") via partitionBy predicates ----
      const pb = Array.isArray(currentPreset?.partitionBy) ? currentPreset.partitionBy : [];
      const labelToBucketKey = new Map();

      // first pass: use explicit predicates
      for (const part of pb) {
        const lbl = String(part?.label ?? '').trim();
        const pred = Array.isArray(part?.predicates) ? part.predicates : [];
        const iz = pred.find(p => String(p.field).toLowerCase() === 'is_zero' && String(p.op).toLowerCase() === 'eq');
        if (lbl && iz && (iz.value === 0 || iz.value === 1 || iz.value === '0' || iz.value === '1')) {
          // your display labels are like "BEERS · Zero" — we’ll match by the suffix if needed
          const suffix = lbl; // "Zero" | "With alcohol"
          const bucketKey = String(Number(iz.value)); // "0" | "1"
          // assign for both raw label and with section prefix
          labelToBucketKey.set(lbl, bucketKey);
          labelToBucketKey.set(`BEERS · ${lbl}`, bucketKey);
          labelToBucketKey.set(`REFRESHMENTS · ${lbl}`, bucketKey);
        }
      }

      // fallback helper when no partitionBy match
      const toBucketKeyFallback = (label) => {
        const suffix = String(label).includes(' · ')
            ? String(label).split(' · ').slice(1).join(' · ').trim()
            : String(label).trim();
        if (/^zero$/i.test(suffix)) return '1';
        if (/^with alcohol$/i.test(suffix)) return '0';
        // if it already looks like "0"/"1"
        if (suffix === '0' || suffix === '1') return suffix;
        return null;
      };

      // ---- build normalized counts keyed by real bucket keys ("0"/"1") ----
      const normalizedCounts = {};
      for (const lbl of displayLabels) {
        const key =
            labelToBucketKey.get(lbl) ??
            toBucketKeyFallback(lbl);

        const n = Number(countsMap[lbl] ?? 0);
        if (key) {
          normalizedCounts[key] = (normalizedCounts[key] || 0) + n;
        } else {
          // if we can’t resolve, just keep for logging purposes (won’t affect optimizer)
          normalizedCounts[lbl] = (normalizedCounts[lbl] || 0) + n;
        }
      }

      const K = Object.values(normalizedCounts).reduce((s, v) => s + Number(v || 0), 0);

      // only log once for this combo
      const stamp = `${presetId}|K=${K}|${filterKey}`;
      if (loggedStampRef.current === stamp) return;
      loggedStampRef.current = stamp;

      try {
        console.group(`[ALLOC] preset=${presetId} | K=${K}`);

        // snapshot of current (display)
        //console.table(displayLabels.map(label => ({
          //label,
          //current: Number(countsMap[label] ?? 0),
        //})));

        if (typeof buildRecommendations === 'function') {
          const { optimalCounts = {}, diffs = {}, recommended = {} } =
          buildRecommendations({
            presetId,
            counts: normalizedCounts, // <-- keys are "0"/"1" now
            k: K,
          }) || {};

          // reader that tries bucket key first, based on mapping, then label
          const pick = (obj, label) => {
            const bucketKey = labelToBucketKey.get(label) ?? toBucketKeyFallback(label);
            if (bucketKey && Object.prototype.hasOwnProperty.call(obj, bucketKey)) {
              return Number(obj[bucketKey]) || 0;
            }
            if (Object.prototype.hasOwnProperty.call(obj, label)) {
              return Number(obj[label]) || 0;
            }
            return 0;
          };

          const recTable = displayLabels.map(label => ({
            label,
            current: Number(countsMap[label] ?? 0),
            optimal: pick(optimalCounts, label),
            diff: pick(diffs, label),
            recommended: pick(recommended, label),
          }));

          //console.table(recTable);
        }
      } catch (e) {
        console.warn('[ALLOC] logging skipped:', e);
      } finally {
        console.groupEnd();
      }
    }, [currentPreset, countsByCategory, filterKey]);




    const labelFor = makeCategoryLabeler();

  const presetLoading = countsLoading || (effectiveWillyOn && recoComputing);

  // ── Combined navigation: swaps within preset, then next preset ──
  const swapCount = swapPairs.length;
  const handleNavPrev = React.useCallback(() => {
    if (effectiveWillyOn && swapCount > 0 && swapIndex > 0) {
      setSwapIndex(swapIndex - 1);
    } else {
      prevPreset();
      setSwapIndex(0);
    }
  }, [effectiveWillyOn, swapCount, swapIndex, prevPreset]);

  const handleNavNext = React.useCallback(() => {
    if (effectiveWillyOn && swapCount > 0 && swapIndex < swapCount - 1) {
      setSwapIndex(swapIndex + 1);
    } else {
      nextPreset();
      setSwapIndex(0);
    }
  }, [effectiveWillyOn, swapCount, swapIndex, nextPreset]);

  if (loading) return (
      <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 300, gap: 10,
          color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600,
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '0.03em',
      }}>
          <span style={{
              width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.15)',
              borderTop: '2.5px solid rgba(255,255,255,0.6)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
          }} />
          Loading…
      </div>
  );
  if (error) return <p className="error">{error}</p>;










    const parseComposite = (val) => {
    const s = String(val);
    const parts = s.split(' · ');
    const base = parts[0] || s;
    const suffix = (parts[1] || '').trim().toLowerCase();

    // carbonation
    if (suffix === 'sparkling') return { base, carb: 1, zero: null };
    if (suffix === 'still' || suffix === 'not sparkling') return { base, carb: 0, zero: null };

    // sugar
    if (suffix === 'zero') return { base, carb: null, zero: 1 };
    if (suffix === 'with sugar') return { base, carb: null, zero: 0 };

    return { base, carb: null, zero: null };
  };



  function getScrollContainer(el) {
    let node = el?.parentElement;
    while (node) {
      const s = window.getComputedStyle(node);
      const canScrollY =
          (s.overflowY === 'auto' || s.overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight;
      if (canScrollY) return node;
      node = node.parentElement;
    }
    return window;
  }

// Extend your existing parse to also detect heritage suffixes
  // Extend your existing parse to also detect heritage suffixes
  const parseCompositeWithHeritage = (val) => {
    const s = String(val || '');
    const parts = s.split(' · ').map(p => p.trim());
    const base = parts[0] || s;
    const suffixes = parts.slice(1).map(p => p.toLowerCase());

    let carb = null;   // 1/0
    let zero = null;   // 1/0
    let heritage = null; // 'normal' | 'abbey' | 'trappist' | ['normal','abbey'] | null

    for (const suf of suffixes) {
      if (suf === 'sparkling') carb = 1;
      else if (suf === 'still' || suf === 'not sparkling') carb = 0;
      else if (suf === 'zero') zero = 1;
      else if (suf === 'with sugar') zero = 0;
      else if (suf === 'normal/abbey') heritage = ['normal','abbey'];
      else if (suf === 'normal') heritage = 'normal';
      else if (suf === 'abbey') heritage = 'abbey';
      else if (suf === 'trappist') heritage = 'trappist';
    }

    return { base, carb, zero, heritage };
  };

  const handleFocusGroup = (groupValue) => {
    // ── Rollup bucket: use hoverOverrides predicates directly ──────────────
    const rollupOv = hoverOverrides && hoverOverrides[groupValue];
    if (rollupOv) {
      const preds = Array.isArray(rollupOv.predicates) ? rollupOv.predicates : [];

      // Use the rollup bucket ID itself so it matches tasteOptions
      const tastesSet = new Set([normToken(groupValue)]);

      // is_zero predicate → sugar state
      const zeroEq = preds.find(p => p.field === 'is_zero' && String(p.op || '').toLowerCase() === 'eq');
      const sugarState = zeroEq
          ? (Number(zeroEq.value) === 1
              ? { zero_sugar: true,  with_sugar: false }
              : { zero_sugar: false, with_sugar: true })
          : { zero_sugar: true, with_sugar: true };

      // is_sparkling predicate → sparkling state
      const sparkEq = preds.find(p => p.field === 'is_sparkling' && String(p.op || '').toLowerCase() === 'eq');
      const sparklingState = sparkEq
          ? (Number(sparkEq.value) === 1
              ? { sparkling: true,  not_sparkling: false }
              : { sparkling: false, not_sparkling: true })
          : { sparkling: true, not_sparkling: true };

      setToAddMode(true);
      skipTasteResetRef.current = true;
      setFilters(prev => ({
        ...prev,
        tastes: tastesSet,
        sugar: sugarState,
        sparkling: sparklingState,
      }));

      // scroll to list
      window.requestAnimationFrame(() => {
        const targetEl = itemsSectionRef.current;
        if (!targetEl) return;
        const scroller = getScrollContainer(targetEl);
        if (scroller === window) {
          const rect = targetEl.getBoundingClientRect();
          const targetY = window.scrollY + rect.top - window.innerHeight * 0.33;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        } else {
          const scrollerRect = scroller.getBoundingClientRect();
          const elRect = targetEl.getBoundingClientRect();
          const relTop = elRect.top - scrollerRect.top + scroller.scrollTop;
          const targetY = relTop - scroller.clientHeight * 0.33;
          scroller.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }
      });
      return;
    }

    // ── Regular (non-rollup) bucket ─────────────────────────────────────────
    // parse suffixes (sparkling/zero/heritage)
    const { base, carb, zero, heritage } = parseCompositeWithHeritage(groupValue);

    const token = normToken(base);
    const rec = recommendations[toKey(token)];
    setToAddMode(!(rec && Number(rec.recommended) < 0));

    // helper to read preset/API forced eq
    const getEq = (field) => {
      const p = (presetPredicates || []).find(
          pr => pr.field === field && String(pr.op || '').toLowerCase() === 'eq'
      );
      if (p && (p.value === 0 || p.value === 1)) return Number(p.value);

      const v = apiFilters ? apiFilters[field] : undefined;
      if (v === 0 || v === 1) return Number(v);
      if (v === '0' || v === '1') return Number(v);
      return null;
    };

    const zeroVal  = getEq('is_zero');      // 0 / 1 / null
    const sparkVal = getEq('is_sparkling'); // 0 / 1 / null

    // carbonation checkbox state
    const sparklingState =
        carb === 1 ? { sparkling: true,  not_sparkling: false } :
            carb === 0 ? { sparkling: false, not_sparkling: true } :
                (sparkVal === null
                        ? { sparkling: true,  not_sparkling: true }
                        : (sparkVal === 1
                                ? { sparkling: true,  not_sparkling: false }
                                : { sparkling: false, not_sparkling: true }
                        )
                );

    // sugar (zero) override from row if present
    const sugarStateFromRow =
        zero === 1 ? { zero_sugar: true,  with_sugar: false } :
            zero === 0 ? { zero_sugar: false, with_sugar: true } :
                null;

    // NEW: heritage selection based on suffix if present
    // Optionbar expects a Set(['abbey','trappist','normal'])
    const heritageSetFromRow = (() => {
      if (!heritage) return null;
      if (Array.isArray(heritage)) return new Set(heritage);        // ['normal','abbey']
      return new Set([heritage]);                                    // 'trappist' | 'abbey' | 'normal'
    })();

    skipTasteResetRef.current = true;
    setFilters(prev => ({
      ...prev,
      tastes: new Set([token]),
      sugar: sugarStateFromRow
          ? sugarStateFromRow
          : (zeroVal === null
              ? { zero_sugar: true, with_sugar: true }
              : (zeroVal === 1
                  ? { zero_sugar: true,  with_sugar: false }
                  : { zero_sugar: false, with_sugar: true })),
      sparkling: sparklingState,
      ...(heritageSetFromRow ? { heritage: heritageSetFromRow } : {}), // 👈 apply when present
    }));

    // scroll to list
    window.requestAnimationFrame(() => {
      const targetEl = itemsSectionRef.current;
      if (!targetEl) return;

      const scroller = getScrollContainer(targetEl);

      if (scroller === window) {
        const rect = targetEl.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - window.innerHeight * 0.33;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      } else {
        const scrollerRect = scroller.getBoundingClientRect();
        const elRect = targetEl.getBoundingClientRect();
        const relTop = elRect.top - scrollerRect.top + scroller.scrollTop;
        const targetY = relTop - scroller.clientHeight * 0.33;
        scroller.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    });
  };

  // ── "Yes, see options" from SuggestedSwapPanel ─────────────────────────
  const handleSwapSeeOptions = (rec, isRemove) => {
    if (!rec?.label) return;
    // Reuse handleFocusGroup for filter logic (handles rollups + composite labels)
    handleFocusGroup(rec.label);
    // Override toAddMode: To Add for add recs, To Remove for remove recs
    setToAddMode(!isRemove);
    // Scroll a bit lower than handleFocusGroup (0.12 vs 0.33) so items list
    // appears near the top of the viewport
    requestAnimationFrame(() => {
      const targetEl = itemsSectionRef.current;
      if (!targetEl) return;
      const scroller = getScrollContainer(targetEl);
      if (scroller === window) {
        const rect = targetEl.getBoundingClientRect();
        window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - window.innerHeight * 0.12), behavior: 'smooth' });
      } else {
        const scrollerRect = scroller.getBoundingClientRect();
        const elRect = targetEl.getBoundingClientRect();
        const relTop = elRect.top - scrollerRect.top + scroller.scrollTop;
        scroller.scrollTo({ top: Math.max(0, relTop - scroller.clientHeight * 0.12), behavior: 'smooth' });
      }
    });
  };

  // recommended deltas per group (tokenized keys)
  const recommendations = buildRecommendations({
    countsByCategory,
    presetParams: paramBucket,
    defaults,
    K
  });

  const statusColor =
      headerKPI.status === 'green'  ? '#137333' :
          headerKPI.status === 'orange' ? '#b45309' :
              '#b91c1c';

  const kpiBadgeText =
      headerKPI.status === 'green'  ? '+1'   :
          headerKPI.status === 'orange' ? '+0.5' :
              '+0';

    const refreshOnMenuItems = async () => {
      const res = await api.get('/api/menu-items', {
        withCredentials: true,
        params: {
          page: 1, pageSize: 500, orderBy: 'products.name',
          ...(activeAssortmentId != null && { assortmentId: activeAssortmentId }),
        }
      });
      setOnMenuItems(res.data?.items || []);
    };

    const handleAddToMenu = async (item, price) => {
      const product_id = item?.id_product ?? item?.product_id ?? item?.id;
      await api.post(
          '/api/menu-items/add',
          {
            product_id, price: Number(price),
            ...(activeAssortmentId != null && { assortmentId: activeAssortmentId }),
          },
          { withCredentials: true }
      );
      await refreshOnMenuItems();
    };

    const removeMenuItem = async (id_menu_item) => {
      await api.delete(`/api/menu-items/${id_menu_item}`, {
        withCredentials: true,
        data: activeAssortmentId != null ? { assortmentId: activeAssortmentId } : undefined,
      });
      await refreshOnMenuItems();
    };


    const viewUI = currentPreset?.ui || {};
    const gridColumns = viewUI.columns === 3 ? 3 : 2;
    const showItemsInline = !!viewUI.showItemsInline;
    const aggregateTop = viewUI.aggregateTop || { enabled: false };





  return (
      <div className="toadd-page">
        {/* === Page-level header === */}
        <div className="toadd-page-header">
            <KPIHeader
                personaInfo={personaInfo}
                headerKPI={headerKPI}
                onPrev={handleNavPrev}
                onNext={handleNavNext}
                onJumpPreset={setPresetIndex}
                presetCount={PACK_LEN}
                activeCategory={activeCategory}
                currentPreset={currentPreset}
                presetIndex={presetIndex}
                onGoBack={onGoBack}
                onViewMenu={onViewMenu}
                allAssortments={assortments ?? []}
                assortmentScores={assortmentScores}
                willyOffIds={new Set(
                    (activeCategory === 'beers' ? PRESET_FILTERS_BEERS : PRESET_FILTERS_REFRESHMENTS)
                        .filter(p => p.willyOff).map(p => String(p.id))
                )}
                presetLoading={presetLoading}
                swapIndex={swapIndex}
                swapCount={swapCount}
            />
        </div>

        <div className="top-worst-container toadd-grid">
        <div className="centre-content">
          <div className="segment-section">

            {/* Status text above the grid */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, flexWrap: 'wrap', textAlign: 'center',
                marginBottom: 12, fontSize: 14, fontWeight: 500,
                opacity: presetLoading ? 0.4 : 0.85,
                transition: 'opacity 0.2s',
            }}>
                <span>
                    {personaInfo.line1} <strong>{presetLoading ? '…' : (() => {
                        // Sum only buckets visible in the grid rows (matches SummaryGrid)
                        const allBuckets = rowDefs.flatMap(r => r?.buckets || []);
                        if (!allBuckets.length) return headerKPI.total;
                        const cbc = displayedCountsByCategory || {};
                        return allBuckets.reduce((s, b) => s + Number(cbc[b] ?? 0), 0);
                    })()}</strong> {personaInfo.line2}
                    {effectiveWillyOn && !presetLoading && (
                        <> {headerKPI.status === 'green' ? 'goed' : headerKPI.status === 'orange' ? 'ok' : 'niet in balans'}</>
                    )}
                </span>
                {effectiveWillyOn && !presetLoading && (
                    <img src={headerKPI.icon} alt="" style={{ width: 18, height: 18, verticalAlign: 'middle' }} />
                )}
            </div>

            {presetLoading ? (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 10, padding: '40px 0', minHeight: 200,
                    color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif",
                    letterSpacing: '0.03em',
                }}>
                    <span style={{
                        width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.15)',
                        borderTop: '2.5px solid rgba(255,255,255,0.6)', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    Loading…
                </div>
            ) : (
            <SummaryGrid
                countsByCategory={displayedCountsByCategory}
                groupBy={groupBy}
                filterKey={filterKey}
                hoverLists={hoverLists}
                hoverCat={hoverCat}
                setHoverCat={setHoverCat}
                loadHoverList={loadHoverList}
                hoverOverrides={hoverOverrides}
                makeKey={makeKey}
                showPriceBars={showPriceBars}
                onFocusGroup={handleFocusGroup}
                presetId={currentPreset.id}
                recommendations={effectiveWillyOn ? recommendations : {}}
                activeBadges={activeBadges}
                summaryAdds={effectiveWillyOn ? aggAdds : []}
                summaryRemoves={effectiveWillyOn ? aggRemoves : []}
                willyDisabled={!effectiveWillyOn}
                sortPriority={currentPreset.sortPriority || []}
                columns={gridColumns}
                showItemsInline={showItemsInline}
                aggregateTop={aggregateTop}
                ui={currentPreset?.ui}
                stereotypeBenchmarks={stereotypeBenchmarks}
                totalMenuCount={totalMenuCount}
            />
            )}
          </div>

          <div className="items-section" ref={itemsSectionRef}>
            <div className="list-header">
              <div className="header-title">
                <p>To Add</p>
                <h2 className="section-title-top">Menu-items</h2>
              </div>

              <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

            </div>


            <ItemsList
                items={visible}
                itemsOnMenu={visibleOnMenu}
                toAdd={toAddMode}
                onModeChange={setToAddMode}
                groupBy={groupBy}
                section={effectiveSection}
                labelFor={makeCategoryLabeler()}
                businessCity={businessCity}
                hotForYouSet={new Set(Object.keys(idealCounts))}

                onAdd={(item) => {
                  setAddItem({ ...item, id_product: item.id });
                  setModalPrice('');
                }}

                onRemove={(itemOnMenu) => {
                  setRemoveItem(itemOnMenu); // should include id_menu_item
                }}

            />

          </div>
        </div>


        <div className="stereotype-panel-container">
          {effectiveWillyOn && (
            <SuggestedSwapPanel
              swapPairs={swapPairs}
              swapIndex={swapIndex}
              onSwapIndex={setSwapIndex}
              onSkip={() => {
                if (swapIndex < swapPairs.length - 1) setSwapIndex(swapIndex + 1);
                else handleNavNext();
              }}
              onSeeOptions={handleSwapSeeOptions}
              willyMode={willyMode}
              countsByCategory={countsByCategory}
              stereotypeBenchmarks={stereotypeBenchmarks}
              personaWeights={personaWeights}
              totalMenuCount={totalMenuCount}
            />
          )}
          <StereotypeSatisfactionPanel
            personaFit={personaFit}
            personaWeights={personaWeights}
            satisfactionScore={satisfactionScore}
            personaDeltas={personaDeltas}
            disabled={!effectiveWillyOn}
            compact
          />
        </div>

        <Optionbar
            groupBy={groupBy}
            category={activeCategory}
            tasteOptions={tasteOptions}
            filters={filters}
            onChange={setFilters}
        />

        {/* Modal */}
        <AddToMenuModal
            item={addItem}
            price={modalPrice}
            onChangePrice={setModalPrice}
            onCancel={() => { setAddItem(null); setModalPrice(''); }}
            onConfirm={async () => {
              await handleAddToMenu(addItem, modalPrice);
              setAddItem(null);
              setModalPrice('');
            }}
        />

        <RemoveFromMenuModal
            item={removeItem}
            onCancel={() => setRemoveItem(null)}
            onConfirm={async () => {
              const id = removeItem?.id_menu_item ?? removeItem?.id;
              if (!id) return alert('Geen id_menu_item gevonden.');
              await removeMenuItem(id);
              setRemoveItem(null);
            }}
        />


      </div>
      </div>
  );
}
