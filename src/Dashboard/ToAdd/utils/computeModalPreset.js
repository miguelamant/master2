// src/Dashboard/ToAdd/utils/computeModalPreset.js
import { normToken } from './normalize';

/**
 * Build a starting selection for the modal based on counts and the current context.
 *
 * @param {Object} args
 * @param {'category'|'subcategory'|'subsubcategory'} args.groupBy   // current summary level
 * @param {string} args.groupValue                                    // e.g. 'ICE_TEA'
 * @param {Array<{key:string,label?:string,count:number}>} args.counts
 *        // counts of the *next* level down (e.g., subsubcategories under ICE_TEA)
 * @param {Object} args.pageFilters    // right-hand optionbar filters (sugar/sparkling/heritage)
 * @param {Array}  args.presetPredicates // top summary predicates (e.g., is_zero/is_sparkling)
 *
 * @returns {{
 *   tastes:Set<string>,
 *   sugar:{zero_sugar:boolean, with_sugar:boolean},
 *   sparkling:{sparkling:boolean, not_sparkling:boolean},
 *   heritage:Set<'abbey'|'trappist'|'normal'>
 * }}
 */
export function computeModalPreset({
                                       groupBy,
                                       groupValue,
                                       counts = [],
                                       pageFilters = {},
                                       presetPredicates = [],
                                   }) {
    // --- start from page Optionbar (so it "feels" consistent)
    const ret = {
        tastes: new Set(
            counts.length
                ? counts.filter(c => (c.count ?? 0) > 0).map(c => normToken(c.key))
                : [] // default empty; we’ll fill below if needed
        ),
        sugar: {
            zero_sugar: !!pageFilters?.sugar?.zero_sugar,
            with_sugar: !!pageFilters?.sugar?.with_sugar,
        },
        sparkling: {
            sparkling: !!pageFilters?.sparkling?.sparkling,
            not_sparkling: !!pageFilters?.sparkling?.not_sparkling,
        },
        heritage:
            pageFilters?.heritage instanceof Set
                ? new Set(pageFilters.heritage)
                : new Set(['abbey', 'trappist', 'normal']),
    };

    // If we ended up with no tastes at all (e.g., all zeros), preselect *all* from counts.
    if (ret.tastes.size === 0 && counts.length) {
        counts.forEach(c => ret.tastes.add(normToken(c.key)));
    }

    // Honor top-summary constraints (presetPredicates) if present.
    for (const p of presetPredicates || []) {
        if (!p || p.op !== 'eq') continue;
        if (p.field === 'is_zero') {
            if (Number(p.value) === 1) {
                ret.sugar.zero_sugar = true;
                ret.sugar.with_sugar = false;
            } else if (Number(p.value) === 0) {
                ret.sugar.zero_sugar = false;
                ret.sugar.with_sugar = true;
            }
        }
        if (p.field === 'is_sparkling') {
            if (Number(p.value) === 1) {
                ret.sparkling.sparkling = true;
                ret.sparkling.not_sparkling = false;
            } else if (Number(p.value) === 0) {
                ret.sparkling.sparkling = false;
                ret.sparkling.not_sparkling = true;
            }
        }
    }

    // --------- Hardcoded example you asked for ----------
    // If the current group is ICE_TEA, start with only ICE_TEA_GREEN and Not Sparkling.
    if (normToken(groupValue) === 'ICE_TEA') {
        ret.tastes = new Set(['ICE_TEA_GREEN']);
        ret.sparkling = { sparkling: false, not_sparkling: true };
    }

    return ret;
}
