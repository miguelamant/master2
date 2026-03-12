import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabase } from '../integrations/supabase.js';

const CACHE = new Map(); // businessId -> { etag, layers, version, updatedAt, weights }

// --- utilities ---------------------------------------------------------------
function deepClone(x) {
    return JSON.parse(JSON.stringify(x));
}

/** Read persona JSON (e.g., SPORT.json) from rootDir */
function readPersonaFile(rootDir, name) {
    const p = path.resolve(rootDir, `${name}.json`);
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('[personaMatrix] invalid JSON:', p, e.message);
        return null;
    }
}

/** Compute stable hash for weights */
function hashWeights(weights) {
    const json = JSON.stringify(weights, Object.keys(weights).sort());
    return crypto.createHash('sha1').update(json).digest('hex');
}

/** Map DB row → persona weights (normalized later) */
function mapDbRowToPersonaWeights(row) {
    return {
        PARTY:        Number(row?.party ?? 0),
        BUDGET:       Number(row?.budget ?? 0),
        TRENDY:       Number(row?.trendy ?? 0),
        ECO:          Number(row?.eco ?? 0),
        SPORT:        Number(row?.sport ?? 0),
        LOCAL:        Number(row?.local ?? 0),
        LUXURY:       Number(row?.luxury ?? 0),
        TRADITIONAL:  Number(row?.traditional ?? 0),
        HEALTHY:      Number(row?.healthy ?? 0),
        AVERAGE:      Number(row?.average ?? 0),
    };
}

/** For a persona object, find the MB array for a given layer+bucket/cell key. */
function findBucketMB(personaObj, layer, key) {
    if (!personaObj || !layer) return null;
    if (layer.type === '1D') {
        const L = (personaObj.layers || []).find(
            x => String(x.layer_id) === String(layer.layer_id)
        );
        return L?.buckets?.[key]?.bucket || null;
    }
    if (layer.type === '2D') {
        const L = (personaObj.layers || []).find(
            x => String(x.layer_id) === String(layer.layer_id)
        );
        const rec = (L?.buckets && L.buckets[key]) || (L?.cells && L.cells[key]);
        return rec?.bucket || null;
    }
    return null;
}

/** Weighted merge of MB arrays: element-wise sum to the longest length; pad missing with 0. */
function mergeMBArraysWeighted(arrays /* [{w, mb}], w∈[0..1] */) {
    if (!Array.isArray(arrays) || arrays.length === 0) return [];
    const maxLen = Math.max(0, ...arrays.map(a => (Array.isArray(a.mb) ? a.mb.length : 0)));
    const out = new Array(maxLen).fill(0);
    for (let i = 0; i < maxLen; i++) {
        let s = 0;
        for (const { w, mb } of arrays) {
            const v = Number(mb?.[i]) || 0;
            s += w * v;
        }
        out[i] = s;
    }
    return out;
}

