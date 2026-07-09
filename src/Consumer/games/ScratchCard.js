import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'apiService';
import './ScratchCard.css';
import WillyIcon from '../WillyIcon';

function generateGrid(prize) {
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
  if (prize === 50) {
    return shuffle([
      { sym: '💎', label: '€50' }, { sym: '💎', label: '€50' }, { sym: '💎', label: '€50' },
      { sym: '⭐', label: '€5' },
      { sym: '🍭', label: '✗' }, { sym: '🍬', label: '✗' }, { sym: '🍫', label: '✗' },
      { sym: '🧁', label: '✗' }, { sym: '🍦', label: '✗' },
    ]);
  }
  if (prize === 5) {
    return shuffle([
      { sym: '⭐', label: '€5' }, { sym: '⭐', label: '€5' }, { sym: '⭐', label: '€5' },
      { sym: '🍭', label: '✗' }, { sym: '🍬', label: '✗' }, { sym: '🍫', label: '✗' },
      { sym: '🧁', label: '✗' }, { sym: '🍦', label: '✗' }, { sym: '🎪', label: '✗' },
    ]);
  }
  // Lose: max 2 stars — teasing but no triple
  return shuffle([
    { sym: '⭐', label: '€5' }, { sym: '⭐', label: '€5' },
    { sym: '🍭', label: '✗' }, { sym: '🍬', label: '✗' }, { sym: '🍫', label: '✗' },
    { sym: '🧁', label: '✗' }, { sym: '🍦', label: '✗' }, { sym: '🎪', label: '✗' },
    { sym: '🌟', label: '✗' },
  ]);
}

