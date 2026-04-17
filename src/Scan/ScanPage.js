import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../apiService';
import LocationPicker from './LocationPicker';
import ScanTwinPreview from './ScanTwinPreview';
import './ScanPage.css';

// ── Image upload ────────────────────────────────────────────────────────────

function PhotoUploader({ images, setImages }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files) => {
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const { data } = await api.post('/api/scan/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const imgEntry = {
          imageId: data.imageId,
          imageUrl: data.imageUrl,
          localPreview: URL.createObjectURL(file),
          fileName: file.name,
        };
        setImages(prev => [...prev, imgEntry]);
      } catch (e) {
        console.error('Upload failed:', e);
      }
    }
    setUploading(false);
  }, [setImages]);

  const rotateImage = useCallback(async (imageId) => {
    const img = images.find(i => i.imageId === imageId);
    if (!img) return;
    try {
      const { data } = await api.post('/api/scan/rotate', { imageUrl: img.imageUrl });
      setImages(prev => prev.map(i =>
        i.imageId === imageId
          ? { ...i, imageUrl: data.imageUrl, localPreview: data.imageUrl }
          : i
      ));
    } catch (e) {
      console.error('Rotate failed:', e);
    }
  }, [images, setImages]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    handleFiles([...e.dataTransfer.files].filter(f => f.type.startsWith('image/')));
  }, [handleFiles]);

  return (
    <div>
      <div
        className="scan-dropzone"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="scan-dropzone__text">
          <strong>Click to browse</strong> or drag & drop menu card photos
        </div>
        {uploading && <div className="scan-status" style={{ marginTop: 8 }}>Uploading...</div>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles([...e.target.files])}
      />
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          {images.map(img => (
            <div key={img.imageId} style={{ position: 'relative', width: 140 }}>
              <img
                src={img.localPreview}
                alt={img.fileName}
                className="scan-thumb"
                style={{ border: '3px solid #e5e7eb', borderRadius: 8, width: '100%' }}
              />
              <button
                onClick={() => rotateImage(img.imageId)}
                title="Rotate 90°"
                style={{
                  position: 'absolute', top: 4, left: 4, fontSize: 14, lineHeight: 1,
                  width: 24, height: 24, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >&#8635;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Items table ─────────────────────────────────────────────────────────────

function ItemsTable({ items, setItems }) {
  const update = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const remove = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  if (items.length === 0) return null;

  return (
    <div className="scan-table-wrap">
      <table className="scan-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Box</th>
            <th>Pos</th>
            <th>Category</th>
            <th style={{ minWidth: 200 }}>Product Name</th>
            <th style={{ minWidth: 150 }}>Description</th>
            <th style={{ width: 80 }}>Price (ct)</th>
            <th style={{ width: 40 }}>Conf</th>
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const conf = item.confidence ?? 100;
            const rowBg = conf < 50 ? 'rgba(239,68,68,0.12)' : conf < 70 ? 'rgba(245,158,11,0.12)' : 'transparent';
            const confColor = conf < 50 ? '#ef4444' : conf < 70 ? '#f59e0b' : '#22c55e';
            return (
            <tr key={idx} style={{ backgroundColor: rowBg }}>
              <td style={{ color: '#9ca3af' }}>{item.item_count ?? idx + 1}</td>
              <td style={{ color: '#6366f1', textAlign: 'center', fontWeight: 700 }}>{item.textbox ?? ''}</td>
              <td style={{ color: '#9ca3af', textAlign: 'center' }}>{item.position_in_textbox ?? ''}</td>
              <td>
                <input value={item.category_name || ''} onChange={e => update(idx, 'category_name', e.target.value)} />
              </td>
              <td>
                <input value={item.product_name || ''} onChange={e => update(idx, 'product_name', e.target.value)} />
              </td>
              <td>
                <input value={item.product_description || ''} onChange={e => update(idx, 'product_description', e.target.value)} />
              </td>
              <td>
                <input
                  type="number"
                  value={item.product_price ?? ''}
                  onChange={e => update(idx, 'product_price', e.target.value ? Number(e.target.value) : null)}
                />
              </td>
              <td style={{ textAlign: 'center', fontWeight: 600, color: confColor }}>{conf}</td>
              <td>
                <button className="scan-row-delete" onClick={() => remove(idx)}>×</button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function ScanPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState({});
  const [columnCount, setColumnCount] = useState(null);
  const [rectifying, setRectifying] = useState(false);
  const [rectifyResult, setRectifyResult] = useState(null);
  const [detectingCols, setDetectingCols] = useState(false);
  const [detectedCols, setDetectedCols] = useState(null);
  const [inferring, setInferring] = useState(false);
  const [foldResult, setFoldResult] = useState(null);
  const [extractError, setExtractError] = useState(null);
  const [visionExtracting, setVisionExtracting] = useState(false);
  const [visionExtractResult, setVisionExtractResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [calibrationScale, setCalibrationScale] = useState(1);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [pushError, setPushError] = useState(null);
  const [savingTwin, setSavingTwin] = useState(false);
  const [saveTwinResult, setSaveTwinResult] = useState(null);
  const [saveTwinError, setSaveTwinError] = useState(null);

  // Auth gate — redirect to /claim if not logged in
  useEffect(() => {
    api.get('/api/user')
      .then(() => setAuthChecked(true))
      .catch(() => navigate('/claim'));
  }, [navigate]);

  // ── Rectify paper (perspective warp via OpenCV) ────────────────────────
  const handleRectifyPaper = async () => {
    if (images.length === 0) return;
    setRectifying(true);
    setRectifyResult(null);
    setExtractError(null);

    let rectifiedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const img of images) {
      try {
        const { data } = await api.post('/api/scan/rectify-paper', { imageUrl: img.imageUrl });
        if (data.rectified) {
          setImages(prev => prev.map(i =>
            i.imageId === img.imageId
              ? { ...i, imageUrl: data.imageUrl, localPreview: data.imageUrl }
              : i
          ));
          rectifiedCount++;
        } else {
          skippedCount++;
        }
      } catch (e) {
        const detail = e.response?.data?.detail || e.message;
        errors.push(`${img.fileName}: ${detail}`);
      }
    }

    setRectifyResult({ rectifiedCount, skippedCount, errors });
    setRectifying(false);
  };

  // ── Google Vision column detection (all images) ────────────────────────
  const handleDetectCols = async () => {
    if (images.length === 0) return;
    setDetectingCols(true);
    setDetectedCols(null);
    setExtractError(null);

    const results = [];

    for (let idx = 0; idx < images.length; idx++) {
      const img = images[idx];
      try {
        const { data } = await api.post('/api/scan/detect-columns-vision', { imageUrl: img.imageUrl });
        results.push({
          pageIndex: idx,
          imageUrl: data.cropped_url || img.imageUrl,
          displayUrl: img.localPreview,
          imageId: img.imageId,
          fileName: img.fileName,
          columns: data.columns || [],
          gutterDetails: data.gutter_details,
          allSplits: data.all_splits,
          debugWords: data.debug_words,
          priceCount: data.price_count,
          priceClusters: data.price_clusters,
          logos: data.logos || [],
          objects: data.objects || [],
          zoneClassifications: data.zone_classifications || [],
          headerClassifications: data.header_classifications || [],
          imageSize: data.image_size,
          medianWordHeight: data.median_word_height,
          medianLineSpacing: data.median_line_spacing,
          lineHeightRatio: data.line_height_ratio,
        });
      } catch (e) {
        console.error(`Column detection failed for image ${idx}:`, e);
        const detail = e.response?.data?.detail || e.response?.data?.error || e.message;
        setExtractError(`Detection failed for ${img.fileName}: ${detail}`);
      }
    }

    // Enrich columns with zone types (content vs cover)
    for (const page of results) {
      const cols = page.columns || [];
      const debugWords = page.debugWords || [];
      const zoneClassifications = page.zoneClassifications || [];

      for (const col of cols) {
        const matchingZone = zoneClassifications.find(zc =>
          Math.abs(zc.x_start - col.x_start) < 5 && Math.abs(zc.x_end - col.x_end) < 5
        );
        if (matchingZone) {
          col.type = matchingZone.classification === 'menu-items' ? 'content' : matchingZone.classification;
        } else {
          const x0 = col.x_start / 100;
          const x1 = col.x_end / 100;
          const zoneWords = debugWords.filter(w => {
            const wMid = (w.x0_pct + w.x1_pct) / 2 / 100;
            return wMid >= x0 && wMid <= x1;
          });
          const priceCount = zoneWords.filter(w => w.isPrice).length;
          const headerCount = zoneWords.filter(w => w.isHeader).length;
          const wordCount = zoneWords.length;
          col.type = priceCount > 2 ? 'content' : (headerCount >= 1 && wordCount < 30) ? 'cover' : (priceCount === 0 && wordCount < 15) ? 'cover' : 'content';
          col.priceCount = priceCount;
          col.headerCount = headerCount;
          col.wordCount = wordCount;
        }
      }
    }

    const totalCols = results.reduce((s, r) => s + r.columns.length, 0);
    setDetectedCols({ pages: results, imageCount: images.length, totalColumns: totalCols });
    setDetectingCols(false);
  };

  // ── Infer fold structure via GPT ──────────────────────────────────────
  const handleInferStructure = async () => {
    if (!detectedCols?.pages?.length) return;
    setInferring(true);
    setFoldResult(null);
    setExtractError(null);

    try {
      const { data } = await api.post('/api/scan/infer-fold', {
        pages: detectedCols.pages.map(p => ({
          fileName: p.fileName,
          columns: (p.columns || []).map(c => ({
            column: c.column,
            x_start: c.x_start,
            x_end: c.x_end,
            type: c.type || 'content',
            priceCount: c.priceCount || 0,
            headerCount: c.headerCount || 0,
            wordCount: c.wordCount || 0,
          })),
          gutterDetails: p.gutterDetails,
        })),
      });
      setFoldResult(data);
      console.log(`[scan] Fold inference: ${data.fold_type}, ${data.total_panels} panels — ${data.reasoning}`);
    } catch (e) {
      console.error('Fold inference failed:', e);
      setExtractError(`Fold inference failed: ${e.response?.data?.detail || e.message}`);
    }
    setInferring(false);
  };

  // ── Vision Extract: process all pages ─────────────────────────────────
  const handleVisionExtract = async () => {
    if (!detectedCols?.pages?.length) return;
    setVisionExtracting(true);
    setVisionExtractResult(null);
    setExtractError(null);

    const allPanels = [];
    const allItems = [];
    let counter = 1;
    let globalColIdx = 0;

    for (const page of detectedCols.pages) {
      try {
        // Build column roles from fold result panels
        // Maps each column number (1-based) to its role: 'content' or 'cover'
        const columnRoles = [];
        const foldPage = foldResult?.pages?.find(p => p.page_index === page.pageIndex);
        if (foldPage?.panels) {
          const splits = (page.gutterDetails || []).map(s => s.position_pct).sort((a, b) => a - b);
          const numCols = splits.length + 1;
          // Default all to content
          for (let c = 0; c < numCols; c++) columnRoles.push('content');
          // Mark cover columns from panel assignments
          for (const panel of foldPage.panels) {
            if (panel.type === 'cover' || panel.type === 'info') {
              for (const colNum of (panel.columns || [])) {
                if (colNum >= 1 && colNum <= numCols) columnRoles[colNum - 1] = panel.type;
              }
            }
          }
        }

        const { data } = await api.post('/api/scan/vision-extract', {
          imageUrl: page.imageUrl,
          splitLines: page.gutterDetails || [],
          columnRoles: columnRoles.length > 0 ? columnRoles : undefined,
        });

        // Tag each column with page info and role
        const pageColumns = (data.panel?.columns || []).map((col, ci) => ({
          ...col,
          pageIndex: page.pageIndex,
          globalColumn: ++globalColIdx,
          role: columnRoles[ci] || 'content',
        }));
        allPanels.push({ ...data, panel: { ...data.panel, columns: pageColumns }, pageIndex: page.pageIndex, fileName: page.fileName });

        // Flatten items
        for (const col of pageColumns) {
          for (const tb of (col.textboxes || [])) {
            for (const dr of (tb.display_rows || [])) {
              for (const item of (dr.items || [])) {
                allItems.push({
                  ...item,
                  item_count: counter++,
                  category_name: tb.header || 'Unknown',
                  column: col.globalColumn,
                  page: page.pageIndex + 1,
                  row_type: dr.row_type,
                });
              }
            }
          }
        }
      } catch (e) {
        console.error(`Vision extract failed for page ${page.pageIndex}:`, e);
        const detail = e.response?.data?.detail || e.response?.data?.error || e.message;
        setExtractError(`Extract failed for ${page.fileName}: ${detail}`);
      }
    }

    // Merge all panels into one result, padding cover panels to columns_per_panel
    let mergedColumns = allPanels.flatMap(p => p.panel?.columns || []);

    const cpp = foldResult?.columns_per_panel || 1;
    if (cpp > 1 && foldResult?.pages) {
      const paddedColumns = [];
      for (const foldPage of foldResult.pages) {
        for (const panel of (foldPage.panels || [])) {
          // Find the extracted columns that belong to this panel
          const panelCols = (panel.columns || []).map(colNum =>
            mergedColumns.find(c => c.column === colNum && c.pageIndex === foldPage.page_index)
          ).filter(Boolean);

          // Add the panel's columns
          paddedColumns.push(...panelCols);

          // Pad cover/info panels to match columns_per_panel
          if ((panel.type === 'cover' || panel.type === 'info') && panelCols.length < cpp) {
            const needed = cpp - panelCols.length;
            for (let p = 0; p < needed; p++) {
              paddedColumns.push({
                column: -1, // dummy
                textboxes: [],
                pageIndex: foldPage.page_index,
                globalColumn: ++globalColIdx,
                role: panel.type,
              });
            }
            console.log(`[scan] Padded ${panel.type} panel ${panel.panel_number} with ${needed} empty column(s)`);
          }
        }
      }
      // Only use padded if we successfully mapped all columns
      if (paddedColumns.length >= mergedColumns.length) {
        mergedColumns = paddedColumns;
      }
    }
    const mergedStyling = allPanels[0]?.styling || {};
    const totalTextboxes = mergedColumns.reduce((s, c) => s + c.textboxes.length, 0);
    const totalRows = mergedColumns.reduce((s, c) => s + c.textboxes.reduce((s2, tb) => s2 + (tb.display_rows?.length || 0), 0), 0);

    const rowTypeCounts = {};
    for (const col of mergedColumns) {
      for (const tb of col.textboxes) {
        for (const dr of (tb.display_rows || [])) {
          rowTypeCounts[dr.row_type] = (rowTypeCounts[dr.row_type] || 0) + 1;
        }
      }
    }

    setVisionExtractResult({
      panel: { columns: mergedColumns, column_count: mergedColumns.length },
      styling: mergedStyling,
      total_textboxes: totalTextboxes,
      total_display_rows: totalRows,
      total_items: allItems.length,
      row_type_counts: rowTypeCounts,
      pages: allPanels,
      fold_type: detectedCols.foldType,
    });
    setItems(allItems);
    setColumnCount(mergedColumns.length);
    const cats = {};
    for (const it of allItems) {
      cats[it.category_name] = (cats[it.category_name] || 0) + 1;
    }
    setCategories(cats);
    setVisionExtracting(false);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportDone(false);
    try {
      const response = await api.post('/api/scan/export', {
        location: location || {},
        images: images.map(i => ({ imageId: i.imageId, imageUrl: i.imageUrl })),
        items,
      }, { responseType: 'blob' });

      // Trigger download
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
    } catch (e) {
      console.error('Export failed:', e);
    }
    setExporting(false);
  };

  const handlePushMenu = async () => {
    setPushing(true);
    setPushResult(null);
    setPushError(null);
    try {
      const { data } = await api.post('/api/scan/push-menu', {
        location: location || {},
        images: images.map(i => ({ imageId: i.imageId, imageUrl: i.imageUrl })),
        items,
      });
      setPushResult(data);
    } catch (e) {
      console.error('Push menu failed:', e);
      setPushError(e.response?.data?.detail || e.message || 'Pipeline failed');
    }
    setPushing(false);
  };

  const handleSaveTwin = async () => {
    if (!visionExtractResult || !location?.place_id) return;
    setSavingTwin(true);
    setSaveTwinResult(null);
    setSaveTwinError(null);
    try {
      const { data } = await api.post('/api/scan/save-twin', {
        placeId: location.place_id,
        location: location || {},
        visionExtractResult,
        styling: visionExtractResult.styling,
        foldType: visionExtractResult.fold_type || foldResult?.foldType || 'a4-portrait',
        calibrationScale,
      });
      setSaveTwinResult(data);
    } catch (e) {
      console.error('Save twin failed:', e);
      setSaveTwinError(e.response?.data?.detail || e.message || 'Save failed');
    }
    setSavingTwin(false);
  };

  if (!authChecked) return null;

  const rowTypeBadge = {
    single: { bg: '#e5e7eb', color: '#374151', label: 'S' },
    single_described: { bg: '#dbeafe', color: '#1e40af', label: 'Sd' },
    multi_inline: { bg: '#fce7f3', color: '#9d174d', label: 'Mi' },
    brand_variants: { bg: '#ede9fe', color: '#6b21a8', label: 'Bv' },
    price_variants: { bg: '#d1fae5', color: '#065f46', label: 'Pv' },
  };

  return (
    <div className="scan-page">
      <div className="scan-header">
        <button className="scan-header__back" onClick={() => window.history.back()}>← Back</button>
        <h1>Menu Card Scanner</h1>
      </div>

      {/* Step 1: Location */}
      <div className="scan-section">
        <h2 className="scan-section__title">
          <span className="scan-section__step">1</span>
          Select venue location
        </h2>
        <LocationPicker
          location={location}
          onSelect={setLocation}
          onClear={() => setLocation(null)}
        />
      </div>

      {/* Step 2: Upload */}
      <div className="scan-section">
        <h2 className="scan-section__title">
          <span className="scan-section__step">2</span>
          Upload menu card photos
        </h2>
        <PhotoUploader images={images} setImages={setImages} />
      </div>

      {/* Step 3: Detect columns, infer structure, extract */}
      <div className="scan-section">
        <h2 className="scan-section__title">
          <span className="scan-section__step">3</span>
          Detect, infer & extract
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="scan-extract-btn"
            onClick={handleRectifyPaper}
            disabled={images.length === 0 || rectifying}
            style={{ background: rectifying ? '#9ca3af' : '#0ea5e9' }}
          >
            {rectifying ? 'Rectifying...' : `0. Rectify paper`}
          </button>

          <button
            className="scan-extract-btn"
            onClick={handleDetectCols}
            disabled={images.length === 0 || detectingCols}
            style={{ background: detectingCols ? '#9ca3af' : '#4285f4' }}
          >
            {detectingCols ? 'Detecting...' : `1. Detect columns (${images.length} photo${images.length > 1 ? 's' : ''})`}
          </button>

          {detectedCols?.pages?.length > 0 && (
            <button
              className="scan-extract-btn"
              onClick={handleInferStructure}
              disabled={inferring}
              style={{ background: inferring ? '#9ca3af' : '#7c3aed' }}
            >
              {inferring ? 'Inferring...' : `2. Infer structure`}
            </button>
          )}

          {foldResult && (
            <button
              className="scan-extract-btn"
              onClick={handleVisionExtract}
              disabled={visionExtracting}
              style={{ background: visionExtracting ? '#9ca3af' : '#059669' }}
            >
              {visionExtracting ? 'Extracting...' : `3. Extract items`}
            </button>
          )}

          {(rectifying || detectingCols || inferring || visionExtracting) && (
            <span className="scan-status" style={{ color: '#6b7280' }}>
              {rectifying ? 'Detecting paper outline & warping...' : detectingCols ? 'Running Google Vision...' : inferring ? 'GPT inferring fold type...' : 'Extracting items from each column...'}
            </span>
          )}

          {rectifyResult && !rectifying && (
            <span className="scan-status" style={{ color: rectifyResult.skippedCount || rectifyResult.errors.length ? '#f59e0b' : '#22c55e' }}>
              Rectified {rectifyResult.rectifiedCount}/{images.length}
              {rectifyResult.skippedCount > 0 && ` · ${rectifyResult.skippedCount} skipped (no paper outline detected)`}
              {rectifyResult.errors.length > 0 && ` · ${rectifyResult.errors.length} error(s)`}
            </span>
          )}

          {extractError && <span className="scan-status scan-status--error">{extractError}</span>}

          {items.length > 0 && !visionExtracting && (
            <span className="scan-status scan-status--success">
              {items.length} items extracted across {Object.keys(categories).length} categories
              {columnCount && ` · ${columnCount} column${columnCount > 1 ? 's' : ''}`}
            </span>
          )}
        </div>

        {/* Fold inference result */}
        {foldResult && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 10, padding: 12, background: 'rgba(124,58,237,0.04)', borderRadius: 8, border: '1px solid rgba(124,58,237,0.15)' }}>
            <div>
              <strong style={{ color: '#7c3aed' }}>Fold: {foldResult.fold_type}</strong>
              {' · '}{foldResult.total_panels} panels
              {foldResult.standard_column_width_pct && ` · col width: ~${foldResult.standard_column_width_pct}%`}
              {foldResult.columns_per_panel && ` · ${foldResult.columns_per_panel} col/panel`}
            </div>
            {foldResult.reasoning && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' }}>
                {foldResult.reasoning}
              </div>
            )}
            {foldResult.pages && (
              <div style={{ fontSize: 11, marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {foldResult.pages.map((p, pi) => (
                  <div key={pi}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      {pi === 0 ? 'Front' : pi === 1 ? 'Back' : `Page ${pi + 1}`}:
                    </span>{' '}
                    {(p.panels || []).map((panel, pj) => {
                      const colors = { cover: '#06b6d4', info: '#f59e0b', content: '#22c55e' };
                      return (
                        <span key={pj} style={{ marginRight: 4 }}>
                          <span style={{
                            padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: `${colors[panel.type] || '#9ca3af'}18`,
                            color: colors[panel.type] || '#9ca3af',
                            border: `1px solid ${colors[panel.type] || '#9ca3af'}40`,
                          }}>
                            P{panel.panel_number}: {panel.type} (col {(panel.columns || []).join(',')})
                            {panel.fold_after && ' | fold'}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Per-page detection results */}
        {detectedCols?.pages?.length > 0 && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            {detectedCols.pages.map((page, pi) => (
              <div key={pi} style={{ flex: '1 1 300px', maxWidth: 500 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#374151' }}>
                  Page {pi + 1}: {page.fileName}
                  <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
                    {page.columns.length} column{page.columns.length !== 1 ? 's' : ''}
                    {page.priceCount > 0 && ` · ${page.priceCount} prices`}
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={page.imageUrl}
                    alt={`Page ${pi + 1}`}
                    style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }}
                  />
                  {/* Column shading */}
                  {page.columns.map((col, ci) => {
                    const colors = ['rgba(59,130,246,0.12)', 'rgba(245,158,11,0.12)', 'rgba(34,197,94,0.12)', 'rgba(139,92,246,0.12)'];
                    const borderColors = ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6'];
                    return (
                      <React.Fragment key={ci}>
                        <div style={{
                          position: 'absolute', left: `${col.x_start}%`, top: 0,
                          width: `${col.x_end - col.x_start}%`, height: '100%',
                          background: colors[ci % colors.length], pointerEvents: 'none',
                        }}>
                          <span style={{
                            position: 'absolute', top: 4, left: 4,
                            fontSize: 11, fontWeight: 700, padding: '2px 8px',
                            background: borderColors[ci % borderColors.length], color: '#fff',
                            borderRadius: 4, whiteSpace: 'nowrap',
                          }}>
                            Col {col.column}
                          </span>
                        </div>
                        {ci < page.columns.length - 1 && (
                          <div style={{
                            position: 'absolute', left: `${col.x_end}%`, top: 0,
                            width: 2, height: '100%', background: '#ef4444', pointerEvents: 'none',
                          }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                  {/* Debug: word boxes — prices (green), ABV (purple), headers (orange), text (grey) */}
                  {(page.debugWords || []).map((w, wi) => {
                    const color = w.isPrice ? '#22c55e' : w.isABV ? '#8b5cf6' : w.isLarge ? '#ef4444' : w.isMedium ? '#f59e0b' : '#1f2937';
                    const bg = w.isPrice ? 'rgba(34,197,94,0.15)' : w.isABV ? 'rgba(139,92,246,0.15)' : w.isLarge ? 'rgba(239,68,68,0.18)' : w.isMedium ? 'rgba(245,158,11,0.18)' : 'transparent';
                    const border = (w.isPrice || w.isABV || w.isMedium || w.isLarge) ? `2px solid ${color}` : `0.5px solid rgba(31,41,55,0.3)`;
                    return (
                      <div key={`w-${wi}`} title={`"${w.text}" ${w.isPrice ? 'PRICE' : w.isABV ? 'ABV' : w.isHeader ? 'HEADER' : ''} (${w.sizeRatio}x, ${w.height_px}px)`} style={{
                        position: 'absolute',
                        left: `${w.x0_pct}%`, top: `${w.y0_pct}%`,
                        width: `${w.x1_pct - w.x0_pct}%`, height: `${w.y1_pct - w.y0_pct}%`,
                        border, background: bg, borderRadius: 2,
                        pointerEvents: (w.isPrice || w.isABV || w.isHeader) ? 'auto' : 'none',
                        cursor: (w.isPrice || w.isABV || w.isHeader) ? 'help' : 'default',
                      }} />
                    );
                  })}
                  {/* Logos (cyan dashed) */}
                  {(page.logos || []).map((logo, li) => (
                    <div key={`logo-${li}`} title={`Logo: "${logo.description}" (score: ${logo.score})`} style={{
                      position: 'absolute',
                      left: `${logo.x0_pct}%`, top: `${logo.y0_pct}%`,
                      width: `${logo.x1_pct - logo.x0_pct}%`, height: `${logo.y1_pct - logo.y0_pct}%`,
                      border: '3px dashed #06b6d4', borderRadius: 6,
                      background: 'rgba(6,182,212,0.08)', pointerEvents: 'auto', cursor: 'help',
                    }}>
                      <span style={{
                        position: 'absolute', top: -16, left: 0, fontSize: 9, fontWeight: 700,
                        padding: '1px 5px', background: '#06b6d4', color: '#fff', borderRadius: 3, whiteSpace: 'nowrap',
                      }}>
                        Logo: {logo.description}
                      </span>
                    </div>
                  ))}
                  {/* Objects (pink dashed) */}
                  {(page.objects || []).map((obj, oi) => (
                    <div key={`obj-${oi}`} title={`${obj.name} (${obj.score})`} style={{
                      position: 'absolute',
                      left: `${obj.x0_pct}%`, top: `${obj.y0_pct}%`,
                      width: `${obj.x1_pct - obj.x0_pct}%`, height: `${obj.y1_pct - obj.y0_pct}%`,
                      border: '2px dashed #ec4899', borderRadius: 4,
                      background: 'rgba(236,72,153,0.06)', pointerEvents: 'auto', cursor: 'help',
                    }}>
                      <span style={{
                        position: 'absolute', bottom: -14, left: 0, fontSize: 8, fontWeight: 600,
                        padding: '1px 4px', background: '#ec4899', color: '#fff', borderRadius: 3, whiteSpace: 'nowrap',
                      }}>
                        {obj.name} {obj.score}
                      </span>
                    </div>
                  ))}
                  {/* Split lines */}
                  {(page.gutterDetails || []).map((g, gi) => (
                    <div key={`g-${gi}`} title={`Split at ${g.position_pct}% (${g.source || ''})`} style={{
                      position: 'absolute', left: `${g.position_pct}%`, top: 0,
                      width: 3, height: '100%', background: '#ef4444', pointerEvents: 'none',
                    }} />
                  ))}
                </div>
                {/* Legend */}
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                  <span style={{ color: '#22c55e' }}>■</span> price
                  {' '}<span style={{ color: '#8b5cf6' }}>■</span> ABV
                  {' '}<span style={{ color: '#ef4444' }}>■</span> large
                  {' '}<span style={{ color: '#f59e0b' }}>■</span> medium
                  {' '}<span style={{ color: '#9ca3af' }}>■</span> small
                  {' '}<span style={{ color: '#06b6d4' }}>□</span> logo
                  {' '}<span style={{ color: '#ec4899' }}>□</span> object
                  {page.priceCount > 0 && <span> · {page.priceCount} prices in {page.priceClusters?.length || 0} clusters</span>}
                  {page.logos?.length > 0 && <span> · {page.logos.length} logo{page.logos.length > 1 ? 's' : ''}</span>}
                  {page.objects?.length > 0 && <span> · {page.objects.length} object{page.objects.length > 1 ? 's' : ''}</span>}
                </div>
                {page.zoneClassifications?.length > 0 && (
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                    {page.zoneClassifications.map((zc, zi) => (
                      <div key={zi} style={{ marginBottom: 2 }}>
                        <span style={{
                          fontWeight: 700,
                          color: zc.classification === 'cover' ? '#06b6d4' : zc.classification === 'info' ? '#f59e0b' : zc.classification === 'menu-items' ? '#22c55e' : '#9ca3af',
                        }}>
                          {zc.side} zone → {zc.classification}
                        </span>
                        <span style={{ color: '#9ca3af' }}> ({zc.word_count} words, {zc.x_start}-{zc.x_end}%)</span>
                        <span style={{ color: '#6b7280', fontStyle: 'italic' }}> "{zc.sample_text}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Vision extract structural tree */}
        {visionExtractResult && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
              <strong>{visionExtractResult.panel?.column_count}</strong> columns →{' '}
              <strong>{visionExtractResult.total_textboxes}</strong> text-boxes →{' '}
              <strong>{visionExtractResult.total_display_rows}</strong> display rows →{' '}
              <strong>{visionExtractResult.total_items}</strong> items
            </div>
            {visionExtractResult.row_type_counts && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {Object.entries(visionExtractResult.row_type_counts).map(([type, count]) => {
                  const badge = rowTypeBadge[type] || { bg: '#e5e7eb', color: '#374151', label: '?' };
                  return (
                    <span key={type} style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: badge.bg, color: badge.color,
                    }}>
                      {type}: {count}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Structural tree */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {(visionExtractResult.panel?.columns || []).map((col, ci) => {
                const colors = ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6'];
                const color = colors[ci % colors.length];
                return (
                  <div key={ci} style={{
                    flex: '1 1 250px', maxWidth: 420,
                    border: `2px solid ${color}`, borderRadius: 8,
                    overflow: 'hidden', fontSize: 12,
                  }}>
                    <div style={{ background: color, color: '#fff', padding: '6px 12px', fontWeight: 700, fontSize: 13 }}>
                      Column {col.column} ({col.x_start_pct}–{col.x_end_pct}%)
                    </div>
                    {col.error && <div style={{ padding: 8, color: '#ef4444' }}>{col.error}</div>}
                    {(col.textboxes || []).map((tb, ti) => (
                      <div key={ti} style={{ borderTop: `1px solid ${color}30`, padding: '8px 12px' }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#374151', marginBottom: 4 }}>
                          {tb.header ? (
                            <span style={{
                              padding: '1px 6px', borderRadius: 4, fontSize: 11,
                              background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
                            }}>
                              {tb.header}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>no header</span>
                          )}
                          <span style={{ color: '#9ca3af', fontSize: 10, marginLeft: 6 }}>
                            {tb.type} · {(tb.display_rows || []).length} rows
                          </span>
                        </div>
                        {(tb.display_rows || []).map((dr, di) => {
                          const badge = rowTypeBadge[dr.row_type] || rowTypeBadge.single;
                          return (
                            <div key={di} style={{ padding: '2px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                                <span style={{
                                  padding: '0 4px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                                  background: badge.bg, color: badge.color,
                                }}>
                                  {badge.label}
                                </span>
                                {dr.brand_name && (
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6b21a8' }}>{dr.brand_name}</span>
                                )}
                                {dr.separator && (
                                  <span style={{ fontSize: 9, color: '#9ca3af' }}>sep: "{dr.separator}"</span>
                                )}
                                {dr.description && (
                                  <span style={{ fontSize: 9, color: '#6b7280', fontStyle: 'italic' }}>{dr.description}</span>
                                )}
                              </div>
                              {(dr.items || []).map((item, ii) => (
                                <div key={ii} style={{
                                  display: 'flex', justifyContent: 'space-between', gap: 8,
                                  padding: '0 0 0 16px', color: '#374151', fontSize: 11,
                                }}>
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.variant_label ? (
                                      <span style={{ color: '#8b5cf6' }}>{item.variant_label}</span>
                                    ) : item.product_name}
                                    {item.volume && <span style={{ color: '#9ca3af' }}> {item.volume}</span>}
                                    {item.abv != null && <span style={{ color: '#9ca3af' }}> {item.abv}%</span>}
                                  </span>
                                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {item.product_price != null ? `€${(item.product_price / 100).toFixed(2)}` : '–'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category counts */}
        {Object.keys(categories).length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {Object.entries(categories).map(([cat, count]) => (
              <span key={cat} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 12,
                background: 'rgba(0,0,0,0.04)', color: '#374151', fontWeight: 600,
              }}>
                {cat}: {count}
              </span>
            ))}
          </div>
        )}

        {/* Items table */}
        <ItemsTable items={items} setItems={setItems} />
      </div>

      {/* Step 4: Digital Twin preview */}
      {visionExtractResult && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">5</span>
            Digital Twin
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
            Preview of the menu as a digital replica, rendered from the extracted structure.
          </p>
          <ScanTwinPreview visionExtractResult={visionExtractResult} onUpdateResult={setVisionExtractResult} foldResult={foldResult} detectedPages={detectedCols?.pages} onCalibrationChange={setCalibrationScale} />

          {/* Save Twin to DB */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="scan-extract-btn"
              onClick={handleSaveTwin}
              disabled={savingTwin || !location?.place_id}
              style={{ background: savingTwin ? '#9ca3af' : '#7c3aed' }}
            >
              {savingTwin ? 'Saving...' : 'Save Twin'}
            </button>
            {!location?.place_id && (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Select a venue location first</span>
            )}
            {saveTwinError && <span className="scan-status scan-status--error">{saveTwinError}</span>}
            {saveTwinResult?.ok && (
              <span className="scan-status scan-status--success">
                Saved: {saveTwinResult.totalSections} sections, {saveTwinResult.totalRows} rows, {saveTwinResult.totalItems} items
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 6: Export */}
      {items.length > 0 && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">5</span>
            Export
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="scan-export-btn"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Generating...' : 'Download Excel'}
            </button>
            {exportDone && <span className="scan-status scan-status--success">Downloaded + saved to storage</span>}
          </div>
        </div>
      )}

      {/* Step 7: Push Menu to Supabase */}
      {items.length > 0 && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">7</span>
            Push Menu
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
            Run the matching pipeline and import items directly into the database.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="scan-extract-btn"
              onClick={handlePushMenu}
              disabled={pushing}
              style={{ background: pushing ? '#9ca3af' : '#059669' }}
            >
              {pushing ? 'Processing...' : 'Push Menu'}
            </button>
            {pushError && <span className="scan-status scan-status--error">{pushError}</span>}
            {pushResult && pushResult.ok && (
              <span className="scan-status scan-status--success">
                Inserted: {pushResult.inserted} | Skipped (duplicate): {pushResult.skipped_dup} | Skipped (invalid): {pushResult.skipped_fk}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
