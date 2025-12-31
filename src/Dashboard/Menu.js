// src/Menu.js
import React, { useState, useEffect, useMemo } from 'react';
import { api } from "apiService";
import './Menu.css';

import TasteIconWithBadges from './components/TasteIconWithBadges';
import { iconFor } from './ToAdd/utils/iconLoader';
import { convertItemLabel } from './ToAdd/utils/itemLabelMap';
import { convertDisplayLabel } from './ToAdd/utils/labelMap';

const normToken = (s) =>
    String(s ?? '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const BADGES_BY_GROUP = {};
const SHOW_DIETARY_BADGES = false;

const Menu = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [editMode, setEditMode]   = useState(false);
    const [priceMap, setPriceMap]   = useState({});
    const [toDelete, setToDelete]   = useState(new Set());

    const [productsList, setProductsList] = useState([]);
    const [newItem, setNewItem] = useState({ productId: '', name: '', brand: '', price: '' });

    // NEW: for category-header hover popover
    const [hoverCat, setHoverCat] = useState(null);
    // NEW: per-item hover tooltip
    const [hoverItem, setHoverItem] = useState(null);


    const to01 = (v) => {
        if (v === 1 || v === '1' || v === true) return 1;
        if (typeof v === 'string' && v.trim().toLowerCase() === 'true') return 1;
        return 0;
    };

    // --- sorting helpers ---
    const normalizeStr = (s) => String(s || '').toUpperCase();
    const abvOf = (i) => {
        const v = i?.abv ?? i?.abv_percent ?? i?.alcohol;
        return v == null ? null : Number(v);
    };
    const abvKey = (i) => (abvOf(i) == null ? Number.POSITIVE_INFINITY : abvOf(i));

    const bySubcatThenAbv = (a, b) => {
        const sa = normalizeStr(a.subcategory).localeCompare(normalizeStr(b.subcategory));
        if (sa !== 0) return sa;
        return abvKey(a) - abvKey(b);
    };


    const fetchMenuItems = async () => {
        const res = await api.get('/api/menu-items', {
            withCredentials: true,
            params: { page: 1, pageSize: 500, orderBy: 'products.name' }
        });
        return res.data?.items || [];
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [itemsArr, prodRes] = await Promise.all([
                    fetchMenuItems(),
                    api.get('/api/products', { withCredentials: true })
                ]);
                setMenuItems(itemsArr);

                const mappedProducts = (prodRes.data || []).map(p => ({
                    ...p,
                    recommendedPrice:
                        p.low_price != null && p.high_price != null ? (p.low_price + p.high_price) / 2 : null
                }));
                setProductsList(mappedProducts);
            } catch (err) {
                console.error(err);
                setError('Kon data niet laden');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    useEffect(() => {
        if (editMode && Array.isArray(menuItems)) {
            const m = {};
            menuItems.forEach(i => (m[i.id_menu_item] = i.price));
            setPriceMap(m);
            setToDelete(new Set());
        }
    }, [editMode, menuItems]);

    // GROUPING: only by category; keep subcategories in a map for hover
    const tree = useMemo(() => {
        const t = {};
        (Array.isArray(menuItems) ? menuItems : []).forEach(i => {
            const cat  = i.category || 'Other';
            const sub  = i.subcategory || 'General';
            if (!t[cat]) t[cat] = {};
            if (!t[cat][sub]) t[cat][sub] = [];
            t[cat][sub].push(i);
        });
        return t;
    }, [menuItems]);

    if (loading) return <p>Loading…</p>;
    if (error)   return <p className="error">{error}</p>;

    // —— handlers ——
    const handlePriceChange = (id, raw) => {
        const v = parseFloat(raw);
        setPriceMap(pm => ({ ...pm, [id]: isNaN(v) ? raw : v }));
    };
    const toggleDelete = id => {
        setToDelete(td => {
            const nxt = new Set(td);
            nxt.has(id) ? nxt.delete(id) : nxt.add(id);
            return nxt;
        });
    };
    const handleCancel = () => {
        setEditMode(false);
        setPriceMap({});
        setToDelete(new Set());
        setNewItem({ productId: '', name: '', brand: '', price: '' });
    };
    const handleSave = async () => {
        try {
            for (let id of toDelete) {
                await api.delete(`/api/menu-items/${id}`, { withCredentials: true });
            }
            const updates = Object.entries(priceMap)
                .filter(([id]) => !toDelete.has(Number(id)))
                .map(([id, price]) => ({ id_menu_item: Number(id), price: Number(price) }));
            if (updates.length) {
                await api.patch('/api/menu-items', { updates }, { withCredentials: true });
            }
            const fresh = await fetchMenuItems();
            setMenuItems(fresh);
            setEditMode(false);
            setToDelete(new Set());
        } catch (err) {
            console.error(err);
            alert('Opslaan mislukt');
        }
    };
    const handleAdd = async e => {
        e.preventDefault();
        try {
            await api.post(
                '/api/menu-items/add',
                { product_id: newItem.productId, price: Number(newItem.price) },
                { withCredentials: true }
            );
            localStorage.removeItem('wrapped_hot_items');
            localStorage.removeItem('wrapped_next_season');
            const fresh = await fetchMenuItems();
            setMenuItems(fresh);
            setNewItem({ productId: '', name: '', brand: '', price: '' });
        } catch (err) {
            console.error(err);
            alert('Toevoegen mislukt');
        }
    };

    // header with icon + (optional) group-level badges
    const GroupHeader = ({ label, size = 22, color = '#0b1220' }) => {
        const token  = normToken(label);
        const icon   = iconFor(token);
        const pretty = convertDisplayLabel(label);
        const badges = BADGES_BY_GROUP[token] || [];
        const visibleBadges = SHOW_DIETARY_BADGES
            ? badges
            : badges.filter(b => b !== 'badge_lactose_free' && b !== 'badge_gluten_free');
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color }}>
        {icon && <TasteIconWithBadges token={token} badges={visibleBadges} size={size} title={pretty} />}
                <span style={{ color }}>{pretty}</span>
      </span>
        );
    };

    // per-item badges from flags
    const buildBadges = (i) => {
        const b = [];
        if (to01(i.is_zero) === 1) b.push('badge_zero');

        const spr = to01(i.is_sparkling);
        if (spr === 1) b.push('badge_sparkling');
        else if (spr === 0) b.push('badge_not_sparkling');

        if (to01(i.is_lactose_free) === 1) b.push('badge_lactose_free');
        if (to01(i.is_gluten_free)  === 1) b.push('badge_gluten_free');
        return b;
    };

    // Item row (no brand; use subsubcategory text style; optional ABV)
    const ItemRow = ({ i, showAbv }) => {
        const catUpper = String(i.category || '').toUpperCase();

// For beers: prefer subcategory icons (more stable coverage)
// For others: keep the more specific subsubcategory when available
        const token = normToken(
            catUpper === 'BEERS'
                ? (i.subcategory || i.subsubcategory || i.category)
                : (i.subsubcategory || i.subcategory || i.category)
        );

        const badges = buildBadges(i);
        const visibleBadges = SHOW_DIETARY_BADGES
            ? badges
            : badges.filter(b => b !== 'badge_lactose_free' && b !== 'badge_gluten_free');

        const abv = abvOf(i); // may be null

        return (
            <li
                key={i.id_menu_item}
                className="menu-item"
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoverItem(i.id_menu_item)}
                onMouseLeave={() => setHoverItem(null)}
            >
                <div className="item-left">
                    <TasteIconWithBadges
                        token={token}
                        badges={visibleBadges}
                        size={20}
                        title={convertItemLabel(i.item_name)}
                    />
                    <div className="item-text">
                        <div className="item-name" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                            {convertItemLabel(i.item_name)}
                            {showAbv && abv != null && (
                                <span
                                    className="item-abv"
                                    style={{ fontSize: 12, color: '#64748b', lineHeight: 1 }}
                                >
                {abv.toFixed(1)}%
              </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* keep price on the right exactly as before */}
                <div className="item-right">
                    <div className="item-price">
                        {editMode ? (
                            <div className="price-input-wrapper">
                                <span className="currency-symbol">€</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="menu-item-input"
                                    value={priceMap[i.id_menu_item] ?? ''}
                                    onChange={e => handlePriceChange(i.id_menu_item, e.target.value)}
                                />
                            </div>
                        ) : (
                            `€${Number(i.price).toFixed(2)}`
                        )}
                    </div>
                </div>

                {/* item-level hover tooltip with subcategory */}
                {hoverItem === i.id_menu_item && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 6,
                            background: '#fff',
                            color: '#0b1220',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            borderRadius: 6,
                            padding: '6px 8px',
                            zIndex: 15,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            fontSize: 12,
                            lineHeight: 1.2,
                        }}
                    >
                        {convertDisplayLabel(i.subcategory || '')}
                    </div>
                )}
            </li>
        );
    };



    return (
        <div className="menu-container">
            <div className="menu-header">
                {!editMode ? (
                    <button className="edit-save-btn" onClick={() => setEditMode(true)}>Edit</button>
                ) : (
                    <>
                        <button className="edit-save-btn" onClick={handleSave}>Confirm</button>
                        <button className="edit-cancel-btn" onClick={handleCancel}>Cancel</button>
                    </>
                )}
            </div>

            <div
                className="menu-list-container"
                style={{ maxHeight: editMode ? 'calc(100vh - 17rem)' : 'calc(100vh - 11rem)' }}
            >
                {/* CATEGORY level */}
                {/* CATEGORY level */}
                {Object.entries(tree).map(([category, bySub]) => {
                    const itemsFlat = Object.values(bySub).flat();

                    return (
                        <section key={category} className="menu-section">
                            {/* Header + count + stable hover */}
                            <div
                                className="menu-category-wrap"
                                style={{ position: 'relative', display: 'inline-block' }}
                                onMouseEnter={() => setHoverCat(category)}
                                onMouseLeave={() => setHoverCat(null)}
                            >
                                <h3
                                    className="menu-category"
                                    style={{
                                        color: '#0b1220',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        margin: 0,
                                    }}
                                >
                                    <GroupHeader label={category} size={26} color="#0b1220" />
                                    <span className="count-pill">{itemsFlat.length}</span>
                                </h3>

                                {hoverCat === category && (
                                    <div
                                        className="cat-popover"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            marginTop: 6,
                                            background: '#fff',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                            borderRadius: 8,
                                            padding: '8px 10px',
                                            zIndex: 10,
                                            minWidth: 280,
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            pointerEvents: 'auto',
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 6, color: '#0b1220' }}>
                                            Subcategories
                                        </div>
                                        <ul
                                            style={{
                                                listStyle: 'none',
                                                margin: 0,
                                                padding: 0,
                                                maxHeight: 260,
                                                overflowY: 'auto',
                                            }}
                                        >
                                            {Object.entries(bySub).map(([sub, items]) => (
                                                <li
                                                    key={sub}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        gap: 8,
                                                        padding: '2px 0',
                                                    }}
                                                    title={convertDisplayLabel(sub)}
                                                >
                                                    <span>{convertDisplayLabel(sub)}</span>
                                                    <span
                                                        style={{
                                                            color: '#475569',
                                                            fontVariantNumeric: 'tabular-nums',
                                                        }}
                                                    >
                    {items.length}
                  </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* ITEMS (category only) */}
                            {(() => {
                                const catUpper  = String(category).toUpperCase();
                                const isRefresh = catUpper === 'REFRESHMENTS' || catUpper === 'SODAS';
                                const itemsFlat = Object.values(bySub).flat();

                                if (catUpper === 'BEERS') {
                                    const zeroItems = itemsFlat.filter(i => to01(i.is_zero) === 1).sort(bySubcatThenAbv);
                                    const alcItems  = itemsFlat.filter(i => to01(i.is_zero) === 0).sort(bySubcatThenAbv);

                                    return (
                                        <>
                                            {zeroItems.length > 0 && (
                                                <div className="menu-subsection">
                                                    <h4 className="menu-subcategory">
                                                        <span style={{ fontWeight: 700, color: '#111827' }}>Zero / Non-alcoholic</span>
                                                    </h4>
                                                    <ul className="menu-list menu-list--indented">
                                                        {zeroItems.map(i => (
                                                            <ItemRow key={`zero-${i.id_menu_item}`} i={i} showAbv={true} />
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {alcItems.length > 0 && (
                                                <div className="menu-subsection" style={{ marginTop: 14 }}>
                                                    <h4 className="menu-subcategory">
                                                        <span style={{ fontWeight: 700, color: '#111827' }}>Alcoholic</span>
                                                    </h4>
                                                    <ul className="menu-list menu-list--indented">
                                                        {alcItems.map(i => (
                                                            <ItemRow key={`alc-${i.id_menu_item}`} i={i} showAbv={true} />
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    );
                                }

                                // Non-beers (e.g. refreshments): sort by subcategory then (no ABV shown)
                                const sorted = itemsFlat.slice().sort(bySubcatThenAbv);
                                return (
                                    <div className="menu-subsection">
                                        <ul className="menu-list menu-list--indented">
                                            {sorted.map(i => (
                                                <ItemRow key={i.id_menu_item} i={i} showAbv={!isRefresh} />
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })()}

                        </section>
                    );
                })}
            </div>
        </div>
    );
};


export default Menu;