export default function ScratchCard() {
  const navigate = useNavigate();
  const [phase, setPhase]       = useState('confirm'); // confirm | loading | playing
  const [prize, setPrize]       = useState(null);
  const [grid, setGrid]         = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [newBalance, setNewBalance] = useState(null);
  const [error, setError]       = useState(null);

  const canvasRef   = useRef(null);
  const gridRef     = useRef(null);
  const painting    = useRef(false);
  const didReveal   = useRef(false);

  // Draw the silver coating on canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const gridEl = gridRef.current;
    if (!canvas || !gridEl) return;

    const rect = gridEl.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    grad.addColorStop(0,   '#b0b0b0');
    grad.addColorStop(0.4, '#cecece');
    grad.addColorStop(0.7, '#b8b8b8');
    grad.addColorStop(1,   '#a0a0a0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Diagonal "SCRATCH" texture
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = 'bold 10px Inter, sans-serif';
    for (let y = 14; y < rect.height + 20; y += 24) {
      for (let x = -10; x < rect.width + 60; x += 64) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.35);
        ctx.fillText('SCRATCH', 0, 0);
        ctx.restore();
      }
    }
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      didReveal.current = false;
      setTimeout(initCanvas, 60);
    }
  }, [phase, initCanvas]);

  const revealAll = useCallback(() => {
    if (didReveal.current) return;
    didReveal.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setRevealed(true);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const src    = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const doScratch = useCallback((e) => {
    if (!painting.current || revealed) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Sample every 64 bytes (every 16th pixel) to check % scratched
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    for (let i = 3; i < data.length; i += 64) {
      if (data[i] < 128) clear++;
    }
    if (clear / (data.length / 64) > 0.45) revealAll();
  }, [revealed, revealAll]);

  const startScratch = async () => {
    setPhase('loading');
    setError(null);
    try {
      const res = await api.post('/api/consumer/scratch');
      if (res.data?.success) {
        setPrize(res.data.prize);
        setGrid(generateGrid(res.data.prize));
        setNewBalance(res.data.new_balance);
        setRevealed(false);
        setPhase('playing');
      } else {
        setError(res.data?.message || 'Something went wrong');
        setPhase('confirm');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to start — try again');
      setPhase('confirm');
    }
  };

  // ── CONFIRM / LOADING ──────────────────────────────────────────────────────
  if (phase === 'confirm' || phase === 'loading') {
    return (
      <div className="sc-root">
        <header className="sc-header">
          <button className="sc-back" onClick={() => navigate('/consumer/games')}>←</button>
          <span className="sc-title">Scratch Card</span>
        </header>
        <div className="sc-body">
          <div className="sc-cost-banner">
            <div className="sc-cost-icon"><WillyIcon size={36} /></div>
            <div>
              <div className="sc-cost-num">5 Willies</div>
              <div className="sc-cost-sub">invested per scratch</div>
            </div>
          </div>

          <div className="sc-odds-card">
            <p className="sc-odds-title">Your chances</p>
            <div className="sc-odds-row">
              <span>💎 Match 3 diamonds</span>
              <span className="sc-odds-val">1 / 100</span>
              <span className="sc-odds-prize">€50</span>
            </div>
            <div className="sc-odds-row">
              <span>⭐ Match 3 stars</span>
              <span className="sc-odds-val">5 / 100</span>
              <span className="sc-odds-prize">€5</span>
            </div>
            <div className="sc-odds-row sc-odds-row--lose">
              <span>No match</span>
              <span className="sc-odds-val">94 / 100</span>
              <span className="sc-odds-prize">—</span>
            </div>
          </div>

          {error && <div className="sc-error">{error}</div>}

          <button className="sc-btn-primary" onClick={startScratch} disabled={phase === 'loading'}>
            {phase === 'loading' ? 'Getting your card…' : 'Invest 5 Willies →'}
          </button>
          <button className="sc-link" onClick={() => navigate('/consumer/games')}>Back</button>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  return (
    <div className="sc-root">
      <header className="sc-header">
        <div className="sc-back-placeholder" />
        <span className="sc-title">Scratch Card</span>
      </header>
      <div className="sc-body sc-body--play">
        {!revealed && <p className="sc-scratch-hint">Scratch to reveal your prizes 👆</p>}

        <div className="sc-card">
          <div className="sc-card-header">MATCH 3 TO WIN</div>

          <div className="sc-grid" ref={gridRef}>
            {grid.map((cell, i) => (
              <div key={i} className={`sc-cell ${cell.label !== '✗' ? 'sc-cell--prize' : ''}`}>
                <span className="sc-cell-sym">{cell.sym}</span>
                <span className="sc-cell-lbl">{cell.label}</span>
              </div>
            ))}

            <canvas
              ref={canvasRef}
              className="sc-canvas"
              style={{ display: revealed ? 'none' : 'block' }}
              onMouseDown={() => { painting.current = true; }}
              onMouseUp={() => { painting.current = false; }}
              onMouseLeave={() => { painting.current = false; }}
              onMouseMove={doScratch}
              onTouchStart={(e) => { e.preventDefault(); painting.current = true; doScratch(e); }}
              onTouchEnd={() => { painting.current = false; }}
              onTouchMove={doScratch}
            />
          </div>

          <div className="sc-card-footer"><WillyIcon size={14} /> Rate products · Earn Willies · Scratch</div>
        </div>

        {revealed && (
          <div className={`sc-result ${prize > 0 ? 'sc-result--win' : ''}`}>
            {prize === 50 && (
              <>
                <div className="sc-result-emoji">💎</div>
                <div className="sc-result-title">You won €50!</div>
                <div className="sc-result-sub">Contact us to claim your prize.</div>
              </>
            )}
            {prize === 5 && (
              <>
                <div className="sc-result-emoji">⭐</div>
                <div className="sc-result-title">You won €5!</div>
                <div className="sc-result-sub">Contact us to claim your prize.</div>
              </>
            )}
            {prize === 0 && (
              <>
                <div className="sc-result-emoji">😔</div>
                <div className="sc-result-title">No prize this time</div>
                <div className="sc-result-sub">Keep rating to earn more Willies!</div>
              </>
            )}
            {newBalance !== null && (
              <div className="sc-result-balance">Balance: {newBalance} <WillyIcon size={16} /></div>
            )}
            <button className="sc-btn-primary" onClick={() => navigate('/consumer/games')}>
              Back to home
            </button>
          </div>
        )}

        {!revealed && (
          <button className="sc-link" onClick={revealAll}>Reveal all</button>
        )}
      </div>
    </div>
  );
}
