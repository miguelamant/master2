// src/Dashboard/ToAdd/components/SuggestedChanges.jsx
import React from 'react';

/**
 * props: { suggestions: [{ pair:{add,remove,k}, gain, breakdown }], onApplyPair? }
 * breakdown.byLayer is an object keyed by layer_id (string), e.g. { "L2101": 0.42, ... }.
 */
export default function SuggestedChanges({ suggestions = [], onApplyPair }) {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return (
            <div
                style={{
                    padding: '8px 12px',
                    border: '1px dashed #dcdfe4',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'black',
                    background: '#f8fafc'
                }}
            >
                No strong suggestions right now.
            </div>
        );
    }

    const safeNumber = (x, d = 2) => {
        const n = Number(x);
        return Number.isFinite(n) ? n.toFixed(d) : '0.00';
    };

    const renderLayerBreakdown = (title, byLayer = {}) => {
        const entries = Object.entries(byLayer);
        if (!entries.length) return null;
        return (
            <div>
                <div style={{ fontWeight: 600 }}>{title}</div>
                <div style={{ marginLeft: 8, opacity: 0.9 }}>
                    {entries.map(([layerId, val]) => (
                        <div key={layerId} style={{ fontFamily: 'monospace' }}>
                            {layerId}: {safeNumber(val, 3)}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'grid', gap: 8 }}>
            {suggestions.map((s, i) => {
                const pair = s?.pair || {};
                const add = pair.add || {};
                const remove = pair.remove || {};
                const k = pair.k ?? 1;

                return (
                    <div
                        key={i}
                        style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            padding: 10,
                            background: '#fff',
                            boxShadow: '0 1px 2px rgba(0,0,0,.04)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <strong>#{i + 1} Gain: {safeNumber(s?.gain)}</strong>
                            <span style={{ fontSize: 12, opacity: 0.8 }}>k={k}</span>
                        </div>

                        <div style={{ fontSize: 13 }}>
                            <div>➕ Add <b>{add.label ?? '—'}</b></div>
                            <div style={{ marginLeft: 14, opacity: 0.8 }}>
                                {add.id_subcategory != null && <>subcat {String(add.id_subcategory)} • </>}
                                {add.is_zero != null && <>zero {String(add.is_zero)} • </>}
                                {add.is_sparkling != null && <>spark {String(add.is_sparkling)}</>}
                            </div>

                            {remove && remove.label ? (
                                <>
                                    <div>➖ Remove <b>{remove.label}</b></div>
                                    <div style={{ marginLeft: 14, opacity: 0.8 }}>
                                        {remove.id_subcategory != null && <>subcat {String(remove.id_subcategory)} • </>}
                                        {remove.is_zero != null && <>zero {String(remove.is_zero)} • </>}
                                        {remove.is_sparkling != null && <>spark {String(remove.is_sparkling)}</>}
                                    </div>
                                </>
                            ) : (
                                <div style={{ marginTop: 4, opacity: 0.7, fontStyle: 'italic' }}>
                                    (Add-only suggestion)
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 6, fontSize: 12, color: 'black', display: 'grid', gap: 4 }}>
                            {renderLayerBreakdown('Breakdown (add):', s?.breakdown?.add?.byLayer)}
                            {renderLayerBreakdown('Breakdown (remove):', s?.breakdown?.remove?.byLayer)}
                        </div>

                        {onApplyPair && (
                            <div style={{ marginTop: 8 }}>
                                <button
                                    onClick={() => onApplyPair(s)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: 8,
                                        border: '1px solid #10b981',
                                        background: '#ecfdf5',
                                        color: 'black',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Apply this change
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
