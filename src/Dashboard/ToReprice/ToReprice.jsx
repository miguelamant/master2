import React, { useEffect, useMemo, useRef, useState } from "react";
import "../TopWorstSellers.css";
import "../ToReprice.css";

import pacman from "../Icons/pacman.svg";
import pricesens from "../Icons/pricesensitivity.svg";
import euro from "../Icons/euro.svg";

import { api } from "apiService";
import Optionbar from "../Optionbar";
import PriceBar from "../PriceBar";

// ---------- small helpers (local, so no dependency on ToAdd utils) ----------
const normToken = (s) =>
    String(s ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const normalizeCategory = (s) => {
    const t = String(s || "").toLowerCase();
    if (["sodas", "refreshments", "softs", "soft-drinks", "softdrinks", "nonalcoholic"].includes(t)) return "refreshments";
    if (["beer", "beers", "bier"].includes(t)) return "beers";
    return "beers";
};

const normalizeHeritage = (v) => {
    const t = String(v ?? "").trim().toLowerCase();
    if (t === "abbey" || t === "trappist") return t;
    return "normal";
};

export default function ToReprice({ section = "beers" }) {
    const activeCategory = normalizeCategory(section);

    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Optionbar-compatible UI filters (same model as your ToAdd page)
    const [filters, setFilters] = useState({
        tastes: new Set(),
        sugar: { zero_sugar: true, with_sugar: true },
        sparkling: { sparkling: true, not_sparkling: true },
        heritage: new Set(["abbey", "trappist", "normal"]),
    });

    // Keep it simple for ToReprice: group “tastes” by subsubcategory
    const groupBy = "subsubcategory";

    const bepaalPrijsOordeel = (item) => {
        const { currentPrice, minPrice, lowPrice, highPrice, maxPrice } = item;
        if (currentPrice < minPrice) return { label: "laag", kleur: "#d32f2f" };
        if (currentPrice < lowPrice) return { label: "laag", kleur: "#e69e6a" };
        if (currentPrice <= highPrice) return { label: "goed", kleur: "#388e3c" };
        if (currentPrice <= maxPrice) return { label: "hoog", kleur: "#e69e6a" };
        return { label: "hoog", kleur: "#d32f2f" };
    };

    const berekenPriceSensitivity = (low, high, floor, ceiling) => {
        const denom = ceiling - floor;
        const ratio = denom === 0 ? 0 : (high - low) / denom;
        if (ratio >= 0.6) return { label: "laag", kleur: "#388e3c" };
        if (ratio >= 0.3) return { label: "medium", kleur: "#e69e6a" };
        return { label: "hoog", kleur: "#d32f2f" };
    };

    // Fetch menu-items (new API shape: { items: [...] })
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);

                const res = await api.get("/api/menu-items", {
                    withCredentials: true,
                    params: { page: 1, pageSize: 5000, orderBy: "products.name" },
                });

                const rows = res.data?.items || [];

                const mapped = rows.map((i) => {
                    const currentPrice = Number(i.price ?? 0);

                    const minPrice = i.floor_price != null ? Number(i.floor_price) : null;
                    const maxPrice = i.ceiling_price != null ? Number(i.ceiling_price) : null;
                    const lowPrice = i.low_price != null ? Number(i.low_price) : null;
                    const highPrice = i.high_price != null ? Number(i.high_price) : null;

                    const safeLow = lowPrice ?? currentPrice;
                    const safeHigh = highPrice ?? currentPrice;

                    const oordeel = bepaalPrijsOordeel({
                        currentPrice,
                        minPrice: minPrice ?? safeLow,
                        lowPrice: safeLow,
                        highPrice: safeHigh,
                        maxPrice: maxPrice ?? safeHigh,
                    });

                    const sensitivity = berekenPriceSensitivity(
                        safeLow,
                        safeHigh,
                        minPrice ?? safeLow,
                        maxPrice ?? safeHigh
                    );

                    return {
                        id_menu_item: i.id_menu_item,
                        name: i.item_name,
                        category: i.category,            // e.g. "BEERS" / "REFRESHMENTS"
                        subcategory: i.subcategory,
                        subsubcategory: i.subsubcategory,

                        // tokens for taste filter (Optionbar)
                        _category_token: normToken(i.category),
                        _subcat_token: normToken(i.subcategory),
                        _subsubcat_token: normToken(i.subsubcategory),

                        // needed for PriceBar + KPI chips
                        currentPrice,
                        minPrice: minPrice ?? safeLow,
                        maxPrice: maxPrice ?? safeHigh,
                        lowPrice: safeLow,
                        highPrice: safeHigh,
                        optimalPrice: (safeLow + safeHigh) / 2,

                        priceSensitivity: sensitivity.label,
                        priceSensitivityColor: sensitivity.kleur,

                        jouwPrijsIs: oordeel.label,
                        jouwPrijsKleur: oordeel.kleur,

                        // if you still want these chips but don’t have exact data, keep them
                        cannibalisationRisk: "—",
                        cannibalisationRiskColor: "#999",

                        // filters
                        is_zero: Number(i.is_zero ?? 0),
                        is_sparkling: Number(i.is_sparkling ?? 0),
                        heritage: normalizeHeritage(i.heritage),
                    };
                });

                setMenuItems(mapped);
            } catch (err) {
                console.error(err);
                setError("Kon data niet laden");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // Filter to active section (beers/refreshments)
    const inActiveSection = (it) => {
        const catTok = it._category_token || normToken(it.category);
        if (activeCategory === "beers") return catTok === "BEERS";
        if (activeCategory === "refreshments") return catTok === "REFRESHMENTS";
        return true;
    };

    const passesFilters = (item) => {
        // search
        if (!String(item.name || "").toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // tasteId based on groupBy
        let tasteId = null;
        if (groupBy === "category") tasteId = item._category_token;
        else if (groupBy === "subcategory") tasteId = item._subcat_token;
        else tasteId = item._subsubcat_token;

        if (filters.tastes?.size && tasteId && !filters.tastes.has(tasteId)) return false;

        // sugar
        const sugar = filters.sugar || { zero_sugar: true, with_sugar: true };
        const sugarNoRestr = (!sugar.zero_sugar && !sugar.with_sugar) || (sugar.zero_sugar && sugar.with_sugar);
        const isZero = Number(item.is_zero ?? 0) === 1;
        if (!sugarNoRestr) {
            if (isZero && !sugar.zero_sugar) return false;
            if (!isZero && !sugar.with_sugar) return false;
        }

        // sparkling
        const sprk = filters.sparkling || { sparkling: true, not_sparkling: true };
        const sprkNoRestr = (!sprk.sparkling && !sprk.not_sparkling) || (sprk.sparkling && sprk.not_sparkling);
        const isSpark = Number(item.is_sparkling ?? 0) === 1;
        if (!sprkNoRestr) {
            if (isSpark && !sprk.sparkling) return false;
            if (!isSpark && !sprk.not_sparkling) return false;
        }

        // heritage
        const hset = filters.heritage instanceof Set ? filters.heritage : new Set(["abbey", "trappist", "normal"]);
        const hval = (item.heritage || "normal").toLowerCase();
        if (!hset.has(hval)) return false;

        return true;
    };

    const visible = useMemo(() => {
        return (menuItems || []).filter(inActiveSection).filter(passesFilters);
    }, [menuItems, searchTerm, filters, activeCategory]);

    // Build tasteOptions for Optionbar from visible dataset
    const tasteOptions = useMemo(() => {
        const seen = new Set();
        const out = [];

        for (const it of (menuItems || []).filter(inActiveSection)) {
            let raw = it.subsubcategory || it.subcategory || it.category || "Unknown";
            let id = normToken(raw);
            if (!id || seen.has(id)) continue;
            seen.add(id);

            out.push({
                id,
                label: String(raw).replace(/_/g, " ").toLowerCase(),
                icon: null,
            });
        }

        out.sort((a, b) => a.label.localeCompare(b.label));
        return out;
    }, [menuItems, activeCategory]);

    // Select all tastes by default (like ToAdd does)
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            tastes: new Set((tasteOptions || []).map((o) => o.id)),
        }));
    }, [activeCategory, tasteOptions]);

    const selectedItem = visible[selectedIndex] || null;

    const handleSetOptimalPrice = async () => {
        if (!selectedItem?.id_menu_item) return;

        const updatedPrice = Number(((selectedItem.lowPrice + selectedItem.highPrice) / 2).toFixed(2));

        try {
            await api.patch(
                `/api/menu-items/${selectedItem.id_menu_item}/price`,
                { price: updatedPrice },
                { withCredentials: true }
            );

            setMenuItems((prev) => {
                const copy = [...prev];
                const idx = copy.findIndex((x) => x.id_menu_item === selectedItem.id_menu_item);
                if (idx === -1) return prev;

                const next = { ...copy[idx], currentPrice: updatedPrice };

                const oordeel = bepaalPrijsOordeel({
                    currentPrice: updatedPrice,
                    minPrice: next.minPrice,
                    lowPrice: next.lowPrice,
                    highPrice: next.highPrice,
                    maxPrice: next.maxPrice,
                });

                next.jouwPrijsIs = oordeel.label;
                next.jouwPrijsKleur = oordeel.kleur;

                copy[idx] = next;
                return copy;
            });
        } catch (err) {
            alert("Fout bij het updaten van de prijs.");
            console.error(err);
        }
    };

    if (loading) return <p>Loading…</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="top-worst-container toadd-grid">
            <div className="centre-content">
                {/* ===== TOP SECTION (same spot as KPIHeader+SummaryGrid) ===== */}
                <div className="segment-section">
                    <div className="reprice-section">
                        <p className="reprice-title">
                            {selectedItem?.name ? selectedItem.name : "Selecteer een item"}
                        </p>

                        {selectedItem && (
                            <>
                                <div className="reprice-indicators">
                                    <div className="tooltip-tr">
                                        <div className="cannibalism">
                                            <img src={pacman} alt="cannibalism icon" className="pacman-icon" />
                                            <div className="cannibalism-label">Cannibalism</div>
                                            <div
                                                className="cannibalism-indicator"
                                                style={{ backgroundColor: selectedItem.cannibalisationRiskColor, color: "#fff", border: "none" }}
                                            >
                                                {selectedItem.cannibalisationRisk}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tooltip-tr">
                                        <div className="pricesens">
                                            <img src={pricesens} alt="price sensitivity icon" className="pricesens-icon" />
                                            <div className="pricesens-label">Price Sensitivity</div>
                                            <div
                                                className="pricesens-indicator"
                                                style={{ backgroundColor: selectedItem.priceSensitivityColor, color: "#fff", border: "none" }}
                                            >
                                                {selectedItem.priceSensitivity}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tooltip-tr">
                                        <div className="yourprice">
                                            <img src={euro} alt="euro icon" className="euro-icon" />
                                            <div className="yourprice-label">Your Price</div>
                                            <div
                                                className="yourprice-indicator"
                                                style={{ backgroundColor: selectedItem.jouwPrijsKleur, color: "#fff", border: "none" }}
                                            >
                                                {selectedItem.jouwPrijsIs}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button className="set-optimal-button" onClick={handleSetOptimalPrice}>
                                    Zet prijs op optimale waarde
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* ===== LIST SECTION (same spot as ToAdd items list) ===== */}
                <div className="items-section">
                    <div className="list-header">
                        <div className="header-title">
                            <p>To Reprice</p>
                            <h2 className="section-title-top">Menu-items</h2>
                        </div>

                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedIndex(0);
                                }}
                            />
                        </div>
                    </div>

                    <ul className="items-list">
                        {visible.map((item, idx) => (
                            <li
                                key={item.id_menu_item}
                                className={`item ${selectedIndex === idx ? "selected" : ""}`}
                                onClick={() => setSelectedIndex(idx)}
                            >
                                <span>{idx + 1}. {item.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ===== RIGHT OPTIONBAR (same placement as ToAdd) ===== */}
            <nav className="optionbar-container">
                <Optionbar
                    groupBy={groupBy}
                    category={activeCategory}
                    tasteOptions={tasteOptions}
                    filters={filters}
                    onChange={setFilters}
                />
            </nav>
        </div>
    );
}
