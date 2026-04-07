import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAssortment } from '../context/AssortmentContext';
import { api } from '../apiService';
import { useStereotypeFit } from '../Dashboard/ToAdd/hooks/useStereotypeFit';
import useStereotypeBenchmarks from '../Dashboard/ToAdd/hooks/useStereotypeBenchmarks';
import StereotypeSatisfactionPanel from '../Dashboard/ToAdd/components/StereotypeSatisfactionPanel';
import TasteIconWithBadges from '../Dashboard/components/TasteIconWithBadges';
import { convertItemLabel } from '../Dashboard/ToAdd/utils/itemLabelMap';
import { convertDisplayLabel } from '../Dashboard/ToAdd/utils/labelMap';
import '../Dashboard/AssortmentOverview.css';
import '../Dashboard/Menu.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN ||
    'pk.eyJ1IjoibWlndWVsYW1hbnQiLCJhIjoiY21tb29xOTlzMGVweTJvc2IweGEwb2s2ZyJ9.3j5JPLEn0_D6_-5d_OEuxg';

const normToken = (s) =>
  String(s ?? '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const to01 = (v) => (v === 1 || v === '1' || v === true || (typeof v === 'string' && v.trim().toLowerCase() === 'true')) ? 1 : 0;

const buildBadges = (i) => {
  const b = [];
  if (to01(i.is_zero) === 1) b.push('badge_zero');
  if (to01(i.is_sparkling) === 1) b.push('badge_sparkling');
  if (to01(i.is_gluten_free) === 1) b.push('badge_gluten_free');
  return b;
};

// ── Shared data hook ──────────────────────────────────────────────────────
function useMatchmakingData(storeId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    api.get('/api/menu-items', { params: { assortmentId: storeId, page: 1, pageSize: 500 } })
      .then(({ data }) => { setItems(data?.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [storeId]);

  const countsByCategory = useMemo(() => {
    const map = {};
    for (const item of items) map[item.subcategory || 'Other'] = (map[item.subcategory || 'Other'] || 0) + 1;
    return map;
  }, [items]);

  const totalMenuCount = useMemo(
    () => Object.values(countsByCategory).reduce((s, n) => s + n, 0) || 75,
    [countsByCategory]
  );

  const { scores: personaFit } = useStereotypeFit({
    assortmentId: storeId, groupBy: 'subcategory', section: 'beers',
    countsByCategory, totalMenuCount,
    enabled: !!storeId && items.length > 0,
  });

  const { personaWeights } = useStereotypeBenchmarks({
    assortmentId: storeId, groupBy: 'subcategory', section: 'beers',
    enabled: !!storeId,
  });

  const satisfactionScore = useMemo(() => {
    const axis = (list) => {
      const tW = list.reduce((s, p) => s + (personaWeights[p] ?? 25), 0);
      const wS = list.reduce((s, p) => s + (personaFit[p] ?? 0) * (personaWeights[p] ?? 25), 0);
      return tW > 0 ? wS / tW : null;
    };
    const geo   = axis(['Belgian', 'French', 'German', 'Dutch']);
    const style = axis(['Conservative', 'Normal', 'Progressive']);
    if (geo === null && style === null) return null;
    const avg = geo !== null && style !== null ? (geo + style) / 2 : (geo ?? style);
    return Math.round(avg * 10) / 10;
  }, [personaFit, personaWeights]);

  const grouped = useMemo(() => {
    const map = {};
    for (const item of items) {
      const sub = item.subcategory || 'Other';
      if (!map[sub]) map[sub] = [];
      map[sub].push(item);
    }
    for (const arr of Object.values(map)) arr.sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));
    return map;
  }, [items]);

  return { items, loading, grouped, personaFit, personaWeights, satisfactionScore };
}

// ── Assortment list (rendered inside popup — compact) ────────────────────
function AssortmentList({ grouped, items, loading }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: '#111827' }}>
          Assortment
        </span>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, color: '#9ca3af',
          background: 'rgba(0,0,0,0.04)', padding: '1px 5px', borderRadius: 8,
        }}>
          {loading ? '...' : `${items.length} items`}
        </span>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 8, color: '#9ca3af', fontSize: 11 }}>Loading...</div>
      ) : (
        Object.entries(grouped).map(([subcategory, subItems]) => (
          <div key={subcategory} style={{ marginTop: 6 }}>
            <div style={{
              color: '#0b1220', display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
              borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 2, marginBottom: 2,
            }}>
              <TasteIconWithBadges token={normToken(subcategory)} badges={[]} size={13} title={convertDisplayLabel(subcategory)} />
              <span>{convertDisplayLabel(subcategory)}</span>
              <span style={{
                fontSize: 8, color: '#9ca3af', background: 'rgba(0,0,0,0.04)',
                padding: '0 4px', borderRadius: 6, fontWeight: 600,
              }}>{subItems.length}</span>
            </div>
            {subItems.map((i) => {
              const abv = i.abv != null ? Number(i.abv) : null;
              return (
                <div key={i.id_menu_item} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '1.5px 0 1.5px 10px', lineHeight: 1.3,
                }}>
                  <TasteIconWithBadges
                    token={normToken(i.subcategory || i.category)}
                    badges={buildBadges(i)}
                    size={13}
                    title={convertItemLabel(i.item_name)}
                  />
                  <span style={{ fontSize: 10, color: '#1f2937' }}>
                    {convertItemLabel(i.item_name)}
                  </span>
                  {abv != null && (
                    <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' }}>{abv.toFixed(1)}%</span>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </>
  );
}

// ── Identity distribution panel (rendered in side panel) ─────────────────
function IdentityPanel({ personaFit, personaWeights, satisfactionScore, items, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <StereotypeSatisfactionPanel
        personaFit={personaFit}
        personaWeights={personaWeights}
        satisfactionScore={satisfactionScore}
        personaDeltas={null}
        disabled={items.length === 0 && !loading}
        hideCulture
      />
    </div>
  );
}

// ── Wrapper that fetches data once and renders both pieces ───────────────
function MatchmakingDataProvider({ storeId, children }) {
  const data = useMatchmakingData(storeId);
  return children(data);
}

// ── Main component ──────────────────────────────────────────────────────────

export default function PoiMatchmaking() {
  const { assortments, loaded, setActiveAssortmentId } = useAssortment();

  const [activeIdx, setActiveIdx]     = useState(0);
  const [popupId, setPopupId]         = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const mapRef     = useRef(null);
  const marqueeRef = useRef(null);
  const pausedRef  = useRef(false);

  const stores = assortments.filter(a => a.lat != null && a.lng != null);

  const selectStore = useCallback((store, idx) => {
    setPopupId(store.id);
    setActiveIdx(idx);
    setActiveAssortmentId(store.id);
  }, [setActiveAssortmentId]);

  const closePopup = useCallback(() => {
    setPopupId(null);
  }, []);

  // Marquee auto-scroll
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el || stores.length === 0) return;
    let rafId;
    const step = () => {
      if (!pausedRef.current) {
        el.scrollLeft += 0.5;
        const halfWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= halfWidth) el.scrollLeft -= halfWidth;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [stores.length]);

  const popupStore = stores.find(s => s.id === popupId) ?? null;
  const panelOpen  = popupId !== null;

  if (!loaded) {
    return (
      <div className="ao-wrapper" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600,
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="ao-wrapper">
      {/* ── left store list ── */}
      <div className="ao-left-panel">
        <div className="ao-left-title">POI Matchmaking</div>
        <div className="ao-left-search">
          <input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="ao-left-search-input"
          />
        </div>
        <div className="ao-left-list">
          {stores
            .map((store, idx) => ({ store, idx }))
            .filter(({ store }) =>
              !searchQuery ||
              (store.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (store.address || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(({ store, idx }) => {
              const isActive = store.id === popupId;
              return (
                <div
                  key={store.id}
                  className={`ao-left-item${isActive ? ' ao-left-item--active' : ''}`}
                  onClick={() => selectStore(store, idx)}
                >
                  <span className="ao-left-dot" style={{ background: isActive ? '#6366f1' : '#6b7280' }} />
                  <div className="ao-left-info">
                    <span className="ao-left-name">{store.name}</span>
                    {store.address && (
                      <span className="ao-left-address">{store.address}</span>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>
        <div className="ao-left-footer">
          <button className="ao-left-logout" onClick={() => window.location.assign('/')}>
            ⏻ Logout
          </button>
        </div>
      </div>

      {/* ── map + side panel wrapped in provider when a store is selected ── */}
      {panelOpen && popupStore ? (
        <MatchmakingDataProvider key={popupStore.id} storeId={popupStore.id}>
          {({ items, loading, grouped, personaFit, personaWeights, satisfactionScore }) => (
            <>
              <div className={`ao-map-area ao-map-area--narrow`}>
                <Map
                  ref={mapRef}
                  initialViewState={{ longitude: 4.47, latitude: 50.5, zoom: 7.5 }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/light-v11"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  projection="mercator"
                  onClick={() => closePopup()}
                >
                  <NavigationControl position="top-right" />
                  {stores.map((store, idx) => {
                    const isActive = store.id === popupId;
                    const size = isActive ? 44 : 32;
                    return (
                      <Marker
                        key={store.id}
                        longitude={store.lng}
                        latitude={store.lat}
                        anchor="bottom"
                        onClick={e => { e.originalEvent.stopPropagation(); selectStore(store, idx); }}
                      >
                        <div
                          className={`ao-pin${isActive ? ' ao-pin--active' : ''}`}
                          style={{ '--pin-color': isActive ? '#6366f1' : '#94a3b8', '--pin-size': `${size}px` }}
                        >
                          <div className="ao-pin-dot" />
                          <div className="ao-pin-tail" />
                        </div>
                      </Marker>
                    );
                  })}

                  <Popup
                    longitude={popupStore.lng}
                    latitude={popupStore.lat}
                    offset={52}
                    closeButton={true}
                    closeOnClick={false}
                    onClose={closePopup}
                    className="ao-popup"
                    maxWidth="360px"
                  >
                    <div className="ao-popup-inner" onClick={e => e.stopPropagation()}>
                      <div className="ao-popup-name">{popupStore.name}</div>
                      {popupStore.address && (
                        <div className="ao-popup-address">{popupStore.address}</div>
                      )}
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 8, paddingTop: 8, maxHeight: 340, overflowY: 'auto' }}>
                        <AssortmentList grouped={grouped} items={items} loading={loading} />
                      </div>
                    </div>
                  </Popup>
                </Map>

                {/* ── marquee ── */}
                <div
                  className="ao-marquee-bar"
                  onMouseEnter={() => { pausedRef.current = true; }}
                  onMouseLeave={() => { pausedRef.current = false; }}
                >
                  <div className="ao-marquee-track" ref={marqueeRef}>
                    {[...stores, ...stores].map((store, i) => {
                      const realIdx = i % stores.length;
                      const isActive = store.id === popupId;
                      return (
                        <div
                          key={`${store.id}-${i < stores.length ? 'a' : 'b'}`}
                          className={`ao-marquee-card${isActive ? ' ao-marquee-card--active' : ''}`}
                          onClick={() => selectStore(store, realIdx)}
                        >
                          <span className="ao-card-dot" style={{ background: '#6366f1' }} />
                          <span className="ao-card-name">{store.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="ao-category-label">
                  <span className="ao-category-dot" />
                  POI Matchmaking
                </div>
              </div>

              {/* ── side panel: identity distribution ── */}
              <div className="ao-side-panel" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div className="ao-panel-header">
                  <div>
                    <div className="ao-popup-name">{popupStore.name}</div>
                    {popupStore.address && (
                      <div className="ao-popup-address">{popupStore.address}</div>
                    )}
                  </div>
                  <button className="ao-panel-close" onClick={closePopup}>×</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
                  <IdentityPanel
                    personaFit={personaFit}
                    personaWeights={personaWeights}
                    satisfactionScore={satisfactionScore}
                    items={items}
                    loading={loading}
                  />
                </div>
              </div>
            </>
          )}
        </MatchmakingDataProvider>
      ) : (
        <div className="ao-map-area">
          <Map
            ref={mapRef}
            initialViewState={{ longitude: 4.47, latitude: 50.5, zoom: 7.5 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            projection="mercator"
            onClick={() => closePopup()}
          >
            <NavigationControl position="top-right" />
            {stores.map((store, idx) => {
              const isActive = store.id === popupId;
              const size = isActive ? 44 : 32;
              return (
                <Marker
                  key={store.id}
                  longitude={store.lng}
                  latitude={store.lat}
                  anchor="bottom"
                  onClick={e => { e.originalEvent.stopPropagation(); selectStore(store, idx); }}
                >
                  <div
                    className={`ao-pin${isActive ? ' ao-pin--active' : ''}`}
                    style={{ '--pin-color': isActive ? '#6366f1' : '#94a3b8', '--pin-size': `${size}px` }}
                  >
                    <div className="ao-pin-dot" />
                    <div className="ao-pin-tail" />
                  </div>
                </Marker>
              );
            })}
          </Map>

          {/* ── marquee ── */}
          <div
            className="ao-marquee-bar"
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            <div className="ao-marquee-track" ref={marqueeRef}>
              {[...stores, ...stores].map((store, i) => {
                const realIdx = i % stores.length;
                const isActive = store.id === popupId;
                return (
                  <div
                    key={`${store.id}-${i < stores.length ? 'a' : 'b'}`}
                    className={`ao-marquee-card${isActive ? ' ao-marquee-card--active' : ''}`}
                    onClick={() => selectStore(store, realIdx)}
                  >
                    <span className="ao-card-dot" style={{ background: '#6366f1' }} />
                    <span className="ao-card-name">{store.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ao-category-label">
            <span className="ao-category-dot" />
            POI Matchmaking
          </div>
        </div>
      )}
    </div>
  );
}
