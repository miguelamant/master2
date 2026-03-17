import React from 'react';
import './CategoryGrid.css';
import { iconFor } from './ToAdd/utils/iconLoader';
import lockIcon from './Icons/lock.svg';
import { getFinal, subscribeScoreStore } from './ToAdd/ui/scoreStore';
import checkGreen from './Icons/check_green.svg';
import checkOrange from './Icons/check_orange.svg';
import cross from './Icons/not_check.svg';

const CATEGORIES = [
    { id: 'beers',        label: 'Bieren',      token: 'BEERS',      locked: false },
    { id: 'refreshments', label: 'Frisdrank+',  token: 'REFRESHMENTS', locked: false },
    { id: 'cocktails',    label: 'Cocktails',   token: 'COCKTAILS',  locked: true },
    { id: 'liquors',      label: 'Liquors',     token: 'LIQOURS',    locked: true },
    { id: 'wines',        label: 'Wines',       token: 'WINES',      locked: true },
    { id: 'hotdrinks',    label: 'Hot Drinks',  token: 'HOT_DRINKS', locked: true },
    { id: 'snacks',       label: 'Snacks',      token: 'SNACKS',     locked: true },
    { id: 'meals',        label: 'Meals',       token: 'MEALS',      locked: true },
];

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

export default function CategoryGrid({ onSelect }) {
    const forceRerender = React.useReducer(x => x + 1, 0)[1];
    React.useEffect(() => subscribeScoreStore(() => forceRerender()), []);

    const [search, setSearch] = React.useState('');

    const filtered = CATEGORIES.filter(({ label }) =>
        !search || label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="category-page">
            {/* ── left panel ── */}
            <div className="cg-left-panel">
                <div className="cg-left-title">Categories</div>
                <div className="cg-left-search">
                    <input
                        type="text"
                        placeholder="Search categories…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="cg-left-search-input"
                    />
                </div>
                <div className="cg-left-list">
                    {filtered.map(({ id, label, token, locked }) => {
                        const icon = iconFor(token);
                        let badgeSrc = null;
                        if (!locked) {
                            const { finished, sum, total } = getFinal(id);
                            if (finished) {
                                badgeSrc = badgeForTier(tierFromScore(sum, total));
                            }
                        }

                        return (
                            <div
                                key={id}
                                className={`cg-left-item${locked ? ' cg-left-item--locked' : ''}`}
                                onClick={() => !locked && onSelect(id)}
                                title={locked ? 'Locked' : label}
                            >
                                {icon && <img src={icon} alt="" className="cg-left-icon" />}
                                <span className="cg-left-label">{label}</span>
                                {badgeSrc && <img src={badgeSrc} alt="" className="cg-left-badge" />}
                                {locked && <img src={lockIcon} alt="" className="cg-left-lock" />}
                            </div>
                        );
                    })}
                </div>
                <div className="cg-left-footer">
                    <button
                        className="cg-left-logout"
                        onClick={() => window.location.assign('/')}
                    >
                        ⏻ Logout
                    </button>
                </div>
            </div>

            {/* ── main grid area ── */}
            <div className="category-grid-wrapper">
                <div className="category-grid-title">Kies een categorie</div>
                <div className="category-grid">
                    {CATEGORIES.map(({ id, label, token, locked }) => {
                        const icon = iconFor(token);
                        let badge = null;
                        if (!locked) {
                            const { finished, sum, total } = getFinal(id);
                            if (finished) {
                                const tier = tierFromScore(sum, total);
                                const badgeSrc = badgeForTier(tier);
                                if (badgeSrc) {
                                    badge = <img src={badgeSrc} alt="" className="card-badge" />;
                                }
                            }
                        }

                        return (
                            <div
                                key={id}
                                className={`category-card${locked ? ' locked' : ''}`}
                                onClick={() => !locked && onSelect(id)}
                                title={locked ? 'Locked' : label}
                            >
                                {badge}
                                {icon && <img src={icon} alt="" className="card-icon" />}
                                <span>{label}</span>
                                {locked && <img src={lockIcon} alt="" className="card-lock" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
