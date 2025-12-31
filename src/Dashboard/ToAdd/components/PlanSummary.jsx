// src/Dashboard/ToAdd/components/PlanSummary.jsx
import React from 'react';

function Tag({ children }) {
    return (
        <span
            style={{
                display: 'inline-block',
                padding: '1px 6px',
                border: '1px solid #e2e8f0',
                borderRadius: 999,
                fontSize: 11,
                lineHeight: '16px',
                marginLeft: 6,
                color: '#0f172a',
                background: '#f8fafc'
            }}
        >
      {children}
    </span>
    );
}

function GroupLine({ r }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong style={{ color: '#0f172a' }}>{r.label}</strong>
                {r.subcategory && <Tag>{r.subcategory}</Tag>}
                {r.subsubcategory && <Tag>{r.subsubcategory}</Tag>}
                {r.is_zero === 0 || r.is_zero === 1 ? <Tag>{r.is_zero ? 'Zero' : 'With sugar'}</Tag> : null}
                {r.is_sparkling === 0 || r.is_sparkling === 1 ? <Tag>{r.is_sparkling ? 'Sparkling' : 'Still'}</Tag> : null}
            </div>
            <div style={{ fontFamily: 'monospace' }}>
                {r.delta > 0 ? `+${r.delta}` : r.delta}
            </div>
        </div>
    );
}

/**
 * props:
 *  - adds:    array of {label, delta>0, ...}
 *  - removes: array of {label, delta<0, ...}
 */
export default function PlanSummary({ adds = [], removes = [] }) {
    const hasAny = adds.length || removes.length;
    if (!hasAny) {
        return (
            <div style={{
                padding: '8px 12px',
                border: '1px dashed #dcdfe4',
                borderRadius: 8,
                fontSize: 13,
                color: 'black',
                background: '#f8fafc'
            }}>
                No net changes above threshold.
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            {adds.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, background: '#fff' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#065f46' }}>Add to these item-groups</div>
                    {adds.map(r => <GroupLine key={`add-${r.id}`} r={r} />)}
                </div>
            )}

            {removes.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, background: '#fff' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#7c2d12' }}>Remove from these item-groups</div>
                    {removes.map(r => <GroupLine key={`rem-${r.id}`} r={r} />)}
                </div>
            )}
        </div>
    );
}
