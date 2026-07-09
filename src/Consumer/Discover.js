import React, { useState, useEffect } from 'react';
import { api } from 'apiService';
import ProductSheet from './ProductSheet';
import './Discover.css';

const Discover = () => {
    const [products, setProducts] = useState(null);
    const [error, setError] = useState(false);
    const [selected, setSelected] = useState(null); // { gtin, product }

    useEffect(() => {
        api.get('/api/consumer/products')
            .then((res) => {
                const list = Object.entries(res.data?.products ?? {}).map(([gtin, p]) => ({ gtin, ...p }));
                setProducts(list);
            })
            .catch(() => setError(true));
    }, []);

    return (
        <div className="disc-root">
            <h2 className="disc-section-title">New on Willy</h2>

            {error && <div className="disc-error">Couldn't load products.</div>}

            {!error && !products && <p className="disc-hint">Loading…</p>}

            {!error && products && (
                <div className="disc-feed">
                    {products.map((p) => (
                        <button
                            key={p.gtin}
                            className="disc-card"
                            onClick={() => setSelected({ gtin: p.gtin, product: p })}
                        >
                            <img src={p.image} alt={p.name} className="disc-card-img" loading="lazy" />
                            <div className="disc-card-text">
                                <div className="disc-card-brand">{p.brand}</div>
                                <div className="disc-card-name">{p.name}</div>
                            </div>
                            <span className="disc-card-arrow">→</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="disc-forYou">
                <span className="disc-forYou-badge">Coming soon</span>
                <h3 className="disc-forYou-title">For You</h3>
                <p className="disc-forYou-text">A personalized feed based on what you scan and rate — on its way.</p>
            </div>

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

export default Discover;
