// useItemsNotOnMenu.js
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { normToken, to01 } from "../utils/normalize";
import { api } from "apiService";

export default function useItemsNotOnMenu() {
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [itemsError, setItemsError] = useState(null);

    const mapRow = (i) => ({
        id: i.id_product,
        id_product: i.id_product,
        name: i.name,
        category: (i.subcat_name ?? i.category_name ?? i.category),
        _category_token: normToken(i.category_name ?? i.category),
        _subcat_token: normToken(i.subcat_name),
        _subsubcat_token: normToken(i.subsubcat_name),

        eco_friendly: (i.eco_friendly ?? "").toString().toLowerCase() === "yes",
        season: i.season,

        prodCity: i.prodCity,
        prodCountry: i.prodCountry,

        recommendedPrice:
            (i.low_price != null && i.high_price != null)
                ? (Number(i.low_price) + Number(i.high_price)) / 2
                : null,

        is_zero: to01(i.is_zero ?? i.zero ?? i.zero_sugar ?? 0),
        is_sparkling: to01(i.is_sparkling ?? i.sparkling ?? 0),
        // NEW functional flags
        is_protein:     to01(i.is_protein ?? 0),
        is_prebiotic:   to01(i.is_prebiotic ?? 0),
        is_magnesium:   to01(i.is_magnesium ?? 0),
        is_vitamin:     to01(i.is_vitamin ?? 0),
        is_collagen:    to01(i.is_collagen ?? 0),

// ALSO include these
        is_trending:    to01(i.is_trending ?? 0),
        is_high_margin: to01(i.is_high_margin ?? 0),
        heritage: (i.heritage || "normal").toLowerCase(),
    });

    const refreshItems = useCallback(async () => {
        setLoadingItems(true);
        try {
            const res = await api.get("/api/items-not-on-menu", { withCredentials: true });
            setItems((res.data || []).map(mapRow));
            setItemsError(null);
        } catch (err) {
            console.error(err);
            setItemsError("Kon items niet laden");
        } finally {
            setLoadingItems(false);
        }
    }, []);

    useEffect(() => {
        refreshItems();
    }, [refreshItems]);

    return { items, loadingItems, itemsError, refreshItems };
}
