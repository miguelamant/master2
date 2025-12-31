// useMenuGroups.js
import { useEffect, useState } from "react";
import { api } from "apiService";
import axios from "axios";

export default function useMenuGroups({ apiFilters, filterKey }) {
  const [groupMeta, setGroupMeta] = useState({}); // { token: { base, badges, label } }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.post(
            "/api/menu-groups",
            { groupBy: ["category"], filters: apiFilters, minBadgeCoverage: 0.95 },
            { withCredentials: true }
        );
        if (!alive) return;
        const map = {};
        for (const g of data.results || []) {
          const cat = (g.key.split("|")[0].split("=")[1] || g.label);
          map[cat] = { base: g.icon.base, badges: g.icon.badges, label: g.label };
        }
        setGroupMeta(map);
      } catch (e) {
        console.error("menu-groups meta error", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiFilters, filterKey]);

  return groupMeta;
}
