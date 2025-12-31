import React, { useEffect, useState } from 'react';
import './PrijsVergelijking.css';
import axios from 'axios';
import { api } from "apiService";

const PrijsVergelijking = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('/api/price-comparison', { withCredentials: true })
            .then(res => {
                setData({
                    title: "Prijsvergelijking",
                    subtitle: "Hoe verhouden jouw prijzen zich tot het gemiddelde",
                    items: res.data
                });
            })
            .catch(err => {
                console.error(err);
                setError("Kon prijsvergelijking niet laden");
            });
    }, []);


    if (error) return <h1>{error}</h1>;
    if (!data || !data.items) return <p>Loading…</p>;

    const { title, subtitle, items } = data;

    const colorClasses = [
        "prijs-vergelijken-item-1",
        "prijs-vergelijken-item-2",
        "prijs-vergelijken-item-3",
        "prijs-vergelijken-item-4",
        "prijs-vergelijken-item-5"
    ];

    const generateDescription = (comparison) => {
        const amount = comparison.match(/[+-]?\s?€\d+,\d+/);
        if (!amount) return null;

        if (comparison.includes("+")) {
            return `Dit product is ${amount[0]} duurder dan gemiddeld in vergelijkbare zaken.`;
        } else {
            return `Dit product is ${amount[0]} goedkoper dan gemiddeld in vergelijkbare zaken.`;
        }
    };

    return (
        <div className="page-container">
            <div className="prijs-vergelijken-container">
                <h1 className="prijs-vergelijken-title">{title}</h1>
                <p className="prijs-vergelijken-subtitle">{subtitle}</p>
                <div className="prijs-vergelijken-items-container">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`prijs-vergelijken-item ${colorClasses[index % colorClasses.length]}`}
                        >
                            <div className="prijs-vergelijken-item-content">
                                <span className="prijs-vergelijken-item-name">{item.name}</span>
                                <span className="prijs-vergelijken-comparison">{item.comparison}</span>
                            </div>
                            {index === 0 && (
                                <p className="prijs-vergelijken-description">
                                    {generateDescription(item.comparison)}
                                </p>
                            )}
                        </div>
                    ))}
                    <br/><br/><br/><br/>
                </div>
            </div>
        </div>
    );
};

export default PrijsVergelijking;
