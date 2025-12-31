import React, { useEffect, useState } from 'react';
import TopTemplate from './TopTemplate';
import axios from 'axios';
import { api } from "apiService";

const TopverkopersDrank = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('/api/sales/last-90-days', { withCredentials: true })
            .then(res => {
                const sorted = [...res.data].sort((a, b) => b.total_sold - a.total_sold);

                const topItems = sorted.slice(0, 5).map(item => ({
                    name: item.name,
                    brand: item.brand,
                    extra: `${item.total_sold} verkocht`
                }));

                const bottomItems = sorted
                    .filter(i => i.total_sold > 0)
                    .slice(-5)
                    .reverse()
                    .map(item => ({
                        name: item.name,
                        brand: item.brand,
                        extra: `${item.total_sold} verkocht`
                    }));

                setData({
                    topTitle: "Top 5 Bestsellers",
                    topSubtitle: "Meest verkochte items (laatste 90 dagen)",
                    topItems,
                    bottomTitle: "Lage verkoop",
                    bottomSubtitle: "Minst verkochte items",
                    bottomItems
                });
            })
            .catch(err => {
                console.error(err);
                setError("Kon topverkopers niet laden");
            });
    }, []);

    if (error) return <h1>{error}</h1>;
    if (!data) return <p>Loading…</p>;

    return (
        <TopTemplate
            topTitle={data.topTitle}
            topSubtitle={data.topSubtitle}
            topItems={data.topItems}
            bottomTitle={data.bottomTitle}
            bottomSubtitle={data.bottomSubtitle}
            bottomItems={data.bottomItems}
        />
    );
};

export default TopverkopersDrank;
