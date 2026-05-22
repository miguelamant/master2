import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Spyder.css';

const DECKS = [
  { civilian: 'Romelu Lukaku', special: 'Kevin De Bruyne' },
  { civilian: 'Stoofvleessaus', special: 'Vol-au-vent' },
  { civilian: 'Mango', special: 'Peach' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function defaultRoles(n) {
  return { normal: Math.max(1, n - 2), special: 1, spyder: 1 };
}

export default function Spyder() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase]             = useState('setup');
  const [playerCount, setPlayerCount] = useState(5);
  const [roles, setRoles]             = useState(defaultRoles(5));
  const [names, setNames]             = useState(Array(5).fill(''));
  const [players, setPlayers]         = useState([]);
  const [deck, setDeck]               = useState(null);
  const [peekIdx, setPeekIdx]         = useState(null);
  const [speakOrder, setSpeakOrder]   = useState([]);
  const [round, setRound]             = useState(1);
  const [voteTarget, setVoteTarget]   = useState(null);
  const [exposed, setExposed]         = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  const [winner, setWinner]           = useState(null);
  const [winReason, setWinReason]     = useState(null);

  // Check win conditions then go to GAME or END
  const advance = (current) => {
    const alive      = current.filter(p => !p.eliminated);
    const hasSpyder  = alive.some(p => p.role === 'spyder');
    const hasSpecial = alive.some(p => p.role === 'special');

    if (!hasSpyder && !hasSpecial) {
      setWinner('normals'); setWinReason('survival'); setPhase('end');
    } else if (hasSpyder && alive.length <= 2) {
      setWinner('spyder'); setWinReason('survival'); setPhase('end');
    } else if (!hasSpyder && hasSpecial && alive.length <= 2) {
      setWinner('special'); setWinReason('survival'); setPhase('end');
    } else {
      setSpeakOrder(shuffle(alive.map(p => p.name)));
      setRound(r => r + 1);
      setPhase('game');
    }
  };

  // ── SETUP ──────────────────────────────────────────────────────────────────
  const setCount = (n) => {
    const c = Math.max(3, Math.min(10, n));
    setPlayerCount(c);
    setRoles(defaultRoles(c));
    setNames(Array(c).fill(''));
  };

  const adjustRole = (role, delta) =>
    setRoles(prev => ({ ...prev, [role]: Math.max(0, prev[role] + delta) }));

  // ── NAMES ──────────────────────────────────────────────────────────────────
  const updateName = (i, val) =>
    setNames(prev => { const n = [...prev]; n[i] = val; return n; });

  const goToCocoons = () => {
    const d = DECKS[Math.floor(Math.random() * DECKS.length)];
    setDeck(d);
    const roleList = shuffle([
      ...Array(roles.normal).fill('normal'),
      ...Array(roles.special).fill('special'),
      ...Array(roles.spyder).fill('spyder'),
    ]);
    setPlayers(names.map((name, i) => ({
      name: name.trim(),
      role: roleList[i],
      word: roleList[i] === 'normal'  ? d.civilian
          : roleList[i] === 'special' ? d.special
          : null,
      opened: false,
      eliminated: false,
    })));
    setPhase('cocoons');
  };

  // ── COCOONS ────────────────────────────────────────────────────────────────
  const peekCocoon = (i) => { setPeekIdx(i); setPhase('peek'); };

  const closePeek = () => {
    setPlayers(prev => prev.map((p, i) => i === peekIdx ? { ...p, opened: true } : p));
    setPeekIdx(null);
    setPhase('cocoons');
  };

  // ── VOTE ───────────────────────────────────────────────────────────────────
  const confirmExpose = () => {
    if (!voteTarget) return;
    const target  = players.find(p => p.name === voteTarget);
    const updated = players.map(p => p.name === voteTarget ? { ...p, eliminated: true } : p);
    setPlayers(updated);
    setExposed(target);
    setVoteTarget(null);
    setGuessResult(null);
    setPhase(target.role === 'spyder' ? 'guess' : 'reveal');
  };

  // ── GUESS ──────────────────────────────────────────────────────────────────
  const judgeGuess = (correct) => {
    setGuessResult(correct ? 'correct' : 'wrong');
    if (correct) { setWinner('spyder'); setWinReason('guess'); }
  };

  const continueFromGuess = () => {
    if (guessResult === 'correct') { setPhase('end'); return; }
    advance(players);
  };

  // ── RESET ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setPhase('setup'); setPlayerCount(5); setRoles(defaultRoles(5));
    setNames(Array(5).fill('')); setPlayers([]); setDeck(null);
    setPeekIdx(null); setSpeakOrder([]); setRound(1);
    setVoteTarget(null); setExposed(null);
    setGuessResult(null); setWinner(null); setWinReason(null);
  };

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const total = roles.normal + roles.special + roles.spyder;
    const valid = total === playerCount && roles.spyder >= 1 && roles.normal >= 1;
    return (
      <div className="spy-root">
        <header className="spy-header">
          <button className="spy-back" onClick={() => navigate(`/consumer/category/${categoryId}`)}>←</button>
          <span className="spy-title">Spyder</span>
        </header>
        <div className="spy-body">
          <section className="spy-section">
            <p className="spy-section-label">Number of players</p>
            <div className="spy-counter">
              <button className="spy-cnt-btn" onClick={() => setCount(playerCount - 1)}>−</button>
              <span className="spy-cnt-val">{playerCount}</span>
              <button className="spy-cnt-btn" onClick={() => setCount(playerCount + 1)}>+</button>
            </div>
          </section>

          <section className="spy-section">
            <p className="spy-section-label">Role distribution</p>
            {[
              ['normal',  '🦋', 'Normal Butterflies'],
              ['special', '✨', 'Special Butterflies'],
              ['spyder',  '🕷️', 'Spyders'],
            ].map(([key, icon, label]) => (
              <div className="spy-role-row" key={key}>
                <span className="spy-role-name">{icon} {label}</span>
                <div className="spy-counter spy-counter--sm">
                  <button className="spy-cnt-btn spy-cnt-btn--sm" onClick={() => adjustRole(key, -1)}>−</button>
                  <span className="spy-cnt-val spy-cnt-val--sm">{roles[key]}</span>
                  <button className="spy-cnt-btn spy-cnt-btn--sm" onClick={() => adjustRole(key, +1)}>+</button>
                </div>
              </div>
            ))}
            {total !== playerCount && (
              <p className="spy-warn">Total roles ({total}) must equal {playerCount} players</p>
            )}
          </section>

          <button className="spy-btn-primary" disabled={!valid} onClick={() => setPhase('names')}>
            Enter Names →
          </button>
        </div>
      </div>
    );
  }

  // ── NAMES ──────────────────────────────────────────────────────────────────
  if (phase === 'names') {
    const allFilled = names.every(n => n.trim().length > 0);
    return (
      <div className="spy-root">
        <header className="spy-header">
          <button className="spy-back" onClick={() => setPhase('setup')}>←</button>
          <span className="spy-title">Player Names</span>
        </header>
        <div className="spy-body">
          <div className="spy-names-list">
            {names.map((name, i) => (
              <input
                key={i}
                className="spy-name-input"
                placeholder={`Player ${i + 1}`}
                value={name}
                onChange={e => updateName(i, e.target.value)}
                maxLength={20}
              />
            ))}
          </div>
          <button className="spy-btn-primary" disabled={!allFilled} onClick={goToCocoons}>
            Assign Cocoons →
          </button>
        </div>
      </div>
    );
  }

  // ── COCOONS ────────────────────────────────────────────────────────────────
  if (phase === 'cocoons') {
    const allOpened = players.every(p => p.opened);
    return (
      <div className="spy-root">
        <header className="spy-header">
          <button className="spy-back" onClick={() => setPhase('names')}>←</button>
          <span className="spy-title">Cocoons</span>
        </header>
        <div className="spy-body">
          <p className="spy-hint">Pass the phone. Each player taps their own cocoon, peeks at their word, then closes it.</p>
          <div className="spy-cocoon-list">
            {players.map((p, i) => (
              <button
                key={i}
                className={`spy-cocoon-card ${p.opened ? 'spy-cocoon-card--done' : ''}`}
                onClick={() => !p.opened && peekCocoon(i)}
                disabled={p.opened}
              >
                <span className="spy-cocoon-icon">{p.opened ? '✓' : '🥚'}</span>
                <span className="spy-cocoon-name">{p.name}</span>
              </button>
            ))}
          </div>
          {allOpened && (
            <button className="spy-btn-primary" onClick={() => {
              setSpeakOrder(shuffle(players.map(p => p.name)));
              setRound(1);
              setPhase('game');
            }}>
              Start Game →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── PEEK ───────────────────────────────────────────────────────────────────
  if (phase === 'peek' && peekIdx !== null) {
    const p = players[peekIdx];
    return (
      <div className="spy-peek-root">
        <div className="spy-peek-card">
          <div className="spy-peek-name">{p.name}</div>
          <div className="spy-peek-emoji">{p.role === 'spyder' ? '🕷️' : '🦋'}</div>
          {p.word
            ? <div className="spy-peek-word">{p.word}</div>
            : <div className="spy-peek-word spy-peek-word--unknown">???</div>
          }
          <p className="spy-peek-sub">Remember your word, then close your cocoon.</p>
          <button className="spy-btn-primary" onClick={closePeek}>
            Close Cocoon 🥚
          </button>
        </div>
      </div>
    );
  }

  // ── GAME ───────────────────────────────────────────────────────────────────
  if (phase === 'game') {
    return (
      <div className="spy-root">
        <header className="spy-header">
          <div className="spy-back-placeholder" />
          <span className="spy-title">Round {round}</span>
        </header>
        <div className="spy-body">
          <p className="spy-hint">Each player says one word out loud in this order:</p>
          <div className="spy-order-list">
            {speakOrder.map((name, i) => (
              <div className="spy-order-item" key={i}>
                <span className="spy-order-num">{i + 1}</span>
                <span className="spy-order-name">{name}</span>
              </div>
            ))}
          </div>
          <div className="spy-game-actions">
            <button className="spy-btn-secondary" onClick={() => {
              const alive = players.filter(p => !p.eliminated).map(p => p.name);
              setSpeakOrder(shuffle(alive));
              setRound(r => r + 1);
            }}>↺ Next Round</button>
            <button className="spy-btn-danger" onClick={() => { setVoteTarget(null); setPhase('vote'); }}>
              🕷️ Expose Cocoon
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VOTE ───────────────────────────────────────────────────────────────────
  if (phase === 'vote') {
    const alive = players.filter(p => !p.eliminated);
    return (
      <div className="spy-root">
        <header className="spy-header">
          <button className="spy-back" onClick={() => setPhase('game')}>←</button>
          <span className="spy-title">Expose Who?</span>
        </header>
        <div className="spy-body">
          <p className="spy-hint">Agree on a name, then tap to confirm.</p>
          <div className="spy-vote-list">
            {alive.map((p, i) => (
              <button
                key={i}
                className={`spy-vote-btn ${voteTarget === p.name ? 'spy-vote-btn--on' : ''}`}
                onClick={() => setVoteTarget(p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button className="spy-btn-danger" disabled={!voteTarget} onClick={confirmExpose}>
            Expose {voteTarget || '…'}
          </button>
        </div>
      </div>
    );
  }

  // ── GUESS ──────────────────────────────────────────────────────────────────
  if (phase === 'guess') {
    return (
      <div className="spy-root">
        <header className="spy-header">
          <div className="spy-back-placeholder" />
          <span className="spy-title">Spyder Caught!</span>
        </header>
        <div className="spy-body">
          <div className="spy-reveal-hero">
            <div className="spy-reveal-emoji">🕷️</div>
            <div className="spy-reveal-name">{exposed?.name}</div>
            <div className="spy-reveal-role">is the Spyder</div>
          </div>
          {!guessResult ? (
            <>
              <p className="spy-hint">Say out loud what you think the Butterflies' word was.</p>
              <div className="spy-judge-row">
                <button className="spy-judge-btn spy-judge-btn--wrong" onClick={() => judgeGuess(false)}>✗ Wrong</button>
                <button className="spy-judge-btn spy-judge-btn--correct" onClick={() => judgeGuess(true)}>✓ Correct</button>
              </div>
            </>
          ) : (
            <>
              <div className={`spy-guess-result ${guessResult === 'correct' ? 'spy-guess-result--win' : 'spy-guess-result--lose'}`}>
                {guessResult === 'correct'
                  ? `✓ Correct! "${deck.civilian}" — Spyder wins!`
                  : `✗ Wrong. The word was "${deck.civilian}"`
                }
              </div>
              <button className="spy-btn-primary" onClick={continueFromGuess}>Continue</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── REVEAL ─────────────────────────────────────────────────────────────────
  if (phase === 'reveal') {
    return (
      <div className="spy-root">
        <header className="spy-header">
          <div className="spy-back-placeholder" />
          <span className="spy-title">Cocoon Opened!</span>
        </header>
        <div className="spy-body">
          <div className="spy-reveal-hero">
            <div className="spy-reveal-emoji">🦋</div>
            <div className="spy-reveal-name">{exposed?.name}</div>
            <div className="spy-reveal-role">
              was {exposed?.role === 'special' ? 'the Special Butterfly' : 'a Normal Butterfly'}
            </div>
            {exposed?.word && (
              <div className="spy-reveal-word">Their word: <strong>{exposed.word}</strong></div>
            )}
          </div>
          <button className="spy-btn-primary" onClick={() => advance(players)}>Continue</button>
        </div>
      </div>
    );
  }

  // ── END ────────────────────────────────────────────────────────────────────
  if (phase === 'end') {
    const specialPlayer = players.find(p => p.role === 'special');
    const spyderPlayer  = players.find(p => p.role === 'spyder');
    const cfg = winner === 'spyder'
      ? { emoji: '🕷️', title: 'Spyder Wins!',
          sub: winReason === 'guess'
            ? `${spyderPlayer?.name} guessed the word correctly.`
            : `${spyderPlayer?.name} survived to the end.` }
      : winner === 'special'
      ? { emoji: '✨', title: 'Special Butterfly Wins!',
          sub: `${specialPlayer?.name} stayed undercover til the end.` }
      : { emoji: '🦋', title: 'Butterflies Win!',
          sub: 'All impostors have been exposed.' };

    return (
      <div className="spy-root">
        <div className="spy-end">
          <div className="spy-end-emoji">{cfg.emoji}</div>
          <div className="spy-end-title">{cfg.title}</div>
          <div className="spy-end-sub">{cfg.sub}</div>
          <div className="spy-end-deck">
            Word pair: <strong>{deck?.civilian}</strong> / <strong>{deck?.special}</strong>
          </div>
          <button className="spy-btn-primary" onClick={reset}>Play Again</button>
          <button className="spy-link" onClick={() => navigate(`/consumer/category/${categoryId}`)}>
            Back to games
          </button>
        </div>
      </div>
    );
  }

  return null;
}
