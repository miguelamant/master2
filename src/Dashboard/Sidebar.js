// src/Dashboard/Sidebar.js
import React from 'react';
import './Sidebar.css';
import lockIcon from './Icons/lock.svg';
import { iconFor } from './ToAdd/utils/iconLoader';
import WillySwitch from './ToAdd/components/WillySwitch';

import { getFinal, subscribeScoreStore } from './ToAdd/ui/scoreStore';
import checkGreen from './Icons/check_green.svg';
import checkOrange from './Icons/check_orange.svg';
import cross from './Icons/not_check.svg';

const beerIcon         = iconFor('BEERS');
const refreshmentsIcon = iconFor('REFRESHMENTS');
const wineIcon         = iconFor('WINES');
const liquorsIcon      = iconFor('LIQOURS');
const cocktailIcon     = iconFor('COCKTAILS');
const hotDrinksIcon    = iconFor('HOT_DRINKS');
const snackIcon        = iconFor('SNACKS');
const mealsIcon        = iconFor('MEALS');

function tierFromScore(sum, total) {
    if (total <= 0) return 'neutral';
    if (sum >= Math.max(9, total - 1)) return 'green';
    if (sum >= 6) return 'orange';
    return 'red';
}
function badgeForTier(t) {
    if (t === 'green')  return checkGreen;
    if (t === 'orange') return checkOrange;
    if (t === 'red')    return cross;
    return null;
}
function tintStyle(t) {
    if (t === 'green')  return { background:'rgba(16,185,129,0.12)', borderLeft:'3px solid #10b981' };
    if (t === 'orange') return { background:'rgba(245,158,11,0.12)', borderLeft:'3px solid #f59e0b' };
    if (t === 'red')    return { background:'rgba(239,68,68,0.12)', borderLeft:'3px solid #ef4444' };
    return {};
}

