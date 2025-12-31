import React from 'react';
import './WillySwitch.css';

import chillyWilly from '../../../Images/presets/chilly-willy.png';
import sternWilly  from '../../../Images/presets/stern-willy.png';
import sleepyWilly from '../../../Images/presets/sleepy-willy.png';

import {
    getWillyMode,
    setWillyMode,
    subscribeUIPrefs,
} from '../ui/uiPrefs';

import { resetAllScores } from '../ui/scoreStore';

const MODES = [
    { id: 0, name: 'chilly-willy', img: chillyWilly },
    { id: 1, name: 'stern-willy',  img: sternWilly },
    { id: 2, name: 'sleepy-willy', img: sleepyWilly },
];

export default function WillySwitch({ imageHeight = 100 }) {
    const [mode, setModeState] = React.useState(getWillyMode());

    React.useEffect(() => {
        return subscribeUIPrefs((s) => setModeState(s.willyMode));
    }, []);

    const go = (dir) => {
        const idx = MODES.findIndex((m) => m.id === mode);
        const nextIdx = (idx + dir + MODES.length) % MODES.length;
        const nextMode = MODES[nextIdx].id;
        setWillyMode(nextMode);
        resetAllScores(); // fully reset progress
    };

    const current = MODES.find((m) => m.id === mode) || MODES[0];

    return (
        <div className="willy-switch" style={{gap:8}}>
            <button
                type="button"
                className="willy-round-btn"
                onClick={() => go(-1)}
                aria-label="Previous Willy mode"
            >
                &lt;
            </button>

            <div style={{display:'grid', justifyItems:'center'}}>
                <img
                    src={current.img}
                    alt={current.name}
                    className="willy-image"
                    style={{ height: imageHeight, width: 'auto' }}
                />
                <div style={{marginTop:6, fontSize:12, color:'#111827'}}>{current.name}</div>
            </div>

            <button
                type="button"
                className="willy-round-btn"
                onClick={() => go(1)}
                aria-label="Next Willy mode"
            >
                &gt;
            </button>
        </div>
    );
}
