import React, { useState } from 'react';
import { useAssortment } from '../context/AssortmentContext';
import Layout from '../Dashboard/Layout';
import VenuePicker from './VenuePicker';
import './OptimizeAssortment.css';

const OptimizeAssortment = () => {
  const { activeAssortmentId, activeAssortment, setActiveAssortmentId } = useAssortment();
  const [venueConfirmed, setVenueConfirmed] = useState(false);

  const handleSelectVenue = (storeId) => {
    setActiveAssortmentId(storeId);
  };

  const handleConfirm = () => {
    if (activeAssortmentId) setVenueConfirmed(true);
  };

  const handleBackToVenues = () => {
    setVenueConfirmed(false);
  };

  // Step 2: venue confirmed → show Layout (CategoryGrid + Digital Twin)
  if (venueConfirmed && activeAssortmentId) {
    return (
      <div className="oa-page">
        <div className="oa-venue-bar">
          <button className="oa-venue-bar__back" onClick={handleBackToVenues}>
            &larr; Change venue
          </button>
          <span className="oa-venue-bar__name">
            {activeAssortment?.name || `Venue #${activeAssortmentId}`}
          </span>
          {activeAssortment?.address && (
            <span className="oa-venue-bar__address">{activeAssortment.address}</span>
          )}
        </div>
        <Layout skipOverview />
      </div>
    );
  }

  // Step 1: pick a venue
  return (
    <VenuePicker
      onSelect={handleSelectVenue}
      onConfirm={handleConfirm}
      selectedId={activeAssortmentId}
    />
  );
};

export default OptimizeAssortment;
