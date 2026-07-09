import React, { useState, useEffect, useMemo } from 'react';
import { api } from 'apiService';
import ProductSheet from './ProductSheet';
import './Search.css';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'better-for-you-candy', label: 'Better For You Candy' },
    { id: 'natural-energy-drinks', label: 'Natural Energy Drinks' },
];

// No per-product category column exists yet — every product in scan_products today
// is candy, so "Better For You Candy" just shows everything and the energy-drinks
// chip is an honest empty state until products are tagged with a real category.
const categoryHasNoProducts = (categoryId) => categoryId === 'natural-energy-drinks';

const Search = () => {
    const [products, setProducts] = useState(null);
    const [error, setError] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get('/api/consumer/products')
            .then((res) => {
                const list = Object.entries(res.data?.products ?? {}).map(([gtin, p]) => ({ gtin, ...p }));
                setProducts(list);
            })
            .catch(() => setError(true));
    }, []);

    const results = useMemo(() => {
        if (!products || categoryHasNoProducts(category)) return [];
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter(
            (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
        );
    }, [products, query, category]);

    return (
        <div className="srch-root">
            <div className="srch-bar">
                <svg className="srch-bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                    className="srch-bar-input"
                    type="text"
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="srch-chips">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.id}
                        className={`srch-chip${category === c.id ? ' srch-chip-active' : ''}`}
                        onClick={() => setCategory(c.id)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {error && <div className="srch-error">Couldn't load products.</div>}

            {!error && !products && <p className="srch-hint">Loading…</p>}

            {!error && products && categoryHasNoProducts(category) && (
                <div className="srch-empty">
                    <p>No products in this category yet — check back soon.</p>
                </div>
            )}

            {!error && products && !categoryHasNoProducts(category) && results.length === 0 && (
                <div className="srch-empty">
                    <p>No products match "{query}".</p>
                </div>
            )}

            {!error && products && results.length > 0 && (
                <div className="srch-results">
                    {results.map((p) => (
                        <button
                            key={p.gtin}
                            className="srch-card"
                            onClick={() => setSelected({ gtin: p.gtin, product: p })}
                        >
                            <img src={p.image} alt={p.name} className="srch-card-img" loading="lazy" />
                            <div className="srch-card-text">
                                <div className="srch-card-brand">{p.brand}</div>
                                <div className="srch-card-name">{p.name}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selected && (
                <ProductSheet
                    gtin={selected.gtin}
                    product={selected.product}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
};

export default Search;
