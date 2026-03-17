import React from 'react';
import { getProgress, getFinal, subscribeScoreStore, getPackOrder, resetAllScores } from '../ui/scoreStore';
import {
    getWillyMode, setWillyMode,
    getWillyEnabled, setWillyEnabled,
    subscribeUIPrefs,
} from '../ui/uiPrefs';
import checkGreen from '../../Icons/check_green.svg';
import checkOrange from '../../Icons/check_orange.svg';
import cross from '../../Icons/not_check.svg';
import octopusIcon from '../../Icons/octopus.svg';

function Mark({ v, size = 14 }) {
    const img = v === 1 ? checkGreen : v === 0.5 ? checkOrange : cross;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={img} alt="" style={{ width: size, height: size }} />
        </span>
    );
}
function GreyDot({ size = 10 }) {
    return <span style={{
        width: size, height: size, borderRadius: '50%', display: 'inline-block',
        background: '#4b5563', border: '1px solid #6b7280',
    }} />;
}

function scoreColor(score) {
    if (score === null || score === undefined) return '#9ca3af';
    if (score >= 0.75) return '#22c55e';
    if (score >= 0.45) return '#f97316';
    return '#ef4444';
}

const navBtnBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: '9px 18px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    whiteSpace: 'nowrap',
    letterSpacing: '0.03em',
    transition: 'all 0.15s',
};
const goBackBtnStyle = {
    ...navBtnBase,
    background: 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.06) 100%)',
    border: '1px solid rgba(59,130,246,0.2)',
    color: '#3b82f6',
    boxShadow: '0 1px 4px rgba(59,130,246,0.1)',
};
const viewMenuBtnStyle = {
    ...navBtnBase,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: 'var(--text-primary)',
};

