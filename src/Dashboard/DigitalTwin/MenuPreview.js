import React, { useRef, useEffect, useState } from 'react';
import MenuPanel from './MenuPanel';
import FoldDiagram from './FoldDiagram';

/* ── Layout: how many panels on each side of the paper ── */
const LAYOUT = {
  'a5-portrait':     { front: 1, back: 1, pw: 248, ph: 352 },
  'a4-portrait':     { front: 1, back: 1, pw: 280, ph: 396 },
  'a4-landscape':    { front: 1, back: 1, pw: 396, ph: 280 },
  'bifold':          { front: 2, back: 2, pw: 230, ph: 330 },
  'trifold':         { front: 3, back: 3, pw: 200, ph: 300 },
  'zfold':           { front: 3, back: 3, pw: 200, ph: 300 },
  'four-panel':      { front: 4, back: 4, pw: 180, ph: 280 },
  'a4-booklet':      { front: 4, back: 4, pw: 240, ph: 340 },
  'a5-booklet':      { front: 4, back: 4, pw: 210, ph: 300 },
  'gate-fold':       { front: 2, back: 2, pw: 220, ph: 320 },
  'accordion':       { front: 2, back: 2, pw: 220, ph: 310 },
  'roll-fold':       { front: 2, back: 2, pw: 220, ph: 310 },
  'double-parallel': { front: 4, back: 4, pw: 190, ph: 270 },
};

const MenuPreview = ({ format, columns, showEuro, decimalSep, pages, styling = {} }) => {
  const layout = LAYOUT[format] || LAYOUT['a4-portrait'];
  const { front, back, pw, ph } = layout;
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const maxPerRow = Math.max(front, back);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 200;
      const needed = maxPerRow * pw + (maxPerRow - 1) * 2;
      setScale(available < needed ? Math.max(0.35, available / needed) : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxPerRow, pw]);

  // Build CSS custom properties from styling
  const styleVars = {
    '--twin-bg':      styling.bgColor     || '#faf8f4',
    '--twin-text':    styling.textColor    || '#14213d',
    '--twin-header':  styling.headerColor  || '#c4a96a',
    '--twin-accent':  styling.accentColor  || '#c4a96a',
    '--twin-font':    styling.fontFamily   || 'Inter',
    '--twin-size':    `${styling.fontSizeBase || 13}px`,
  };

  const panelStyle = { width: pw, minHeight: ph };

  const makePanel = (pageIdx) => (
    <MenuPanel
      key={pageIdx}
      pageIndex={pageIdx}
      items={pages[pageIdx] || []}
      columns={columns}
      showEuro={showEuro}
      decimalSep={decimalSep}
      style={panelStyle}
    />
  );

  const buildSide = (startIdx, count) => {
    const els = [];
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        els.push(
          <div key={`fold-${i}`} className="flat-fold-line">
            <div className="flat-fold-line__dash" />
          </div>
        );
      }
      els.push(makePanel(startIdx + i));
    }
    return els;
  };

  return (
    <div className="flat-preview" ref={containerRef} style={styleVars}>
      <div className="flat-preview__cards" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div className="flat-side">
          <div className="flat-side__label">Voorkant (Front)</div>
          <div className="flat-side__panels">
            {buildSide(0, front)}
          </div>
        </div>

        <div className="flat-side">
          <div className="flat-side__label">Achterkant (Back)</div>
          <div className="flat-side__panels">
            {buildSide(front, back)}
          </div>
        </div>
      </div>

      <div className="flat-preview__diagram">
        <div className="flat-preview__diagram-label">Fold preview</div>
        <FoldDiagram format={format} />
      </div>
    </div>
  );
};

export default MenuPreview;
