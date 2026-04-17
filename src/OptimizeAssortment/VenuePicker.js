import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAssortment } from '../context/AssortmentContext';
import albertHeijnLogo from '../Dashboard/Icons/albert_heijn.png';
import colruytLogo from '../Dashboard/Icons/colruyt.png';
import delhaizeLogo from '../Dashboard/Icons/delhaize.png';

const BRAND_LOGOS = { albert_heijn: albertHeijnLogo, colruyt: colruytLogo, delhaize: delhaizeLogo };

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN ||
  'pk.eyJ1IjoibWlndWVsYW1hbnQiLCJhIjoiY21tb29xOTlzMGVweTJvc2IweGEwb2s2ZyJ9.3j5JPLEn0_D6_-5d_OEuxg';

const VenuePicker = ({ onSelect, onConfirm, selectedId }) => {
  const navigate = useNavigate();
  const { assortments, loaded } = useAssortment();
  const logoSrc = BRAND_LOGOS[localStorage.getItem('logo')] || null;
  const [search, setSearch] = useState('');
  const [popupId, setPopupId] = useState(selectedId);
  const mapRef = useRef(null);

  const stores = assortments.filter(a => a.lat != null && a.lng != null);

  const filtered = stores.filter(s =>
    !search ||
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const popupStore = stores.find(s => s.id === popupId) ?? null;
  const selectedStore = stores.find(s => s.id === selectedId);

  const initialView = selectedStore
    ? { longitude: selectedStore.lng, latitude: selectedStore.lat, zoom: 12 }
    : { longitude: 4.47, latitude: 50.5, zoom: 7.5 };

  function selectStore(store) {
    setPopupId(store.id);
    onSelect(store.id);
    mapRef.current?.flyTo({ center: [store.lng, store.lat], zoom: 13, duration: 800 });
  }

  if (!loaded) {
    return (
      <div className="vp-loading">
        <span className="vp-spinner" /> Loading venues...
      </div>
    );
  }

  return (
    <div className="vp-wrapper">
      {/* ── left panel: store list ── */}
      <div className="vp-left">
        <div className="vp-left__title">Select a venue</div>
        <div className="vp-left__search">
          <input
            type="text"
            placeholder="Search venues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="vp-left__input"
          />
        </div>
        <div className="vp-left__list">
          {filtered.map(store => (
            <div
              key={store.id}
              className={`vp-store${store.id === selectedId ? ' vp-store--active' : ''}`}
              onClick={() => selectStore(store)}
            >
              <div className="vp-store__name">{store.name || `Venue #${store.id}`}</div>
              {store.address && <div className="vp-store__addr">{store.address}</div>}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="vp-empty">No venues found</div>
          )}
        </div>

        <div className="vp-left__footer">
          <button
            className="vp-confirm-btn"
            disabled={!selectedId}
            onClick={onConfirm}
          >
            {selectedId ? 'See menu →' : 'Select a venue first'}
          </button>
          <button
            className="vp-link-btn"
            onClick={() => navigate('/claim')}
          >
            + Link a new venue
          </button>
        </div>
      </div>

      {/* ── map ── */}
      <div className="vp-map">
        <Map
          ref={mapRef}
          initialViewState={initialView}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {stores.map(store => {
            const isSelected = store.id === selectedId;
            return (
              <Marker
                key={store.id}
                longitude={store.lng}
                latitude={store.lat}
                anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); selectStore(store); }}
              >
                <div
                  className={`vp-pin${isSelected ? ' vp-pin--active' : ''}`}
                  style={{ '--pin-size': isSelected ? '40px' : '28px' }}
                >
                  {logoSrc
                    ? <img src={logoSrc} alt="" className="vp-pin-logo" />
                    : <div className="vp-pin-dot" />
                  }
                  <div className="vp-pin-tail" />
                </div>
              </Marker>
            );
          })}

          {popupStore && (
            <Popup
              longitude={popupStore.lng}
              latitude={popupStore.lat}
              anchor="bottom"
              offset={48}
              closeButton
              closeOnClick={false}
              onClose={() => setPopupId(null)}
              className="vp-popup"
            >
              <div className="vp-popup-inner">
                <div className="vp-popup-name">{popupStore.name}</div>
                {popupStore.address && <div className="vp-popup-addr">{popupStore.address}</div>}
                <button className="vp-popup-btn" onClick={onConfirm}>
                  See menu →
                </button>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
};

export default VenuePicker;
