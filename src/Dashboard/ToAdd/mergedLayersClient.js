// src/Dashboard/ToAdd/mergedLayersClient.js
import { api } from '../../apiService';
import FALLBACK from './engine/layers.all.matrix.v1.json';

/**
 * Fetch the merged matrix:
 * 1) Use sessionStorage cache if present (set at login)
 * 2) Try the API (/api/layers-matrix) via axios instance (baseURL :3007)
 * 3) Fallback to the bundled JSON
 */
export async function fetchMergedLayers() {
    // 1) session cache from login route
    const cached = sessionStorage.getItem('layersMatrix');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed.layers)) {
                return parsed;
            }
        } catch { /* ignore */ }
    }

    // 2) API via axios instance (baseURL set in apiService.js)
    try {
        const { data } = await api.get('/api/layers-matrix'); // <-- NOT :3000
        if (data && Array.isArray(data.layers)) {
            sessionStorage.setItem('layersMatrix', JSON.stringify(data));
            return data;
        }
    } catch (e) {
        console.warn('[layers-matrix] request failed, using fallback:', e);
    }

    // 3) Fallback to bundled
    return FALLBACK;
}

export function clearMergedLayersCache() {
    sessionStorage.removeItem('layersMatrix');
}
