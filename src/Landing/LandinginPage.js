import React, { useState } from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';
import { api } from 'apiService';
import { useAssortment } from '../context/AssortmentContext';
import octopusIcon from '../Dashboard/Icons/octopus.svg';

const LandingPage = () => {
    const navigate = useNavigate();
    const { refresh: refreshAssortments } = useAssortment();

    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [loginData, setLoginData] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return {
            email: params.get('email') || '',
            password: params.get('password') || '',
        };
    });
    const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (mode === 'login') {
            setLoginData((prev) => ({ ...prev, [id]: value }));
        } else {
            setRegisterData((prev) => ({ ...prev, [id]: value }));
        }
    };

    const handleLogin = async () => {
        setError(null);
        setLoading(true);
        try {
            const res = await api.post('/api/login', loginData, { withCredentials: true });

            if (res.data?.success) {
                if (res.data?.layers_matrix?.layers && Array.isArray(res.data.layers_matrix.layers)) {
                    sessionStorage.setItem('layersMatrix', JSON.stringify(res.data.layers_matrix));
                } else {
                    sessionStorage.removeItem('layersMatrix');
                }
                if (res.data.token) localStorage.setItem('token', res.data.token);
                if (res.data.business_id) localStorage.setItem('business_id', res.data.business_id);
                localStorage.setItem('logo', res.data.logo || '');
                localStorage.setItem('product_type', res.data.product_type ?? 2);

                refreshAssortments();
                navigate(res.data.product_type === 1 ? '/poi-matchmaking' : res.data.product_type === 3 ? '/optimize-assortment' : '/scan');
            } else {
                setError('Invalid credentials');
            }
        } catch {
            setError('Unable to connect — try again');
        }
        setLoading(false);
    };

    const handleRegister = async () => {
        setError(null);
        if (!registerData.email || !registerData.password) {
            setError('Email and password are required');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/register', registerData, { withCredentials: true });
            if (res.data?.success) {
                refreshAssortments();
                // New user — go to venue linking (claim page)
                navigate('/claim');
            } else {
                setError(res.data?.message || 'Registration failed');
            }
        } catch (e) {
            const msg = e.response?.data?.message;
            setError(msg || 'Unable to connect — try again');
        }
        setLoading(false);
    };

    // Auto-login if email & password provided via URL params
    React.useEffect(() => {
        if (!autoLoginAttempted && loginData.email && loginData.password) {
            setAutoLoginAttempted(true);
            handleLogin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            mode === 'login' ? handleLogin() : handleRegister();
        }
    };

    return (
        <div className="landing">
            <div className="landing-lines">
                <span /><span /><span /><span />
            </div>

            <div className="landing-card">
                <div className="landing-pulse-ring" />

                <img src={octopusIcon} alt="" className="landing-octopus" />
                <div className="landing-brand">Willy</div>
                <div className="landing-tagline">Serve your local demand</div>

                <div className="landing-form" onKeyDown={handleKeyDown}>
                    {mode === 'register' && (
                        <div className="landing-field">
                            <label className="landing-label" htmlFor="name">Name</label>
                            <input
                                className="landing-input"
                                type="text"
                                id="name"
                                placeholder="Your name"
                                value={registerData.name}
                                onChange={handleInputChange}
                                autoComplete="name"
                            />
                        </div>
                    )}

                    <div className="landing-field">
                        <label className="landing-label" htmlFor="email">Email</label>
                        <input
                            className="landing-input"
                            type="email"
                            id="email"
                            placeholder="you@company.com"
                            value={mode === 'login' ? loginData.email : registerData.email}
                            onChange={handleInputChange}
                            autoComplete="email"
                        />
                    </div>

                    <div className="landing-field">
                        <label className="landing-label" htmlFor="password">Password</label>
                        <input
                            className="landing-input"
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={mode === 'login' ? loginData.password : registerData.password}
                            onChange={handleInputChange}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                    </div>

                    <button
                        className="landing-submit"
                        onClick={mode === 'login' ? handleLogin : handleRegister}
                        disabled={loading}
                    >
                        {loading
                            ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                            : (mode === 'login' ? 'Sign in' : 'Create account')
                        }
                    </button>

                    {error && <div className="landing-error">{error}</div>}

                    <div className="landing-switch">
                        {mode === 'login' ? (
                            <span>
                                No account yet?{' '}
                                <button className="landing-switch-btn" onClick={() => { setMode('register'); setError(null); }}>
                                    Register
                                </button>
                            </span>
                        ) : (
                            <span>
                                Already have an account?{' '}
                                <button className="landing-switch-btn" onClick={() => { setMode('login'); setError(null); }}>
                                    Sign in
                                </button>
                            </span>
                        )}
                    </div>
                </div>

                <div className="landing-footer">Assortment intelligence</div>
            </div>
        </div>
    );
};

export default LandingPage;