export default function KPIHeader({
                                      personaInfo,
                                      headerKPI,
                                      onPrev,
                                      onNext,
                                      onJumpPreset,
                                      presetCount = 0,
                                      activeCategory,
                                      currentPreset,
                                      presetIndex = 0,
                                      onGoBack,
                                      onViewMenu,
                                      allAssortments = [],
                                      assortmentScores = {},
                                      willyOffIds = new Set(),
                                      presetLoading = false,
                                      swapIndex = 0,
                                      swapCount = 0,
                                  }) {
    const [, force] = React.useState(0);
    React.useEffect(() => subscribeScoreStore(() => force(x => x + 1)), []);

    const [willyMode, setWillyModeLocal] = React.useState(getWillyMode());
    const [willyOn, setWillyOnLocal] = React.useState(getWillyEnabled());
    React.useEffect(() => subscribeUIPrefs((s) => {
        setWillyModeLocal(s.willyMode);
        setWillyOnLocal(s.willyEnabled);
    }), []);

    const presetForcesOff = currentPreset?.willyOff === true;
    const effectiveOn = willyOn && !presetForcesOff;

    const { earned, denom } = getProgress(activeCategory);
    const { ids: packIds, visited: packVisited } = getPackOrder(activeCategory);

    const scorePercent = denom > 0 ? Math.round((earned / denom) * 100) : 0;
    const scoreCol = scorePercent >= 75 ? '#34d399' : scorePercent >= 45 ? '#fbbf24' : '#f87171';

    const arrowBtnStyle = {
        width: 56, height: 56, borderRadius: 16,
        border: '1.5px solid rgba(59,130,246,0.35)',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.10) 100%)',
        color: '#3b82f6',
        cursor: 'pointer',
        fontSize: 28, fontWeight: 800, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s ease',
        flexShrink: 0,
        boxShadow: '0 3px 14px rgba(59,130,246,0.18)',
        animation: 'preset-arrow-glow 2.5s ease-in-out infinite',
    };

    return (
        <div
            className="section-header"
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 16,
                alignItems: 'center',
                marginBottom: 0,
                paddingBottom: 0,
                borderBottom: 'none',
            }}
        >
            {/* LEFT: navigation buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                {onGoBack && (
                    <button onClick={onGoBack} style={goBackBtnStyle}>
                        <span style={{ fontSize: 15, lineHeight: 1 }}>←</span>
                        <span>All stores</span>
                    </button>
                )}
                {onViewMenu && (
                    <button onClick={onViewMenu} style={viewMenuBtnStyle}>
                        <span>See assortment</span>
                        <span style={{ fontSize: 15, lineHeight: 1 }}>→</span>
                    </button>
                )}
            </div>

            {/* CENTER: ‹ [preset track + score] › */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                justifyContent: 'center',
            }}>
                {/* Prev arrow */}
                <button onClick={onPrev} aria-label="Previous" style={arrowBtnStyle}>‹</button>

                {/* Preset track + category score */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {/* Preset dots — clickable */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {packIds.map((id, idx) => {
                            const strId = String(id);
                            const isCurrent = idx === presetIndex;
                            const score = packVisited[strId];
                            const presetWillyOff = willyOffIds.has(strId);

                            return (
                                <div
                                    key={strId}
                                    onClick={() => onJumpPreset?.(idx)}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', gap: 2,
                                        transition: 'transform 0.15s',
                                        transform: isCurrent ? 'scale(1)' : 'scale(0.85)',
                                    }}
                                    title={`View ${idx + 1}`}
                                >
                                    {isCurrent ? (
                                        /* Current preset: octopus icon */
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <img src={octopusIcon} alt="" style={{ width: 18, height: 18, opacity: 0.9 }} />
                                        </div>
                                    ) : (
                                        /* Other presets: score mark or grey dot */
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {willyOn && !presetWillyOff && score != null
                                                ? <Mark v={score} size={13} />
                                                : <GreyDot size={8} />
                                            }
                                        </div>
                                    )}

                                    {/* Swap progress pips under current preset */}
                                    {isCurrent && effectiveOn && swapCount > 0 && (
                                        <div style={{ display: 'flex', gap: 2, height: 4 }}>
                                            {Array.from({ length: Math.min(swapCount, 8) }, (_, si) => (
                                                <span key={si} style={{
                                                    width: si === swapIndex ? 10 : 4,
                                                    height: 4,
                                                    borderRadius: 2,
                                                    background: si === swapIndex
                                                        ? '#3b82f6'
                                                        : si < swapIndex
                                                            ? 'rgba(59,130,246,0.35)'
                                                            : 'rgba(255,255,255,0.15)',
                                                    transition: 'width 0.2s, background 0.2s',
                                                }} />
                                            ))}
                                            {swapCount > 8 && (
                                                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', lineHeight: '4px' }}>+</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Category score */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', opacity: 0.4,
                        }}>Score</span>
                        <span style={{
                            fontSize: 20, fontWeight: 900,
                            fontFamily: "'Space Grotesk', sans-serif",
                            color: (effectiveOn && !presetLoading) ? scoreCol : '#6b7280',
                        }}>
                            {(effectiveOn && !presetLoading) ? Math.round(earned * 10) / 10 : '—'}
                        </span>
                        <span style={{ fontSize: 12, opacity: 0.35, fontWeight: 600 }}>/{denom}</span>
                    </div>
                </div>

                {/* Next arrow */}
                <button onClick={onNext} aria-label="Next" style={arrowBtnStyle}>›</button>
            </div>

            {/* RIGHT: willy toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {/* Icon + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <img src={octopusIcon} alt="" style={{ width: 18, height: 18, opacity: effectiveOn ? 0.7 : 0.3 }} />
                    <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em', opacity: 0.45,
                        fontFamily: "'Space Grotesk', sans-serif",
                    }}>Willy austerity mode</span>
                </div>

                {/* On/Off toggle + Chill / Normal / Stern pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={() => { if (!presetForcesOff) setWillyEnabled(!willyOn); }}
                        disabled={presetForcesOff}
                        style={{
                            position: 'relative',
                            width: 36, height: 20, borderRadius: 10,
                            border: 'none', cursor: presetForcesOff ? 'not-allowed' : 'pointer',
                            background: effectiveOn ? '#111827' : '#d1d5db',
                            transition: 'background 0.2s',
                            opacity: presetForcesOff ? 0.35 : 1,
                            flexShrink: 0,
                        }}
                        title={presetForcesOff ? 'Willy disabled for this view' : (willyOn ? 'Turn Willy off' : 'Turn Willy on')}
                    >
                        <span style={{
                            position: 'absolute',
                            top: 2, left: effectiveOn ? 18 : 2,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            transition: 'left 0.2s',
                        }} />
                    </button>

                    <div style={{
                        display: 'flex', gap: 2, padding: 2,
                        borderRadius: 8, background: '#f3f4f6',
                        border: '1px solid rgba(0,0,0,0.05)',
                        opacity: effectiveOn ? 1 : 0.35,
                        pointerEvents: effectiveOn ? 'auto' : 'none',
                    }}>
                        {[
                            { label: 'Chill', idx: 0 },
                            { label: 'Normal', idx: 1 },
                            { label: 'Stern', idx: 2 },
                        ].map(({ label, idx }) => (
                            <button
                                key={label}
                                onClick={() => { setWillyMode(idx); resetAllScores(); }}
                                style={{
                                    padding: '4px 10px', borderRadius: 6,
                                    border: '1px solid transparent',
                                    background: idx === willyMode ? '#111827' : 'transparent',
                                    color: idx === willyMode ? '#ffffff' : '#9ca3af',
                                    fontSize: 10, fontWeight: 700,
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
