// server/routes/layers.routes.js
import { Router } from 'express';
import path from 'path';
import { getMergedMatrixForBusiness } from '../services/personaMatrix.service.js';

const router = Router();

/**
 * GET /api/layers-matrix
 * Requires an authenticated session (req.session.user.id)
 * Returns { version, layers, meta }
 */
router.get('/layers-matrix', async (req, res) => {
    try {
        const businessId = req?.session?.user?.id;
        if (!businessId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const PERSONA_DIR = path.resolve('src/Dashboard/ToAdd/engine/context_and_clientele');

        const payload = await getMergedMatrixForBusiness({
            businessId,
            rootDir: PERSONA_DIR,
        });

        return res.json({
            version: payload.version,
            layers: payload.layers,
            meta: payload.meta,
        });
    } catch (e) {
        console.error('[layers-matrix] failed:', e);
        return res.status(500).json({ error: 'Failed to build matrix' });
    }
});

export default router;
