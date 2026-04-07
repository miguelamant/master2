import React from 'react';

/* ─────────────────────────────────────────────────────
   Small 3D-ish SVG diagrams showing how each format
   folds. Displayed beside the flat preview.
   ───────────────────────────────────────────────────── */

const S = ({ children, w = 160, h = 120 }) => (
  <svg viewBox={`0 0 ${w} ${h}`} className="fold-diagram" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

/* shared helpers */
const Panel = (props) => (
  <rect rx="2" fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" {...props} />
);
const Fold = (props) => (
  <line stroke="#cc3333" strokeWidth="1" strokeDasharray="4,2" {...props} />
);
const Label = ({ x, y, children }) => (
  <text x={x} y={y} fontSize="7" fill="#999" textAnchor="middle" fontFamily="sans-serif">{children}</text>
);

const DIAGRAMS = {
  /* ── Flat formats: just front + back, no fold ── */
  'a5-portrait': () => (
    <S>
      <Panel x="20" y="10" width="50" height="70" />
      <Panel x="90" y="10" width="50" height="70" />
      <Label x="45" y="95">Front</Label>
      <Label x="115" y="95">Back</Label>
    </S>
  ),
  'a4-portrait': () => (
    <S>
      <Panel x="15" y="5" width="55" height="78" />
      <Panel x="90" y="5" width="55" height="78" />
      <Label x="42" y="98">Front</Label>
      <Label x="117" y="98">Back</Label>
    </S>
  ),
  'a4-landscape': () => (
    <S>
      <Panel x="8" y="20" width="65" height="50" />
      <Panel x="87" y="20" width="65" height="50" />
      <Label x="40" y="85">Front</Label>
      <Label x="119" y="85">Back</Label>
    </S>
  ),

  /* ── Bifold: two panels folding together like a book ── */
  'bifold': () => (
    <S>
      {/* 3D-ish perspective: left panel angled, right panel angled */}
      <polygon points="25,15 70,10 70,90 25,85" fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="70,10 120,15 120,85 70,90" fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <Fold x1="70" y1="10" x2="70" y2="90" />
      {/* shadow on fold */}
      <line x1="71" y1="12" x2="71" y2="88" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
      <Label x="72" y="108">Bi-fold</Label>
    </S>
  ),

  /* ── Trifold: three panels, left folds over center ── */
  'trifold': () => (
    <S>
      <polygon points="10,18 50,12 50,88 10,82" fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="50,12 95,10 95,90 50,88" fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="95,10 140,14 140,86 95,90" fill="#e8dfc8" stroke="#b89a5a" strokeWidth="1" />
      <Fold x1="50" y1="12" x2="50" y2="88" />
      <Fold x1="95" y1="10" x2="95" y2="90" />
      <Label x="75" y="108">Tri-fold</Label>
    </S>
  ),

  /* ── Z-fold: zigzag ── */
  'zfold': () => (
    <S>
      <polygon points="10,20 48,12 48,82 10,74" fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="48,12 92,20 92,82 48,74"  fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="92,20 135,12 135,82 92,74" fill="#e8dfc8" stroke="#b89a5a" strokeWidth="1" />
      <Fold x1="48" y1="12" x2="48" y2="82" />
      <Fold x1="92" y1="12" x2="92" y2="82" />
      {/* Z arrows */}
      <polyline points="30,8 70,4 70,90 115,86" fill="none" stroke="#cc3333" strokeWidth="0.6" strokeDasharray="2,2" opacity="0.5" />
      <Label x="75" y="108">Z-fold</Label>
    </S>
  ),

  /* ── Four-panel ── */
  'four-panel': () => (
    <S w="180">
      <polygon points="5,20  40,14 40,86 5,80"   fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="40,14 80,10 80,90 40,86"   fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="80,10 120,14 120,86 80,90"  fill="#e8dfc8" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="120,14 160,20 160,80 120,86" fill="#e2d9bc" stroke="#b89a5a" strokeWidth="1" />
      <Fold x1="40"  y1="14" x2="40"  y2="86" />
      <Fold x1="80"  y1="10" x2="80"  y2="90" />
      <Fold x1="120" y1="14" x2="120" y2="86" />
      <Label x="90" y="108">Four-panel</Label>
    </S>
  ),

  /* ── Booklets: pages stacked like a book ── */
  'a4-booklet': () => (
    <S>
      {/* stacked page effect */}
      <Panel x="30" y="8"  width="100" height="72" />
      <Panel x="27" y="12" width="100" height="72" />
      <Panel x="24" y="16" width="100" height="72" />
      {/* spine */}
      <rect x="72" y="14" width="4" height="76" fill="#d4b87a" rx="1" opacity="0.5" />
      <Fold x1="74" y1="16" x2="74" y2="88" />
      <Label x="74" y="108">A4 Booklet</Label>
    </S>
  ),
  'a5-booklet': () => (
    <S>
      <Panel x="35" y="12" width="85" height="64" />
      <Panel x="32" y="16" width="85" height="64" />
      <Panel x="29" y="20" width="85" height="64" />
      <rect x="69" y="18" width="4" height="68" fill="#d4b87a" rx="1" opacity="0.5" />
      <Fold x1="71" y1="20" x2="71" y2="84" />
      <Label x="71" y="108">A5 Booklet</Label>
    </S>
  ),

  /* ── Gate fold: two narrow flaps folding inward over center ── */
  'gate-fold': () => (
    <S>
      {/* narrow left flap */}
      <polygon points="15,22 42,16 42,84 15,78" fill="#e8dfc8" stroke="#b89a5a" strokeWidth="1" />
      {/* wide center */}
      <polygon points="42,16 110,16 110,84 42,84" fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      {/* narrow right flap */}
      <polygon points="110,16 140,22 140,78 110,84" fill="#e8dfc8" stroke="#b89a5a" strokeWidth="1" />
      <Fold x1="42" y1="16" x2="42" y2="84" />
      <Fold x1="110" y1="16" x2="110" y2="84" />
      {/* inward arrows */}
      <path d="M28,10 L42,10" fill="none" stroke="#cc3333" strokeWidth="0.8" markerEnd="url(#arrowRed)" />
      <path d="M128,10 L114,10" fill="none" stroke="#cc3333" strokeWidth="0.8" markerEnd="url(#arrowRed)" />
      <defs>
        <marker id="arrowRed" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#cc3333"/>
        </marker>
      </defs>
      <Label x="77" y="108">Gate fold</Label>
    </S>
  ),

  /* ── Accordion: zigzag panels ── */
  'accordion': () => (
    <S>
      <polygon points="10,24 42,14 42,86 10,76"  fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="42,14 78,24 78,76 42,86"   fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="78,24 114,14 114,86 78,76"  fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="114,14 148,24 148,76 114,86" fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <Fold x1="42"  y1="14" x2="42"  y2="86" />
      <Fold x1="78"  y1="14" x2="78"  y2="86" />
      <Fold x1="114" y1="14" x2="114" y2="86" />
      <Label x="80" y="108">Accordion</Label>
    </S>
  ),

  /* ── Roll fold: panels roll inward progressively ── */
  'roll-fold': () => (
    <S>
      <polygon points="10,18 48,14 48,86 10,82"   fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="48,14 84,16 84,84 48,86"    fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="84,16 118,18 118,82 84,84"   fill="#e8dfc8" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="118,18 148,22 148,78 118,82"  fill="#e2d9bc" stroke="#b89a5a" strokeWidth="1" />
      <Fold x1="48"  y1="14" x2="48"  y2="86" />
      <Fold x1="84"  y1="16" x2="84"  y2="84" />
      <Fold x1="118" y1="18" x2="118" y2="82" />
      {/* roll curve hint */}
      <path d="M145,50 Q155,50 152,38 Q149,26 142,32" fill="none" stroke="#cc3333" strokeWidth="0.7" opacity="0.5" />
      <Label x="80" y="108">Roll fold</Label>
    </S>
  ),

  /* ── Double parallel: two parallel folds ── */
  'double-parallel': () => (
    <S w="180">
      {/* top halves */}
      <polygon points="10,8  45,5  45,48 10,45"   fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="45,5  85,3  85,50 45,48"    fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="85,3  125,5  125,48 85,50"   fill="#e8dfc8" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="125,5 165,8  165,45 125,48"  fill="#e2d9bc" stroke="#b89a5a" strokeWidth="1" />
      {/* bottom halves */}
      <polygon points="10,55 45,52 45,95 10,92"    fill="#f5f0e6" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="45,52 85,50 85,97 45,95"     fill="#ede6d4" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="85,50 125,52 125,95 85,97"   fill="#e8dfc8" stroke="#b89a5a" strokeWidth="1" />
      <polygon points="125,52 165,55 165,92 125,95" fill="#e2d9bc" stroke="#b89a5a" strokeWidth="1" />
      {/* vertical folds */}
      <Fold x1="45"  y1="3"  x2="45"  y2="97" />
      <Fold x1="85"  y1="3"  x2="85"  y2="97" />
      <Fold x1="125" y1="3"  x2="125" y2="97" />
      {/* horizontal fold */}
      <Fold x1="8"   y1="50" x2="167" y2="50" />
      <Label x="90" y="112">Double parallel</Label>
    </S>
  ),
};

const FoldDiagram = ({ format }) => {
  const Diagram = DIAGRAMS[format];
  if (!Diagram) return null;
  return <Diagram />;
};

export default FoldDiagram;
