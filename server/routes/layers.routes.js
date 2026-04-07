// server/routes/layers.routes.js
import { Router } from 'express';
import path from 'path';
import { getMergedMatrixForBusiness } from '../services/personaMatrix.service.js';
import { supabase } from '../integrations/supabase.js';

const router = Router();

/**
 * GET /api/layers-matrix
 * Requires an authenticated session (req.session.user.id)
 * Returns { version, layers, meta }
 */
router.get('/layers-matrix', async (req, res) => {
    try {
        const userId = req?.session?.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Resolve business_id from user's first linked venue
        let businessId = req.session.user.business_id;
        if (!businessId) {
            const { data: link } = await supabase.from('user_venues').select('assortment_id').eq('user_id', userId).limit(1).maybeSingle();
            if (link) {
                const { data: assort } = await supabase.from('assortments').select('business_id').eq('id', link.assortment_id).maybeSingle();
                businessId = assort?.business_id;
            }
        }
        if (!businessId) {
            return res.json({ version: 0, layers: [], meta: {} });
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
