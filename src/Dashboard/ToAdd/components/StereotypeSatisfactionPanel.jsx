import React from 'react';
import '../StereotypeSatisfactionPanel.css';
import { iconFor } from '../utils/iconLoader';

const GEO_PERSONAS = [
  { key: 'Belgian', country: 'Belgium',     iconToken: 'BELGIUM'     },
  { key: 'French',  country: 'France',      iconToken: 'FRANCE'      },
  { key: 'German',  country: 'Germany',     iconToken: 'GERMANY'     },
  { key: 'Dutch',   country: 'Netherlands', iconToken: 'NETHERLANDS' },
];
const STYLE_PERSONAS = [
  { key: 'Conservative', country: 'Conservative', iconToken: 'CONSERVATIVE' },
  { key: 'Normal',       country: 'Normal',       iconToken: 'NORMAL_STYLE' },
  { key: 'Progressive',  country: 'Progressive',  iconToken: 'PROGRESSIVE'  },
];
const DIET_PERSONAS = [
  { key: 'Ecological', country: 'Eco / Veggie / Vegan', iconToken: 'ECOLOGICAL' },
  { key: 'Omnivore',   country: 'Fish / Omnivore',      iconToken: 'FISH'       },
];
const PRICE_PERSONAS = [
  { key: 'Cheap',        country: 'Cheap',   iconToken: 'EURO_1' },
  { key: 'Normal_Price', country: 'Normal',  iconToken: 'EURO_2' },
  { key: 'Premium',      country: 'Premium', iconToken: 'EURO_3' },
];
const LIFESTYLE_PERSONAS = [
  { key: 'Sport',      country: 'Sport',      iconToken: 'SPORT_PERSON' },
  { key: 'Health',     country: 'Health',      iconToken: 'HEARTBEAT'    },
  { key: 'Biological', country: 'Biological',  iconToken: 'BIOLOGICAL' },
  { key: 'Local',      country: 'Local',       iconToken: 'LOCAL'      },
];
const PERSONA_MAP = [...GEO_PERSONAS, ...STYLE_PERSONAS, ...DIET_PERSONAS, ...PRICE_PERSONAS, ...LIFESTYLE_PERSONAS];

// Demo only — randomly generated placeholder scores
const MOCK_SCORES = {
  Ecological: 6.8, Omnivore: 7.4,
  Cheap: 5.2, Normal_Price: 7.0, Premium: 8.1,
  Sport: 6.5, Health: 5.9, Biological: 4.8, Local: 7.3,
};

function scoreColor(score) {
  if (score >= 7.5) return '#34d399';
  if (score >= 5.0) return '#fbbf24';
  return '#f87171';
}

const MatchIcon = ({ size = 14, color = '#111827' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6" />
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export default function StereotypeSatisfactionPanel({
  personaFit = {},
  personaWeights = {},
  satisfactionScore = null,
  personaDeltas = null,
  disabled = false,
  compact = false,
  hideCulture = false,
}) {
  const G = '#d1d5db';  // grey used when disabled

  const makeEntries = (list) => list
    .map(({ key, country, iconToken }) => ({
      name: key, country, iconToken,
      score: personaFit[key] ?? MOCK_SCORES[key] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const geoEntries       = makeEntries(GEO_PERSONAS);
  const styleEntries     = makeEntries(STYLE_PERSONAS);
  const dietEntries      = makeEntries(DIET_PERSONAS);
  const priceEntries     = makeEntries(PRICE_PERSONAS);
  const lifestyleEntries = makeEntries(LIFESTYLE_PERSONAS);

  const overallColor = disabled ? G : (satisfactionScore !== null ? scoreColor(satisfactionScore) : '#9ca3af');

  const renderPersonaRows = (entries) => entries.map(({ name, country, iconToken, score }) => {
    const delta = personaDeltas?.[name];
    const color = disabled ? G : scoreColor(score);
    const weight = personaWeights[name];
    return (
      <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img src={iconFor(iconToken)} alt={country}
               style={{
                 width: 20, height: 14, objectFit: 'cover', borderRadius: 2, flexShrink: 0,
                 filter: disabled ? 'grayscale(100%)' : 'none',
               }} />
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12,
            color: disabled ? '#9ca3af' : 'var(--text-primary)', flex: 1,
          }}>
            {country}
            {compact && weight != null && (
              <span style={{ fontWeight: 400, fontSize: 10, color: 'rgba(0,0,0,0.4)', marginLeft: 4 }}>
                {weight}%
              </span>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, flexShrink: 0 }}>
            <span style={{
              fontSize: 15, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color,
            }}>{disabled ? '—' : score.toFixed(1)}</span>
            {!disabled && delta != null && delta !== 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: delta > 0 ? '#34d399' : '#f87171', minWidth: 28,
              }}>{delta > 0 ? `+${delta}` : String(delta)}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ position: 'relative', flex: 1, height: 6 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 3,
              border: '1px dashed rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.02)',
            }} />
            <div style={{
              position: 'relative', height: '100%',
              width: disabled ? '0%' : `${Math.min(score / 10 * 100, 100)}%`,
              borderRadius: 3,
              background: disabled ? G : `linear-gradient(to right, #374151 0%, #4b5563 75%, ${color} 100%)`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <MatchIcon size={12} color={disabled ? G : '#111827'} />
        </div>
      </div>
    );
  });

  return (
    <div className="stereotype-panel" style={disabled ? { opacity: 0.55, pointerEvents: 'none' } : undefined}>

      {/* Title */}
      <div className="stereotype-panel__title">
        {compact ? 'Satisfaction KPIs' : 'Identity Distribution'}
        {disabled && <span style={{ marginLeft: 6, fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>— off</span>}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '-4px 0 0' }} />

      {/* ── Geographic axis ── */}
      {!hideCulture && (<>
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
          color: 'rgba(0,0,0,0.35)', marginBottom: -2,
        }}>Culture</div>
        {renderPersonaRows(geoEntries)}
      </>)}

      {!compact && (<>
        {/* Axis separator */}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.10)', margin: '2px 0 4px' }} />

        {/* ── Taste axis ── */}
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
          color: 'rgba(0,0,0,0.35)', marginBottom: -2,
        }}>Taste</div>
        {renderPersonaRows(styleEntries)}
      </>)}

      {!compact && (<>
        {/* Axis separator */}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.10)', margin: '2px 0 4px' }} />

        <div style={{ fontSize: 9, fontStyle: 'italic', color: 'rgba(0,0,0,0.3)', marginBottom: 2 }}>*dummy data</div>

        {/* ── Diet axis ── */}
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
          color: 'rgba(0,0,0,0.35)', marginBottom: -2,
        }}>Diet</div>
        {renderPersonaRows(dietEntries)}

        {/* Axis separator */}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.10)', margin: '2px 0 4px' }} />

        {/* ── Price axis ── */}
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
          color: 'rgba(0,0,0,0.35)', marginBottom: -2,
        }}>Price</div>
        {renderPersonaRows(priceEntries)}

        {/* Axis separator */}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.10)', margin: '2px 0 4px' }} />

        {/* ── Lifestyle axis ── */}
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
          color: 'rgba(0,0,0,0.35)', marginBottom: -2,
        }}>Lifestyle</div>
        {renderPersonaRows(lifestyleEntries)}
      </>)}
    </div>
  );
}
