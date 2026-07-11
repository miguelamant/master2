import React, { useState, useEffect, useMemo } from 'react';
import { api } from 'apiService';
import ProductSheet from './ProductSheet';
import { getRatingPercent } from './ratingStats';
import './Search.css';

const CATEGORIES = [
    { id: 'better-for-you-candy', label: 'Better For You Candy', emoji: '🍬' },
    { id: 'natural-energy-drinks', label: 'Natural Energy Drinks', emoji: '⚡' },
];

// No per-product category column exists yet — every product in scan_products today
// is candy, so "Better For You Candy" shows everything and "Natural Energy Drinks"
// is an honest empty state until products are tagged with a real category.
const categoryHasNoProducts = (categoryId) => categoryId === 'natural-energy-drinks';

const RatingBadge = ({ gtin }) => {
    const pct = getRatingPercent(gtin);
    return (
        <div className={`srch-card-rating${pct === null ? ' srch-card-rating-empty' : ''}`}>
            {pct !== null ? `${pct}% as loved as the reference` : 'No public ratings'}
        </div>
    );
};

const Search = () => {
    const [products, setProducts] = useState(null);
    const [error, setError] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState(null); // null = category picker
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get('/api/consumer/products')
            .then((res) => {
                const list = Object.entries(res.data?.products ?? {}).map(([gtin, p]) => ({ gtin, ...p }));
                setProducts(list);
            })
            .catch(() => setError(true));
    }, []);

    const searching = query.trim().length > 0;

    const results = useMemo(() => {
        if (!products) return [];
        if (searching) {
            const q = query.trim().toLowerCase();
            return products.filter(
                (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
            );
        }
        if (!category || categoryHasNoProducts(category)) return [];
        return products;
    }, [products, query, category, searching]);

    const activeCategory = CATEGORIES.find((c) => c.id === category);
    const showCategoryPicker = !searching && !category;
    const showEmptyCategory = !searching && category && categoryHasNoProducts(category);

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

            {!searching && category && (
                <button className="srch-back" onClick={() => setCategory(null)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    {activeCategory?.label}
                </button>
            )}

            {error && <div className="srch-error">Couldn't load products.</div>}

            {!error && !products && <p className="srch-hint">Loading…</p>}

            {!error && products && showCategoryPicker && (
                <div className="srch-categories">
                    {CATEGORIES.map((c) => (
                        <button key={c.id} className="srch-cat-tile" onClick={() => setCategory(c.id)}>
                            <span className="srch-cat-emoji">{c.emoji}</span>
                            <span className="srch-cat-label">{c.label}</span>
                            <svg className="srch-cat-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    ))}
                </div>
            )}

            {!error && products && showEmptyCategory && (
                <div className="srch-empty">
                    <p>No products in this category yet — check back soon.</p>
                </div>
            )}

            {!error && products && searching && results.length === 0 && (
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
                                <RatingBadge gtin={p.gtin} />
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
