// src/Dashboard/AssortmentOverview.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAssortment } from '../context/AssortmentContext';
import { api } from '../apiService';
import { iconFor } from './ToAdd/utils/iconLoader';
import colruytLogo from './Icons/colruyt.png';
import delhaizeLogo from './Icons/delhaize.png';
import albertHeijnLogo from './Icons/albert_heijn.png';
import okayLogo from './Icons/okay.jpg';
import jumboLogo from './Icons/jumbo.jpg';
import './AssortmentOverview.css';

const LOGO_MAP = {
    colruyt: colruytLogo,
    delhaize: delhaizeLogo,
    albert_heijn: albertHeijnLogo,
    okay: okayLogo,
    jumbo: jumboLogo,
};

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN ||
    'pk.eyJ1IjoibWlndWVsYW1hbnQiLCJhIjoiY21tb29xOTlzMGVweTJvc2IweGEwb2s2ZyJ9.3j5JPLEn0_D6_-5d_OEuxg';

// ─── helpers ────────────────────────────────────────────────────────────────

function scoreColor(score) {
    if (score === null) return '#6b7280';          // gray — not computed
    if (score >= 0.75)  return '#22c55e';          // green
    if (score >= 0.45)  return '#f97316';          // orange
    return '#ef4444';                              // red
}

function tierLabel(score) {
    if (score === null) return null;
    if (score >= 0.75)  return 'green';
    if (score >= 0.45)  return 'orange';
    return 'red';
}

const PERSONA_CFG = [
    { key: 'belgian', name: 'Belgian', iconToken: 'BELGIUM' },
    { key: 'french',  name: 'French',  iconToken: 'FRANCE' },
    { key: 'german',  name: 'German',  iconToken: 'GERMANY' },
    { key: 'dutch',   name: 'Dutch',   iconToken: 'NETHERLANDS' },
];

