// src/Dashboard/ToAdd/components/ItemsList.jsx
import React from 'react';
import TooltipIcon from '../../components/TooltipIcon';

// add/remove icons for the mode switch
import addIcon    from '../../Icons/add.svg';
import removeIcon from '../../Icons/remove.svg';

// small badges for the taste icon
import badgeZero      from '../../Icons/badges/badge_zero.svg';
import badgeSparkling from '../../Icons/badges/badge_sparkling.svg';

// shared dynamic taste icon loader
import { iconFor } from '../utils/iconLoader';
import { convertItemLabel } from '../utils/itemLabelMap';

/**
 * Props
 * - items:        array for "To Add" mode
 * - itemsOnMenu:  array for "To Remove" mode
 * - toAdd:        boolean (true = Add mode, false = Remove mode)
 * - onModeChange: fn(nextBool)
 * - onAdd:        fn(item)
 * - onRemove:     fn(item)
 * - groupBy:      'category' | 'subcategory' | 'subsubcategory'  <-- IMPORTANT
 * - labelFor:     (label) => string
 */
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

    const setMode = (next) => onModeChange && onModeChange(next);

    // Normalize the label we use for the icon based on groupBy and mixed shapes
    const pickTasteLabel = (it) => {
        // data can be from two sources with different shapes:
        //  - "to add" items: { category (often subcat), subcategory, subsubcategory, ... }
        //  - "on menu" items: { category, subcategory, subsubcategory, item_name, ... }
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
            {/* Mode switch (centered) */}
            <div
                className="items-mode-switch"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 14,
                    margin: '0 0 12px 0',
                }}
            >
                <button
                    type="button"
                    onClick={() => setMode(true)}
                    aria-pressed={effectiveToAdd}
                    className="mode-btn"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: effectiveToAdd ? '9px 16px' : '8px 14px',
                        borderRadius: 14,
                        border: '1px solid #dfe3e8',
                        background: effectiveToAdd ? '#e9f7ef' : '#f7fafc', // soft green when active
                        boxShadow: effectiveToAdd ? '0 0 0 2px #c7ebd6 inset' : 'none',
                        transform: effectiveToAdd ? 'scale(1.04)' : 'none',
                        transition: 'all .12s ease',
                        cursor: 'pointer',
                    }}
                >
                    <img src={addIcon} alt="" aria-hidden="true" style={{ width: 16, height: 16 }} />
                    <span>To Add</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMode(false)}
                    aria-pressed={!effectiveToAdd}
                    className="mode-btn"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: !effectiveToAdd ? '9px 16px' : '8px 14px',
                        borderRadius: 14,
                        border: '1px solid #dfe3e8',
                        background: !effectiveToAdd ? '#ffecee' : '#f7fafc', // soft red when active
                        boxShadow: !effectiveToAdd ? '0 0 0 2px #ffd4d8 inset' : 'none',
                        transform: !effectiveToAdd ? 'scale(1.04)' : 'none',
                        transition: 'all .12s ease',
                        cursor: 'pointer',
                    }}
                >
                    <img src={removeIcon} alt="" aria-hidden="true" style={{ width: 16, height: 16 }} />
                    <span>To Remove</span>
                </button>
            </div>

            <ul className="items-list">
                {list.map((item, idx) => {
                    const name = item.name ?? item.item_name ?? '';
                    const key  = item.id ?? item.id_menu_item ?? idx;

                    const tasteLabel = pickTasteLabel(item);
                    const tasteIcon  = iconFor(tasteLabel);

                    // badges (may be missing on /api/menu-items payload; handles undefined safely)
                    const isZero  = Number(item.is_zero ?? 0) === 1;
                    const isSpark = Number(item.is_sparkling ?? 0) === 1;
/*
                    const isProtein     = Number(item.is_protein ?? 0) === 1;
                    const isPrebiotic   = Number(item.is_prebiotic ?? 0) === 1;
                    const isMagnesium   = Number(item.is_magnesium ?? 0) === 1;
                    const isVitamin     = Number(item.is_vitamin ?? 0) === 1;
                    const isCollagen    = Number(item.is_collagen ?? 0) === 1;

                    const isTrending    = Number(item.is_trending ?? 0) === 1;
                    const isHighMargin  = Number(item.is_high_margin ?? 0) === 1;

 */


                    return (
                        <li key={key} className="item">
                            <div className="item-main">
                                {/*<span className="item-rank">{idx + 1}.</span>*/}
                                <div className="item-title">{convertItemLabel(name || item.name)}</div>

                                <div className="item-icons" style={{display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {/* Taste icon 25x25 with tiny corner badges */}
                                    {tasteIcon && (
                                        <div
                                            className="taste-badged"
                                            style={{
                                                position: 'relative',
                                                width: 25,
                                                height: 25,
                                                display: 'inline-block',
                                            }}
                                            title={labelFor(tasteLabel)}
                                        >
                                            <TooltipIcon
                                                src={tasteIcon}
                                                alt={labelFor(tasteLabel)}
                                                tooltip={labelFor(tasteLabel)}
                                                className="category-icon"
                                                style={{ width: 25, height: 25 }}
                                            />
                                            {/* bottom-right: zero badge */}
                                            {isZero && (
                                                <img
                                                    src={badgeZero}
                                                    alt=""
                                                    aria-hidden="true"
                                                    style={{
                                                        position: 'absolute',
                                                        right: -4,
                                                        bottom: -6,
                                                        width: 14,
                                                        height: 14,
                                                    }}
                                                />
                                            )}
                                            {/* top-left: sparkling badge */}
                                            {isSpark && (
                                                <img
                                                    src={badgeSparkling}
                                                    alt=""
                                                    aria-hidden="true"
                                                    style={{
                                                        position: 'absolute',
                                                        left: -4,
                                                        top: -3,
                                                        width: 14,
                                                        height: 14,
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {effectiveToAdd ? (
                                <button
                                    className="add-button"
                                    onClick={() => onAdd?.(item)}
                                    title="Add to menu"
                                >
                                    Add
                                </button>
                            ) : (
                                <button
                                    className="add-button"
                                    onClick={() => onRemove?.(item)}
                                    title="Remove from menu"
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
