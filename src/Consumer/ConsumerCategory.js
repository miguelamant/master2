import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from 'apiService';
import './ConsumerCategory.css';
import candyImg from './candy-category.jpeg';

const CATEGORY_META = {
    'better-for-you-candy': {
        label: 'Better For You Candy',
        image: candyImg,
    },
    'natural-energy-drinks': {
        label: 'Natural Energy Drinks',
        image: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=900&q=80',
    },
};

const CANDY_GAMES = [
    {
        id: 'rate-and-scratch',
        label: 'Rate & Scratch',
        description: 'Try a product and win willies',
        icon: '🎰',
    },
    {
        id: 'spyder',
        label: 'Spyder',
        description: 'Butterflies and impostors',
        icon: '🕷️',
    },
    {
        id: 'quiz',
        label: 'Quiz vs Computer',
        description: 'Test your candy knowledge',
        icon: '🧠',
    },
];

const ConsumerCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/user').then((res) => {
            if (res.data?.user?.user_type === 'consumer') {
                setUser(res.data.user);
            } else {
                navigate('/join');
            }
        }).catch(() => navigate('/join'))
          .finally(() => setLoading(false));
    }, [navigate]);

    if (loading) return null;

    const meta = CATEGORY_META[id];
    if (!meta) {
        navigate('/consumer/home');
        return null;
    }

    const games = id === 'better-for-you-candy' ? CANDY_GAMES : [];

    return (
        <div className="cc-root">
            {/* hero */}
            <div className="cc-hero">
                <img src={meta.image} alt={meta.label} className="cc-hero-img" />
                <div className="cc-hero-overlay" />
                <button className="cc-back" onClick={() => navigate('/consumer/home')} aria-label="Back">
                    ←
                </button>
                <h1 className="cc-hero-title">{meta.label}</h1>
            </div>

            {/* game list */}
            <main className="cc-main">
                <p className="cc-subtitle">Pick a game</p>

                <div className="cc-games">
                    {games.map((game) => (
                        <button
                            key={game.id}
                            className="cc-game-card"
                            onClick={() => navigate(`/consumer/game/${id}/${game.id}`)}
                        >
                            <span className="cc-game-icon">{game.icon}</span>
                            <div className="cc-game-text">
                                <span className="cc-game-label">{game.label}</span>
                                <span className="cc-game-desc">{game.description}</span>
                            </div>
                            <span className="cc-game-arrow">→</span>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ConsumerCategory;
