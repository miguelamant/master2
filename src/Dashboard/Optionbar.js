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

function Chip({ icon, label, active, onClick }) {
    return (
        <li
            className={`option-chip${active ? ' active' : ''}`}
            onClick={onClick}
            role="checkbox"
            aria-checked={active}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        >
            {icon && (
                <img src={icon} alt="" aria-hidden="true" className="option-chip-icon" />
            )}
            <span>{label}</span>
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
                            <ul className="optionbar-list">
                                {tasteOptions.map(opt => (
                                    <Chip
                                        key={opt.id}
                                        icon={opt.icon}
                                        label={opt.label}
                                        active={tastesSet.has(opt.id)}
                                        onClick={() => toggleTaste(opt.id)}
                                    />
                                ))}
                            </ul>
                        </section>

                        <hr className="optionbar-divider" />

                        {/* ZERO */}
                        <section className="optionbar-group">
                            <h4 className="optionbar-group-title">Zero</h4>
                            <ul className="optionbar-list">
                                <Chip
                                    icon={badgeZero}
                                    label="Zero"
                                    active={!!sugar.zero_sugar}
                                    onClick={() => toggleSugar('zero_sugar')}
                                />
                                <Chip
                                    icon={badgeNotZero}
                                    label="Not zero"
                                    active={!!sugar.with_sugar}
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
                                    <ul className="optionbar-list">
                                        <Chip
                                            icon={badgeSparkling}
                                            label="Sparkling"
                                            active={!!sparkling.sparkling}
                                            onClick={() => toggleSparkling('sparkling')}
                                        />
                                        <Chip
                                            icon={badgeStill}
                                            label="Not sparkling"
                                            active={!!sparkling.not_sparkling}
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
                                <ul className="optionbar-list">
                                    <Chip
                                        icon={badgeNormal}
                                        label="Normal"
                                        active={heritageSet.has('normal')}
                                        onClick={() => toggleHeritage('normal')}
                                    />
                                    <Chip
                                        icon={badgeAbbey}
                                        label="Abbey"
                                        active={heritageSet.has('abbey')}
                                        onClick={() => toggleHeritage('abbey')}
                                    />
                                    <Chip
                                        icon={badgeTrappist}
                                        label="Trappist"
                                        active={heritageSet.has('trappist')}
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
