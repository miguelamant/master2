import React, { useState, useEffect } from 'react';
import './ToReprice.css';
import Optionbar from "./Optionbar";
import { segmentOptions, locationOptions, seasonOptions, highlightOptions } from './optionbarOptions';
import pacman from './Icons/pacman.svg';
import pricesens from './Icons/pricesensitivity.svg';
import euro from './Icons/euro.svg';
import axios from 'axios';
import { api } from "apiService";
const ToReprice = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const bepaalPrijsOordeel = (item) => {
        const { currentPrice, minPrice, lowPrice, highPrice, maxPrice } = item;

        if (currentPrice < minPrice) return { label: "laag", kleur: "#d32f2f" };
        if (currentPrice < lowPrice) return { label: "laag", kleur: "#e69e6a" };
        if (currentPrice <= highPrice) return { label: "goed", kleur: "#388e3c" };
        if (currentPrice <= maxPrice) return { label: "hoog", kleur: "#e69e6a" };
        return { label: "hoog", kleur: "#d32f2f" };
    };

    const berekenPriceSensitivity = (low, high, floor, ceiling) => {
        const ratio = (high - low) / (ceiling - floor);

        if (ratio >= 0.6) return { label: "laag", kleur: "#388e3c" };      // groen
        if (ratio >= 0.3) return { label: "medium", kleur: "#e69e6a" };   // oranje
        return { label: "hoog", kleur: "#d32f2f" };                       // rood
    };

    const bepaalCannibalisationRisk = (cat, countsByCategory) => {
        const actual = countsByCategory[cat] || 0;
        const ideal = idealCounts[cat] || 1; // voorkom deling door 0
        const ratio = actual / ideal;

        if (ratio >= 1.2) return { label: 'hoog', kleur: '#d32f2f' };
        if (ratio >= 0.9) return { label: 'medium', kleur: '#e69e6a' };
        return { label: 'laag', kleur: '#388e3c' };
    };

    const idealCounts = {
        Beer:              11,
        Cocktail:           8,
        Coffee:             4,
        Juices:             5,
        Mocktails:          7,
        'Soft Drinks':      6,
        Spirits:            3,
        'Sport/Energy Drinks': 4,
        'Tea & Infusions':  5,
        Wine:               4
    };


    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await api.get(
                    `${process.env.REACT_APP_API_URL || ''}/api/menu-items`,
                    { withCredentials: true }
                );

                // ✅ Stap 1: Tellen per categorie
                const countsByCategory = {};
                res.data.forEach(item => {
                    if (!countsByCategory[item.category]) {
                        countsByCategory[item.category] = 0;
                    }
                    countsByCategory[item.category]++;
                });

                // ✅ Stap 2: Mapping inclusief berekeningen
                const mapped = res.data.map((i) => {
                    const currentPrice = i.price;
                    const minPrice = i.floor_price;
                    const maxPrice = i.ceiling_price;
                    const lowPrice = i.low_price;
                    const highPrice = i.high_price;

                    const oordeel = bepaalPrijsOordeel({
                        currentPrice,
                        minPrice,
                        lowPrice,
                        highPrice,
                        maxPrice
                    });

                    const sensitivity = berekenPriceSensitivity(lowPrice, highPrice, minPrice, maxPrice);
                    const cannibal = bepaalCannibalisationRisk(i.category, countsByCategory);

                    return {
                        id_menu_item: i.id_menu_item,
                        name: i.item_name,
                        category: i.category, // eventueel handig om te behouden
                        currentPrice,
                        minPrice,
                        maxPrice,
                        highPrice,
                        lowPrice,
                        optimalPrice: (lowPrice + highPrice) / 2,
                        priceSensitivity: sensitivity.label,
                        priceSensitivityColor: sensitivity.kleur,
                        jouwPrijsIs: oordeel.label,
                        jouwPrijsKleur: oordeel.kleur,
                        cannibalisationRisk: cannibal.label,
                        cannibalisationRiskColor: cannibal.kleur
                    };
                });

                setMenuItems(mapped);
            } catch (err) {
                console.error(err);
                setError('Kon data niet laden');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);




    const handleSetOptimalPrice = async () => {
        if (!selectedItem?.id_menu_item) return;

        const updatedPrice = Number(((selectedItem.lowPrice + selectedItem.highPrice) / 2).toFixed(2));

        try {
            const res = await fetch('/api/menu-items', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    updates: [{
                        id_menu_item: selectedItem.id_menu_item,
                        price: updatedPrice
                    }]
                })
            });

            if (!res.ok) throw new Error('Fout bij updaten');

            // Update frontend state
            const updated = [...menuItems];
            updated[selectedIndex].currentPrice = updatedPrice;
            const oordeel = bepaalPrijsOordeel(updated[selectedIndex]);
            updated[selectedIndex].jouwPrijsIs = oordeel.label;
            updated[selectedIndex].jouwPrijsKleur = oordeel.kleur;
            setMenuItems(updated);
        } catch (err) {
            alert('Fout bij het updaten van de prijs.');
            console.error(err);
        }
    };


    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('top');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredItems = menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const segmentClasses = [
        'segment--low',
        'segment--below-optimal',
        'segment--optimal',
        'segment--above-optimal',
        'segment--high'
    ];

    const selectedItem = filteredItems[selectedIndex] || {};

    const currentPrice = selectedItem.currentPrice;
    const lowPrice = selectedItem.lowPrice;
    const highPrice = selectedItem.highPrice;
    const optimalPrice = ((highPrice + lowPrice) / 2).toFixed(2);
    const minPrice = selectedItem.minPrice;
    const maxPrice = selectedItem.maxPrice;
    const startBar = Math.min((minPrice * 0.9).toFixed(2),currentPrice);
    const endBar = Math.max((maxPrice * 1.1).toFixed(2), currentPrice);
    const thresholds = [startBar, minPrice, lowPrice, highPrice, maxPrice, endBar];
    const segmentWeights = thresholds.slice(1).map((end, idx) => end - thresholds[idx]);
    const positionPercentCurrent = ((currentPrice - startBar) / (endBar - startBar)) * 100;
    const positionPercentOptimal = ((optimalPrice - startBar) / (endBar - startBar)) * 100;
    const toPct = p => ((p - startBar) / (endBar - startBar)) * 100;





    return (
        <div className="to-reprice-container">
            <div className="centre-content">
                <div className="reprice-section">
                    <p className="reprice-title">
                        {selectedItem.name ? selectedItem.name : "Selecteer een item"}
                    </p>

                    <div className="price-bar-wrapper">
                        {thresholds.map((t, i) => (
                            <div
                                key={i}
                                className={`price-threshold-label ${i === 0 || i === thresholds.length - 1 ? 'end' : ''}`}
                                style={{left: `calc(${toPct(t)}% - 12px)`}}
                            >
                                €{t}
                            </div>
                        ))}
                        <div
                            className="price-indicator top"
                            style={{left: `calc(${positionPercentOptimal}% - 8px)`}}
                        />
                        <div className="price-label top" style={{left: `calc(${positionPercentOptimal}% - 8px)`}}>
                            €{optimalPrice} best price
                        </div>

                        <div className="price-bar">
                            {segmentWeights.map((w, idx) => (
                                <div
                                    key={idx}
                                    className={`segment ${segmentClasses[idx]}`}
                                    style={{flex: w}}
                                />
                            ))}
                        </div>

                        <div
                            className="price-indicator bottom"
                            style={{left: `calc(${positionPercentCurrent}% - 8px)`}}
                        />
                        <div className="price-label bottom" style={{left: `calc(${positionPercentCurrent}% - 8px)`}}>
                            €{currentPrice} current price
                        </div>
                    </div>

                    <div className="reprice-indicators">
                        <div className="tooltip-tr">
                            <div className="cannibalism">
                                <img src={pacman} alt="cannibalism icon" className="pacman-icon"/>
                                <div className="cannibalism-label"> Cannibalism</div>
                                <div
                                    className="cannibalism-indicator"
                                    style={{
                                        backgroundColor: selectedItem.cannibalisationRiskColor,
                                        color: '#fff',
                                        border: 'none'
                                    }}
                                >
                                    {selectedItem.cannibalisationRisk}
                                </div>

                            </div>
                            <span className="tooltip-tr-text">
                                When a product competes with another on your menu, causing reduced sales.
                            </span>
                        </div>

                        <div className="tooltip-tr">
                            <div className="pricesens">
                                <img src={pricesens} alt="price sensitivity icon" className="pricesens-icon"/>
                                <div className="pricesens-label"> Price Sensitivity</div>
                                <div
                                    className="pricesens-indicator"
                                    style={{
                                        backgroundColor: selectedItem.priceSensitivityColor,
                                        color: '#fff',
                                        border: 'none'
                                    }}
                                >
                                    {selectedItem.priceSensitivity}
                                </div>
                            </div>
                            <span className="tooltip-tr-text">
                                How strongly customers react to changes in price — high means they care a lot.
                            </span>
                        </div>


                        <div className="tooltip-tr">
                            <div className="yourprice">
                                <img src={euro} alt="euro icon" className="euro-icon"/>
                                <div className="yourprice-label"> Your Price</div>
                                <div
                                    className="yourprice-indicator"
                                    style={{
                                        backgroundColor: selectedItem.jouwPrijsKleur,
                                        color: '#fff',
                                        border: 'none'
                                    }}
                                >
                                    {selectedItem.jouwPrijsIs}
                                </div>
                            </div>
                            <span className="tooltip-tr-text">
        Evaluation of your current price vs. the recommended range.
    </span>
                        </div>

                    </div>
                    {selectedItem.name && (
                        <button
                            className="set-optimal-button"
                            onClick={() => handleSetOptimalPrice(selectedItem, selectedIndex)}
                        >
                            Zet prijs op optimale waarde (€{optimalPrice})
                        </button>
                    )}
                </div>

                <div className="reprice-items-section">
                    <div className="r-list-header">
                        <h2 className="header-title">To Reprice Items</h2>
                        <div className="r-search-bar">
                        <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <ul className="items-list">
                    {filteredItems.map((item, idx) => (
                            <li
                                key={item.name}
                                className={`item ${selectedIndex === idx ? 'selected' : ''}`}
                                onClick={() => setSelectedIndex(idx)}
                            >
                                <span>{idx + 1}. {item.name}</span>
                                <div className="verandering-prijs">
                                    <div className="lijst-jouw-prijs">
                                        <div>€ {item.currentPrice}</div>
                                        <div>jouw prijs</div>
                                    </div>
                                    <div className="lijst-pijl">&#8594;</div>
                                    <div className="lijst-nieuwe-prijs">
                                        <div>€ {item.optimalPrice.toFixed(2)}</div>
                                        <div>betere prijs</div>
                                    </div>
                                </div>
                                <div className="lijst-indicator">
                                    <div> Jouw prijs is </div>
                                    <div
                                        style={{
                                            backgroundColor: item.jouwPrijsKleur,
                                            color: '#fff',
                                            padding: '0.5rem 1.5rem',
                                            borderRadius: '1.5rem',
                                            fontWeight: '700',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {item.jouwPrijsIs}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ToReprice;
