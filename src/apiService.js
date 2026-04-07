// src/apiService.js
import axios from 'axios';

const baseURL =
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:3007");



export const api = axios.create({
    baseURL,
    withCredentials: true,
});

// make a stable cache key from filters
export const serializeKey = (filters = {}) =>
    Object.entries(filters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : String(v)}`)
        .join('&');

// counts per group (category/brand/type)
export async function menuCounts({
                                     groupBy = 'category',
                                     section,
                                     includeEmpty = false,
                                     within = {},
                                     filters = {},        // object flags (back-compat)
                                     predicates = [],     // array of { field, op, value }
                                     assortmentId,
                                 } = {}) {
    const { data } = await api.post('/api/menu-counts', {
        groupBy, section, includeEmpty, within, filters, predicates,
        ...(assortmentId != null && { assortmentId }),
    });
    return data;
}

// list of items (for modal/hover), paginated
export async function menuItems({
                                    filters = {},         // e.g. { category, subcategory, subsubcategory }
                                    within = {},          // e.g. { subcategory_in: ['ICE_TEA'] }
                                    predicates = [],      // e.g. [{ field:'is_zero', op:'eq', value:1 }]
                                    page = 1,
                                    pageSize = 100,
                                    orderBy = 'products.name',
                                    assortmentId,
                                    groupBy,
                                } = {}) {
    const { data } = await api.post('/api/menu-items', {
        filters, within, predicates, page, pageSize, orderBy,
        ...(assortmentId != null && { assortmentId }),
        ...(groupBy != null && { groupBy }),
    });
    return data; // { items, page, pageSize, appliedFilters }
}

// Menu config (digital twin layout)
export async function getMenuConfig(assortmentId) {
  const { data } = await api.get('/api/menu-config', { params: { assortmentId } });
  return data;
}

export async function updateMenuConfig(assortmentId, config) {
  const { data } = await api.put('/api/menu-config', { assortmentId, ...config });
  return data;
}

export async function updateMenuItemDetails(id, details) {
  const { data } = await api.patch(`/api/menu-items/${id}/details`, details);
  return data;
}

export async function updateMenuItemsLayout(updates) {
  const { data } = await api.patch('/api/menu-items/layout', { updates });
  return data;
}

// Digital Twin: extract format + items + styling from menu photos
export async function extractTwin(files) {
  const form = new FormData();
  for (const file of files) form.append('images', file);
  const { data } = await api.post('/api/scan/extract-twin', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 min — vision API can be slow
  });
  return data;
}
