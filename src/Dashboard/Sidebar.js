// src/Dashboard/Sidebar.js
import React from 'react';
import './Sidebar.css';

import {
    getWillyMode,
    setWillyMode,
    subscribeUIPrefs,
} from './ToAdd/ui/uiPrefs';
import { resetAllScores } from './ToAdd/ui/scoreStore';

import chillyWilly from '../Images/presets/chilly-willy.png';
import sternWilly  from '../Images/presets/stern-willy.png';
import sleepyWilly from '../Images/presets/sleepy-willy.png';

const WILLY_IMGS = [chillyWilly, sternWilly, sleepyWilly];

const Sidebar = ({ selectedOption, onSelectionChange, onGoBack }) => {
    const [willyMode, setWillyModeState] = React.useState(getWillyMode());

    React.useEffect(() => subscribeUIPrefs((s) => setWillyModeState(s.willyMode)), []);

    const cycleWilly = () => {
        const next = (willyMode + 1) % 3;
        setWillyMode(next);
        resetAllScores();
    };

    return (
        <nav className="sidebar">
            <div className="sidebar-top">
                {selectedOption !== null && (
                    <button
                        className="sidebar-icon-btn back-btn"
                        onClick={onGoBack}
                        title="Terug"
                        aria-label="Terug naar categorieen"
                    >
                        &#8592;
                    </button>
                )}
                <button
                    className={`sidebar-icon-btn${selectedOption === 'edit-menu' ? ' active' : ''}`}
                    onClick={() => onSelectionChange('edit-menu')}
                    title="Assortiment"
                    aria-label="Assortiment"
                >
                    ☰
                </button>
            </div>

            <div className="sidebar-middle">
                <button
                    className="sidebar-icon-btn willy-btn"
                    onClick={cycleWilly}
                    title="Wissel Willy-modus"
                    aria-label="Wissel Willy-modus"
                >
                    <img src={WILLY_IMGS[willyMode]} alt="Willy" style={{ height: 44, width: 'auto' }} />
                </button>
            </div>

            <div className="sidebar-bottom">
                <button
                    className="sidebar-icon-btn"
                    onClick={() => window.location.assign('/regioverdeling2a')}
                    title="Clientele instellingen"
                    aria-label="Clientele instellingen"
                >
                    👤
                </button>
                <button
                    className="sidebar-icon-btn"
                    onClick={() => window.location.assign('/')}
                    title="Uitloggen"
                    aria-label="Uitloggen"
                >
                    ⏻
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;
