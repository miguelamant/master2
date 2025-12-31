import { menuCounts } from "../../../apiService";

/**
 * Fetch counts for a base summary, partitioned by mutually-exclusive “buckets”.
 *
 * baseArgs: { groupBy, section, includeEmpty, within, filters, predicates }
 *
 * rollups (optional): array of rules to merge some composite keys into one.
 * Example:
 * rollups: [
 *   {
 *     match: { partitionLabel: "With sugar", basePrefix: "LEMONADES_" },
 *     into: "LEMONADES (With sugar)"
 *   }
 * ]
 */
export async function fetchPartitionedMenuCounts({
                                                     baseArgs,
                                                     partitions = [],
                                                     rollups = [], // NEW
                                                 }) {
    // Normalize each partition to an array of predicates
    const normalized = partitions.map((p) => {
        const label = String(p.label ?? "").trim();
        let preds = Array.isArray(p.predicates) ? p.predicates : [];
        if (!preds.length && p.field != null) {
            preds = [{ field: p.field, op: (p.op || "eq"), value: p.value }];
        }
        return { label, predicates: preds };
    });

    // Run menuCounts once per partition
    const resultsByPartition = await Promise.all(
        normalized.map(async ({ label, predicates }) => {
            console.log('[partition fetch]', { label, predicates });
            const { results } = await menuCounts({
                ...baseArgs,
                predicates: [
                    ...(baseArgs.predicates || []),
                    ...predicates,
                ],
            });

            const map = {};
            for (const row of results || []) {
                const key =
                    row[baseArgs.groupBy] ??
                    row.group ??
                    row.category ??
                    row.label;
                const count = row.count_on_menu ?? row.count ?? 0;
                if (key != null) map[key] = count;
            }
            return { label, map };
        })
    );

    // Merge into composite keys: "<base> · <partition label>"
    const composite = {};
    for (const { label, map } of resultsByPartition) {
        for (const baseKey of Object.keys(map)) {
            composite[`${baseKey} · ${label}`] = map[baseKey];
        }
    }

    // ---- NEW: Apply rollups (merge selected composite keys into a single bucket) ----
    if (Array.isArray(rollups) && rollups.length) {
        const out = { ...composite };

        const split = (k) => {
            const parts = String(k).split(" · ").map(s => s.trim());
            const base = parts[0] || k;
            const part = parts[parts.length - 1] || "";
            return { base, part };
        };

        const matches = (rule, key) => {
            const { base, part } = split(key);
            const wantPart = rule?.match?.partitionLabel;
            const basePrefix = rule?.match?.basePrefix;
            const baseIn = rule?.match?.baseIn;

            if (wantPart != null && String(part) !== String(wantPart)) return false;
            if (basePrefix != null && !String(base).startsWith(String(basePrefix))) return false;
            if (Array.isArray(baseIn) && baseIn.length && !baseIn.includes(base)) return false;

            return true;
        };

        for (const rule of rollups) {
            const into = String(rule?.into ?? "").trim();
            if (!into) continue;

            let sum = 0;
            for (const key of Object.keys(out)) {
                if (!matches(rule, key)) continue;
                sum += Number(out[key] ?? 0);
                delete out[key]; // remove originals
            }

            // Only set if something matched; keep existing value if you want additive behavior
            if (sum !== 0 || rule?.keepZero === true) {
                out[into] = (Number(out[into] ?? 0) + sum);
            }
        }

        return out;
    }

    return composite;
}