function PersonaSlider({ iconToken, name, value, onChange }) {
    const icon = iconFor(iconToken);
    return (
        <div className="ao-persona-row">
            <span className="ao-persona-label">
                {icon
                    ? <img src={icon} alt={name} width={20} height={14} className="ao-persona-flag" />
                    : null}
                {name}
            </span>
            <input
                type="range" min={0} max={100} step={1}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="ao-persona-slider"
            />
            <span className="ao-persona-value">{value}</span>
        </div>
    );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function AssortmentOverview({ category, onSelectStore, onGoBack, scores = {}, onScoreUpdate }) {
    const { assortments, loaded, setActiveAssortmentId } = useAssortment();

    const [activeIdx, setActiveIdx]     = useState(() => {
        const saved = sessionStorage.getItem('ao_lastStoreId');
        if (!saved) return 0;
        const id = Number(saved);
        const idx = assortments.filter(a => a.lat != null && a.lng != null).findIndex(a => a.id === id);
        return idx >= 0 ? idx : 0;
    });
    const [popupId, setPopupId]         = useState(() => {
        const saved = sessionStorage.getItem('ao_lastStoreId');
        return saved ? Number(saved) : null;
    });
    const [personas, setPersonas]       = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving]           = useState(false);
    const [saveOk, setSaveOk]           = useState(false);

    const mapRef     = useRef(null);
    const marqueeRef = useRef(null);
    const pausedRef  = useRef(false);

    const logoKey = localStorage.getItem('logo');
    const logoSrc = LOGO_MAP[logoKey] ?? null;

    const stores = assortments.filter(a => a.lat != null && a.lng != null);

    useEffect(() => {
        if (!stores[activeIdx] || !mapRef.current) return;
        mapRef.current.flyTo({
            center: [stores[activeIdx].lng, stores[activeIdx].lat],
            zoom: 12,
            duration: 800,
        });
    }, [activeIdx, stores]);

    const openPopup = useCallback((store) => {
        setPopupId(store.id);
        setSaveOk(false);
        setPersonas({
            belgian: store.belgian ?? 25,
            french:  store.french  ?? 25,
            german:  store.german  ?? 25,
            dutch:   store.dutch   ?? 25,
        });
    }, []);

    const closePopup = useCallback(() => {
        setPopupId(null);
        setPersonas(null);
        setSaveOk(false);
    }, []);

    // ── marquee auto-scroll ──
    useEffect(() => {
        const el = marqueeRef.current;
        if (!el || stores.length === 0) return;
        let rafId;
        const step = () => {
            if (!pausedRef.current) {
                el.scrollLeft += 0.5;
                // seamless loop: when we've scrolled past the first copy, reset
                const halfWidth = el.scrollWidth / 2;
                if (el.scrollLeft >= halfWidth) {
                    el.scrollLeft -= halfWidth;
                }
            }
            rafId = requestAnimationFrame(step);
        };
        rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    }, [stores.length]);

    async function savePersonas() {
        if (!personas || !popupId) return;
        setSaving(true);
        try {
            await api.patch(`/api/assortments/${popupId}/persona-weights`, personas);
            setSaveOk(true);
        } catch {}
        setSaving(false);
    }

    function goToAnalysis(storeId) {
        sessionStorage.setItem('ao_lastStoreId', String(storeId));
        setActiveAssortmentId(storeId);
        onSelectStore(storeId);
    }

    const lastStore = stores.find(s => s.id === popupId) || stores[activeIdx];
    const initialView = lastStore
        ? { longitude: lastStore.lng, latitude: lastStore.lat, zoom: 12 }
        : { longitude: 4.47, latitude: 50.5, zoom: 7.5 };

    const popupStore  = stores.find(s => s.id === popupId) ?? null;
    const popupScore  = popupId != null ? (scores[popupId] ?? null) : null;
    const panelOpen   = popupId !== null;

    // Don't render until assortments have loaded
    if (!loaded) {
        return (
            <div className="ao-wrapper" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif",
            }}>
                <span style={{
                    width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.15)',
                    borderTop: '2.5px solid rgba(255,255,255,0.6)', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', marginRight: 10,
                }} />
                Loading…
            </div>
        );
    }

    return (
        <div className="ao-wrapper">
            {/* ── left store list panel ── */}
            <div className="ao-left-panel">
                {onGoBack && (
                    <button className="ao-left-back" onClick={onGoBack}>
                        ← Back
                    </button>
                )}
                <div className="ao-left-title">Stores</div>
                <div className="ao-left-search">
                    <input
                        type="text"
                        placeholder="Search stores…"
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
                            const score    = scores[store.id] ?? null;
                            const scoreVal = score ? score.sum / score.total : null;
                            const color    = scoreColor(scoreVal);
                            const isActive = idx === activeIdx;

                            return (
                                <div
                                    key={store.id}
                                    className={`ao-left-item${isActive ? ' ao-left-item--active' : ''}`}
                                    onClick={() => { setActiveIdx(idx); openPopup(store); }}
                                >
                                    <span className="ao-left-dot" style={{ background: color }} />
                                    <div className="ao-left-info">
                                        <span className="ao-left-name">{store.name}</span>
                                        {store.address && (
                                            <span className="ao-left-address">{store.address}</span>
                                        )}
                                    </div>
                                    {score && <span className="ao-left-score">{score.sum}/{score.total}</span>}
                                </div>
                            );
                        })
                    }
                </div>
                <div className="ao-left-footer">
                    <button
                        className="ao-left-logout"
                        onClick={() => window.location.assign('/')}
                    >
                        ⏻ Logout
                    </button>
                </div>
            </div>

            {/* ── map area ── */}
            <div className={`ao-map-area${panelOpen ? ' ao-map-area--narrow' : ''}`}>
                <Map
                    ref={mapRef}
                    initialViewState={initialView}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/light-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                    projection="mercator"
                    onClick={() => closePopup()}
                    onLoad={() => {}}
                >
                    <NavigationControl position="top-right" />

                    {stores.map((store, idx) => {
                        const isActive  = idx === activeIdx;
                        const score     = scores[store.id] ?? null;
                        const scoreVal  = score ? score.sum / score.total : null;
                        const color     = scoreColor(scoreVal);
                        const size      = isActive ? 44 : 32;

                        return (
                            <Marker
                                key={store.id}
                                longitude={store.lng}
                                latitude={store.lat}
                                anchor="bottom"
                                onClick={e => { e.originalEvent.stopPropagation(); openPopup(store); setActiveIdx(idx); }}
                            >
                                <div
                                    className={`ao-pin${isActive ? ' ao-pin--active' : ''}`}
                                    style={{ '--pin-color': color, '--pin-size': `${size}px` }}
                                >
                                    <div className="ao-pin-dot">
                                        {logoSrc && <img src={logoSrc} alt="" className="ao-pin-logo" />}
                                    </div>
                                    <div className="ao-pin-tail" />
                                </div>
                            </Marker>
                        );
                    })}

                    {/* compact popup */}
                    {popupStore && (
                        <Popup
                            longitude={popupStore.lng}
                            latitude={popupStore.lat}
                            anchor="bottom"
                            offset={52}
                            closeButton={true}
                            closeOnClick={false}
                            onClose={closePopup}
                            className="ao-popup"
                        >
                            <div className="ao-popup-inner" onClick={e => e.stopPropagation()}>
                                <div className="ao-popup-header">
                                    <div className="ao-popup-name">{popupStore.name}</div>
                                    {popupStore.address && (
                                        <div className="ao-popup-address">{popupStore.address}</div>
                                    )}
                                </div>

                                {popupScore ? (
                                    <div className={`ao-score-badge ao-score-badge--${tierLabel(popupScore.sum / popupScore.total)}`}>
                                        {popupScore.sum}/{popupScore.total}
                                        <span className="ao-score-cat">{category}</span>
                                    </div>
                                ) : (
                                    <div className="ao-score-badge ao-score-badge--gray">
                                        — <span className="ao-score-cat">{category} score not yet computed</span>
                                    </div>
                                )}

                                <button className="ao-btn ao-btn--primary" onClick={() => goToAnalysis(popupStore.id)}>
                                    See analysis →
                                </button>
                            </div>
                        </Popup>
                    )}
                </Map>

                {/* ── top marquee bar ── */}
                <div
                    className="ao-marquee-bar"
                    onMouseEnter={() => { pausedRef.current = true; }}
                    onMouseLeave={() => { pausedRef.current = false; }}
                >
                    <div className="ao-marquee-track" ref={marqueeRef}>
                        {[...stores, ...stores].map((store, i) => {
                            const realIdx  = i % stores.length;
                            const score    = scores[store.id] ?? null;
                            const scoreVal = score ? score.sum / score.total : null;
                            const color    = scoreColor(scoreVal);
                            return (
                                <div
                                    key={`${store.id}-${i < stores.length ? 'a' : 'b'}`}
                                    className={`ao-marquee-card${realIdx === activeIdx ? ' ao-marquee-card--active' : ''}`}
                                    onClick={() => { setActiveIdx(realIdx); openPopup(store); }}
                                >
                                    <span className="ao-card-dot" style={{ background: color }} />
                                    <span className="ao-card-name">{store.name}</span>
                                    {score && <span className="ao-card-score">{score.sum}/{score.total}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── category label top-left (below marquee) ── */}
                <div className="ao-category-label">
                    <span className="ao-category-dot" />
                    {category}
                </div>
            </div>

            {/* ── side panel ── */}
            {panelOpen && popupStore && (
                <div className="ao-side-panel">
                    <div className="ao-panel-header">
                        <div>
                            <div className="ao-popup-name">{popupStore.name}</div>
                            {popupStore.address && (
                                <div className="ao-popup-address">{popupStore.address}</div>
                            )}
                        </div>
                        <button className="ao-panel-close" onClick={closePopup}>×</button>
                    </div>

                    {popupScore ? (
                        <div className={`ao-score-badge ao-score-badge--${tierLabel(popupScore.sum / popupScore.total)}`}>
                            {popupScore.sum}/{popupScore.total}
                            <span className="ao-score-cat">{category}</span>
                        </div>
                    ) : (
                        <div className="ao-score-badge ao-score-badge--gray">
                            — <span className="ao-score-cat">{category} score not yet computed</span>
                        </div>
                    )}

                    {personas && (
                        <div className="ao-personas">
                            <div className="ao-personas-title">Persona distribution</div>
                            {(() => {
                                const changePersona = (key, v) => setPersonas(p => {
                                    const others = (p.belgian + p.french + p.german + p.dutch) - p[key];
                                    const capped = Math.min(v, Math.max(0, 100 - others));
                                    return { ...p, [key]: capped };
                                });
                                const total = personas.belgian + personas.french + personas.german + personas.dutch;
                                return (<>
                                    {PERSONA_CFG.map(({ key, name, iconToken }) => (
                                        <PersonaSlider
                                            key={key}
                                            iconToken={iconToken}
                                            name={name}
                                            value={personas[key]}
                                            onChange={v => changePersona(key, v)}
                                        />
                                    ))}
                                    <div className="ao-persona-total" style={{ color: total > 100 ? '#ef4444' : total === 100 ? '#22c55e' : '#64748b' }}>
                                        Total: {total}/100
                                    </div>
                                </>);
                            })()}
                            <button
                                className={`ao-save-btn${saveOk ? ' ao-save-btn--ok' : ''}`}
                                onClick={savePersonas}
                                disabled={saving}
                            >
                                {saving ? 'Saving…' : saveOk ? '✓ Saved' : 'Save targets'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
