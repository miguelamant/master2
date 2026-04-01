import React, { useRef, useEffect, useState } from 'react';
import MenuPanel from './MenuPanel';

const PANEL_COUNTS = { single: 1, bifold: 2, trifold: 3, quadfold: 4 };

const MenuPreview = ({ format, columns, showEuro, decimalSep, pages }) => {
  const panelCount = PANEL_COUNTS[format] || 1;
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Responsive scaling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width;
      const needed = panelCount * 300 + (panelCount - 1) * 4;
      setScale(available < needed ? available / needed : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [panelCount]);

  return (
    <div className="twin-scene" ref={containerRef}>
      <div
        className={`twin-book twin-book--${format}`}
        style={{ transform: `scale(${scale}) rotateX(2deg) rotateY(-5deg)` }}
      >
        {Array.from({ length: panelCount }).map((_, i) => (
          <MenuPanel
            key={i}
            pageIndex={i}
            items={pages[i] || []}
            columns={columns}
            showEuro={showEuro}
            decimalSep={decimalSep}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuPreview;
