import React from 'react';

/* ────────────────────────────────────────────
   Format catalogue — each entry defines a menu
   format the user can preview.
   ──────────────────────────────────────────── */
export const FORMAT_CATALOG = [
  { id: 'a5-portrait',      label: 'A5 Portrait Flat',        pages: 2,  desc: '2 pages' },
  { id: 'a4-portrait',      label: 'A4 Portrait Flat',        pages: 2,  desc: '2 pages' },
  { id: 'a4-landscape',     label: 'A4 Landscape Flat',       pages: 2,  desc: '2 pages' },
  { id: 'bifold',           label: 'Bi-fold Menu',            pages: 4,  desc: '4 pages' },
  { id: 'trifold',          label: 'Tri-fold Menu',           pages: 6,  desc: '6 pages' },
  { id: 'zfold',            label: 'Z-fold Menu',             pages: 6,  desc: '6 pages' },
  { id: 'four-panel',       label: 'Four-panel Folded',       pages: 8,  desc: '8 pages' },
  { id: 'a4-booklet',       label: 'A4 Booklet Menu',         pages: 8,  desc: '8+ pages' },
  { id: 'a5-booklet',       label: 'A5 Booklet Menu',         pages: 8,  desc: '8+ pages' },
  { id: 'gate-fold',        label: 'Gate Fold Menu',          pages: 4,  desc: '4 panels' },
  { id: 'accordion',        label: 'Accordion Fold Menu',     pages: 4,  desc: '4+ panels' },
  { id: 'roll-fold',        label: 'Roll Fold Menu',          pages: 4,  desc: '4 panels' },
  { id: 'double-parallel',  label: 'Double Parallel Fold',    pages: 8,  desc: '8 panels' },
];

