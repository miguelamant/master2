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

function CheckRow({ icon, label, checked, onClick }) {
    return (
        <li
            className={`optionbar-row${checked ? ' is-checked' : ''}`}
            onClick={onClick}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        >
            <span className={`optionbar-check${checked ? ' checked' : ''}`}>
                {checked && (
                    <svg className="optionbar-check-tick" viewBox="0 0 12 12">
                        <polyline points="2.5,6 5.5,9 10,3" />
                    </svg>
                )}
            </span>
            {icon && <img src={icon} alt="" aria-hidden="true" className="optionbar-row-icon" />}
            <span className="optionbar-row-label">{label}</span>
        </li>
    );
}

export default function Optionbar({
                                      groupBy,
                                      tasteOptions = [],
                                      filters,
                                      onChange,
                                      category = null,
                                  }) {
    const tastesSet   = filters?.tastes    instanceof Set ? filters.tastes : new Set();
    const sugar       = filters?.sugar     || { zero_sugar: true, with_sugar: true };
    const sparkling   = filters?.sparkling || { sparkling: true, not_sparkling: true };
    const heritageSet = filters?.heritage  instanceof Set ? filters.heritage : new Set(['abbey','trappist','normal']);

    const cat = String(category || '').toLowerCase();
    const showCarbonation = (cat === 'refreshments' || cat === 'sodas');
    const showHeritage    = (cat === 'beers');

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
                            <ul className="optionbar-checklist">
                                {tasteOptions.map(opt => (
                                    <CheckRow
                                        key={opt.id}
                                        icon={opt.icon}
                                        label={opt.label}
                                        checked={tastesSet.has(opt.id)}
                                        onClick={() => toggleTaste(opt.id)}
                                    />
                                ))}
                            </ul>
                        </section>

                        <hr className="optionbar-divider" />

                        {/* ZERO */}
                        <section className="optionbar-group">
                            <h4 className="optionbar-group-title">Zero</h4>
                            <ul className="optionbar-checklist">
                                <CheckRow
                                    icon={badgeZero}
                                    label="Zero"
                                    checked={!!sugar.zero_sugar}
                                    onClick={() => toggleSugar('zero_sugar')}
                                />
                                <CheckRow
                                    icon={badgeNotZero}
                                    label="Not zero"
                                    checked={!!sugar.with_sugar}
                                    onClick={() => toggleSugar('with_sugar')}
                                />
                            </ul>
                        </section>

                        <hr className="optionbar-divider" />

                        {/* CARBONATION */}
                        {showCarbonation && (
                            <>
                                <section className="optionbar-group">
                                    <h4 className="optionbar-group-title">Carbonation</h4>
                                    <ul className="optionbar-checklist">
                                        <CheckRow
                                            icon={badgeSparkling}
                                            label="Sparkling"
                                            checked={!!sparkling.sparkling}
                                            onClick={() => toggleSparkling('sparkling')}
                                        />
                                        <CheckRow
                                            icon={badgeStill}
                                            label="Not sparkling"
                                            checked={!!sparkling.not_sparkling}
                                            onClick={() => toggleSparkling('not_sparkling')}
                                        />
                                    </ul>
                                </section>

                                <hr className="optionbar-divider" />
                            </>
                        )}

                        {/* HERITAGE */}
                        {showHeritage && (
                            <section className="optionbar-group">
                                <h4 className="optionbar-group-title">Heritage</h4>
                                <ul className="optionbar-checklist">
                                    <CheckRow
                                        icon={badgeNormal}
                                        label="Normal"
                                        checked={heritageSet.has('normal')}
                                        onClick={() => toggleHeritage('normal')}
                                    />
                                    <CheckRow
                                        icon={badgeAbbey}
                                        label="Abbey"
                                        checked={heritageSet.has('abbey')}
                                        onClick={() => toggleHeritage('abbey')}
                                    />
                                    <CheckRow
                                        icon={badgeTrappist}
                                        label="Trappist"
                                        checked={heritageSet.has('trappist')}
                                        onClick={() => toggleHeritage('trappist')}
                                    />
                                </ul>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