const Sidebar = ({ onSelectionChange, selectedOption }) => {
    const forceRerender = React.useReducer(x => x + 1, 0)[1];

    React.useEffect(() => subscribeScoreStore(() => forceRerender()), []);

    const computeTint = (cat) => {
        const { finished, sum, total } = getFinal(cat);
        if (!finished) return { tint: 'neutral', label: '' };
        const t = tierFromScore(sum, total);
        return { tint: t, label: `${Math.round(sum*10)/10} / ${total}` };
    };

    const beersTint = computeTint('beers');
    const sodasTint = computeTint('refreshments');

    const handleClick = (id, locked = false, e) => {
        if (locked) {
            e?.preventDefault?.(); e?.stopPropagation?.(); return;
        }
        onSelectionChange(id);
    };

    const handleLogout = () => window.location.assign('/');

    // NEW: navigate to onboarding/personas
    //const handleGetStarted = () => window.location.assign('/personas');
    const handleGetStarted = () => window.location.assign('/leeftijdsverdeling');

    const CornerBadge = ({ t }) => {
        const icon = badgeForTier(t);
        if (!icon || t === 'neutral') return null;
        return (
            <img
                src={icon}
                alt=""
                style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    zIndex: 2,
                }}
            />
        );
    };

    return (
        <nav className="sidebar">


            <ul className="sidebar-list">
                <li
                    className={`sidebar-list-item ${selectedOption === 'edit-menu' ? 'active' : ''}`}
                    onClick={(e) => handleClick('edit-menu', false, e)}
                >
                    Assortiment
                </li>
                {/*
                <li
                    className={`sidebar-list-item ${selectedOption === 'to-reprice' ? 'active' : ''}`}
                    onClick={(e) => handleClick('to-reprice', false, e)}
                >
                    To reprice
                </li>

                <li
                    className={`sidebar-list-item ${selectedOption === 'wrapped' ? 'active' : ''}`}
                    onClick={(e) => handleClick('wrapped', false, e)}
                >
                    Wrapped
                </li>

               Beers */}
                <li
                    className={`sidebar-list-item ${selectedOption === 'beers' ? 'active' : ''}`}
                    onClick={(e) => handleClick('beers', false, e)}
                    style={{position: 'relative', ...tintStyle(beersTint.tint)}}
                >
                    <CornerBadge t={beersTint.tint}/>
                    <span className="sidebar-item-content">
                        <img src={beerIcon} alt="" aria-hidden="true" className="sidebar-item-icon"/>
                        Bieren
                    </span>
                    {beersTint.label && (
                        <span style={{marginLeft: 'auto', fontSize: 12, fontWeight: 600}}>{beersTint.label}</span>
                    )}
                </li>

                {/* Refreshments */}
                <li
                    className={`sidebar-list-item ${selectedOption === 'refreshments' ? 'active' : ''}`}
                    onClick={(e) => handleClick('refreshments', false, e)}
                    style={{position: 'relative', ...tintStyle(sodasTint.tint)}}
                >
                    <CornerBadge t={sodasTint.tint}/>
                    <span className="sidebar-item-content">
                        <img src={refreshmentsIcon} alt="" aria-hidden="true" className="sidebar-item-icon"/>
                        Frisdrank+ {sodasTint.label && (
                        <span style={{marginLeft: 'auto', fontSize: 12, fontWeight: 600}}>{sodasTint.label}</span>
                    )}
                    </span>
                </li>

                {/* Locked items below */}
                <li className={`sidebar-list-item locked ${selectedOption === 'cocktails' ? 'active' : ''}`}
                    onClick={(e) => handleClick('cocktails', true, e)}
                    aria-disabled="true" tabIndex={-1} title="Locked">
                    <span className="sidebar-item-content">
                        <img src={cocktailIcon} alt="" aria-hidden="true" className="sidebar-item-icon"/>
                        Cocktails
                        <img src={lockIcon} alt="" aria-hidden="true" className="sidebar-item-lock"/>
                    </span>
                </li>

                <li className={`sidebar-list-item locked ${selectedOption === 'liquors' ? 'active' : ''}`}
                    onClick={(e) => handleClick('liquors', true, e)}
                    aria-disabled="true" tabIndex={-1} title="Locked">
                    <span className="sidebar-item-content">
                        <img src={liquorsIcon} alt="" aria-hidden="true" className="sidebar-item-icon"/>
                        Liquors
                        <img src={lockIcon} alt="" aria-hidden="true" className="sidebar-item-lock"/>
                    </span>
                </li>

                <li className={`sidebar-list-item locked ${selectedOption === 'wines' ? 'active' : ''}`}
                    onClick={(e) => handleClick('wines', true, e)}
                    aria-disabled="true" tabIndex={-1} title="Locked">
                    <span className="sidebar-item-content">
                        <img src={wineIcon} alt="" aria-hidden="true" className="sidebar-item-icon"/>
                        Wines
                        <img src={lockIcon} alt="" aria-hidden="true" className="sidebar-item-lock"/>
                    </span>
                </li>

                <li className={`sidebar-list-item locked ${selectedOption === 'hotdrinks' ? 'active' : ''}`}
                    onClick={(e) => handleClick('hotdrinks', true, e)}
                    aria-disabled="true" tabIndex={-1} title="Locked">
                    <span className="sidebar-item-content">
                        <img src={hotDrinksIcon} alt="" aria-hidden="true" className="sidebar-item-icon"/>
                        Hot Drinks
                        <img src={lockIcon} alt="" aria-hidden="true" className="sidebar-item-lock"/>
                    </span>
                </li>

                <li className={`sidebar-list-item locked ${selectedOption === 'snacks' ? 'active' : ''}`}
                    onClick={(e) => handleClick('snacks', true, e)}
                    aria-disabled="true" tabIndex={-1} title="Locked">
                    <span className="sidebar-item-content">
                        <img src={snackIcon} alt="" aria-hidden="true" className="sidebar-item-icon"/>
                        Snacks
                        <img src={lockIcon} alt="" aria-hidden="true" className="sidebar-item-lock"/>
                    </span>
                </li>

                <li className={`sidebar-list-item locked ${selectedOption === 'meals' ? 'active' : ''}`}
                    onClick={(e) => handleClick('meals', true, e)}
                    aria-disabled="true" tabIndex={-1} title="Locked">
                    <span className="sidebar-item-content">
                        <img src={mealsIcon} alt="" aria-hidden="true" className="sidebar-item-icon"/>
                        Meals
                        <img src={lockIcon} alt="" aria-hidden="true" className="sidebar-item-lock"/>
                    </span>
                </li>
            </ul>
            <div style={{display: 'flex', justifyContent: 'center', margin: '10px 0'}}>
                <WillySwitch imageHeight={100}/>
            </div>

            <div className="sidebar-footer">
                {/* NEW: Get Started button */}
                <button className="get-started-button" onClick={handleGetStarted}>
                    Unlock normal Willy
                </button>

                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
};

export default Sidebar;
