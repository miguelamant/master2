import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../apiService';
import LocationPicker from './LocationPicker';
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
        setImages(prev => [...prev, {
          imageId: data.imageId,
          imageUrl: data.imageUrl,
          localPreview: URL.createObjectURL(file),
          fileName: file.name,
        }]);
      } catch (e) {
        console.error('Upload failed:', e);
      }
    }
    setUploading(false);
  }, [setImages]);

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
        <div className="scan-thumbs">
          {images.map(img => (
            <img key={img.imageId} src={img.localPreview} alt={img.fileName} className="scan-thumb" />
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
            <th>Col</th>
            <th>Pos</th>
            <th>Category</th>
            <th style={{ minWidth: 200 }}>Product Name</th>
            <th style={{ minWidth: 150 }}>Description</th>
            <th style={{ width: 80 }}>Price (ct)</th>
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ color: '#9ca3af' }}>{item.item_count ?? idx + 1}</td>
              <td style={{ color: '#6366f1', textAlign: 'center', fontWeight: 700 }}>{item.column_number ?? ''}</td>
              <td style={{ color: '#9ca3af', textAlign: 'center' }}>{item.position_in_column ?? ''}</td>
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
              <td>
                <button className="scan-row-delete" onClick={() => remove(idx)}>×</button>
              </td>
            </tr>
          ))}
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
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [pushError, setPushError] = useState(null);

  // Auth gate — redirect to /claim if not logged in
  useEffect(() => {
    api.get('/api/user')
      .then(() => setAuthChecked(true))
      .catch(() => navigate('/claim'));
  }, [navigate]);

  const handleExtract = async () => {
    if (images.length === 0) return;
    setExtracting(true);
    setExtractError(null);
    setItems([]);
    setCategories({});
    setColumnCount(null);

    let allItems = [];
    let allCategories = {};
    let maxColumns = 0;
    let counter = 1;

    for (const img of images) {
      try {
        const { data } = await api.post('/api/scan/extract', { imageUrl: img.imageUrl });
        const imgItems = (data.items || []).map(it => ({
          ...it,
          item_count: counter++,
          scan_image_id: img.imageId,
          scan_image_url: img.imageUrl,
        }));
        allItems = [...allItems, ...imgItems];
        for (const [cat, count] of Object.entries(data.categories || {})) {
          allCategories[cat] = (allCategories[cat] || 0) + count;
        }
        if (data.column_count) maxColumns = Math.max(maxColumns, data.column_count);
      } catch (e) {
        console.error('Extract failed for image:', img.imageId, e);
        setExtractError(`Failed to extract from ${img.fileName}`);
      }
    }
    setColumnCount(maxColumns || null);

    setItems(allItems);
    setCategories(allCategories);
    setExtracting(false);
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

      {/* Step 3: Extract */}
      <div className="scan-section">
        <h2 className="scan-section__title">
          <span className="scan-section__step">3</span>
          Extract & review items
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="scan-extract-btn"
            onClick={handleExtract}
            disabled={images.length === 0 || extracting}
          >
            {extracting ? 'Extracting...' : 'Extract menu items'}
          </button>
          {extractError && <span className="scan-status scan-status--error">{extractError}</span>}
          {items.length > 0 && !extracting && (
            <span className="scan-status scan-status--success">
              {items.length} items extracted across {Object.keys(categories).length} categories
              {columnCount && ` · ${columnCount} column${columnCount > 1 ? 's' : ''} detected`}
            </span>
          )}
        </div>

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

        <ItemsTable items={items} setItems={setItems} />
      </div>

      {/* Step 4: Export */}
      {items.length > 0 && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">4</span>
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

      {/* Step 5: Push Menu to Supabase */}
      {items.length > 0 && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">5</span>
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
