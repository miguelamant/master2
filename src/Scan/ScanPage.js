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
  const [detectingCols, setDetectingCols] = useState(false);
  const [detectedCols, setDetectedCols] = useState(null);
  const [extractError, setExtractError] = useState(null);
  const [visionExtracting, setVisionExtracting] = useState(false);
  const [visionExtractResult, setVisionExtractResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [pushError, setPushError] = useState(null);

  // Auth gate — redirect to /claim if not logged in
  useEffect(() => {
    api.get('/api/user')
      .then(() => setAuthChecked(true))
      .catch(() => navigate('/claim'));
  }, [navigate]);

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
          imageSize: data.image_size,
        });
      } catch (e) {
        console.error(`Column detection failed for image ${idx}:`, e);
        const detail = e.response?.data?.detail || e.response?.data?.error || e.message;
        setExtractError(`Detection failed for ${img.fileName}: ${detail}`);
      }
    }

    // Infer fold type from image count + total columns
    const totalCols = results.reduce((s, r) => s + r.columns.length, 0);
    let foldType = 'single';
    if (images.length === 1) {
      foldType = totalCols <= 2 ? 'a5-portrait' : totalCols <= 3 ? 'trifold' : 'four-panel';
    } else if (images.length === 2) {
      foldType = totalCols <= 4 ? 'bifold' : totalCols <= 6 ? 'trifold' : 'four-panel';
    } else {
      foldType = 'a4-booklet';
    }

    setDetectedCols({ pages: results, foldType, imageCount: images.length, totalColumns: totalCols });
    setDetectingCols(false);
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
        const { data } = await api.post('/api/scan/vision-extract', {
          imageUrl: page.imageUrl,
          splitLines: page.gutterDetails || [],
        });

        // Tag each column with page info
        const pageColumns = (data.panel?.columns || []).map(col => ({
          ...col,
          pageIndex: page.pageIndex,
          globalColumn: ++globalColIdx,
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

    // Merge all panels into one result
    const mergedColumns = allPanels.flatMap(p => p.panel?.columns || []);
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

  // ── Verify structure: cross-check GPT extraction against the image ────
  const handleVerifyStructure = async () => {
    if (!visionExtractResult || !detectedCols?.pages?.length) return;
    setVerifying(true);
    setVerifyResult(null);

    // Verify each page separately, then merge results
    const allVerifications = [];
    const extractedCols = visionExtractResult.panel.columns;
    let colOffset = 0;

    for (const page of detectedCols.pages) {
      const pageCols = page.columns.length;
      const pageExtracted = extractedCols.slice(colOffset, colOffset + pageCols);
      colOffset += pageCols;

      try {
        const { data } = await api.post('/api/scan/verify-structure', {
          imageUrl: page.imageUrl,
          splitLines: page.gutterDetails || [],
          extractedColumns: pageExtracted,
        });
        allVerifications.push(...(data.columns || []).map(c => ({ ...c, page: page.pageIndex + 1 })));
      } catch (e) {
        console.error(`Verify failed for page ${page.pageIndex}:`, e);
        allVerifications.push({ column: colOffset, status: 'error', error: e.message, page: page.pageIndex + 1 });
      }
    }

    const allOk = allVerifications.every(v => v.status === 'ok' || v.status === 'skipped');
    const totalIssues = allVerifications.reduce((s, v) => s + (v.issues?.length || 0), 0);
    setVerifyResult({ ok: allOk, total_issues: totalIssues, columns: allVerifications });
    setVerifying(false);
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

      {/* Step 3: Detect columns (Google Vision) + Extract structure */}
      <div className="scan-section">
        <h2 className="scan-section__title">
          <span className="scan-section__step">3</span>
          Detect columns & extract
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
          Detects columns on each uploaded photo separately (1 photo = 1 side of the menu), then extracts items from each column.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
              onClick={handleVisionExtract}
              disabled={visionExtracting}
              style={{ background: visionExtracting ? '#9ca3af' : '#059669' }}
            >
              {visionExtracting ? 'Extracting structure...' : `2. Extract structure (${detectedCols.totalColumns} columns across ${detectedCols.imageCount} page${detectedCols.imageCount > 1 ? 's' : ''})`}
            </button>
          )}

          {visionExtracting && (
            <span className="scan-status" style={{ color: '#059669' }}>
              Sending each column to GPT-4o...
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

        {/* Detection info */}
        {detectedCols?.pages?.length > 0 && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            <strong style={{ color: '#7c3aed' }}>Fold: {detectedCols.foldType}</strong>
            {' · '}{detectedCols.imageCount} photo{detectedCols.imageCount > 1 ? 's' : ''}
            {' · '}{detectedCols.totalColumns} total columns
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
                    const color = w.isPrice ? '#22c55e' : w.isABV ? '#8b5cf6' : w.isHeader ? '#f59e0b' : '#1f2937';
                    const bg = w.isPrice ? 'rgba(34,197,94,0.15)' : w.isABV ? 'rgba(139,92,246,0.15)' : w.isHeader ? 'rgba(245,158,11,0.18)' : 'transparent';
                    const border = (w.isPrice || w.isABV || w.isHeader) ? `2px solid ${color}` : `0.5px solid rgba(31,41,55,0.3)`;
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
                  {' '}<span style={{ color: '#f59e0b' }}>■</span> header
                  {' '}<span style={{ color: '#9ca3af' }}>■</span> text
                  {' '}<span style={{ color: '#06b6d4' }}>□</span> logo
                  {' '}<span style={{ color: '#ec4899' }}>□</span> object
                  {page.priceCount > 0 && <span> · {page.priceCount} prices in {page.priceClusters?.length || 0} clusters</span>}
                  {page.logos?.length > 0 && <span> · {page.logos.length} logo{page.logos.length > 1 ? 's' : ''}</span>}
                  {page.objects?.length > 0 && <span> · {page.objects.length} object{page.objects.length > 1 ? 's' : ''}</span>}
                </div>
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

      {/* Step 4: Verify structure */}
      {visionExtractResult && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">4</span>
            Verify structure
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
            Cross-checks the extracted items against the original image to catch skipped items, hallucinations, or wrong prices.
          </p>
          <button
            className="scan-extract-btn"
            onClick={handleVerifyStructure}
            disabled={verifying}
            style={{ background: verifying ? '#9ca3af' : '#f59e0b', marginBottom: 12 }}
          >
            {verifying ? 'Verifying...' : 'Verify digital twin structure'}
          </button>

          {verifyResult && (
            <div style={{ marginTop: 8 }}>
              {verifyResult.error && (
                <span className="scan-status scan-status--error">{verifyResult.error}</span>
              )}
              {!verifyResult.error && (
                <>
                  <div style={{
                    fontSize: 14, fontWeight: 700, marginBottom: 12,
                    color: verifyResult.ok ? '#22c55e' : '#ef4444',
                  }}>
                    {verifyResult.ok
                      ? 'All columns verified — no issues found'
                      : `${verifyResult.total_issues} issue${verifyResult.total_issues !== 1 ? 's' : ''} found`
                    }
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {(verifyResult.columns || []).map((col, i) => (
                      <div key={i} style={{
                        border: `1px solid ${col.status === 'ok' ? '#22c55e40' : col.status === 'error' ? '#ef444440' : '#f59e0b40'}`,
                        borderRadius: 10, padding: 12, minWidth: 220, flex: '1 1 220px',
                        background: col.status === 'ok' ? 'rgba(34,197,94,0.04)' : col.status === 'error' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                          Column {col.column}
                          <span style={{
                            marginLeft: 8, fontSize: 11, fontWeight: 600,
                            color: col.status === 'ok' ? '#22c55e' : '#ef4444',
                          }}>
                            {col.status === 'ok' ? 'OK' : col.status === 'error' ? 'ERROR' : col.status === 'skipped' ? 'SKIPPED' : 'MISMATCH'}
                          </span>
                        </div>
                        {col.extracted_count != null && (
                          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                            Extracted: {col.extracted_count} items · Visible: {col.visible_count} items
                          </div>
                        )}
                        {col.error && (
                          <div style={{ fontSize: 12, color: '#ef4444' }}>{col.error}</div>
                        )}
                        {(col.issues || []).map((issue, j) => {
                          const colors = { missing: '#ef4444', hallucinated: '#f59e0b', wrong_price: '#3b82f6' };
                          const labels = { missing: 'MISSING', hallucinated: 'HALLUCINATED', wrong_price: 'WRONG PRICE' };
                          return (
                            <div key={j} style={{
                              fontSize: 12, padding: '4px 8px', marginTop: 4, borderRadius: 6,
                              background: `${colors[issue.type]}10`,
                              border: `1px solid ${colors[issue.type]}30`,
                            }}>
                              <span style={{ fontWeight: 700, color: colors[issue.type], fontSize: 10 }}>
                                {labels[issue.type]}
                              </span>
                              {' '}{issue.product_name}
                              {issue.product_price != null && (
                                <span style={{ color: '#6b7280' }}> — €{(issue.product_price / 100).toFixed(2)}</span>
                              )}
                              {issue.correct_price != null && (
                                <span style={{ color: '#3b82f6' }}> (should be €{(issue.correct_price / 100).toFixed(2)})</span>
                              )}
                              {issue.location && (
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{issue.location}</div>
                              )}
                              {issue.reason && (
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{issue.reason}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 5: Digital Twin preview */}
      {visionExtractResult && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">5</span>
            Digital Twin
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
            Preview of the menu as a digital replica, rendered from the extracted structure.
          </p>
          <ScanTwinPreview visionExtractResult={visionExtractResult} onUpdateResult={setVisionExtractResult} />
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
