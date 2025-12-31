import path from 'path';
import { getMergedMatrixForBusiness, rebuildMergedMatrixForBusiness } from '../services/personaMatrix.service.js';

const PERSONA_DIR = path.resolve('src/Dashboard/ToAdd/engine/context_and_clientele');

export async function getLayersMatrix(req, res) {
    const businessId = req.session?.user?.id;
    if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const merged = await getMergedMatrixForBusiness({
            businessId,
            rootDir: PERSONA_DIR,
        });
        res.json(merged);
    } catch (e) {
        console.error('[layers] getLayersMatrix failed:', e);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function rebuildLayersMatrix(req, res) {
    const businessId = req.session?.user?.id;
    if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const merged = await rebuildMergedMatrixForBusiness({
            businessId,
            rootDir: PERSONA_DIR,
        });
        res.json(merged);
    } catch (e) {
        console.error('[layers] rebuildLayersMatrix failed:', e);
        res.status(500).json({ error: 'Server error' });
    }
}
