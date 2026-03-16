import React from 'react';
import { iconFor } from '../utils/iconLoader';
import { api } from '../../../apiService';
import { convertDisplayLabel } from '../utils/labelMap';

import octopusIcon from '../../Icons/octopus.svg';

const _swapExplCache = new Map();


const PERSONAS = [
  { key: 'Belgian',  iconToken: 'BELGIUM'     },
  { key: 'French',   iconToken: 'FRANCE'      },
  { key: 'German',   iconToken: 'GERMANY'     },
  { key: 'Dutch',    iconToken: 'NETHERLANDS' },
];

function shortageColor(shortage) {
  if (shortage <= 0)   return '#374151';
  if (shortage < 0.4)  return '#d97706';
  if (shortage < 1.0)  return '#ea580c';
  return '#dc2626';
}

function SwapCard({ rec, countsByCategory, stereotypeBenchmarks, personaWeights, isRemove, totalMenuCount }) {
  const [explText, setExplText] = React.useState(null);

  React.useEffect(() => {
    if (!rec?.label) return;
    const delta  = isRemove ? -1 : +1;
    const actual = countsByCategory?.[rec.label] ?? 0;
    const key    = `${rec.label}_${isRemove ? 'out' : 'in'}`;

    const cached = _swapExplCache.get(key);
    if (cached && cached !== '__loading__') { setExplText(cached.text); return; }
    if (cached === '__loading__') return;

    _swapExplCache.set(key, '__loading__');
    setExplText('…');

    const bucketBenchmarks = Object.fromEntries(
      PERSONAS.map(({ key: p }) => [p, stereotypeBenchmarks?.[p]?.[rec.label] ?? 0])
    );

    api.post('/api/explain-recommendation', {
      label: rec.label,
      displayLabel: convertDisplayLabel(rec.label),
      delta,
      actual,
      recommended: actual + delta,
      bucketBenchmarks,
      personaWeights,
    })
      .then(({ data }) => {
        const text = data.text || 'No explanation available.';
        _swapExplCache.set(key, { text });
        setExplText(text);
      })
      .catch(() => {
        _swapExplCache.set(key, { text: 'Explanation unavailable.' });
        setExplText('Explanation unavailable.');
      });
  }, [rec?.label, isRemove]);

  if (!rec) return <div style={{ flex: 1 }} />;

  const lookupKey  = rec.label ?? rec.id;
  const current    = countsByCategory?.[lookupKey] ?? 0;
  const after      = isRemove ? current - 1 : current + 1;
  const bucketIcon = iconFor(lookupKey);

  const benchmarkRows = PERSONAS.map(({ key, iconToken }) => {
    const benchmark = stereotypeBenchmarks?.[key]?.[lookupKey] ?? 0;
    const weight    = (personaWeights?.[key] ?? 0) / 100;
    const shortage  = (benchmark - current) * weight;
    return { key, iconToken, benchmark, numColor: shortageColor(shortage) };
  });

  const actionWord = isRemove ? 'Out' : 'In';

  return (
    <div style={{
      flex: 1,
      borderRadius: 12,
      background: '#f8fafc',
      border: '1px solid rgba(0,0,0,0.08)',
      borderTop: '3px solid #3b82f6',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Header: badge + label */}
      <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase',
            color: '#3b82f6', background: 'rgba(59,130,246,0.12)',
            borderRadius: 4, padding: '2px 6px', flexShrink: 0,
            WebkitTextFillColor: '#3b82f6',
          }}>
            One {actionWord}
          </span>
          <span style={{
            fontSize: 14, fontWeight: 700, color: '#1e293b',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            WebkitTextFillColor: '#1e293b',
          }}>
            {convertDisplayLabel(rec.label)}
          </span>
        </div>

        {/* Count transition */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#1e293b', lineHeight: 1,
                         fontFamily: "'Space Grotesk', sans-serif",
                         WebkitTextFillColor: '#1e293b' }}>{current}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1, WebkitTextFillColor: '#94a3b8' }}>→</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#3b82f6', lineHeight: 1,
                           WebkitTextFillColor: '#3b82f6' }}>
              {isRemove ? '−1' : '+1'}
            </span>
          </div>
          <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: '#94a3b8',
                         fontFamily: "'Space Grotesk', sans-serif",
                         WebkitTextFillColor: '#94a3b8' }}>{after}</span>
          {bucketIcon && <img src={bucketIcon} alt="" style={{ width: 22, height: 22, marginLeft: 2 }} />}
        </div>
      </div>

      {/* Benchmarks */}
      <div style={{ padding: '7px 10px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5,
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)',
                      WebkitTextFillColor: 'rgba(0,0,0,0.4)' }}>
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
          </svg>
          Benchmarks
        </div>

        {benchmarkRows.map(({ key, iconToken, benchmark, numColor }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <img src={iconFor(iconToken)} alt={key}
                   style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', WebkitTextFillColor: 'rgba(0,0,0,0.55)' }}>{key}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
                           color: numColor, WebkitTextFillColor: numColor }}>
              {Number(benchmark).toFixed(1)}
              {totalMenuCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.35)',
                               WebkitTextFillColor: 'rgba(0,0,0,0.35)' }}>/{totalMenuCount}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* AI explanation */}
      {explText && (
        <div style={{
          margin: '0 10px 8px',
          paddingLeft: 8,
          borderLeft: '2px solid rgba(59,130,246,0.4)',
          fontSize: 13,
          lineHeight: 1.45,
          color: '#475569',
          WebkitTextFillColor: '#475569',
          fontStyle: 'italic',
        }}>
          {explText}
        </div>
      )}
    </div>
  );
}

