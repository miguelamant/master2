import React, { useState, useRef, useEffect } from 'react';
import '../Dashboard/DigitalTwin/DigitalTwin.css';
import './ScanTwinPreview.css';

// ── Physical dimensions (mm) per fold type ───────────────────────────────
// Always design at A4 ratio (1:√2). A4 and A5 are the same ratio, so we
// standardize on A4. Export can target any size — the layout scales.
const PAPER_SIZES = {
  'a4-portrait':  { label: 'Portrait',   options: { a4: { w: 210, h: 297 } } },
  'a4-landscape': { label: 'Landscape',  options: { a4: { w: 297, h: 210 } } },
  'bifold':       { label: 'Bifold', options: {
    'a4-landscape': { w: 297, h: 210, label: 'A4 landscape' },
    'a3-landscape': { w: 420, h: 297, label: 'A3 landscape' },
  }},
  'trifold':      { label: 'Trifold', options: {
    'a4-landscape': { w: 297, h: 210, label: 'A4 landscape' },
    'a3-landscape': { w: 420, h: 297, label: 'A3 landscape' },
  }},
  'zfold':        { label: 'Z-fold', options: {
    'a4-landscape': { w: 297, h: 210, label: 'A4 landscape' },
    'a3-landscape': { w: 420, h: 297, label: 'A3 landscape' },
  }},
  'four-panel':   { label: 'Quad-fold', options: {
    'custom':       { w: 420, h: 297, label: 'Custom (~3×A4 panels)' },
  }},
  'booklet':      { label: 'Booklet', options: {
    'a4': { w: 210, h: 297, label: 'A4 page' },
  }},
};

const MM_TO_PX = 3.78; // 1mm ≈ 3.78px at 96 DPI (real physical size on screen)

const ROW_TYPES = [
  { value: 'single', label: 'Single' },
  { value: 'single_described', label: 'Described' },
  { value: 'multi_inline', label: 'Multi inline' },
  { value: 'brand_variants', label: 'Brand variants' },
  { value: 'price_variants', label: 'Price variants' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'note', label: 'Note' },
];

const formatPrice = (price, cfg) => {
  if (price == null) return '';
  const num = (price / 100).toFixed(2);
  const formatted = cfg.decimalSep === 'dot' ? num : num.replace('.', ',');
  return cfg.showEuro ? `\u20AC${formatted}` : formatted;
};

// ── Config bar ────────────────────────────────────────────────────────────

