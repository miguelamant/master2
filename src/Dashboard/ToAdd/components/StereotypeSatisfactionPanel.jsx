import React from 'react';
import '../StereotypeSatisfactionPanel.css';

const MOCK_SCORES = {
  beers: [
    { country: 'Belgium',     flag: '🇧🇪', score: 87 },
    { country: 'Germany',     flag: '🇩🇪', score: 79 },
    { country: 'Netherlands', flag: '🇳🇱', score: 72 },
    { country: 'France',      flag: '🇫🇷', score: 54 },
  ],
  refreshments: [
    { country: 'Netherlands', flag: '🇳🇱', score: 81 },
    { country: 'Belgium',     flag: '🇧🇪', score: 68 },
    { country: 'Germany',     flag: '🇩🇪', score: 63 },
    { country: 'France',      flag: '🇫🇷', score: 76 },
  ],
};

const DEFAULT_SCORES = [
  { country: 'Belgium',     flag: '🇧🇪', score: 70 },
  { country: 'Germany',     flag: '🇩🇪', score: 70 },
  { country: 'Netherlands', flag: '🇳🇱', score: 70 },
  { country: 'France',      flag: '🇫🇷', score: 70 },
];

function barColor(score) {
  if (score >= 75) return 'bar-green';
  if (score >= 50) return 'bar-orange';
  return 'bar-red';
}

export default function StereotypeSatisfactionPanel({ category }) {
  const entries = MOCK_SCORES[category] ?? DEFAULT_SCORES;

  return (
    <div className="stereotype-panel">
      <div className="stereotype-panel__title">Stereotype fit</div>
      {entries.map(({ country, flag, score }) => (
        <div key={country} className="stereotype-entry">
          <div className="stereotype-entry__header">
            <span className="stereotype-entry__flag">{flag}</span>
            <span>{country}</span>
            <span className="stereotype-entry__score-label">{score}%</span>
          </div>
          <div className="stereotype-entry__bar-track">
            <div
              className={`stereotype-entry__bar-fill ${barColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
