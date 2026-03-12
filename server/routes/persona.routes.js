import { Router } from 'express';
import path from 'path';
import { supabase } from '../integrations/supabase.js';
import { rebuildMergedMatrixForBusiness } from '../services/personaMatrix.service.js';

const router = Router();

/**
 * POST /api/business-persona-weights
 * Body: { weights: { eco,budget,trendy,sport,local,luxury,traditionalist,healthy,average_joe,party } } (0..100)
 * Uses req.session.user.id to update the row in business_info.
 * Returns { ok:true, layers_matrix: {version,layers,meta} }
 */
router.post('/business-persona-weights', async (req, res) => {
    const businessId = req?.session?.user?.id;
    if (!businessId) return res.status(401).json({ error: 'Not authenticated' });

    // Resolve assortment ID (from body or default to first assortment)
    let assortmentId = req.body?.assortmentId ? Number(req.body.assortmentId) : null;
    if (!assortmentId) {
        const { data: aRow, error: aErr } = await supabase
            .from('assortments')
            .select('id')
            .eq('business_id', businessId)
            .order('sort_order', { ascending: true })
            .limit(1)
            .single();
        if (aErr || !aRow) return res.status(400).json({ error: 'No assortment found' });
        assortmentId = aRow.id;
    }

    const w = req.body?.weights || {};
    const cleaned = {
        eco: Number(w.eco) || 0,
        budget: Number(w.budget) || 0,
        trendy: Number(w.trendy) || 0,
        sport: Number(w.sport) || 0,
        local: Number(w.local) || 0,
        luxury: Number(w.luxury) || 0,
        traditional: Number(w.traditional) || 0,
        healthy: Number(w.healthy) || 0,
        average: Number(w.average) || 0,
        party: Number(w.party) || 0,
    };

    // Clamp 0..100
    for (const k of Object.keys(cleaned)) {
        cleaned[k] = Math.max(0, Math.min(100, cleaned[k]));
    }

    // Update the assortment row
    const { error } = await supabase
        .from('assortments')
        .update(cleaned)
        .eq('id', assortmentId)
        .eq('business_id', businessId); // safety: ensure this assortment belongs to the business

    if (error) {
        console.error('[persona-weights] update failed:', error);
        return res.status(500).json({ error: 'Update failed' });
    }

    // Rebuild the matrix so the client can use it immediately
    try {
        const PERSONA_DIR = path.resolve('src/Dashboard/ToAdd/engine/context_and_clientele');
        const payload = await rebuildMergedMatrixForBusiness({
            businessId,
            assortmentId,
            rootDir: PERSONA_DIR,
        });
        return res.json({
            ok: true,
            layers_matrix: {
                version: payload.version,
                layers: payload.layers,
                meta: payload.meta,
            },
        });
    } catch (e) {
        console.error('[persona-weights] rebuild failed:', e);
        return res.json({ ok: true });
    }
});

export default router;
