import { useState, useEffect, useCallback } from 'react';
import { getMenuConfig, updateMenuConfig } from 'apiService';

export function useMenuConfig(assortmentId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assortmentId) return;
    let cancelled = false;
    setLoading(true);

    getMenuConfig(assortmentId)
      .then(data => { if (!cancelled) setConfig(data); })
      .catch(err => console.error('[useMenuConfig]', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [assortmentId]);

  const update = useCallback(async (patch) => {
    if (!assortmentId) return;
    const updated = await updateMenuConfig(assortmentId, patch);
    setConfig(updated);
    return updated;
  }, [assortmentId]);

  return { config, loading, update };
}
