import React, { useState, useEffect, useMemo } from 'react';
import { menuItems } from 'apiService';
import { useAssortment } from '../../context/AssortmentContext';
import { useMenuConfig } from './useMenuConfig';
import MenuConfigBar from './MenuConfigBar';
import MenuPreview from './MenuPreview';
import './DigitalTwin.css';

const DigitalTwin = () => {
  const { activeAssortmentId } = useAssortment() || {};
  const { config, loading: configLoading, update: updateConfig } = useMenuConfig(activeAssortmentId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeAssortmentId) return;
    let cancelled = false;
    setLoading(true);

    menuItems({ pageSize: 500, assortmentId: activeAssortmentId })
      .then(data => { if (!cancelled) setItems(data.items || []); })
      .catch(err => console.error('[DigitalTwin] fetch error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeAssortmentId]);

  // Group items into pages by page_number, sorted by sort_order
  const pages = useMemo(() => {
    const panelCount = { single: 1, bifold: 2, trifold: 3, quadfold: 4 }[config?.format] || 1;
    const map = {};
    for (let i = 0; i < panelCount; i++) map[i] = [];

    for (const item of items) {
      const pg = Math.max(0, Math.min((item.page_number || 1) - 1, panelCount - 1));
      if (!map[pg]) map[pg] = [];
      map[pg].push(item);
    }

    // Sort each page by sort_order, then by category + name
    for (const pg of Object.values(map)) {
      pg.sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        const catCmp = (a.category || '').localeCompare(b.category || '');
        if (catCmp !== 0) return catCmp;
        return (a.item_name || '').localeCompare(b.item_name || '');
      });
    }

    return map;
  }, [items, config?.format]);

  if (configLoading || loading) {
    return <div className="twin-loading">Loading menu preview...</div>;
  }

  if (!config) {
    return <div className="twin-loading">No menu configuration found.</div>;
  }

  return (
    <div className="twin-container">
      <h2 className="twin-title">Menu Preview</h2>
      <MenuConfigBar config={config} onUpdate={updateConfig} />
      <MenuPreview
        format={config.format}
        columns={config.columns}
        showEuro={config.show_euro}
        decimalSep={config.decimal_sep}
        pages={pages}
      />
    </div>
  );
};

export default DigitalTwin;
