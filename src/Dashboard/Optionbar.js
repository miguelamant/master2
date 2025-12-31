// src/Dashboard/Optionbar.jsx
import React from 'react';
import './Optionbar.css';

// Badge icons
import badgeZero       from './Icons/badges/badge_zero_2.svg';
import badgeNotZero    from './Icons/badges/badge_one_2.svg';
import badgeSparkling  from './Icons/badges/badge_sparkling.svg';
import badgeStill      from './Icons/badges/badge_not_sparkling.svg';
import badgeAbbey      from './Icons/badges/badge_abbey.svg';
import badgeTrappist   from './Icons/badges/badge_trappist.svg';
import badgeNormal     from './Icons/badges/badge_factory.svg';

export default function Optionbar({
                                      groupBy,
                                      tasteOptions = [],
                                      filters,
                                      onChange,
                                      /** optional: "beers" | "refreshments" | "sodas" */
                                      category = null,
                                  }) {
    // current filter state
    const tastesSet   = filters?.tastes    instanceof Set ? filters.tastes : new Set();
    const sugar       = filters?.sugar     || { zero_sugar: true, with_sugar: true };
    const sparkling   = filters?.sparkling || { sparkling: true, not_sparkling: true };
    const heritageSet = filters?.heritage  instanceof Set ? filters.heritage : new Set(['abbey','trappist','normal']);

    // category gates
    const cat = String(category || '').toLowerCase();
    const showCarbonation = (cat === 'refreshments' || cat === 'sodas'); // soft drinks only
    const showHeritage    = (cat === 'beers');                            // beers only

    // handlers (unchanged data shape so focusGroup keeps working)
    const toggleTaste = (id) => {
        const next = new Set(tastesSet);
        next.has(id) ? next.delete(id) : next.add(id);
        onChange({ ...filters, tastes: next });
    };

    const toggleSugar = (key) => {
        const next = { ...sugar, [key]: !sugar[key] };
        onChange({ ...filters, sugar: next });
    };

    const toggleSparkling = (key) => {
        const next = { ...sparkling, [key]: !sparkling[key] };
        onChange({ ...filters, sparkling: next });
    };

    const toggleHeritage = (val) => {
        const next = new Set(heritageSet);
        next.has(val) ? next.delete(val) : next.add(val);
        onChange({ ...filters, heritage: next });
    };

    return (
        <nav className="optionbar-container" aria-label="Filters">
            <div className="optionbar-sticky">
                <div className="optionbar-card">
                    <h3 className="optionbar-title">Filters</h3>

                    <div className="optionbar-scrollable">
                        {/* TASTES */}
                        <section className="optionbar-group">
                            <h4 className="optionbar-group-title">
                                {groupBy === 'category' ? 'Categories'
                                    : groupBy === 'subsubcategory' ? 'Variants'
                                        : 'Subcategories'}
                            </h4>
                            <ul className="optionbar-list">
                                {tasteOptions.map(opt => (
                                    <li key={opt.id} className="option-item">
                                        <input
                                            type="checkbox"
                                            id={`taste-${opt.id}`}
                                            checked={tastesSet.has(opt.id)}
                                            onChange={() => toggleTaste(opt.id)}
                                        />
                                        <label htmlFor={`taste-${opt.id}`} className="option-label">
                                            {opt.icon && (
                                                <img
                                                    src={opt.icon}
                                                    alt=""
                                                    aria-hidden="true"
                                                    className="option-icon"
                                                />
                                            )}
                                            {opt.label}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <hr className="optionbar-divider" />

                        {/* ZERO (renamed from "Sugar"; same data shape for compatibility) */}
                        <section className="optionbar-group">
                            <h4 className="optionbar-group-title">Zero</h4>
                            <ul className="optionbar-list">
                                <li className="option-item">
                                    <input
                                        type="checkbox"
                                        id="zero-yes"
                                        checked={!!sugar.zero_sugar}
                                        onChange={() => toggleSugar('zero_sugar')}
                                    />
                                    <label htmlFor="zero-yes" className="option-label">
                                        <img src={badgeZero} alt="" aria-hidden="true" className="option-icon" />
                                        Zero
                                    </label>
                                </li>
                                <li className="option-item">
                                    <input
                                        type="checkbox"
                                        id="zero-no"
                                        checked={!!sugar.with_sugar}
                                        onChange={() => toggleSugar('with_sugar')}
                                    />
                                    <label htmlFor="zero-no" className="option-label">
                                        <img src={badgeNotZero} alt="" aria-hidden="true" className="option-icon" />
                                        Not zero
                                    </label>
                                </li>
                            </ul>
                        </section>

                        <hr className="optionbar-divider" />

                        {/* CARBONATION (only for refreshments/soft drinks) */}
                        {showCarbonation && (
                            <>
                                <section className="optionbar-group">
                                    <h4 className="optionbar-group-title">Carbonation</h4>
                                    <ul className="optionbar-list">
                                        <li className="option-item">
                                            <input
                                                type="checkbox"
                                                id="sparkling-yes"
                                                checked={!!sparkling.sparkling}
                                                onChange={() => toggleSparkling('sparkling')}
                                            />
                                            <label htmlFor="sparkling-yes" className="option-label">
                                                <img src={badgeSparkling} alt="" aria-hidden="true" className="option-icon" />
                                                Sparkling
                                            </label>
                                        </li>
                                        <li className="option-item">
                                            <input
                                                type="checkbox"
                                                id="sparkling-no"
                                                checked={!!sparkling.not_sparkling}
                                                onChange={() => toggleSparkling('not_sparkling')}
                                            />
                                            <label htmlFor="sparkling-no" className="option-label">
                                                <img src={badgeStill} alt="" aria-hidden="true" className="option-icon" />
                                                Not sparkling
                                            </label>
                                        </li>
                                    </ul>
                                </section>

                                <hr className="optionbar-divider" />
                            </>
                        )}

                        {/* HERITAGE (beers only) */}
                        {showHeritage && (
                            <section className="optionbar-group">
                                <h4 className="optionbar-group-title">Heritage</h4>
                                <ul className="optionbar-list">
                                    <li className="option-item">
                                        <input
                                            type="checkbox"
                                            id="heritage-normal"
                                            checked={heritageSet.has('normal')}
                                            onChange={() => toggleHeritage('normal')}
                                        />
                                        <label htmlFor="heritage-normal" className="option-label">
                                            <img src={badgeNormal} alt="" aria-hidden="true" className="option-icon" />
                                            Normal
                                        </label>
                                    </li>
                                    <li className="option-item">
                                        <input
                                            type="checkbox"
                                            id="heritage-abbey"
                                            checked={heritageSet.has('abbey')}
                                            onChange={() => toggleHeritage('abbey')}
                                        />
                                        <label htmlFor="heritage-abbey" className="option-label">
                                            <img src={badgeAbbey} alt="" aria-hidden="true" className="option-icon" />
                                            Abbey
                                        </label>
                                    </li>
                                    <li className="option-item">
                                        <input
                                            type="checkbox"
                                            id="heritage-trappist"
                                            checked={heritageSet.has('trappist')}
                                            onChange={() => toggleHeritage('trappist')}
                                        />
                                        <label htmlFor="heritage-trappist" className="option-label">
                                            <img src={badgeTrappist} alt="" aria-hidden="true" className="option-icon" />
                                            Trappist
                                        </label>
                                    </li>
                                </ul>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
