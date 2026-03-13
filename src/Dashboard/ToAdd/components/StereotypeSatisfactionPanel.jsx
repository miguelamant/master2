import React from 'react';
import '../StereotypeSatisfactionPanel.css';

const PERSONA_MAP = [
  { key: 'Belgian', country: 'Belgium',     flag: '🇧🇪' },
  { key: 'French',  country: 'France',      flag: '🇫🇷' },
  { key: 'German',  country: 'Germany',     flag: '🇩🇪' },
  { key: 'Dutch',   country: 'Netherlands', flag: '🇳🇱' },
];

function barColor(score) {
  if (score >= 7.5) return 'bar-green';
  if (score >= 5.0) return 'bar-orange';
  return 'bar-red';
}

export default function StereotypeSatisfactionPanel({ personaFit = {} }) {
  const entries = PERSONA_MAP
    .map(({ key, country, flag }) => ({ country, flag, score: personaFit[key] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="stereotype-panel">
      <div className="stereotype-panel__title">Stereotype fit</div>
      {entries.map(({ country, flag, score }) => (
        <div key={country} className="stereotype-entry">
          <div className="stereotype-entry__header">
            <span className="stereotype-entry__flag">{flag}</span>
            <span>{country}</span>
            <span className="stereotype-entry__score-label">{score.toFixed(1)}/10</span>
          </div>
          <div className="stereotype-entry__bar-track">
            <div
              className={`stereotype-entry__bar-fill ${barColor(score)}`}
              style={{ width: `${score * 10}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
