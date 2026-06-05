import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'apiService';
import './BurgerCatalog.css';

const OFF_URL = '/api/catalog/veggie-burgers';

const NUTRI_ROWS = [
    { key: 'energy-kcal_100g', label: 'Energy', unit: 'kcal' },
    { key: 'fat_100g', label: 'Fat', unit: 'g' },
    { key: 'saturated-fat_100g', label: 'of which saturated', unit: 'g', indent: true },
    { key: 'carbohydrates_100g', label: 'Carbohydrates', unit: 'g' },
    { key: 'sugars_100g', label: 'of which sugars', unit: 'g', indent: true },
    { key: 'fiber_100g', label: 'Fiber', unit: 'g' },
    { key: 'proteins_100g', label: 'Protein', unit: 'g' },
    { key: 'salt_100g', label: 'Salt', unit: 'g' },
];

// Source: Nectar "Taste of the Industry 2025" TASTY Awards (nectar.org)
// Full per-brand data is behind their dashboard; only award winners are public.
const NECTAR_DATA = {
    'impossible foods': { pct: '≥50%', award: true },
    'impossible':       { pct: '≥50%', award: true },
    'beyond meat':      { pct: '≥50%', award: true },
    'beyond':           { pct: '≥50%', award: true },
};

function getNectarEntry(brands) {
    if (!brands) return null;
    const key = brands.toLowerCase();
    for (const [brand, data] of Object.entries(NECTAR_DATA)) {
        if (key.includes(brand)) return data;
    }
    return null;
}

const NUTRISCORE_COLOR = {
    a: '#1e8f4e',
    b: '#51b045',
    c: '#f5a623',
    d: '#e8812a',
    e: '#e63e11',
};

export default function BurgerCatalog() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get(OFF_URL)
            .then(res => {
                const prods = (res.data.products || []).filter(p => p.image_front_url && p.product_name);
                setProducts(prods);
            })
            .catch(() => setError('Could not load products. Please try again later.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bc-root">
            <header className="bc-header">
                <button className="bc-back" onClick={() => navigate(-1)} aria-label="Back">←</button>
                <div className="bc-header-text">
                    <h1 className="bc-title">Veggie Burgers</h1>
                    <p className="bc-subtitle">Veggie burgers · Open Food Facts</p>
                </div>
            </header>

            <main className="bc-main">
                {loading && (
                    <div className="bc-grid">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="bc-skeleton" />
                        ))}
                    </div>
                )}

                {error && <p className="bc-error">{error}</p>}

                {!loading && !error && products.length === 0 && (
                    <p className="bc-empty">No products found.</p>
                )}

                {!loading && (
                    <div className="bc-grid">
                        {products.map((p) => (
                            <button key={p.code} className="bc-card" onClick={() => setSelected(p)}>
                                <div className="bc-card-img-wrap">
                                    <img
                                        src={p.image_front_url}
                                        alt={p.product_name}
                                        className="bc-card-img"
                                        loading="lazy"
                                    />
                                    {p.nutriscore_grade && (
                                        <span
                                            className="bc-badge"
                                            style={{ background: NUTRISCORE_COLOR[p.nutriscore_grade.toLowerCase()] }}
                                        >
                                            {p.nutriscore_grade.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="bc-card-body">
                                    <div className="bc-card-name">{p.product_name}</div>
                                    <div className="bc-card-brand">{p.brands || '—'}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {selected && (
                <div className="bc-overlay" onClick={() => setSelected(null)}>
                    <div className="bc-modal" onClick={e => e.stopPropagation()}>
                        <button className="bc-modal-close" onClick={() => setSelected(null)}>×</button>

                        <div className="bc-modal-top">
                            <img
                                src={selected.image_front_url}
                                alt={selected.product_name}
                                className="bc-modal-img"
                            />
                            <div className="bc-modal-meta">
                                <div className="bc-modal-name">{selected.product_name}</div>
                                {selected.brands && <div className="bc-modal-brand">{selected.brands}</div>}
                                {selected.quantity && <div className="bc-modal-qty">{selected.quantity}</div>}
                                {selected.nutriscore_grade && (
                                    <span
                                        className="bc-nutriscore-pill"
                                        style={{ background: NUTRISCORE_COLOR[selected.nutriscore_grade.toLowerCase()] }}
                                    >
                                        Nutri-Score {selected.nutriscore_grade.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bc-nectar-row">
                            <span className="bc-nectar-label">
                                Meat parity
                                <span className="bc-nectar-source"> · Nectar 2025</span>
                            </span>
                            {(() => {
                                const entry = getNectarEntry(selected.brands);
                                if (entry) {
                                    return (
                                        <span className="bc-nectar-value bc-nectar-value--hit">
                                            {entry.pct} consumers prefer equally to meat
                                            {entry.award && <span className="bc-nectar-award"> TASTY Award</span>}
                                        </span>
                                    );
                                }
                                return <span className="bc-nectar-value bc-nectar-value--none">No public data</span>;
                            })()}
                        </div>

                        <h3 className="bc-modal-section-title">Nutritional values per 100g</h3>

                        <table className="bc-nutri-table">
                            <tbody>
                                {NUTRI_ROWS.map(row => {
                                    const val = selected.nutriments?.[row.key];
                                    if (val == null) return null;
                                    return (
                                        <tr key={row.key} className={row.indent ? 'bc-nutri-indent' : ''}>
                                            <td>{row.label}</td>
                                            <td>{Math.round(val * 10) / 10} {row.unit}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
