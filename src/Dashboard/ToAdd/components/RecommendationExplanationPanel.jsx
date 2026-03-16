import React, { useEffect, useState } from 'react';
import { api } from '../../../apiService';

export default function RecommendationExplanationPanel({ rec, personaWeights = {} }) {
    const [text, setText] = useState(null);
    const [loading, setLoading] = useState(false);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (!rec) return;
        setFlash(true);
        setTimeout(() => setFlash(false), 600);

        let alive = true;
        setText(null);
        setLoading(true);
        api.post('/api/explain-recommendation', {
            label: rec.displayLabel,
            delta: rec.delta,
            actual: rec.actual,
            recommended: rec.recommended,
            bucketBenchmarks: rec.bucketBenchmarks,
            personaWeights,
            pairedRec: rec.pairedRec ?? null,
        }).then(({ data }) => {
            if (alive) { setText(data.text); setLoading(false); }
        }).catch(() => {
            if (alive) { setText('Explanation unavailable.'); setLoading(false); }
        });
        return () => { alive = false; };
    }, [rec]);

    const containerStyle = {
        marginTop: 8,
        padding: '10px 12px',
        borderRadius: 10,
        fontSize: 15,
        minHeight: 44,
        transition: 'background 0.4s, border-color 0.4s',
        background: flash ? 'rgba(254,249,195,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${flash ? 'rgba(253,230,138,0.4)' : 'rgba(255,255,255,0.08)'}`,
        color: 'inherit',
    };

    if (!rec) return (
        <div style={containerStyle}>
            <span style={{ opacity: 0.4, fontStyle: 'italic' }}>Click any → recommendation to see why it helps.</span>
        </div>
    );

    const actionWord = rec.delta > 0 ? `Add ${rec.delta}` : `Remove ${Math.abs(rec.delta)}`;

    return (
        <div style={containerStyle}>
            <div style={{ fontWeight: 700, fontSize: 14, opacity: 0.6, marginBottom: 4 }}>
                {actionWord} {rec.displayLabel} ({rec.actual} → {rec.recommended})
            </div>
            {loading
                ? <span style={{ opacity: 0.45 }}>Loading…</span>
                : <span style={{ lineHeight: 1.5 }}>{text}</span>
            }
        </div>
    );
}
