// src/Dashboard/ToAdd/components/ItemsList.jsx
import React, { useState, useEffect, useRef } from 'react';


// small badges
import badgeZero        from '../../Icons/badges/badge_zero.svg';
import badgeSparkling   from '../../Icons/badges/badge_sparkling.svg';
import badgeGlutenFree  from '../../Icons/badges/badge_gluten_free.svg';
import badgeAbbey       from '../../Icons/badges/badge_abbey.svg';
import badgeTrappist    from '../../Icons/badges/badge_trappist.svg';

// shared dynamic taste icon loader
import { iconFor } from '../utils/iconLoader';
import { convertItemLabel } from '../utils/itemLabelMap';

const PAGE_SIZE = 10;

export default function ItemsList({
                                      items = [],
                                      itemsOnMenu = [],
                                      toAdd,
                                      onModeChange,
                                      onAdd,
                                      onRemove,
                                      groupBy = 'subcategory',
                                      labelFor = (s) => s,
                                  }) {
    const effectiveToAdd = toAdd !== false;
    const list = effectiveToAdd ? items : itemsOnMenu;

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const gridRef = useRef(null);
    const prevListId = useRef(null);

    // Reset page when list identity changes
    const listId = `${effectiveToAdd ? 'add' : 'rm'}-${list.length}`;
    if (prevListId.current !== listId) {
        prevListId.current = listId;
        if (visibleCount !== PAGE_SIZE) setVisibleCount(PAGE_SIZE);
    }

    // Scroll-based pagination: listen on the grid itself (has max-height + overflow-y)
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const handleScroll = () => {
            const distanceFromBottom = grid.scrollHeight - grid.scrollTop - grid.clientHeight;
            if (distanceFromBottom < 400) {
                setVisibleCount((prev) => {
                    const next = prev + PAGE_SIZE;
                    return next >= list.length ? list.length : next;
                });
            }
        };

        grid.addEventListener('scroll', handleScroll, { passive: true });
        return () => grid.removeEventListener('scroll', handleScroll);
    }, [list.length]);

    const visibleItems = list.slice(0, visibleCount);

    const setMode = (next) => onModeChange && onModeChange(next);

    const pickTasteLabel = (it) => {
        switch (groupBy) {
            case 'category':
                return it.category ?? it.category_name ?? it.subcategory ?? it.subcat_name ?? it.subsubcategory ?? it.subsubcat_name ?? '';
            case 'subsubcategory':
                return it.subsubcategory ?? it.subsubcat_name ?? it.subcategory ?? it.subcat_name ?? it.category ?? it.category_name ?? '';
            case 'subcategory':
            default:
                return it.subcategory ?? it.subcat_name ?? it.category ?? it.category_name ?? it.subsubcategory ?? it.subsubcat_name ?? '';
        }
    };

    return (
        <>
            {/* Mode switch */}
            <div className="items-mode-switch">
                <button
                    type="button"
                    onClick={() => setMode(true)}
                    aria-pressed={effectiveToAdd}
                    className={`mode-btn ${effectiveToAdd ? 'mode-btn--active-add' : ''}`}
                >
                    <span className="mode-btn-icon">+</span>
                    <span>To Add</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMode(false)}
                    aria-pressed={!effectiveToAdd}
                    className={`mode-btn ${!effectiveToAdd ? 'mode-btn--active-remove' : ''}`}
                >
                    <span className="mode-btn-icon">&minus;</span>
                    <span>To Remove</span>
                </button>
            </div>

            {/* Debug: pagination indicator */}
            {list.length > 0 && (
                <div style={{ fontSize: 12, opacity: 0.55, padding: '4px 0 8px', textAlign: 'right' }}>
                    Showing {visibleItems.length} of {list.length}
                </div>
            )}

            {/* Card grid */}
            <ul className="items-grid" ref={gridRef}>
                {visibleItems.map((item, idx) => {
                    const name = item.name ?? item.item_name ?? '';
                    const key  = item.id ?? item.id_menu_item ?? idx;

                    const tasteLabel = pickTasteLabel(item);
                    const tasteIcon  = iconFor(tasteLabel);

                    const isZero       = Number(item.is_zero ?? 0) === 1;
                    const isSpark      = Number(item.is_sparkling ?? 0) === 1;
                    const isGlutenFree = Number(item.is_gluten_free ?? 0) === 1;
                    const heritage     = String(item.heritage || 'normal').toLowerCase();
                    const isAbbey      = heritage === 'abbey';
                    const isTrappist   = heritage === 'trappist';
                    const abv          = item.abv != null ? Number(item.abv) : null;

                    // Frituur-specific fields
                    const catName      = (item.category ?? item.category_name ?? '').toUpperCase();
                    const isFrituur    = catName === 'DEEP_FRIED_SNACKS';
                    const starRating   = isFrituur && item.star_rating != null ? Number(item.star_rating) : null;
                    const tasteScore   = isFrituur && item.taste_score != null ? Number(item.taste_score) : null;
                    const pricePortion = isFrituur && item.price_foodservice != null ? Number(item.price_foodservice) : null;

                    return (
                        <li key={key} className="item-card">
                            {/* Product image area — generic placeholder indicating future image */}
                            <div className="item-card__image">
                                <div className="item-card__image-empty">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                        <polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                </div>
                                {/* Floating corner badges */}
                                {isZero && (
                                    <img src={badgeZero} alt="Zero" className="item-card__float-badge item-card__float-badge--bl" />
                                )}
                                {isSpark && (
                                    <img src={badgeSparkling} alt="Sparkling" className="item-card__float-badge item-card__float-badge--br" />
                                )}
                            </div>

                            {/* Info section */}
                            <div className="item-card__body">
                                {/* Attribute pills row */}
                                <div className="item-card__pills">
                                    {tasteIcon && (
                                        <span className="item-card__pill" title={tasteLabel}>
                                            <img src={tasteIcon} alt="" className="item-card__pill-icon" />
                                        </span>
                                    )}
                                    {abv != null && abv > 0 && (
                                        <span className="item-card__pill item-card__pill--abv" title="ABV">
                                            {abv.toFixed(1)}%
                                        </span>
                                    )}
                                    {isGlutenFree && (
                                        <span className="item-card__pill" title="Gluten free">
                                            <img src={badgeGlutenFree} alt="" className="item-card__pill-icon" />
                                        </span>
                                    )}
                                    {isAbbey && (
                                        <span className="item-card__pill" title="Abbey beer">
                                            <img src={badgeAbbey} alt="" className="item-card__pill-icon" />
                                        </span>
                                    )}
                                    {isTrappist && (
                                        <span className="item-card__pill" title="Trappist beer">
                                            <img src={badgeTrappist} alt="" className="item-card__pill-icon" />
                                        </span>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="item-card__name">
                                    {convertItemLabel(name || item.name)}
                                </div>

                                {/* Category subtitle */}
                                <div className="item-card__category">
                                    {labelFor(tasteLabel)}
                                </div>

                                {/* Frituur extras: stars, taste score, price per portion */}
                                {isFrituur && (starRating != null || tasteScore != null || pricePortion != null) && (
                                    <div className="item-card__frituur-extras">
                                        {starRating != null && (
                                            <span className="item-card__stars" title={`Rating: ${starRating}/5`}>
                                                {[1,2,3,4,5].map(i => (
                                                    <svg key={i} width="12" height="12" viewBox="0 0 24 24"
                                                         fill={i <= Math.round(starRating) ? '#F5A623' : 'none'}
                                                         stroke="#F5A623" strokeWidth="2">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>
                                                    </svg>
                                                ))}
                                            </span>
                                        )}
                                        {tasteScore != null && (
                                            <span className="item-card__taste-score" title="Taste score">
                                                🍴 {tasteScore}/10
                                            </span>
                                        )}
                                        {pricePortion != null && (
                                            <span className="item-card__price-portion" title="Price per portion (foodservice)">
                                                €{pricePortion.toFixed(2)}/st
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Action button */}
                                {effectiveToAdd ? (
                                    <button
                                        className="item-card__action"
                                        onClick={() => onAdd?.(item)}
                                        title="Add to menu"
                                    >
                                        + Add
                                    </button>
                                ) : (
                                    <button
                                        className="item-card__action"
                                        onClick={() => onRemove?.(item)}
                                        title="Remove from menu"
                                    >
                                        &minus; Remove
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {visibleCount < list.length && (
                <div style={{ textAlign: 'center', padding: '16px 0', opacity: 0.5, fontSize: 13 }}>
                    Showing {visibleCount} of {list.length} — scroll down for more
                </div>
            )}
        </>
    );
}
