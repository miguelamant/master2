import React, { useEffect, useState } from 'react';
import HotTemplate from './HotTemplate';
import axios from 'axios';
import { api } from "apiService";

const HotForYou = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const title = "Hot For You";
    const subtitle = "Aanbevolen items om toe te voegen aan jouw menu.";

    const idealCounts = {
        Beer: 11,
        Cocktail: 8,
        Coffee: 4,
        Juices: 5,
        Mocktails: 7,
        'Soft Drinks': 6,
        Spirits: 3,
        'Sport/Energy Drinks': 4,
        'Tea & Infusions': 5,
        Wine: 4
    };

    useEffect(() => {
        const cached = localStorage.getItem("wrapped_hot_items");
        if (cached) {
            setMenuItems(JSON.parse(cached));
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            try {
                const [countsRes, itemsRes] = await Promise.all([
                    api.get('/api/menu-counts', { withCredentials: true }),
                    api.get('/api/items-not-on-menu', { withCredentials: true }),
                ]);

                const countsByCategory = countsRes.data.reduce((acc, { category, count_on_menu }) => {
                    acc[category] = count_on_menu;
                    return acc;
                }, {});

                const shortages = Object.entries(idealCounts)
                    .map(([cat, ideal]) => ({
                        category: cat,
                        shortage: ideal - (countsByCategory[cat] || 0)
                    }))
                    .sort((a, b) => b.shortage - a.shortage);

                const prioritized = itemsRes.data
                    .map(i => ({
                        ...i,
                        shortage: shortages.find(s => s.category === i.category)?.shortage || 0
                    }))
                    .sort((a, b) => b.shortage - a.shortage)
                    .slice(0, 3); // altijd max 3 suggesties

                let withDescriptions = prioritized;

                try {
                    const res = await api.post('/api/describe-item', {
                        items: prioritized.map(i => ({ name: i.name, category: i.category }))
                    }, { withCredentials: true });

                    withDescriptions = res.data.result;
                } catch (err) {
                    console.error("AI-generatie mislukt voor batch:", err);
                    // fallback
                    withDescriptions = prioritized.map(i => ({
                        name: i.name,
                        description: `Een ${i.category.toLowerCase()} die je menu verrijkt.`
                    }));
                }


                setMenuItems(withDescriptions);
                localStorage.setItem("wrapped_hot_items", JSON.stringify(withDescriptions));

            } catch (err) {
                console.error(err);
                setError("Kon aanbevelingen niet laden");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <p>Loading…</p>;
    if (error) return <p>{error}</p>;

    return (
        <HotTemplate
            title={title}
            subtitle={subtitle}
            menuItems={menuItems}
        />
    );
};

export default HotForYou;
