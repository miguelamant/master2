import React, { useEffect, useState } from 'react';
import HotTemplate from './HotTemplate';
import axios from 'axios';
import { api } from "apiService";

const HotForNextSeason = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const title = "Hot Next Season";
    const subtitle = "Drankjes die perfect zijn voor het volgende seizoen.";

    const SEASON = "Summer"; // <-- Pas dit aan indien nodig

    useEffect(() => {
        const cached = localStorage.getItem("wrapped_next_season");
        if (cached) {
            setMenuItems(JSON.parse(cached));
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const res = await api.get('/api/items-not-on-menu', { withCredentials: true });

                const seasonalItems = res.data.filter(item =>
                    item.season?.toLowerCase().includes(SEASON.toLowerCase())
                ).slice(0, 5); // eventueel limiteren

                let withDescriptions;

                try {
                    const aiRes = await api.post('/api/describe-item', {
                        items: seasonalItems.map(i => ({ name: i.name, category: i.category }))
                    }, { withCredentials: true });

                    withDescriptions = aiRes.data.result;
                } catch (err) {
                    console.error("AI-generatie mislukt voor seizoen-items:", err);
                    withDescriptions = seasonalItems.map(i => ({
                        name: i.name,
                        description: `Een ${i.category.toLowerCase()} die perfect past bij ${SEASON.toLowerCase()}.`
                    }));
                }

                setMenuItems(withDescriptions);
                localStorage.setItem("wrapped_next_season", JSON.stringify(withDescriptions));
            } catch (err) {
                console.error(err);
                setError("Kon seizoenssuggesties niet laden.");
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

export default HotForNextSeason;
