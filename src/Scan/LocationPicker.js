import React, { useEffect, useRef } from 'react';

export default function LocationPicker({ location, onSelect, onClear }) {
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const init = () => {
      const g = window.google;
      if (!g?.maps?.places || cancelled) return;

      if (mapRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = new g.maps.Map(mapRef.current, {
          center: { lat: 50.85, lng: 4.35 },
          zoom: 8,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current.addListener('click', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          if (markerRef.current) markerRef.current.setPosition(e.latLng);
          else markerRef.current = new g.maps.Marker({ position: e.latLng, map: mapInstanceRef.current });

          const geocoder = new g.maps.Geocoder();
          geocoder.geocode({ location: e.latLng }, (results) => {
            if (cancelled) return;
            const comp = {};
            const r = results?.[0];
            if (r) for (const c of (r.address_components || [])) for (const t of c.types) comp[t] = { long: c.long_name, short: c.short_name };
            onSelect({
              name: r?.formatted_address?.split(',')[0] || 'Dropped pin',
              place_id: r?.place_id || '', route: comp.route?.long || '',
              street_number: comp.street_number?.long || '', postal_code: comp.postal_code?.long || '',
              locality: comp.locality?.long || '', latitude: lat, longitude: lng,
              country: comp.country?.long || '', country_iso: comp.country?.short || '',
              formatted_address: r?.formatted_address || `${lat}, ${lng}`,
              phone_number: '', website: '', opening_hours: '',
              num_ratings: null, price_level: null, types: '',
            });
          });
        });
      }

      if (inputRef.current && !inputRef.current._autocompleteInit) {
        inputRef.current._autocompleteInit = true;
        const ac = new g.maps.places.Autocomplete(inputRef.current, {
          types: ['establishment'],
          fields: ['name', 'place_id', 'geometry', 'address_components', 'formatted_address',
                   'formatted_phone_number', 'international_phone_number', 'website',
                   'opening_hours', 'user_ratings_total', 'price_level', 'types'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place?.geometry) return;
          const comp = {};
          for (const c of (place.address_components || [])) for (const t of c.types) comp[t] = { long: c.long_name, short: c.short_name };
          const loc = {
            name: place.name || '', place_id: place.place_id || '',
            route: comp.route?.long || '', street_number: comp.street_number?.long || '',
            postal_code: comp.postal_code?.long || '',
            locality: comp.locality?.long || comp.administrative_area_level_1?.long || '',
            latitude: place.geometry.location.lat(), longitude: place.geometry.location.lng(),
            country: comp.country?.long || '', country_iso: comp.country?.short || '',
            formatted_address: place.formatted_address || '',
            phone_number: place.formatted_phone_number || place.international_phone_number || '',
            website: place.website || '',
            opening_hours: (place.opening_hours?.weekday_text || []).join(' | '),
            num_ratings: place.user_ratings_total ?? null,
            price_level: place.price_level ?? null,
            types: (place.types || []).join(', '),
          };
          onSelect(loc);
          if (mapInstanceRef.current) {
            const pos = { lat: loc.latitude, lng: loc.longitude };
            mapInstanceRef.current.setCenter(pos);
            mapInstanceRef.current.setZoom(16);
            if (markerRef.current) markerRef.current.setPosition(pos);
            else markerRef.current = new g.maps.Marker({ position: pos, map: mapInstanceRef.current });
          }
        });
      }
    };

    if (window.google?.maps?.places) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) { clearInterval(interval); init(); }
      }, 200);
      return () => { cancelled = true; clearInterval(interval); };
    }

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a venue or click on the map..."
        className="scan-location-input"
      />
      {location && (
        <div className="scan-location-selected">
          <div className="scan-location-info">
            <div className="scan-location-name">{location.name}</div>
            <div className="scan-location-address">{location.formatted_address}</div>
          </div>
          <button className="scan-location-clear" onClick={() => {
            onClear();
            if (inputRef.current) { inputRef.current.value = ''; inputRef.current.style.display = ''; }
            if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
            if (mapInstanceRef.current) { mapInstanceRef.current.setCenter({ lat: 50.85, lng: 4.35 }); mapInstanceRef.current.setZoom(8); }
          }} title="Clear">x</button>
        </div>
      )}
      <div ref={mapRef} className="scan-map-preview" />
    </div>
  );
}