function ConfigBar({ cfg, onChange, foldType, onFoldTypeChange }) {
  const set = (patch) => onChange({ ...cfg, ...patch });
  const paperDef = PAPER_SIZES[foldType] || PAPER_SIZES['a4-portrait'];
  const paperOptions = Object.entries(paperDef.options || {});

  const foldOptions = [
    { value: 'a4-portrait', label: 'Portrait' },
    { value: 'a4-landscape', label: 'Landscape' },
    { value: 'bifold', label: 'Bifold' },
    { value: 'trifold', label: 'Trifold' },
    { value: 'zfold', label: 'Z-fold' },
    { value: 'four-panel', label: 'Quad-fold' },
    { value: 'booklet', label: 'Booklet' },
  ];

  return (
    <div className="twin-config" style={{ marginBottom: 16 }}>
      <div className="twin-config__group">
        <label className="twin-config__label">Fold</label>
        <select
          value={foldType}
          onChange={e => onFoldTypeChange(e.target.value)}
          style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #c4a96a', background: '#fff', cursor: 'pointer' }}
        >
          {foldOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      {paperOptions.length > 1 && (
        <div className="twin-config__group">
          <label className="twin-config__label">Paper</label>
          <select
            value={cfg.paperSize}
            onChange={e => set({ paperSize: e.target.value })}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #c4a96a', background: '#fff', cursor: 'pointer' }}
          >
            {paperOptions.map(([key, opt]) => <option key={key} value={key}>{opt.label || key}</option>)}
          </select>
        </div>
      )}
      <div className="twin-config__group">
        <label className="twin-config__label">Zoom {cfg.zoom}%</label>
        <input
          type="range" min={30} max={150} value={cfg.zoom}
          onChange={e => set({ zoom: Number(e.target.value) })}
          style={{ width: 80, cursor: 'pointer' }}
        />
      </div>
      <div className="twin-config__group">
        <label className="twin-config__label">
          <input type="checkbox" checked={cfg.showEuro} onChange={() => set({ showEuro: !cfg.showEuro })} />
          &euro; sign
        </label>
      </div>

      <div className="twin-config__group">
        <label className="twin-config__label">Decimal</label>
        <div className="twin-config__segments">
          <button className={`twin-config__seg ${cfg.decimalSep === 'comma' ? 'twin-config__seg--active' : ''}`} onClick={() => set({ decimalSep: 'comma' })}>1,50</button>
          <button className={`twin-config__seg ${cfg.decimalSep === 'dot' ? 'twin-config__seg--active' : ''}`} onClick={() => set({ decimalSep: 'dot' })}>1.50</button>
        </div>
      </div>

      <div className="twin-config__group">
        <label className="twin-config__label">
          <input type="checkbox" checked={cfg.dotLeaders} onChange={() => set({ dotLeaders: !cfg.dotLeaders })} />
          Dot leaders
        </label>
      </div>

      <div className="twin-config__group">
        <label className="twin-config__label">BG</label>
        <input type="color" value={cfg.bgColor} onChange={e => set({ bgColor: e.target.value })} style={{ width: 28, height: 24, border: 'none', cursor: 'pointer' }} />
      </div>

      <div className="twin-config__group">
        <label className="twin-config__label">Text</label>
        <input type="color" value={cfg.textColor} onChange={e => set({ textColor: e.target.value })} style={{ width: 28, height: 24, border: 'none', cursor: 'pointer' }} />
      </div>

      <div className="twin-config__group">
        <label className="twin-config__label">Header</label>
        <input type="color" value={cfg.headerColor} onChange={e => set({ headerColor: e.target.value })} style={{ width: 28, height: 24, border: 'none', cursor: 'pointer' }} />
      </div>
    </div>
  );
}

// ── Row type picker (dropdown on click) ───────────────────────────────────

function RowTypePicker({ currentType, onChangeType, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="st-row-picker" style={{ position: 'relative' }}>
      <div
        className="st-row-picker__trigger"
        onClick={() => setOpen(!open)}
        title={`Type: ${currentType} — click to change`}
      >
        {children}
      </div>
      {open && (
        <div className="st-row-picker__dropdown">
          {ROW_TYPES.map(rt => (
            <button
              key={rt.value}
              className={`st-row-picker__option ${rt.value === currentType ? 'st-row-picker__option--active' : ''}`}
              onClick={() => { onChangeType(rt.value); setOpen(false); }}
            >
              {rt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Display row renderers ─────────────────────────────────────────────────

function Dots({ show }) {
  if (!show) return <span className="st-row__spacer" />;
  return <span className="st-row__dots" />;
}

function SingleRow({ item, cfg }) {
  // Don't show volume/abv separately if already in the product name
  // Normalize spaces for fuzzy match ("25 cl" vs "25cl", "5.0%" vs "5%")
  const norm = s => (s || '').toLowerCase().replace(/\s+/g, '');
  const nameLower = norm(item.product_name);
  const showVolume = item.volume && !nameLower.includes(norm(item.volume));
  const abvStr = item.abv != null ? String(item.abv).replace(/\.0$/, '') : null;
  const showAbv = abvStr && !nameLower.includes(abvStr + '%') && !nameLower.includes(abvStr);
  return (
    <div className="st-row st-row--single">
      <span className="st-row__name">
        {item.product_name}
        {showVolume && <span className="st-row__vol"> {item.volume}</span>}
        {showAbv && <span className="st-row__abv"> {item.abv}%</span>}
      </span>
      <Dots show={cfg.dotLeaders} />
      <span className="st-row__price">{formatPrice(item.product_price, cfg)}</span>
    </div>
  );
}

function SingleDescribedRow({ dr, cfg }) {
  const item = dr.items?.[0];
  if (!item) return null;
  return (
    <div className="st-row st-row--described">
      <div className="st-row__line">
        <span className="st-row__name">{item.product_name}</span>
        <Dots show={cfg.dotLeaders} />
        <span className="st-row__price">{formatPrice(item.product_price, cfg)}</span>
      </div>
      {dr.description && <div className="st-row__description">{dr.description}</div>}
    </div>
  );
}

function MultiInlineRow({ dr, cfg }) {
  const sep = dr.separator || ' - ';
  const names = (dr.items || []).map(i => i.product_name).join(sep);
  const price = dr.items?.[0]?.product_price;
  return (
    <div className="st-row st-row--multi">
      <span className="st-row__name">{names}</span>
      <Dots show={cfg.dotLeaders} />
      <span className="st-row__price">{formatPrice(price, cfg)}</span>
    </div>
  );
}

function BrandVariantsRow({ dr, cfg }) {
  return (
    <div className="st-row st-row--brand">
      <div className="st-row__brand-name">{dr.brand_name}</div>
      {(dr.items || []).map((item, i) => (
        <div key={i} className="st-row__variant">
          <span className="st-row__variant-label">{item.variant_label || item.product_name}</span>
          {item.volume && <span className="st-row__vol"> {item.volume}</span>}
          <Dots show={cfg.dotLeaders} />
          <span className="st-row__price">{formatPrice(item.product_price, cfg)}</span>
        </div>
      ))}
    </div>
  );
}

function PriceVariantsRow({ dr, cfg, onToggleDisplayMode }) {
  const items = dr.items || [];
  const isInline = dr.display_mode === 'inline';

  if (isInline) {
    const baseName = items[0]?.product_name?.replace(/\s*\d+\s*(cl|ml|l)$/i, '') || '';
    return (
      <div className="st-row st-row--pricevariants">
        <span className="st-row__pv-toggle" title="Switch to block" onClick={onToggleDisplayMode}>&#x25A4;</span>
        <span className="st-row__name">{baseName}</span>
        <Dots show={cfg.dotLeaders} />
        <span className="st-row__volumes-inline">
          {items.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="st-row__vol-sep">/</span>}
              <span className="st-row__vol-price">
                <span className="st-row__vol">{item.volume}</span> {formatPrice(item.product_price, cfg)}
              </span>
            </React.Fragment>
          ))}
        </span>
      </div>
    );
  }

  // Block mode (default): render each item as a SingleRow
  return (
    <div className="st-row st-row--pricevariants-block">
      <span className="st-row__pv-toggle" title="Switch to inline" onClick={onToggleDisplayMode}>&#x25A3;</span>
      {items.map((item, i) => (
        <SingleRow key={i} item={item} cfg={cfg} />
      ))}
    </div>
  );
}

function SupplementRow({ item, cfg }) {
  return (
    <div className="st-row st-row--supplement">
      <span className="st-row__supplement-name">{item.product_name}</span>
      <Dots show={cfg.dotLeaders} />
      <span className="st-row__price st-row__price--supplement">
        {item.product_price != null ? `+${formatPrice(item.product_price, cfg)}` : ''}
      </span>
    </div>
  );
}

function NoteRow({ dr }) {
  return (
    <div className="st-row st-row--note">
      {dr.description}
    </div>
  );
}

// ── Display row dispatcher ────────────────────────────────────────────────

function DisplayRowContent({ dr, cfg, onToggleDisplayMode }) {
  switch (dr.row_type) {
    case 'single':
      return (dr.items || []).map((item, i) => (
        <SingleRow key={i} item={item} cfg={cfg} />
      ));
    case 'single_described':
      return <SingleDescribedRow dr={dr} cfg={cfg} />;
    case 'multi_inline':
      return <MultiInlineRow dr={dr} cfg={cfg} />;
    case 'brand_variants':
      return <BrandVariantsRow dr={dr} cfg={cfg} />;
    case 'price_variants':
      return <PriceVariantsRow dr={dr} cfg={cfg} onToggleDisplayMode={onToggleDisplayMode} />;
    case 'supplement':
      return (dr.items || []).map((item, i) => (
        <SupplementRow key={i} item={item} cfg={cfg} />
      ));
    case 'note':
      return <NoteRow dr={dr} />;
    default:
      return (dr.items || []).map((item, i) => (
        <SingleRow key={i} item={item} cfg={cfg} />
      ));
  }
}

function DisplayRow({ dr, cfg, onChangeType, onToggleDisplayMode }) {
  return (
    <RowTypePicker currentType={dr.row_type} onChangeType={onChangeType}>
      <DisplayRowContent dr={dr} cfg={cfg} onToggleDisplayMode={onToggleDisplayMode} />
    </RowTypePicker>
  );
}

// ── Textbox (category section) ────────────────────────────────────────────

function Textbox({ tb, cfg, onChangeRowType, onToggleDisplayMode }) {
  return (
    <div className="st-textbox">
      {tb.header && (
        <h3 className="st-textbox__header">
          {tb.header}
          {tb.volume_headers && (
            <span className="st-textbox__vol-headers">
              {tb.volume_headers.join('  ')}
            </span>
          )}
        </h3>
      )}
      {(tb.display_rows || []).map((dr, drIdx) => (
        <DisplayRow
          key={drIdx}
          dr={dr}
          cfg={cfg}
          onChangeType={(newType) => onChangeRowType(drIdx, newType)}
          onToggleDisplayMode={() => onToggleDisplayMode(drIdx)}
        />
      ))}
    </div>
  );
}

// ── ScanColumn — renders one extracted column ─────────────────────────────

function ScanColumn({ col, cfg, colIdx, onChangeRowType, onToggleDisplayMode }) {
  // Cover/info panels render as a placeholder, not menu items
  if (col.role === 'cover' || col.role === 'info') {
    return (
      <div className="st-column st-column--cover">
        <div className="st-cover-panel">
          <span className="st-cover-panel__label">{col.role === 'cover' ? 'Cover' : 'Info'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="st-column">
      {(col.textboxes || []).map((tb, tbIdx) => (
        <Textbox
          key={tbIdx}
          tb={tb}
          cfg={cfg}
          onChangeRowType={(drIdx, newType) => onChangeRowType(colIdx, tbIdx, drIdx, newType)}
          onToggleDisplayMode={(drIdx) => onToggleDisplayMode(colIdx, tbIdx, drIdx)}
        />
      ))}
    </div>
  );
}

// ── Main preview ──────────────────────────────────────────────────────────

// Map legacy/detected fold types to our standardized set
function normalizeFoldType(ft) {
  if (!ft) return 'a4-portrait';
  if (ft === 'a5-portrait') return 'a4-portrait';
  if (ft === 'a5-booklet' || ft === 'a4-booklet') return 'booklet';
  if (PAPER_SIZES[ft]) return ft;
  return 'a4-portrait';
}

export default function ScanTwinPreview({ visionExtractResult, onUpdateResult, foldResult, detectedPages, storedCalibrationScale, onCalibrationChange }) {
  const styling = visionExtractResult?.styling || {};
  const foldType = normalizeFoldType(foldResult?.fold_type);

  // Determine default paper size for this fold type
  const paperDef = PAPER_SIZES[foldType] || PAPER_SIZES['a4-portrait'];
  const defaultPaper = Object.keys(paperDef.options)[0];

  const [overrideFoldType, setOverrideFoldType] = useState(null);
  const activeFoldType = overrideFoldType || foldType;

  const [cfg, setCfg] = useState({
    showEuro: styling.currency_symbol === '€' || false,
    decimalSep: 'comma',
    dotLeaders: false,
    zoom: 80,
    paperSize: defaultPaper,
    bgColor: styling.bg_color || '#faf8f4',
    textColor: styling.text_color || '#14213d',
    headerColor: styling.header_color || '#c4a96a',
  });

  // Update cfg when styling or fold type changes
  useEffect(() => {
    if (styling.bg_color || styling.text_color || styling.header_color) {
      setCfg(prev => ({
        ...prev,
        bgColor: styling.bg_color || prev.bgColor,
        textColor: styling.text_color || prev.textColor,
        headerColor: styling.header_color || prev.headerColor,
        showEuro: styling.currency_symbol === '€',
      }));
    }
  }, [styling.bg_color, styling.text_color, styling.header_color, styling.currency_symbol]);

  useEffect(() => {
    const newDefault = Object.keys((PAPER_SIZES[activeFoldType] || PAPER_SIZES['a4-portrait']).options)[0];
    setCfg(prev => ({ ...prev, paperSize: newDefault }));
  }, [activeFoldType]);

  if (!visionExtractResult?.panel?.columns?.length) return null;

  const columns = visionExtractResult.panel.columns;

  const handleChangeRowType = (colIdx, tbIdx, drIdx, newType) => {
    const updated = JSON.parse(JSON.stringify(visionExtractResult));
    const dr = updated.panel.columns[colIdx]?.textboxes?.[tbIdx]?.display_rows?.[drIdx];
    if (dr) {
      dr.row_type = newType;
      onUpdateResult(updated);
    }
  };

  const handleToggleDisplayMode = (colIdx, tbIdx, drIdx) => {
    const updated = JSON.parse(JSON.stringify(visionExtractResult));
    const dr = updated.panel.columns[colIdx]?.textboxes?.[tbIdx]?.display_rows?.[drIdx];
    if (dr) {
      dr.display_mode = dr.display_mode === 'inline' ? 'block' : 'inline';
      onUpdateResult(updated);
    }
  };

  // Get physical dimensions for current paper size
  const currentPaperDef = PAPER_SIZES[activeFoldType] || PAPER_SIZES['a4-portrait'];
  const paperDims = currentPaperDef.options[cfg.paperSize] || Object.values(currentPaperDef.options)[0];
  const zoom = (cfg.zoom || 80) / 100;
  const pageWidthPx = Math.round(paperDims.w * MM_TO_PX * zoom);
  const pageHeightPx = Math.round(paperDims.h * MM_TO_PX * zoom);

  // ── Calculate real font size from Google Vision word heights ────────────
  // Always calculate relative to A4 height (297mm) so font sizes are
  // consistent regardless of detected fold type. A5 is the same ratio.
  const REF_HEIGHT_MM = 297; // A4 portrait height — our design reference
  let bodyFontSizePx = 13; // fallback
  let headerFontSizePx = 16;
  let lineHeightRatio = 1.4; // fallback
  if (detectedPages?.length > 0) {
    // Average across all pages
    const fontSizes = detectedPages.map(page => {
      if (!page.medianWordHeight || !page.imageSize?.height) return null;
      const bodyMm = (page.medianWordHeight / page.imageSize.height) * REF_HEIGHT_MM;
      const bodyPt = bodyMm * 2.835;
      return bodyPt * 1.333; // pt to CSS px
    }).filter(Boolean);

    if (fontSizes.length > 0) {
      bodyFontSizePx = fontSizes.reduce((s, f) => s + f, 0) / fontSizes.length;
      headerFontSizePx = bodyFontSizePx * 1.4; // headers ~1.4x body
    }

    // Average line height ratio from Google Vision
    const ratios = detectedPages.map(p => p.lineHeightRatio).filter(Boolean);
    if (ratios.length > 0) {
      lineHeightRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;
    }
  }

  const scaledBodyFont = Math.round(bodyFontSizePx * zoom * 10) / 10;
  const scaledHeaderFont = Math.round(headerFontSizePx * zoom * 10) / 10;

  const styleVars = {
    '--st-bg': cfg.bgColor,
    '--st-text': cfg.textColor,
    '--st-header': cfg.headerColor,
    '--st-font-body': `${scaledBodyFont}px`,
    '--st-font-header': `${scaledHeaderFont}px`,
    '--st-line-height': `${lineHeightRatio}`,
  };

  // Group columns by page (using pageIndex from extraction)
  const pageGroups = [];
  for (const col of columns) {
    const pageIdx = col.pageIndex || 0;
    if (!pageGroups[pageIdx]) pageGroups[pageIdx] = [];
    pageGroups[pageIdx].push(col);
  }

  // For booklets, each page is rendered individually at page dimensions
  // For folded menus, each photo = one side rendered at full opened-flat dimensions
  const foldPages = foldResult?.pages || [];

  return (
    <div className="st-preview">
      <ConfigBar
        cfg={cfg}
        onChange={setCfg}
        foldType={activeFoldType}
        onFoldTypeChange={(ft) => {
          setOverrideFoldType(ft);
          const newPaperDef = PAPER_SIZES[ft] || PAPER_SIZES['a4-portrait'];
          setCfg(prev => ({ ...prev, paperSize: Object.keys(newPaperDef.options)[0] }));
        }}
      />

      {foldResult && (
        <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, marginBottom: 12 }}>
          {activeFoldType} · {foldResult.total_panels} panels
          {foldResult.columns_per_panel && ` · ${foldResult.columns_per_panel} col/panel`}
          {paperDims && ` · ${paperDims.w}×${paperDims.h}mm`}
          {bodyFontSizePx !== 13 && ` · body: ${bodyFontSizePx.toFixed(1)}px (${(bodyFontSizePx / 1.333).toFixed(1)}pt) · line-height: ${lineHeightRatio.toFixed(2)}`}
          {overrideFoldType && overrideFoldType !== foldType && (
            <span style={{ color: '#f59e0b', fontWeight: 400, marginLeft: 6 }}>(overridden from {foldType})</span>
          )}
        </div>
      )}

      {/* Render per page: front on top, back below */}
      {pageGroups.map((pageCols, pageIdx) => {
        const pageLabel = pageIdx === 0 ? 'Front' : pageIdx === 1 ? 'Back' : `Page ${pageIdx + 1}`;
        const foldPage = foldPages[pageIdx];
        const panels = foldPage?.panels || [];
        const globalOffset = pageGroups.slice(0, pageIdx).reduce((s, pg) => s + pg.length, 0);

        return (
          <MenuPage
            key={pageIdx}
            pageLabel={pageLabel}
            panels={panels}
            pageCols={pageCols}
            pageWidthPx={pageWidthPx}
            pageHeightPx={pageHeightPx}
            styleVars={styleVars}
            scaledBodyFont={scaledBodyFont}
            scaledHeaderFont={scaledHeaderFont}
            cfg={cfg}
            globalOffset={globalOffset}
            onChangeRowType={handleChangeRowType}
            onToggleDisplayMode={handleToggleDisplayMode}
            detectedPage={detectedPages?.[pageIdx]}
            storedCalibrationScale={storedCalibrationScale}
            onCalibrationChange={onCalibrationChange}
          />
        );
      })}
    </div>
  );
}

// ── MenuPage: renders one page with auto-fit ─────────────────────────────

function MenuPage({ pageLabel, panels, pageCols, pageWidthPx, pageHeightPx, styleVars, scaledBodyFont, scaledHeaderFont, cfg, globalOffset, onChangeRowType, onToggleDisplayMode, detectedPage, storedCalibrationScale, onCalibrationChange }) {
  const menuRef = useRef(null);

  // Vision calibration: compare word positions to DOM, get correction factor
  const visionScale = useVisionCalibration(menuRef, detectedPage, detectedPage?.columns, scaledBodyFont, storedCalibrationScale, onCalibrationChange);
  const calibratedBodyFont = Math.round(scaledBodyFont * visionScale * 10) / 10;
  const calibratedHeaderFont = Math.round(scaledHeaderFont * visionScale * 10) / 10;

  // Auto-fit: scale down if content overflows after calibration
  const fontScale = useAutoFit(menuRef, pageHeightPx, [pageCols, calibratedBodyFont]);

  const effectiveBodyFont = Math.round(calibratedBodyFont * fontScale * 10) / 10;
  const effectiveHeaderFont = Math.round(calibratedHeaderFont * fontScale * 10) / 10;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        {pageLabel}
        {panels.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>
            ({panels.map(p => `P${p.panel_number}: ${p.type}`).join(' | ')})
          </span>
        )}
        {visionScale !== 1 && (
          <span style={{ fontSize: 10, color: '#059669', fontWeight: 400 }}>
            (calibrated {Math.round(visionScale * 100)}%)
          </span>
        )}
        {fontScale < 0.99 && (
          <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 400 }}>
            (fit {Math.round(fontScale * 100)}%)
          </span>
        )}
      </div>
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div
          ref={menuRef}
          className="st-preview__menu"
          style={{
            ...styleVars,
            '--st-font-body': `${effectiveBodyFont}px`,
            '--st-font-header': `${effectiveHeaderFont}px`,
            width: pageWidthPx,
            height: pageHeightPx,
            maxWidth: 'none',
            flexShrink: 0,
            fontSize: `${effectiveBodyFont}px`,
            overflow: 'hidden',
          }}
        >
          {pageCols.map((col, ci) => (
            <React.Fragment key={ci}>
              {ci > 0 && <div className="st-preview__divider" />}
              <ScanColumn
                col={col}
                cfg={cfg}
                colIdx={globalOffset + ci}
                onChangeRowType={onChangeRowType}
                onToggleDisplayMode={onToggleDisplayMode}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Vision calibration: compare Vision word positions to DOM ─────────────
// Finds reference rows in Vision data and compares name-width ratios to the
// rendered DOM. Returns a font scale correction factor.

function extractVisionRows(debugWords, columns) {
  // For the first content column, find rows of words (grouped by y-position)
  if (!debugWords?.length || !columns?.length) return [];

  const col = columns[0]; // first column
  const colX0 = col.x_start / 100; // 0-1 range
  const colX1 = col.x_end / 100;
  const colWidth = colX1 - colX0;
  if (colWidth <= 0) return [];

  // Filter words in this column (by midpoint)
  const colWords = debugWords.filter(w => {
    const wMid = (w.x0_pct + w.x1_pct) / 2 / 100;
    return wMid >= colX0 && wMid <= colX1 && !w.isHeader && !w.isLarge;
  });

  // Group words into rows by y-position (within ~1.5% of image height)
  const sorted = [...colWords].sort((a, b) => a.y0_pct - b.y0_pct);
  const rows = [];
  let currentRow = [];
  let lastY = -999;

  for (const w of sorted) {
    if (w.y0_pct - lastY > 1.5) {
      if (currentRow.length) rows.push(currentRow);
      currentRow = [w];
    } else {
      currentRow.push(w);
    }
    lastY = w.y0_pct;
  }
  if (currentRow.length) rows.push(currentRow);

  // For each row, find name words (left) and price word (right)
  const measurements = [];
  for (const row of rows) {
    const priceWords = row.filter(w => w.isPrice);
    const nameWords = row.filter(w => !w.isPrice && !w.isABV);
    if (priceWords.length === 0 || nameWords.length === 0) continue;

    // Name: from leftmost name word to rightmost name word
    const nameX0 = Math.min(...nameWords.map(w => w.x0_pct)) / 100;
    const nameX1 = Math.max(...nameWords.map(w => w.x1_pct)) / 100;
    const nameWidthRatio = (nameX1 - nameX0) / colWidth;

    // Price: rightmost price word
    const priceX0 = Math.min(...priceWords.map(w => w.x0_pct)) / 100;
    const priceX1 = Math.max(...priceWords.map(w => w.x1_pct)) / 100;

    // Gap ratio between name end and price start
    const gapRatio = (priceX0 - nameX1) / colWidth;

    if (nameWidthRatio > 0.05 && nameWidthRatio < 0.9 && gapRatio > 0) {
      measurements.push({ nameWidthRatio, gapRatio });
    }

    if (measurements.length >= 10) break; // enough samples
  }

  return measurements;
}

function useVisionCalibration(menuRef, detectedPage, columns, scaledBodyFont, storedScale, onCalibrationChange) {
  const [calibration, setCalibration] = useState(storedScale || 1);
  const hasCalibrated = useRef(false);

  // Use stored calibration when no detectedPage is available (loading from DB)
  useEffect(() => {
    if (storedScale && storedScale !== 1 && !detectedPage?.debugWords) {
      setCalibration(storedScale);
      hasCalibrated.current = true;
    }
  }, [storedScale, detectedPage]);

  useEffect(() => {
    if (!menuRef.current || !detectedPage?.debugWords || hasCalibrated.current) return;

    const timer = setTimeout(() => {
      const el = menuRef.current;
      if (!el) return;

      // Get Vision reference measurements
      const detectedCols = detectedPage.columns || [];
      const visionRows = extractVisionRows(detectedPage.debugWords, detectedCols);
      if (visionRows.length < 3) return; // not enough data

      // Measure the same on the DOM — first column's single rows
      const firstCol = el.querySelector('.st-column');
      if (!firstCol) return;

      const colRect = firstCol.getBoundingClientRect();
      const domRows = firstCol.querySelectorAll('.st-row--single');
      if (domRows.length < 3) return;

      const domMeasurements = [];
      for (let i = 0; i < Math.min(domRows.length, 10); i++) {
        const row = domRows[i];
        const nameEl = row.querySelector('.st-row__name');
        const priceEl = row.querySelector('.st-row__price');
        if (!nameEl || !priceEl) continue;

        const nameRect = nameEl.getBoundingClientRect();
        const nameWidthRatio = nameRect.width / colRect.width;

        if (nameWidthRatio > 0.05 && nameWidthRatio < 0.9) {
          domMeasurements.push({ nameWidthRatio });
        }
      }

      if (domMeasurements.length < 3) return;

      // Compare: median Vision nameWidthRatio vs median DOM nameWidthRatio
      const visionMedian = visionRows
        .map(r => r.nameWidthRatio)
        .sort((a, b) => a - b)[Math.floor(visionRows.length / 2)];

      const domMedian = domMeasurements
        .map(r => r.nameWidthRatio)
        .sort((a, b) => a - b)[Math.floor(domMeasurements.length / 2)];

      if (domMedian > 0 && visionMedian > 0) {
        // If Vision says names take 60% but DOM shows 45%, font is too small
        // Scale factor: visionMedian / domMedian
        const rawScale = visionMedian / domMedian;
        // Clamp to reasonable range (0.7x - 1.5x correction)
        const clamped = Math.max(0.7, Math.min(1.5, rawScale));
        // Only apply if the difference is meaningful (> 5%)
        if (Math.abs(clamped - 1) > 0.05) {
          console.log(`[vision-calibration] Vision median: ${(visionMedian * 100).toFixed(1)}%, DOM median: ${(domMedian * 100).toFixed(1)}%, correction: ${clamped.toFixed(3)}x`);
          setCalibration(clamped);
          if (onCalibrationChange) onCalibrationChange(clamped);
        }
      }

      hasCalibrated.current = true;
    }, 500); // wait for initial render

    return () => clearTimeout(timer);
  }, [menuRef, detectedPage, columns, scaledBodyFont]);

  return calibration;
}

// ── Auto-fit: measures content and returns a font scale factor ────────────

function useAutoFit(ref, targetHeight, deps) {
  const [fontScale, setFontScale] = useState(1);
  const iterRef = useRef(0);

  useEffect(() => {
    // Reset on content change
    iterRef.current = 0;
    setFontScale(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(deps || [])]);

  useEffect(() => {
    if (!ref.current || !targetHeight || iterRef.current > 10) return;

    const timer = setTimeout(() => {
      const el = ref.current;
      if (!el) return;

      // Temporarily remove height constraint to measure natural height
      const prev = { h: el.style.height, mh: el.style.minHeight, o: el.style.overflow };
      el.style.height = 'auto';
      el.style.minHeight = 'auto';
      el.style.overflow = 'visible';

      const naturalHeight = el.scrollHeight;

      el.style.height = prev.h;
      el.style.minHeight = prev.mh;
      el.style.overflow = prev.o;

      if (naturalHeight > targetHeight + 2) {
        const ratio = targetHeight / naturalHeight;
        const newScale = Math.max(0.4, fontScale * ratio * 0.98);
        iterRef.current++;
        setFontScale(newScale);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [targetHeight, fontScale, ref]);

  return fontScale;
}
