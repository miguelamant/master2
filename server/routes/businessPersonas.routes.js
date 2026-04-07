import { Router } from 'express';
import { supabase } from '../integrations/supabase.js';

const router = Router();

/**
 * Columns we persist in business_info (0..100 integers).
 * You said 'default' was renamed to 'party'.
 */
const COLUMNS = [
    'party', 'budget', 'trendy', 'eco', 'sport', 'local',
    'luxury', 'traditional', 'healthy', 'average'
];

async function resolveAssortmentId(req) {
    const userId = req.session?.user?.id;
    const raw = req.body?.assortmentId ?? req.query?.assortmentId;
    if (raw != null) return Number(raw);
    const { data, error } = await supabase
        .from('user_venues')
        .select('assortment_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
    if (error || !data) throw new Error('No assortment found');
    return data.assortment_id;
}

// GET current business persona weights
router.get('/business-personas', async (req, res, next) => {
    try {
        const businessId = req.session?.user?.id;
        if (!businessId) return res.status(401).json({ error: 'Not authenticated' });

        let assortmentId;
        try { assortmentId = await resolveAssortmentId(req); } catch (e) {
            return res.status(400).json({ error: e.message });
        }

        const { data, error } = await supabase
            .from('assortments')
            .select(COLUMNS.join(','))
            .eq('id', assortmentId)
            .eq('business_id', businessId)
            .maybeSingle();

        if (error) return res.status(500).json({ error: error.message });
        if (!data) return res.status(404).json({ error: 'Assortment not found' });

        res.json({ success: true, personas: data });
    } catch (e) { next(e); }
});

// POST update persona weights for current business
router.post('/business-personas', async (req, res, next) => {
    try {
        const businessId = req.session?.user?.id;
        if (!businessId) return res.status(401).json({ error: 'Not authenticated' });

        let assortmentId;
        try { assortmentId = await resolveAssortmentId(req); } catch (e) {
            return res.status(400).json({ error: e.message });
        }

        // Accept partial updates, clamp 0..100, coerce to int.
        const payload = {};
        for (const c of COLUMNS) {
            if (c in req.body) {
                let v = Number(req.body[c]);
                if (!Number.isFinite(v)) v = 0;
                v = Math.max(0, Math.min(100, Math.round(v)));
                payload[c] = v;
            }
        }
        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { error } = await supabase
            .from('assortments')
            .update(payload)
            .eq('id', assortmentId)
            .eq('business_id', businessId);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export default router;
