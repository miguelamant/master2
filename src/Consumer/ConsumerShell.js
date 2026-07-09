import React, { createContext, useContext, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { api } from 'apiService';
import BottomNav from './BottomNav';
import WillyIcon from './WillyIcon';
import './ConsumerShell.css';

const WilliesContext = createContext({ willies: 0, setWillies: () => {} });
export const useWillies = () => useContext(WilliesContext);

const ConsumerShell = () => {
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
        <WilliesContext.Provider value={{ willies, setWillies }}>
            <div className="cs-root">
                <header className="cs-header">
                    <div className="cs-brand">Willy</div>
                    <div className="cs-header-right">
                        <div className="cs-credits">
                            <WillyIcon size={20} />
                            <span className="cs-credits-count">{willies}</span>
                            <span className="cs-credits-label">willies</span>
                        </div>
                        <button className="cs-signout" onClick={handleSignOut} aria-label="Sign out">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M12 3v9" />
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main className="cs-main">
                    <Outlet />
                </main>

                <BottomNav />
            </div>
        </WilliesContext.Provider>
    );
};

export default ConsumerShell;
