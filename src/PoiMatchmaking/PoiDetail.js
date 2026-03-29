import React, { useEffect, useMemo, useState } from 'react';
import { useAssortment } from '../context/AssortmentContext';
import { api } from '../apiService';
import { useStereotypeFit } from '../Dashboard/ToAdd/hooks/useStereotypeFit';
import useStereotypeBenchmarks from '../Dashboard/ToAdd/hooks/useStereotypeBenchmarks';
import StereotypeSatisfactionPanel from '../Dashboard/ToAdd/components/StereotypeSatisfactionPanel';
import TasteIconWithBadges from '../Dashboard/components/TasteIconWithBadges';
import { convertItemLabel } from '../Dashboard/ToAdd/utils/itemLabelMap';
import { convertDisplayLabel } from '../Dashboard/ToAdd/utils/labelMap';
import '../Dashboard/Menu.css';
import './PoiMatchmaking.css';

const normToken = (s) =>
  String(s ?? '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const to01 = (v) => {
  if (v === 1 || v === '1' || v === true) return 1;
  if (typeof v === 'string' && v.trim().toLowerCase() === 'true') return 1;
  return 0;
};

const buildBadges = (i) => {
  const b = [];
  if (to01(i.is_zero) === 1) b.push('badge_zero');
  const spr = to01(i.is_sparkling);
  if (spr === 1) b.push('badge_sparkling');
  else if (spr === 0) b.push('badge_not_sparkling');
  if (to01(i.is_gluten_free) === 1) b.push('badge_gluten_free');
  return b;
};

export default function PoiDetail({ storeId, onGoBack }) {
  const { assortments } = useAssortment();
  const store = assortments.find(a => a.id === storeId);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch menu items for this assortment
  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    api.post('/api/menu-items', {
      assortmentId: storeId,
      page: 1,
      pageSize: 500,
    }).then(({ data }) => {
      setItems(data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [storeId]);

  // Build countsByCategory from items (group by subcategory)
  const countsByCategory = useMemo(() => {
    const map = {};
    for (const item of items) {
      const key = item.subcategory || 'Other';
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [items]);

  const totalMenuCount = useMemo(
    () => Object.values(countsByCategory).reduce((s, n) => s + n, 0) || 75,
    [countsByCategory]
  );

  // Fetch persona fit scores
  const { scores: personaFit } = useStereotypeFit({
    assortmentId: storeId,
    groupBy: 'subcategory',
    section: 'beers',
    countsByCategory,
    totalMenuCount,
    enabled: !!storeId && items.length > 0,
  });

  // Fetch persona weights
  const { personaWeights } = useStereotypeBenchmarks({
    assortmentId: storeId,
    groupBy: 'subcategory',
    section: 'beers',
    enabled: !!storeId,
  });

  // Compute satisfaction score (two-axis: geo 50%, style 50%)
  const satisfactionScore = useMemo(() => {
    const geoP   = ['Belgian', 'French', 'German', 'Dutch'];
    const styleP = ['Conservative', 'Normal', 'Progressive'];
    const axisScore = (list) => {
      const tW = list.reduce((s, p) => s + (personaWeights[p] ?? 25), 0);
      const wS = list.reduce((s, p) => s + (personaFit[p] ?? 0) * (personaWeights[p] ?? 25), 0);
      return tW > 0 ? wS / tW : null;
    };
    const geo   = axisScore(geoP);
    const style = axisScore(styleP);
    if (geo === null && style === null) return null;
    const avg = geo !== null && style !== null ? (geo + style) / 2 : (geo ?? style);
    return Math.round(avg * 10) / 10;
  }, [personaFit, personaWeights]);

  // Group items by subcategory, sorted
  const grouped = useMemo(() => {
    const map = {};
    for (const item of items) {
      const sub = item.subcategory || 'Other';
      if (!map[sub]) map[sub] = [];
      map[sub].push(item);
    }
    // Sort items within each group by name
    for (const arr of Object.values(map)) {
      arr.sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));
    }
    return map;
  }, [items]);

  return (
    <div className="poi-detail">
      {/* Left: matchmaking scores */}
      <div className="poi-detail__left">
        <button className="poi-detail__back" onClick={onGoBack}>
          ← Back to map
        </button>

        {store && (
          <>
            <div className="poi-detail__store-name">{store.name}</div>
            {store.address && (
              <div className="poi-detail__store-address">{store.address}</div>
            )}
          </>
        )}

        <StereotypeSatisfactionPanel
          personaFit={personaFit}
          personaWeights={personaWeights}
          satisfactionScore={satisfactionScore}
          personaDeltas={null}
          disabled={items.length === 0}
        />
      </div>

      {/* Right: compact item list (Menu.js style) */}
      <div className="poi-detail__right">
        <div className="poi-items__header">
          <span className="poi-items__title">Assortment</span>
          <span className="poi-items__count">{items.length} items</span>
        </div>

        {loading ? (
          <div className="poi-detail__loading">Loading items...</div>
        ) : (
          <div className="menu-list-container" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            {Object.entries(grouped).map(([subcategory, subItems]) => {
              const token = normToken(subcategory);
              return (
                <section key={subcategory} className="menu-section">
                  <h3 className="menu-category" style={{
                    color: '#0b1220', display: 'inline-flex',
                    alignItems: 'center', gap: 10, margin: 0,
                  }}>
                    <TasteIconWithBadges token={token} badges={[]} size={22} title={convertDisplayLabel(subcategory)} />
                    <span>{convertDisplayLabel(subcategory)}</span>
                    <span className="count-pill">{subItems.length}</span>
                  </h3>

                  <ul className="menu-list menu-list--indented">
                    {subItems.map((i) => {
                      const itemToken = normToken(i.subcategory || i.category);
                      const badges = buildBadges(i);
                      const abv = i.abv != null ? Number(i.abv) : null;

                      return (
                        <li key={i.id_menu_item} className="menu-item">
                          <div className="item-left">
                            <TasteIconWithBadges
                              token={itemToken}
                              badges={badges}
                              size={20}
                              title={convertItemLabel(i.item_name)}
                            />
                            <div className="item-text">
                              <div className="item-name" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                                {convertItemLabel(i.item_name)}
                                {abv != null && (
                                  <span className="item-abv" style={{ fontSize: 12, color: '#64748b', lineHeight: 1 }}>
                                    {abv.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="item-right" />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
