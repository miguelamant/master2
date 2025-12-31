// src/Dashboard/ToAdd/mergedLayersClient.js
import { api } from '../../../apiService';

/**
 * Fetch the per-business merged layers matrix from the server.
 * Uses the shared axios instance (baseURL=http://localhost:3007, withCredentials=true).
 * Returns { version, layers, meta } or throws on HTTP errors.
 */
export async function fetchMergedLayers() {
    const { data } = await api.get('/api/layers-matrix');

    if (data && Array.isArray(data.layers)) {
        return data; // { version, layers, meta }
    }
    // normalize null-ish / unexpected shapes
    return null;
}
