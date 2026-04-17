import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { menuItems, extractTwin, updateMenuConfig, updateMenuItemsLayout, loadTwin } from 'apiService';
import { useAssortment } from '../../context/AssortmentContext';
import { useMenuConfig } from './useMenuConfig';
import MenuConfigBar from './MenuConfigBar';
import MenuPreview from './MenuPreview';
import ScanTwinPreview from '../../Scan/ScanTwinPreview';
import FormatPicker, { FORMAT_CATALOG } from './FormatPicker';
import TwinUploader from './TwinUploader';
import { usePdfExport } from './usePdfExport';
import './DigitalTwin.css';

const DigitalTwin = () => {
  const { activeAssortmentId } = useAssortment() || {};
  const { config, loading: configLoading, update: saveConfig } = useMenuConfig(activeAssortmentId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const { exportPdf, exporting } = usePdfExport();
  const [savedTwin, setSavedTwin] = useState(null);

  // Try to load a saved twin structure first
  useEffect(() => {
    if (!activeAssortmentId) return;
    let cancelled = false;

    loadTwin(activeAssortmentId)
      .then(data => {
        if (!cancelled && data?.total_items > 0) {
          setSavedTwin(data);
        }
      })
      .catch(() => { /* No saved twin — fall back to flat view */ });

    return () => { cancelled = true; };
  }, [activeAssortmentId]);

  // Fetch menu items (fallback for venues without a saved twin)
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

  // When config loads with an existing fold_type, auto-select it
  useEffect(() => {
    if (config?.fold_type && !selectedFormat) {
      setSelectedFormat(config.fold_type);
    }
  }, [config?.fold_type]);

  const formatDef = FORMAT_CATALOG.find(f => f.id === selectedFormat);
  const panelCount = formatDef ? formatDef.pages : 1;

  // Group items into pages
  const pages = useMemo(() => {
    const map = {};
    for (let i = 0; i < panelCount; i++) map[i] = [];

    for (const item of items) {
      const pg = Math.max(0, Math.min((item.page_number || 1) - 1, panelCount - 1));
      if (!map[pg]) map[pg] = [];
      map[pg].push(item);
    }

    for (const pg of Object.values(map)) {
      pg.sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        const catCmp = (a.category || '').localeCompare(b.category || '');
        if (catCmp !== 0) return catCmp;
        return (a.item_name || '').localeCompare(b.item_name || '');
      });
    }

    return map;
  }, [items, panelCount]);

  // Handle fold type change — redistribute items proportionally
  const handleFormatChange = useCallback(async (newFormat) => {
    const newDef = FORMAT_CATALOG.find(f => f.id === newFormat);
    if (!newDef) return;
    const oldPages = panelCount;
    const newPages = newDef.pages;

    setSelectedFormat(newFormat);

    // Save fold_type to config
    await saveConfig({ fold_type: newFormat });

    // Redistribute items proportionally if page count changed
    if (oldPages !== newPages && items.length > 0) {
      const updates = items.map(item => {
        const oldPage = item.page_number || 1;
        // Map proportionally: page 3 of 6 → page 2 of 4
        const newPage = Math.max(1, Math.min(newPages,
          Math.ceil((oldPage / oldPages) * newPages)
        ));
        return {
          id_menu_item: item.id_menu_item,
          page_number: newPage,
          sort_order: item.sort_order || 0,
        };
      });

      try {
        await updateMenuItemsLayout(updates);
        // Update local state
        setItems(prev => prev.map(item => {
          const upd = updates.find(u => u.id_menu_item === item.id_menu_item);
          return upd ? { ...item, page_number: upd.page_number } : item;
        }));
      } catch (err) {
        console.error('[DigitalTwin] redistribute error:', err);
      }
    }
  }, [panelCount, items, saveConfig]);

  // Handle AI extraction result
  const handleExtractResult = useCallback(async (result) => {
    // Save styling + fold_type to config
    const configPatch = { fold_type: result.fold_type };
    if (result.styling) {
      if (result.styling.bg_color)     configPatch.bg_color     = result.styling.bg_color;
      if (result.styling.text_color)   configPatch.text_color   = result.styling.text_color;
      if (result.styling.header_color) configPatch.header_color = result.styling.header_color;
      if (result.styling.accent_color) configPatch.accent_color = result.styling.accent_color;
      // Map font_style to a font family
      const fontMap = {
        'serif': 'Playfair Display',
        'sans-serif': 'Inter',
        'script': 'Dancing Script',
        'display': 'Space Grotesk',
        'monospace': 'JetBrains Mono',
      };
      if (result.styling.font_style) {
        configPatch.font_family = fontMap[result.styling.font_style] || 'Inter';
      }
    }

    await saveConfig(configPatch);
    setSelectedFormat(result.fold_type);
    setShowUploader(false);

    // TODO: in future, the extracted items could be matched against the product DB
    // and inserted into menu_items. For now, we just detect + style.
  }, [saveConfig]);

  // ── Format picker screen ──
  if (!selectedFormat) {
    return (
      <FormatPicker
        onSelect={(fmt) => {
          setSelectedFormat(fmt);
          saveConfig({ fold_type: fmt });
        }}
        onUpload={() => setShowUploader(true)}
        showUploader={showUploader}
        onExtractResult={handleExtractResult}
        onCloseUploader={() => setShowUploader(false)}
      />
    );
  }

  // ── Preview screen ──
  if (configLoading || loading) {
    return <div className="twin-loading">Loading menu preview...</div>;
  }

  // Build styling object from config
  const styling = {
    bgColor:      config?.bg_color      || '#faf8f4',
    textColor:    config?.text_color     || '#14213d',
    headerColor:  config?.header_color   || '#c4a96a',
    accentColor:  config?.accent_color   || '#c4a96a',
    fontFamily:   config?.font_family    || 'Inter',
    fontSizeBase: config?.font_size_base || 13,
  };

  return (
    <div className="twin-container">
      <div className="twin-topbar">
        <button className="twin-back" onClick={() => setSelectedFormat(null)}>
          &larr; All formats
        </button>
        <h2 className="twin-title">{formatDef.label}</h2>
        <button className="twin-upload-btn" onClick={() => setShowUploader(true)}>
          Upload photos
        </button>
        <button
          className="twin-export-btn"
          onClick={() => exportPdf('.flat-preview__cards', `menu_${selectedFormat}.pdf`)}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      <MenuConfigBar
        config={{ ...config, fold_type: selectedFormat }}
        onUpdate={saveConfig}
        hideFormat
      />

      {showUploader && (
        <TwinUploader
          onResult={handleExtractResult}
          onClose={() => setShowUploader(false)}
        />
      )}

      {savedTwin ? (
        <ScanTwinPreview
          visionExtractResult={savedTwin}
          onUpdateResult={setSavedTwin}
          foldResult={{ foldType: savedTwin.fold_type || selectedFormat }}
          storedCalibrationScale={savedTwin.styling?.calibration_scale}
        />
      ) : (
        <MenuPreview
          format={selectedFormat}
          columns={config?.columns ?? 1}
          showEuro={config?.show_euro ?? true}
          decimalSep={config?.decimal_sep ?? 'comma'}
          pages={pages}
          styling={styling}
        />
      )}

      {/* Fold type quick-switcher */}
      <div className="twin-format-switcher">
        <span className="twin-format-switcher__label">Switch format:</span>
        <div className="twin-format-switcher__options">
          {FORMAT_CATALOG.map(f => (
            <button
              key={f.id}
              className={`twin-format-switcher__btn ${f.id === selectedFormat ? 'twin-format-switcher__btn--active' : ''}`}
              onClick={() => handleFormatChange(f.id)}
              title={f.desc}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
