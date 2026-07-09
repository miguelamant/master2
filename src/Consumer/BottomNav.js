import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const DiscoverIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </svg>
);

const SearchIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

const ScanIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8V6a2 2 0 0 1 2-2h2" />
        <path d="M4 16v2a2 2 0 0 0 2 2h2" />
        <path d="M20 8V6a2 2 0 0 0-2-2h-2" />
        <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
        <path d="M4 12h16" strokeWidth="2.2" />
    </svg>
);

const GamesIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="11" rx="4" />
        <path d="M7 10.5v4M5 12.5h4" />
        <circle cx="16" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="18.5" cy="13" r="0.9" fill="currentColor" stroke="none" />
    </svg>
);

const NAV_ITEMS = [
    { to: '/consumer/discover', label: 'Discover', icon: DiscoverIcon },
    { to: '/consumer/search', label: 'Search', icon: SearchIcon },
    { to: '/consumer/scan', label: 'Scan', icon: ScanIcon, primary: true },
    { to: '/consumer/games', label: 'Games', icon: GamesIcon },
];

const BottomNav = () => (
    <nav className="bn-root">
        {NAV_ITEMS.map(({ to, label, icon: Icon, primary }) => (
            <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                    `bn-item${primary ? ' bn-item-primary' : ''}${isActive ? ' bn-item-active' : ''}`
                }
            >
                <span className="bn-icon"><Icon /></span>
                {!primary && <span className="bn-label">{label}</span>}
            </NavLink>
        ))}
    </nav>
);

export default BottomNav;
