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

// GET current business persona weights
router.get('/business-personas', async (req, res, next) => {
    try {
        const businessId = req.session?.user?.id;
        if (!businessId) return res.status(401).json({ error: 'Not authenticated' });

        const { data, error } = await supabase
            .from('business_info')
            .select(COLUMNS.join(','))
            .eq('id', businessId)
            .maybeSingle();

        if (error) return res.status(500).json({ error: error.message });
        if (!data) return res.status(404).json({ error: 'Business not found' });

        res.json({ success: true, personas: data });
    } catch (e) { next(e); }
});

// POST update persona weights for current business
router.post('/business-personas', async (req, res, next) => {
    try {
        const businessId = req.session?.user?.id;
        if (!businessId) return res.status(401).json({ error: 'Not authenticated' });

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
            .from('business_info')
            .update(payload)
            .eq('id', businessId);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export default router;
