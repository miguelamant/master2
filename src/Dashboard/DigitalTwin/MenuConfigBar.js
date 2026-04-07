import React from 'react';

const FORMATS = [
  { value: 'single',   label: 'Single' },
  { value: 'bifold',   label: 'Bifold' },
  { value: 'trifold',  label: 'Trifold' },
  { value: 'quadfold', label: 'Quadfold' },
];

const MenuConfigBar = ({ config, onUpdate, hideFormat = false }) => {
  if (!config) return null;

  const { format, columns, show_euro, decimal_sep } = config;

  const set = (patch) => onUpdate(patch);

  return (
    <div className="twin-config">
      {!hideFormat && (
        <div className="twin-config__group">
          <label className="twin-config__label">Format</label>
          <div className="twin-config__segments">
            {FORMATS.map(f => (
              <button
                key={f.value}
                className={`twin-config__seg ${format === f.value ? 'twin-config__seg--active' : ''}`}
                onClick={() => set({ format: f.value })}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="twin-config__group">
        <label className="twin-config__label">Columns</label>
        <div className="twin-config__segments">
          {[1, 2, 3].map(n => (
            <button
              key={n}
              className={`twin-config__seg ${columns === n ? 'twin-config__seg--active' : ''}`}
              onClick={() => set({ columns: n })}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="twin-config__group">
        <label className="twin-config__label">
          <input
            type="checkbox"
            checked={show_euro}
            onChange={() => set({ show_euro: !show_euro })}
          />
          &euro; sign
        </label>
      </div>

      <div className="twin-config__group">
        <label className="twin-config__label">Decimal</label>
        <div className="twin-config__segments">
          <button
            className={`twin-config__seg ${decimal_sep === 'comma' ? 'twin-config__seg--active' : ''}`}
            onClick={() => set({ decimal_sep: 'comma' })}
          >
            1,50
          </button>
          <button
            className={`twin-config__seg ${decimal_sep === 'dot' ? 'twin-config__seg--active' : ''}`}
            onClick={() => set({ decimal_sep: 'dot' })}
          >
            1.50
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuConfigBar;
