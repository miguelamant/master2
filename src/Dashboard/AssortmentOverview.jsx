// src/Dashboard/AssortmentOverview.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAssortment } from '../context/AssortmentContext';
import { api } from '../apiService';
import './AssortmentOverview.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

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

function PersonaSlider({ label, value, onChange }) {
    return (
        <div className="ao-persona-row">
            <span className="ao-persona-label">{label}</span>
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

export default function AssortmentOverview({ category, onSelectStore, onViewMenu }) {
    const { assortments, setActiveAssortmentId } = useAssortment();

    // index of the "active" (slider-focused) store
    const [activeIdx, setActiveIdx]     = useState(0);
    // which pin is showing the popup
    const [popupId, setPopupId]         = useState(null);
    // session-level score cache: { [assortmentId]: { sum, total } }
    const [scores]                      = useState(() => ({}));
    // persona edit state for the open popup
    const [personas, setPersonas]       = useState(null);   // { belgian, french, german, dutch }
    const [saving, setSaving]           = useState(false);
    const [saveOk, setSaveOk]           = useState(false);

    const mapRef = useRef(null);

    const stores = assortments.filter(a => a.lat != null && a.lng != null);

    // sync activeIdx when assortments load
    useEffect(() => {
        if (stores.length > 0) setActiveIdx(0);
    }, [stores.length]);

    // fly map to active store
    useEffect(() => {
        if (!stores[activeIdx] || !mapRef.current) return;
        mapRef.current.flyTo({
            center: [stores[activeIdx].lng, stores[activeIdx].lat],
            zoom: 12,
            duration: 800,
        });
    }, [activeIdx, stores]);

    // open popup → load its persona values
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

    // slider navigation
    const prev = () => setActiveIdx(i => Math.max(0, i - 1));
    const next = () => setActiveIdx(i => Math.min(stores.length - 1, i + 1));

    // save persona targets
    async function savePersonas() {
        if (!personas || !popupId) return;
        setSaving(true);
        try {
            await api.patch(`/api/assortments/${popupId}/persona-weights`, personas);
            setSaveOk(true);
        } catch {}
        setSaving(false);
    }

    // navigate to analysis
    function goToAnalysis(storeId) {
        setActiveAssortmentId(storeId);
        onSelectStore(storeId);
    }

    // navigate to menu
    function goToMenu(storeId) {
        setActiveAssortmentId(storeId);
        onViewMenu(storeId);
    }

    // center of Belgium as default view
    const initialView = { longitude: 4.47, latitude: 50.5, zoom: 7.5 };

    const popupStore = stores.find(s => s.id === popupId) ?? null;
    const popupScore = popupId != null ? (scores[popupId] ?? null) : null;

    return (
        <div className="ao-wrapper">
            {/* ── map ── */}
            <Map
                ref={mapRef}
                initialViewState={initialView}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={() => closePopup()}
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
                                <div className="ao-pin-dot" />
                                {score && (
                                    <div className="ao-pin-score">
                                        {score.sum}/{score.total}
                                    </div>
                                )}
                                <div className="ao-pin-tail" />
                            </div>
                        </Marker>
                    );
                })}

                {/* popup */}
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

                            {/* score badge */}
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

                            {/* persona targets */}
                            {personas && (
                                <div className="ao-personas">
                                    <div className="ao-personas-title">Persona targets</div>
                                    <PersonaSlider label="🇧🇪 Belgian" value={personas.belgian} onChange={v => setPersonas(p => ({ ...p, belgian: v }))} />
                                    <PersonaSlider label="🇫🇷 French"  value={personas.french}  onChange={v => setPersonas(p => ({ ...p, french: v }))} />
                                    <PersonaSlider label="🇩🇪 German"  value={personas.german}  onChange={v => setPersonas(p => ({ ...p, german: v }))} />
                                    <PersonaSlider label="🇳🇱 Dutch"   value={personas.dutch}   onChange={v => setPersonas(p => ({ ...p, dutch: v }))} />
                                    <button
                                        className={`ao-save-btn${saveOk ? ' ao-save-btn--ok' : ''}`}
                                        onClick={savePersonas}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving…' : saveOk ? '✓ Saved' : 'Save targets'}
                                    </button>
                                </div>
                            )}

                            <div className="ao-popup-actions">
                                <button className="ao-btn ao-btn--secondary" onClick={() => goToMenu(popupStore.id)}>
                                    See assortment
                                </button>
                                <button className="ao-btn ao-btn--primary" onClick={() => goToAnalysis(popupStore.id)}>
                                    See analysis →
                                </button>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* ── bottom slider bar ── */}
            <div className="ao-slider-bar">
                <button className="ao-slider-arrow" onClick={prev} disabled={activeIdx === 0}>‹</button>

                <div className="ao-slider-track">
                    {stores.map((store, idx) => {
                        const score    = scores[store.id] ?? null;
                        const scoreVal = score ? score.sum / score.total : null;
                        const color    = scoreColor(scoreVal);
                        return (
                            <div
                                key={store.id}
                                className={`ao-slider-chip${idx === activeIdx ? ' ao-slider-chip--active' : ''}`}
                                onClick={() => { setActiveIdx(idx); openPopup(store); }}
                            >
                                <span className="ao-chip-dot" style={{ background: color }} />
                                <span className="ao-chip-name">{store.name}</span>
                                {score && <span className="ao-chip-score">{score.sum}/{score.total}</span>}
                            </div>
                        );
                    })}
                </div>

                <button className="ao-slider-arrow" onClick={next} disabled={activeIdx === stores.length - 1}>›</button>
            </div>

            {/* ── category label top-left ── */}
            <div className="ao-category-label">
                <span className="ao-category-dot" />
                {category}
            </div>
        </div>
    );
}
