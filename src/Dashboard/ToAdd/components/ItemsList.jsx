// src/Dashboard/ToAdd/components/ItemsList.jsx
import React from 'react';
import TooltipIcon from '../../components/TooltipIcon';

// add/remove icons for the mode switch
import addIcon    from '../../Icons/add.svg';
import removeIcon from '../../Icons/remove.svg';

// small badges
import badgeZero        from '../../Icons/badges/badge_zero.svg';
import badgeSparkling   from '../../Icons/badges/badge_sparkling.svg';
import badgeGlutenFree  from '../../Icons/badges/badge_gluten_free.svg';
import badgeAbbey       from '../../Icons/badges/badge_abbey.svg';
import badgeTrappist    from '../../Icons/badges/badge_trappist.svg';

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
 * - groupBy:      'category' | 'subcategory' | 'subsubcategory'
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
                    <img src={addIcon} alt="" aria-hidden="true" style={{ width: 15, height: 15 }} />
                    <span>To Add</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMode(false)}
                    aria-pressed={!effectiveToAdd}
                    className={`mode-btn ${!effectiveToAdd ? 'mode-btn--active-remove' : ''}`}
                >
                    <img src={removeIcon} alt="" aria-hidden="true" style={{ width: 15, height: 15 }} />
                    <span>To Remove</span>
                </button>
            </div>

            {/* Card grid */}
            <ul className="items-grid">
                {list.map((item, idx) => {
                    const name = item.name ?? item.item_name ?? '';
                    const key  = item.id ?? item.id_menu_item ?? idx;

                    const tasteLabel = pickTasteLabel(item);
                    const tasteIcon  = iconFor(tasteLabel);

                    const isZero      = Number(item.is_zero ?? 0) === 1;
                    const isSpark     = Number(item.is_sparkling ?? 0) === 1;
                    const isGlutenFree = Number(item.is_gluten_free ?? 0) === 1;
                    const heritage    = String(item.heritage || 'normal').toLowerCase();
                    const isAbbey     = heritage === 'abbey';
                    const isTrappist  = heritage === 'trappist';
                    const abv         = item.abv != null ? Number(item.abv) : null;

                    return (
                        <li key={key} className="item-card">
                            {/* Top: taste icon + badges row */}
                            <div className="item-card__header">
                                {tasteIcon && (
                                    <div className="item-card__taste">
                                        <TooltipIcon
                                            src={tasteIcon}
                                            alt={labelFor(tasteLabel)}
                                            tooltip={labelFor(tasteLabel)}
                                            className="item-card__taste-icon"
                                        />
                                        {isZero && (
                                            <img src={badgeZero} alt="Zero" className="item-card__micro-badge item-card__micro-badge--br" />
                                        )}
                                        {isSpark && (
                                            <img src={badgeSparkling} alt="Sparkling" className="item-card__micro-badge item-card__micro-badge--tl" />
                                        )}
                                    </div>
                                )}

                                {/* Attribute badges */}
                                <div className="item-card__badges">
                                    {abv != null && abv > 0 && (
                                        <span className="item-card__badge item-card__badge--abv" title="ABV">
                                            {abv.toFixed(1)}%
                                        </span>
                                    )}
                                    {isGlutenFree && (
                                        <img src={badgeGlutenFree} alt="Gluten free" title="Gluten free"
                                             className="item-card__badge-icon" />
                                    )}
                                    {isAbbey && (
                                        <img src={badgeAbbey} alt="Abbey" title="Abbey beer"
                                             className="item-card__badge-icon" />
                                    )}
                                    {isTrappist && (
                                        <img src={badgeTrappist} alt="Trappist" title="Trappist beer"
                                             className="item-card__badge-icon" />
                                    )}
                                </div>
                            </div>

                            {/* Name */}
                            <div className="item-card__name">
                                {convertItemLabel(name || item.name)}
                            </div>

                            {/* Category subtitle */}
                            <div className="item-card__category">
                                {labelFor(tasteLabel)}
                            </div>

                            {/* Action button */}
                            {effectiveToAdd ? (
                                <button
                                    className="item-card__action item-card__action--add"
                                    onClick={() => onAdd?.(item)}
                                    title="Add to menu"
                                >
                                    + Add
                                </button>
                            ) : (
                                <button
                                    className="item-card__action item-card__action--remove"
                                    onClick={() => onRemove?.(item)}
                                    title="Remove from menu"
                                >
                                    &minus; Remove
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
