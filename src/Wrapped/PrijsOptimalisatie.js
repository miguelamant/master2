import React, { useEffect, useState } from 'react';
import './PrijsOptimalisatie.css';
import axios from 'axios';
import { api } from "apiService";

const PrijsOptimalisatie = () => {
    const [items, setItems] = useState([]);
    const title = "Prijs Optimalisatie";
    const subtitle = "Wij raden aan deze prijzen aan te passen";

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL || ''}/api/menu-items`,
                    { withCredentials: true }
                );

                const data = res.data.map(item => {
                    const optimalPrice = (item.low_price + item.high_price) / 2;
                    const priceDiff = optimalPrice - item.price;

                    return {
                        name: item.item_name,
                        currentPrice: item.price.toFixed(2),
                        newPrice: optimalPrice.toFixed(2),
                        extraPerMonth: `€${(priceDiff * item.monthly_sales || 20).toFixed(0)}`,
                        priceDiffAbs: Math.abs(priceDiff),
                    };
                });

                const sorted = data
                    .sort((a, b) => b.priceDiffAbs - a.priceDiffAbs)
                    .slice(0, 5);

                setItems(sorted);
            } catch (err) {
                console.error('Fout bij ophalen:', err);
            }
        };

        fetchItems();
    }, []);

    const colors = [
        "prijs-optimalisatie-item-1",
        "prijs-optimalisatie-item-2",
        "prijs-optimalisatie-item-3",
        "prijs-optimalisatie-item-4",
        "prijs-optimalisatie-item-5",
    ];

    return (
        <div className="page-container">
            <div className="prijs-optimalisatie-container">
                <h1 className="prijs-optimalisatie-title">{title}</h1>
                <p className="prijs-optimalisatie-subtitle">{subtitle}</p>
                <div className="prijs-optimalisatie-items-container">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`prijs-optimalisatie-item ${colors[index % colors.length]}`}
                        >
                            <span className="prijs-optimalisatie-item-name">{item.name}</span>
                            <div className="prijs-optimalisatie-price-details">
                                <div className="current-price-details">
                                    <span className="prijs-optimalisatie-current-price">{item.currentPrice}</span>
                                    <p>Jouw prijs</p>
                                </div>
                                <span className="prijs-optimalisatie-arrow">→</span>
                                <div className="current-price-details">
                                    <span className="prijs-optimalisatie-new-price">{item.newPrice}</span>
                                    <p>Nieuwe prijs</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrijsOptimalisatie;