/* ── tiny SVG thumbnails for each format ── */
const T = ({ children, w = 120, h = 80 }) => (
  <svg viewBox={`0 0 ${w} ${h}`} className="fp-thumb" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

const P  = (props) => <rect rx="2" fill="#f5f0e6" stroke="#c4a96a" strokeWidth="1.2" {...props} />;
const FL = (props) => <line stroke="#c4a96a" strokeWidth="0.8" strokeDasharray="3,2" {...props} />;

const THUMBS = {
  'a5-portrait':     () => <T><P x="18" y="8"  width="34" height="64" /><P x="68" y="8"  width="34" height="64" /></T>,
  'a4-portrait':     () => <T><P x="14" y="5"  width="40" height="70" /><P x="66" y="5"  width="40" height="70" /></T>,
  'a4-landscape':    () => <T><P x="5"  y="15" width="50" height="50" /><P x="65" y="15" width="50" height="50" /></T>,
  'bifold':          () => <T><P x="10" y="10" width="46" height="60" /><FL x1="56" y1="10" x2="56" y2="70" /><P x="56" y="10" width="46" height="60" /><line x1="56" y1="10" x2="56" y2="70" stroke="#b89a5a" strokeWidth="1.5" /></T>,
  'trifold':         () => <T><P x="5" y="12" width="34" height="56" /><P x="42" y="12" width="34" height="56" /><P x="79" y="12" width="34" height="56" /><line x1="39" y1="12" x2="39" y2="68" stroke="#b89a5a" strokeWidth="1.5" /><line x1="76" y1="12" x2="76" y2="68" stroke="#b89a5a" strokeWidth="1.5" /></T>,
  'zfold':           () => (
    <T>
      <P x="5"  y="12" width="34" height="56" />
      <P x="42" y="12" width="34" height="56" />
      <P x="79" y="12" width="34" height="56" />
      <line x1="39" y1="12" x2="39" y2="68" stroke="#b89a5a" strokeWidth="1.5" />
      <line x1="76" y1="12" x2="76" y2="68" stroke="#b89a5a" strokeWidth="1.5" />
      {/* Z arrows */}
      <polyline points="22,6 60,6 60,74 97,74" fill="none" stroke="#c4a96a" strokeWidth="1" strokeDasharray="2,2" />
    </T>
  ),
  'four-panel':      () => (
    <T>
      <P x="3"  y="14" width="26" height="52" />
      <P x="31" y="14" width="26" height="52" />
      <P x="59" y="14" width="26" height="52" />
      <P x="87" y="14" width="26" height="52" />
      <line x1="29"  y1="14" x2="29"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
      <line x1="57"  y1="14" x2="57"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
      <line x1="85"  y1="14" x2="85"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
    </T>
  ),
  'a4-booklet':      () => (
    <T>
      {/* stacked pages effect */}
      <P x="22" y="4"  width="76" height="56" />
      <P x="19" y="7"  width="76" height="56" />
      <P x="16" y="10" width="76" height="56" />
      <line x1="54" y1="10" x2="54" y2="66" stroke="#b89a5a" strokeWidth="1.2" />
      {/* spine */}
      <rect x="52" y="8" width="4" height="60" fill="#d4b87a" rx="1" opacity="0.5" />
    </T>
  ),
  'a5-booklet':      () => (
    <T>
      <P x="26" y="6"  width="62" height="52" />
      <P x="23" y="9"  width="62" height="52" />
      <P x="20" y="12" width="62" height="52" />
      <line x1="51" y1="12" x2="51" y2="64" stroke="#b89a5a" strokeWidth="1.2" />
      <rect x="49" y="10" width="4" height="56" fill="#d4b87a" rx="1" opacity="0.5" />
    </T>
  ),
  'gate-fold':       () => (
    <T>
      {/* narrow left flap */}
      <P x="10" y="12" width="22" height="56" />
      {/* wide center */}
      <P x="34" y="12" width="44" height="56" />
      {/* narrow right flap */}
      <P x="80" y="12" width="22" height="56" />
      <line x1="32" y1="12" x2="32" y2="68" stroke="#b89a5a" strokeWidth="1.5" />
      <line x1="78" y1="12" x2="78" y2="68" stroke="#b89a5a" strokeWidth="1.5" />
      {/* fold arrows inward */}
      <path d="M21,8 L34,8" fill="none" stroke="#c4a96a" strokeWidth="0.8" markerEnd="url(#arr)" />
      <path d="M91,8 L78,8" fill="none" stroke="#c4a96a" strokeWidth="0.8" markerEnd="url(#arr)" />
      <defs><marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#c4a96a"/></marker></defs>
    </T>
  ),
  'accordion':       () => (
    <T>
      <P x="3"  y="14" width="26" height="52" />
      <P x="31" y="14" width="26" height="52" />
      <P x="59" y="14" width="26" height="52" />
      <P x="87" y="14" width="26" height="52" />
      <line x1="29"  y1="14" x2="29"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
      <line x1="57"  y1="14" x2="57"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
      <line x1="85"  y1="14" x2="85"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
      {/* zigzag hint */}
      <polyline points="16,10 44,6 72,10 100,6" fill="none" stroke="#c4a96a" strokeWidth="0.8" strokeDasharray="2,2" />
    </T>
  ),
  'roll-fold':       () => (
    <T>
      {/* panels getting progressively narrower toward the roll */}
      <P x="3"  y="14" width="30" height="52" />
      <P x="35" y="14" width="28" height="52" />
      <P x="65" y="14" width="26" height="52" />
      <P x="93" y="14" width="24" height="52" />
      <line x1="33"  y1="14" x2="33"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
      <line x1="63"  y1="14" x2="63"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
      <line x1="91"  y1="14" x2="91"  y2="66" stroke="#b89a5a" strokeWidth="1.5" />
      {/* roll arrow */}
      <path d="M110,40 Q118,40 115,30 Q112,20 105,25" fill="none" stroke="#c4a96a" strokeWidth="0.8" />
    </T>
  ),
  'double-parallel': () => (
    <T w="140" h="80">
      {/* top row of 4 */}
      <P x="5"  y="5"  width="30" height="32" />
      <P x="37" y="5"  width="30" height="32" />
      <P x="69" y="5"  width="30" height="32" />
      <P x="101" y="5" width="30" height="32" />
      {/* bottom row of 4 */}
      <P x="5"  y="42" width="30" height="32" />
      <P x="37" y="42" width="30" height="32" />
      <P x="69" y="42" width="30" height="32" />
      <P x="101" y="42" width="30" height="32" />
      {/* vertical fold lines */}
      <line x1="35"  y1="3"  x2="35"  y2="77" stroke="#b89a5a" strokeWidth="1.2" />
      <line x1="67"  y1="3"  x2="67"  y2="77" stroke="#b89a5a" strokeWidth="1.2" />
      <line x1="99"  y1="3"  x2="99"  y2="77" stroke="#b89a5a" strokeWidth="1.2" />
      {/* horizontal fold */}
      <line x1="3"   y1="40" x2="133" y2="40" stroke="#b89a5a" strokeWidth="1.2" />
    </T>
  ),
};

/* ── Format Picker Grid ── */
const FormatPicker = ({ onSelect, onUpload, showUploader, onExtractResult, onCloseUploader }) => {
  // Lazy import to avoid circular deps
  const TwinUploader = React.lazy(() => import('./TwinUploader'));

  return (
    <div className="fp-container">
      <div className="fp-header">
        <div>
          <h2 className="fp-title">Choose a Menu Format</h2>
          <p className="fp-subtitle">Select a fold type to preview your menu, or upload photos to auto-detect</p>
        </div>
        <button className="fp-upload-btn" onClick={onUpload}>
          Upload menu photos
        </button>
      </div>

      {showUploader && (
        <React.Suspense fallback={<div className="twin-loading">Loading...</div>}>
          <TwinUploader onResult={onExtractResult} onClose={onCloseUploader} />
        </React.Suspense>
      )}

      <div className="fp-grid">
        {FORMAT_CATALOG.map(fmt => {
          const Thumb = THUMBS[fmt.id];
          return (
            <div key={fmt.id} className="fp-card" onClick={() => onSelect(fmt.id)}>
              <div className="fp-card__preview">
                {Thumb && <Thumb />}
              </div>
              <div className="fp-card__info">
                <span className="fp-card__label">{fmt.label}</span>
                <span className="fp-card__desc">{fmt.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormatPicker;
