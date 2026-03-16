import React from 'react';
import '../StereotypeSatisfactionPanel.css';
import { iconFor } from '../utils/iconLoader';

const PERSONA_MAP = [
  { key: 'Belgian', country: 'Belgium',     iconToken: 'BELGIUM'     },
  { key: 'French',  country: 'France',      iconToken: 'FRANCE'      },
  { key: 'German',  country: 'Germany',     iconToken: 'GERMANY'     },
  { key: 'Dutch',   country: 'Netherlands', iconToken: 'NETHERLANDS' },
];

function scoreColor(score) {
  if (score >= 7.5) return '#34d399';
  if (score >= 5.0) return '#fbbf24';
  return '#f87171';
}

function scoreBarClass(score) {
  if (score >= 7.5) return 'bar-green';
  if (score >= 5.0) return 'bar-orange';
  return 'bar-red';
}

const PersonIcon = ({ size = 11, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <circle cx="12" cy="7" r="4" />
    <path d="M12 14c-6 0-9 2.5-9 4v1h18v-1c0-1.5-3-4-9-4z" />
  </svg>
);

const HappyFace = ({ size = 14, color = '#111827' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <circle cx="8.5" cy="10" r="1.2" fill={color} />
    <circle cx="15.5" cy="10" r="1.2" fill={color} />
    <path d="M8 15c1.5 2 6.5 2 8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function StereotypeSatisfactionPanel({
  personaFit = {},
  personaWeights = {},
  satisfactionScore = null,
  personaDeltas = null,
  disabled = false,
}) {
  const hasWeights = Object.keys(personaWeights).length > 0;
  const G = '#d1d5db';  // grey used when disabled

  const entries = PERSONA_MAP
    .map(({ key, country, iconToken }) => ({
      name: key,
      country,
      iconToken,
      score: personaFit[key] ?? 0,
      weight: personaWeights[key] ?? null,
    }))
    .sort((a, b) => b.score - a.score);

  const overallColor = disabled ? G : (satisfactionScore !== null ? scoreColor(satisfactionScore) : '#9ca3af');

  return (
    <div className="stereotype-panel" style={disabled ? { opacity: 0.55, pointerEvents: 'none' } : undefined}>

      {/* Title */}
      <div className="stereotype-panel__title">
        Satisfaction KPI's
        {disabled && <span style={{ marginLeft: 6, fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>— off</span>}
      </div>

      {/* Overall score */}
      {satisfactionScore !== null && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <span style={{
              fontSize: 36, fontWeight: 900, lineHeight: 1,
              fontFamily: "'Space Grotesk', sans-serif",
              color: disabled ? G : overallColor,
            }}>
              {disabled ? '—' : satisfactionScore.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, opacity: 0.5 }}>/10</span>
            <span style={{ fontSize: 11, opacity: 0.45, marginLeft: 2 }}>weighted</span>
          </div>

          {/* Overall bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ position: 'relative', flex: 1, height: 5 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 3,
                border: '1px dashed rgba(0,0,0,0.12)',
                background: 'rgba(0,0,0,0.02)',
              }} />
              <div
                style={{
                  position: 'relative',
                  height: '100%',
                  width: disabled ? '0%' : `${Math.min(satisfactionScore / 10 * 100, 100)}%`,
                  borderRadius: 3,
                  background: disabled ? G : `linear-gradient(to right, #374151 0%, #4b5563 75%, ${overallColor} 100%)`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <HappyFace size={14} color={disabled ? G : '#111827'} />
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '-4px 0 0' }} />

      {/* Per-persona rows */}
      {entries.map(({ name, country, iconToken, score, weight }) => {
        const delta = personaDeltas?.[name];
        const color = disabled ? G : scoreColor(score);

        return (
          <div key={country} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

            {/* Row: weight + flag + country + score + delta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>

              {/* Weight badge */}
              {hasWeights && (
                <div style={{ width: 46, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                  {weight != null && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: 'rgba(0,0,0,0.04)', borderRadius: 5,
                      padding: '2px 5px',
                    }}>
                      <PersonIcon size={10} style={{ opacity: 0.6 }} />
                      <span style={{
                        fontSize: 11, fontWeight: 800,
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: disabled ? G : 'var(--text-primary)',
                      }}>{weight}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Flag */}
              <img src={iconFor(iconToken)} alt={country}
                   style={{
                     width: 20, height: 14, objectFit: 'cover', borderRadius: 2, flexShrink: 0,
                     filter: disabled ? 'grayscale(100%)' : 'none',
                   }} />

              {/* Country */}
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12,
                color: disabled ? '#9ca3af' : 'var(--text-primary)', flex: 1,
              }}>{country}</span>

              {/* Score */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, flexShrink: 0 }}>
                <span style={{
                  fontSize: 15, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
                  color,
                }}>{disabled ? '—' : score.toFixed(1)}</span>

                {/* Delta */}
                {!disabled && delta != null && delta !== 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: delta > 0 ? '#34d399' : '#f87171',
                    minWidth: 28,
                  }}>
                    {delta > 0 ? `+${delta}` : String(delta)}
                  </span>
                )}
              </div>
            </div>

            {/* Score bar */}
            <div style={{ paddingLeft: hasWeights ? 53 : 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ position: 'relative', flex: 1, height: 6 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 3,
                  border: '1px dashed rgba(0,0,0,0.12)',
                  background: 'rgba(0,0,0,0.02)',
                }} />
                <div
                  style={{
                    position: 'relative',
                    height: '100%',
                    width: disabled ? '0%' : `${Math.min(score / 10 * 100, 100)}%`,
                    borderRadius: 3,
                    background: disabled ? G : `linear-gradient(to right, #374151 0%, #4b5563 75%, ${color} 100%)`,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <HappyFace size={12} color={disabled ? G : '#111827'} />
            </div>

          </div>
        );
      })}
    </div>
  );
}
