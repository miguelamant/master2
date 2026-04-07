import { supabase } from '../integrations/supabase.js';

/**
 * Resolve assortment ID from request params/body, or fall back to user's first linked venue.
 */
export async function resolveAssortmentId(req) {
  const raw = req.body?.assortmentId ?? req.query?.assortmentId;
  if (raw != null) return Number(raw);

  const userId = req.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_venues')
    .select('assortment_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) throw new Error('No assortment found for user');
  return data.assortment_id;
}

/**
 * Get the business_id for the current user's first linked assortment.
 * Used for backward-compat with routes that need business_id.
 */
export async function resolveBusinessId(req) {
  const assortmentId = await resolveAssortmentId(req);
  const { data } = await supabase
    .from('assortments')
    .select('business_id')
    .eq('id', assortmentId)
    .maybeSingle();
  if (!data) throw new Error('No business found');
  return data.business_id;
}