const confirmBtnStyle = {
  flex: 1, border: 'none', borderRadius: 8, padding: '9px 0',
  fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
  cursor: 'pointer', background: '#3b82f6', color: '#fff',
  WebkitTextFillColor: '#fff',
  transition: 'background 0.15s',
};

export default function SuggestedSwapPanel({
  swapPairs = [],
  swapIndex = 0,
  onSwapIndex,
  onSkip,
  onSeeOptions,
  willyMode = 1,
  countsByCategory,
  stereotypeBenchmarks,
  personaWeights,
  totalMenuCount = 0,
}) {
  if (!swapPairs.length) return null;

  const { removeRec, addRec } = swapPairs[swapIndex] ?? {};
  if (!removeRec && !addRec) return null;

  const total   = swapPairs.length;

  const sharedCardProps = { countsByCategory, stereotypeBenchmarks, personaWeights, totalMenuCount };

  return (
    <div className="stereotype-panel" style={{ gap: '0.75rem' }}>

      {/* Willy header with speech bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
            width: 44, height: 44, borderRadius: '50%',
            flexShrink: 0,
            background: 'rgba(59,130,246,0.1)',
            border: '2px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={octopusIcon} alt="Willy" style={{ width: 28, height: 28 }} />
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '4px 12px 12px 12px',
          padding: '10px 14px',
          fontSize: 14.5,
          lineHeight: 1.5,
          color: 'var(--text-primary)',
        }}>
          I recommend this <strong>1-in-1-out</strong> swap. Do you agree?
          {total > 1 && (
            <span style={{
              marginLeft: 6, fontSize: 11, opacity: 0.5,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              ({swapIndex + 1}/{total})
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <SwapCard rec={addRec}    isRemove={false} {...sharedCardProps} />
        <SwapCard rec={removeRec} isRemove={true}  {...sharedCardProps} />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={confirmBtnStyle} onClick={() => onSeeOptions?.(addRec, false)}>
          Yes, see options →
        </button>
        <button style={confirmBtnStyle} onClick={() => onSeeOptions?.(removeRec, true)}>
          Yes, see options →
        </button>
      </div>

      {/* Skip link */}
      <div
        onClick={onSkip}
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#6b7280',
          WebkitTextFillColor: '#6b7280',
          cursor: 'pointer',
          padding: '2px 0',
          transition: 'color 0.15s',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.WebkitTextFillColor = '#374151'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.WebkitTextFillColor = '#6b7280'; }}
      >
        No, skip this recommendation
      </div>
    </div>
  );
}
