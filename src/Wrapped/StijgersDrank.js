import React, { useEffect, useState } from 'react';
import TopTemplate from './TopTemplate';
import axios from 'axios';
import { api } from "apiService";

const StijgersDrank = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('/api/sales/growth', { withCredentials: true })
            .then(res => {
                const sorted = [...res.data].sort((a, b) => b.growth_abs - a.growth_abs);

                const topItems = sorted
                    .filter(i => i.growth_abs > 0)
                    .slice(0, 5)
                    .map(i => ({
                        name: i.name,
                        brand: i.brand,
                        extra: `+${i.growth_abs} (${i.growth_pct}%)`
                    }));

                const bottomItems = sorted
                    .filter(i => i.growth_abs < 0)
                    .slice(-5)
                    .reverse()
                    .map(i => ({
                        name: i.name,
                        brand: i.brand,
                        extra: `${i.growth_abs} (${i.growth_pct}%)`
                    }));

                setData({
                    topTitle: "Stijgers",
                    topSubtitle: "Items die in 2025 meer verkochten dan in 2024",
                    topItems,
                    bottomTitle: "Dalers",
                    bottomSubtitle: "Items die minder verkochten in 2025",
                    bottomItems
                });
            })
            .catch(err => {
                console.error(err);
                setError("Kon stijgingsdata niet laden");
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

export default StijgersDrank;
