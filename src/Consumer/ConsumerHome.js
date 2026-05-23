import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'apiService';
import './ConsumerHome.css';
import candyImg from './candy-category.jpeg';
import WillyIcon from './WillyIcon';

const CATEGORIES = [
    {
        id: 'natural-energy-drinks',
        label: 'Natural Energy Drinks',
        image: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=900&q=80',
    },
    {
        id: 'better-for-you-candy',
        label: 'Better For You Candy',
        image: candyImg,
    },
];

const ConsumerHome = () => {
    const navigate = useNavigate();
    const [willies, setWillies] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/user').then((res) => {
            if (res.data?.user?.user_type === 'consumer') {
                return api.get('/api/consumer/willies');
            } else {
                navigate('/join');
            }
        }).then((res) => {
            if (res?.data?.success) setWillies(res.data.balance);
        }).catch(() => {
            navigate('/join');
        }).finally(() => setLoading(false));
    }, [navigate]);

    const handleSignOut = async () => {
        await api.post('/api/logout');
        navigate('/join');
    };

    if (loading) return null;

    return (
        <div className="ch-root">
            <header className="ch-header">
                <div className="ch-brand">Willy</div>
                <div className="ch-header-right">
                    <div className="ch-credits">
                        <WillyIcon size={20} />
                        <span className="ch-credits-count">{willies}</span>
                        <span className="ch-credits-label">willies</span>
                    </div>
                    {willies >= 5 && (
                        <button className="ch-scratch-btn" onClick={() => navigate('/consumer/scratch')}>
                            Scratch
                        </button>
                    )}
                </div>
            </header>

            <main className="ch-main">
                <h2 className="ch-section-title">Discover</h2>

                <div className="ch-grid">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            className="ch-card"
                            onClick={() => navigate(`/consumer/category/${cat.id}`)}
                        >
                            <img
                                src={cat.image}
                                alt={cat.label}
                                className="ch-card-img"
                                loading="lazy"
                            />
                            <div className="ch-card-overlay" />
                            <span className="ch-card-label">{cat.label}</span>
                            <span className="ch-card-arrow">→</span>
                        </button>
                    ))}
                </div>
            </main>

            <footer className="ch-footer">
                <button className="ch-signout" onClick={handleSignOut}>Sign out</button>
            </footer>
        </div>
    );
};

export default ConsumerHome;