// --- main build --------------------------------------------------------------
export async function getMergedMatrixForBusiness({ businessId, assortmentId, rootDir }) {
    // 1) resolve assortment row (weights now live in assortments table)
    let row, fetchError;
    if (assortmentId) {
        const { data, error } = await supabase
            .from('assortments')
            .select('party,budget,trendy,eco,sport,local,luxury,traditional,healthy,average')
            .eq('id', assortmentId)
            .single();
        row = data; fetchError = error;
    } else {
        // fall back: first assortment for this business
        const { data, error } = await supabase
            .from('assortments')
            .select('id,party,budget,trendy,eco,sport,local,luxury,traditional,healthy,average')
            .eq('business_id', businessId)
            .order('sort_order', { ascending: true })
            .limit(1)
            .single();
        row = data; fetchError = error;
        if (data) assortmentId = data.id;
    }

    if (fetchError) throw new Error(`DB error: ${fetchError.message}`);

    const cacheKey = assortmentId ? `a:${assortmentId}` : `b:${businessId}`;

    const rawWeights = mapDbRowToPersonaWeights(row);
    const entries = Object.entries(rawWeights).filter(([, v]) => Number(v) > 0);
    const sum = entries.reduce((s, [, v]) => s + Number(v), 0);

    const normWeights =
        sum > 0
            ? Object.fromEntries(entries.map(([k, v]) => [k, Number(v) / sum]))
            : { AVERAGE: 1.0 };

    const etag = hashWeights(normWeights);

    // cache hit
    const cached = CACHE.get(cacheKey);
    if (cached && cached.etag === etag) {
        return deepClone({
            version: cached.version,
            layers: cached.layers,
            meta: { weights: cached.weights, updatedAt: cached.updatedAt, etag: cached.etag },
        });
    }

    // 2) read persona files that are actually used by weights
    const personaRoot = path.resolve(rootDir);
    const personaNames = Object.keys(normWeights);
    const personaObjs = personaNames
        .map(name => [name, readPersonaFile(personaRoot, name)])
        .filter(([, obj]) => !!obj);

    if (personaObjs.length === 0) {
        throw new Error('No persona JSONs found to merge.');
    }

    // Use AVERAGE (or the first persona) as schema carrier (layers/keys)
    const schemaCarrier =
        personaObjs.find(([name]) => name === 'AVERAGE')?.[1] || personaObjs[0][1];

    const merged = {
        version: 2, // bump version since format semantics changed (MB arrays)
        layers: [],
        meta: { weights: normWeights },
    };

    for (const baseL of schemaCarrier.layers || []) {
        const L = deepClone(baseL);

        // normalize for both 1D and 2D: we will rewrite L.buckets; remove legacy cells
        if (L.type === '1D') {
            const outBuckets = {};
            const inBuckets = L.buckets || {};
            for (const [bucketKey] of Object.entries(inBuckets)) {
                const pieces = [];
                for (const [pName, pObj] of personaObjs) {
                    const w = normWeights[pName] ?? 0;
                    if (w <= 0) continue;
                    const mb = findBucketMB(pObj, L, bucketKey); // <-- MB array per persona
                    if (Array.isArray(mb)) pieces.push({ w, mb });
                }
                const mergedMB = mergeMBArraysWeighted(pieces);
                outBuckets[bucketKey] = { bucket: mergedMB }; // <-- MB array OUT
            }
            L.buckets = outBuckets;
            delete L.cells;
            merged.layers.push(L);
            continue;
        }

        if (L.type === '2D') {
            const outBuckets = {};
            const inBuckets = L.buckets || L.cells || {};
            for (const [cellKey] of Object.entries(inBuckets)) {
                const pieces = [];
                for (const [pName, pObj] of personaObjs) {
                    const w = normWeights[pName] ?? 0;
                    if (w <= 0) continue;
                    const mb = findBucketMB(pObj, L, cellKey); // <-- MB array per persona
                    if (Array.isArray(mb)) pieces.push({ w, mb });
                }
                const mergedMB = mergeMBArraysWeighted(pieces);
                outBuckets[cellKey] = { bucket: mergedMB }; // <-- MB array OUT
            }
            L.buckets = outBuckets;
            delete L.cells;
            merged.layers.push(L);
            continue;
        }

        // passthrough unknown types
        merged.layers.push(L);
    }

    const payload = {
        version: merged.version,
        layers: merged.layers,
        meta: {
            weights: normWeights,
            updatedAt: new Date().toISOString(),
            etag,
        },
    };

    CACHE.set(cacheKey, {
        version: payload.version,
        layers: payload.layers,
        weights: payload.meta.weights,
        etag,
        updatedAt: payload.meta.updatedAt,
    });

    return deepClone(payload);
}

export async function rebuildMergedMatrixForBusiness({ businessId, assortmentId, rootDir }) {
    const key = assortmentId ? `a:${assortmentId}` : `b:${businessId}`;
    CACHE.delete(key);
    return getMergedMatrixForBusiness({ businessId, assortmentId, rootDir });
}
