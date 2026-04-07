// src/Onboarding/ClienteleAnalysis.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './layoutOnboarding';
import './ClienteleAnalysis.css';
import { api } from '../apiService'; // ✅ fixed: one level up, not ../../
import { useOnboarding } from './OnboardingContext';

import Budgetbewust from '../profielen/Budgetbewust.png';
import Fijnproever from '../profielen/Fijn-proever.png';
import Gezondheidsbewuste from '../profielen/Gezondheidsbewuste.png';
import LocalLover from '../profielen/Local-Lover.png';
import Luxezoeker from '../profielen/Luxezoeker.png';
import Milieubewuste from '../profielen/Milieubewuste.png';
import Traditionalist from '../profielen/Traditionalist.png';
import Trendvolger from '../profielen/Trendvolger.png';

// Reuse existing images for these two
const SporterImg = Milieubewuste;
const FeestbeestImg = Luxezoeker;

// UI persona name -> DB column (null means local-only, not persisted)
const COLUMN_BY_PERSONA = {
    'Traditionalist': 'traditional',
    'Local-Lover': 'local',
    'Trendvolger': 'trendy',
    'Budgetbewust': 'budget',
    'Fijn-Proever': 'average',           // no DB column
    'Gezondheidsbewuste': 'healthy',
    'Milieubewuste': 'eco',
    'Luxezoeker': 'luxury',
    'Sporter': 'sport',
    'Feestbeest': 'party',
};

const personas = [
    { name: 'Traditionalist', image: Traditionalist },
    { name: 'Local-Lover', image: LocalLover },
    { name: 'Trendvolger', image: Trendvolger },
    { name: 'Budgetbewust', image: Budgetbewust },
    { name: 'Fijn-Proever', image: Fijnproever }, // local-only
    { name: 'Gezondheidsbewuste', image: Gezondheidsbewuste },
    { name: 'Milieubewuste', image: Milieubewuste },
    { name: 'Luxezoeker', image: Luxezoeker },
    { name: 'Sporter', image: SporterImg },
    { name: 'Feestbeest', image: FeestbeestImg },
];

export default function ClienteleAnalysis() {
    const navigate = useNavigate();
    const { onboardingData, updateOnboardingData } = useOnboarding();

    const [percentages, setPercentages] = useState(() => {
        const base = personas.reduce((acc, p) => { acc[p.name] = 0; return acc; }, {});
        const fromCtx = onboardingData?.personaDistribution || {};
        return { ...base, ...fromCtx };
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Prefill sliders from DB on mount
    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await api.get('/api/business-personas'); // server route we added
                if (!alive) return;
                if (data?.success && data?.personas) {
                    const next = { ...percentages };
                    for (const [uiName, col] of Object.entries(COLUMN_BY_PERSONA)) {
                        if (!col) continue;
                        const v = Number(data.personas[col]);
                        if (Number.isFinite(v)) next[uiName] = Math.max(0, Math.min(100, Math.round(v)));
                    }
                    setPercentages(next);
                    updateOnboardingData('personaDistribution', next);
                }
            } catch (e) {
                console.warn('[ClienteleAnalysis] load personas failed:', e);
                setError('Kon gegevens niet laden');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSliderChange = (name, value) => {
        setPercentages(prev => ({
            ...prev,
            [name]: Math.max(0, Math.min(100, Number(value)))
        }));
    };

    // Prepare POST payload for DB columns only
    const payloadForDB = useMemo(() => {
        const out = {};
        for (const [uiName, col] of Object.entries(COLUMN_BY_PERSONA)) {
            if (!col) continue;
            out[col] = Math.round(percentages[uiName] || 0);
        }
        return out;
    }, [percentages]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            updateOnboardingData('personaDistribution', percentages);
            const { data } = await api.post('/api/business-personas', payloadForDB);
            if (!data?.success) throw new Error('Save failed');
            navigate('/optimize-assortment');
        } catch (e) {
            console.error(e);
            setError('Opslaan mislukt');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="Clientele analyse" progress={90}>
            <div className="clientele-analysis-container">
                <p className="clientele-analysis-subtitle">
                    Gebruik de schuifregelaars onder elke profielcategorie om het percentage klanten per profiel aan te passen.
                </p>

                {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

                {loading ? (
                    <div>Gegevens laden…</div>
                ) : (
                    <div className="clientele-grid">
                        {personas.map((persona) => {
                            const v = percentages[persona.name] ?? 0;
                            return (
                                <div key={persona.name} className="clientele-persona-row">
                                    <div className="clientele-persona-info">
                                        <img src={persona.image} alt={persona.name} className="clientele-persona-image" />
                                        <span className="clientele-persona-label">{persona.name}</span>
                                    </div>

                                    {/* Plain % text (no bg/border) */}
                                    <div className="clientele-percent-inline">{v}%</div>

                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={v}
                                        className="clientele-slider-horizontal clean"
                                        onChange={(e) => handleSliderChange(persona.name, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="start-button-container">
                    <button className="start-button" onClick={handleSave} disabled={saving}>
                        {saving ? 'Opslaan…' : 'Opslaan'}
                    </button>
                </div>
            </div>
        </Layout>
    );
}
