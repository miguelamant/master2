import React, { useState, useRef, useEffect } from 'react';
import { FORMAT_CATALOG } from '../Dashboard/DigitalTwin/FormatPicker';
import MenuPreview from '../Dashboard/DigitalTwin/MenuPreview';
import FoldDiagram from '../Dashboard/DigitalTwin/FoldDiagram';
import '../Dashboard/DigitalTwin/DigitalTwin.css';
import './ScanTwinPreview.css';

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

function ConfigBar({ cfg, onChange }) {
  const set = (patch) => onChange({ ...cfg, ...patch });

  return (
    <div className="twin-config" style={{ marginBottom: 16 }}>
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
  return (
    <div className="st-row st-row--single">
      <span className="st-row__name">
        {item.product_name}
        {item.volume && <span className="st-row__vol"> {item.volume}</span>}
        {item.abv != null && <span className="st-row__abv"> {item.abv}%</span>}
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

function PriceVariantsRow({ dr, cfg }) {
  const baseName = dr.items?.[0]?.product_name?.replace(/\s*\d+\s*(cl|ml|l)$/i, '') || '';
  const items = dr.items || [];
  return (
    <div className="st-row st-row--pricevariants">
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

function DisplayRowContent({ dr, cfg }) {
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
      return <PriceVariantsRow dr={dr} cfg={cfg} />;
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

function DisplayRow({ dr, cfg, onChangeType }) {
  return (
    <RowTypePicker currentType={dr.row_type} onChangeType={onChangeType}>
      <DisplayRowContent dr={dr} cfg={cfg} />
    </RowTypePicker>
  );
}

// ── Textbox (category section) ────────────────────────────────────────────

function Textbox({ tb, cfg, onChangeRowType }) {
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
        />
      ))}
    </div>
  );
}

// ── ScanColumn — renders one extracted column ─────────────────────────────

function ScanColumn({ col, cfg, colIdx, onChangeRowType }) {
  return (
    <div className="st-column">
      {(col.textboxes || []).map((tb, tbIdx) => (
        <Textbox
          key={tbIdx}
          tb={tb}
          cfg={cfg}
          onChangeRowType={(drIdx, newType) => onChangeRowType(colIdx, tbIdx, drIdx, newType)}
        />
      ))}
    </div>
  );
}

// ── Logo placeholder ──────────────────────────────────────────────────────

function LogoPlaceholder({ logo }) {
  if (!logo) return null;
  return (
    <div
      className="st-logo-placeholder"
      style={{
        position: 'absolute',
        left: `${logo.x_pct}%`,
        top: `${logo.y_pct}%`,
        width: `${logo.w_pct}%`,
        height: `${logo.h_pct}%`,
      }}
    >
      <span className="st-logo-placeholder__label">LOGO</span>
    </div>
  );
}

// ── Format selector ───────────────────────────────────────────────────────

function FormatSelector({ selectedFormat, onSelect }) {
  return (
    <div className="twin-format-switcher" style={{ marginBottom: 16 }}>
      <span className="twin-format-switcher__label">Format:</span>
      <div className="twin-format-switcher__options">
        {FORMAT_CATALOG.map(f => (
          <button
            key={f.id}
            className={`twin-format-switcher__btn ${f.id === selectedFormat ? 'twin-format-switcher__btn--active' : ''}`}
            onClick={() => onSelect(f.id)}
            title={f.desc}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main preview ──────────────────────────────────────────────────────────

export default function ScanTwinPreview({ visionExtractResult, onUpdateResult }) {
  const styling = visionExtractResult?.styling || {};

  const [cfg, setCfg] = useState({
    showEuro: true,
    decimalSep: 'comma',
    dotLeaders: false,
    bgColor: styling.bg_color || '#faf8f4',
    textColor: styling.text_color || '#14213d',
    headerColor: styling.header_color || '#c4a96a',
  });

  const [selectedFormat, setSelectedFormat] = useState(styling.fold_type || null);

  // Update cfg when styling arrives from extraction
  useEffect(() => {
    if (styling.bg_color || styling.text_color || styling.header_color) {
      setCfg(prev => ({
        ...prev,
        bgColor: styling.bg_color || prev.bgColor,
        textColor: styling.text_color || prev.textColor,
        headerColor: styling.header_color || prev.headerColor,
      }));
    }
    if (styling.fold_type && !selectedFormat) {
      setSelectedFormat(styling.fold_type);
    }
  }, [styling.bg_color, styling.text_color, styling.header_color, styling.fold_type]);

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

  const styleVars = {
    '--st-bg': cfg.bgColor,
    '--st-text': cfg.textColor,
    '--st-header': cfg.headerColor,
  };

  return (
    <div className="st-preview">
      <ConfigBar cfg={cfg} onChange={setCfg} />
      <FormatSelector selectedFormat={selectedFormat} onSelect={setSelectedFormat} />

      {/* Raw column view — the extracted structure as-is */}
      <div className="st-preview__menu" style={styleVars}>
        <LogoPlaceholder logo={styling.logo} />
        {columns.map((col, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="st-preview__divider" />}
            <ScanColumn
              col={col}
              cfg={cfg}
              colIdx={i}
              onChangeRowType={handleChangeRowType}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Fold format preview — using the existing MenuPreview renderer */}
      {selectedFormat && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
            Fold preview — {FORMAT_CATALOG.find(f => f.id === selectedFormat)?.label}
          </h3>
          <ScanFoldPreview
            columns={columns}
            format={selectedFormat}
            cfg={cfg}
            onChangeRowType={handleChangeRowType}
          />
        </div>
      )}
    </div>
  );
}

// ── Fold preview: distribute extracted columns across panels ───────────────

function ScanFoldPreview({ columns, format, cfg, onChangeRowType }) {
  const formatDef = FORMAT_CATALOG.find(f => f.id === format);
  if (!formatDef) return null;

  const panelCount = formatDef.pages;

  // Distribute columns across panels (1 column per panel, or merge if fewer panels than columns)
  const panels = {};
  for (let i = 0; i < panelCount; i++) panels[i] = [];

  // Map extracted columns to panels
  for (let i = 0; i < columns.length; i++) {
    const panelIdx = Math.min(i, panelCount - 1);
    const col = columns[i];
    // Flatten the column's textboxes into menu items for the panel renderer
    for (const tb of (col.textboxes || [])) {
      for (const dr of (tb.display_rows || [])) {
        for (const item of (dr.items || [])) {
          panels[panelIdx].push({
            id_menu_item: `${i}-${panels[panelIdx].length}`,
            item_name: item.product_name,
            category: tb.header || 'Other',
            description: item.product_description || '',
            abv: item.abv,
            price: item.product_price != null ? item.product_price / 100 : null,
            page_number: panelIdx + 1,
            sort_order: panels[panelIdx].length,
          });
        }
      }
    }
  }

  const styling = {
    bgColor: cfg.bgColor,
    textColor: cfg.textColor,
    headerColor: cfg.headerColor,
    accentColor: cfg.headerColor,
    fontFamily: 'Inter',
    fontSizeBase: 13,
  };

  return (
    <MenuPreview
      format={format}
      columns={1}
      showEuro={cfg.showEuro}
      decimalSep={cfg.decimalSep}
      pages={panels}
      styling={styling}
    />
  );
}
