import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Games.css';

const GAMES = [
    {
        id: 'scratch',
        label: 'Scratch Card',
        description: 'Spend 5 willies for a chance to win more',
        icon: '🎰',
        to: '/consumer/scratch',
    },
    {
        id: 'spyder',
        label: 'Spyder',
        description: 'Butterflies and impostors',
        icon: '🕷️',
        to: '/consumer/game/spyder',
    },
    {
        id: 'quiz',
        label: 'Quiz vs Computer',
        description: 'Test your candy knowledge',
        icon: '🧠',
        comingSoon: true,
    },
];

const Games = () => {
    const navigate = useNavigate();

    return (
        <div className="games-root">
            <h2 className="games-section-title">Games</h2>

            <div className="games-list">
                {GAMES.map((game) => (
                    <button
                        key={game.id}
                        className="games-card"
                        disabled={game.comingSoon}
                        onClick={() => !game.comingSoon && navigate(game.to)}
                    >
                        <span className="games-card-icon">{game.icon}</span>
                        <div className="games-card-text">
                            <span className="games-card-label">
                                {game.label}
                                {game.comingSoon && <span className="games-card-badge">Coming soon</span>}
                            </span>
                            <span className="games-card-desc">{game.description}</span>
                        </div>
                        {!game.comingSoon && <span className="games-card-arrow">→</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Games;
