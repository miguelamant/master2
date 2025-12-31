// useMenuCounts.js
import { useEffect, useState } from "react";
import { menuCounts } from '../../../apiService';

export default function useMenuCounts({ groupBy, section, within, apiFilters, predicates }) {
    const [countsByCategory, setCountsByCategory] = useState({});

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { results } = await menuCounts({
                    groupBy,
                    section,
                    includeEmpty: true,
                    within,
                    filters: apiFilters,
                    predicates
                });

                if (!alive) return;
                const byGroup = (results || []).reduce((acc, row) => {
                    const key = row[groupBy] ?? row.group ?? row.category ?? row.label;
                    const count = row.count_on_menu ?? row.count ?? 0;
                    if (key != null) acc[key] = count;
                    return acc;
                }, {});
                setCountsByCategory(byGroup);
            } catch (err) {
                console.error("[FE] menuCounts error", err?.response?.data || err);
            }
        })();
        return () => {
            alive = false;
        };
    }, [groupBy, section, within, apiFilters, predicates]);

    return countsByCategory;
}
