import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from 'apiService';
import './ConsumerAuth.css';
import octopusIcon from '../Dashboard/Icons/octopus.svg';

const TAGLINES = {
    email: 'Your local guide',
    code: 'Check your inbox',
    'set-password': 'One last step',
    login: 'Welcome back',
};

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
);

const ConsumerAuth = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('email'); // 'email' | 'code' | 'set-password' | 'login'
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const cooldownRef = useRef(null);
    const codeInputRef = useRef(null);
    const passwordInputRef = useRef(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const googleErr = params.get('google_error');
        if (googleErr === 'denied') setError('Google sign-in was cancelled.');
        else if (googleErr === 'not_configured') setError('Google sign-in is not configured yet.');
        else if (googleErr) setError('Google sign-in failed. Try another method.');
    }, []);

    useEffect(() => {
        return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
    }, []);

    useEffect(() => {
        if (step === 'code' && codeInputRef.current) codeInputRef.current.focus();
        if (step === 'set-password' && passwordInputRef.current) passwordInputRef.current.focus();
    }, [step]);

    const startCooldown = () => {
        setResendCooldown(60);
        cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleRequestOtp = async () => {
        setError(null);
        if (!email) { setError('Enter your email address'); return; }
        setLoading(true);
        try {
            const res = await api.post('/api/consumer/request-otp', { email });
            if (res.data?.success) {
                setStep('code');
                startCooldown();
            } else {
                setError(res.data?.message || 'Something went wrong');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Unable to connect — try again');
        }
        setLoading(false);
    };

    const handleVerifyOtp = async () => {
        setError(null);
        if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
        setLoading(true);
        try {
            const res = await api.post('/api/consumer/verify-otp', { email, code });
            if (res.data?.success) {
                setStep('set-password');
            } else {
                setError(res.data?.message || 'Invalid code');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Unable to connect — try again');
        }
        setLoading(false);
    };

    const handleSetPassword = async () => {
        setError(null);
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const res = await api.post('/api/consumer/set-password', { password });
            if (res.data?.success) {
                navigate('/consumer');
            } else {
                setError(res.data?.message || 'Something went wrong');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Unable to connect — try again');
        }
        setLoading(false);
    };

    const handlePasswordLogin = async () => {
        setError(null);
        if (!email || !password) { setError('Enter your email and password'); return; }
        setLoading(true);
        try {
            const res = await api.post('/api/consumer/login', { email, password });
            if (res.data?.success) {
                navigate('/consumer');
            } else {
                setError(res.data?.message || 'Invalid credentials');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Unable to connect — try again');
        }
        setLoading(false);
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError(null);
        setCode('');
        setLoading(true);
        try {
            const res = await api.post('/api/consumer/request-otp', { email });
            if (res.data?.success) startCooldown();
            else setError(res.data?.message || 'Something went wrong');
        } catch (e) {
            setError(e.response?.data?.message || 'Unable to connect — try again');
        }
        setLoading(false);
    };

    const handleGoogleSignIn = () => {
        const base = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3007';
        window.location.href = `${base}/api/consumer/google/start`;
    };

    const resetToEmail = () => {
        setStep('email');
        setCode('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
    };

    const enterKeyHandler = (action) => (e) => {
        if (e.key === 'Enter') action();
    };

    return (
        <div className="consumer-auth">
            <div className="consumer-auth-card">
                <div className="consumer-auth-pulse-ring" />
                <img src={octopusIcon} alt="" className="consumer-auth-octopus" />
                <div className="consumer-auth-brand">Willy</div>
                <div className="consumer-auth-tagline">{TAGLINES[step]}</div>

                {/* ── Step: email (OTP entry point) ── */}
                {step === 'email' && (
                    <div className="consumer-auth-form">
                        <div className="consumer-auth-field">
                            <label className="consumer-auth-label" htmlFor="email">Email</label>
                            <input
                                className="consumer-auth-input"
                                type="email"
                                id="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                autoFocus
                                onKeyDown={enterKeyHandler(handleRequestOtp)}
                            />
                        </div>

                        <button className="consumer-auth-submit" onClick={handleRequestOtp} disabled={loading}>
                            {loading ? 'Sending...' : 'Send code'}
                        </button>

                        <div className="consumer-auth-divider-row">
                            <span className="consumer-auth-divider-line" />
                            <span className="consumer-auth-divider-text">or</span>
                            <span className="consumer-auth-divider-line" />
                        </div>

                        <button className="consumer-auth-google-btn" onClick={handleGoogleSignIn} disabled={loading}>
                            <GoogleIcon />
                            Continue with Google
                        </button>

                        {error && <div className="consumer-auth-error">{error}</div>}

                        <div className="consumer-auth-actions">
                            <button className="consumer-auth-link" onClick={() => { setStep('login'); setError(null); }}>
                                Sign in with password
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step: code (OTP verification) ── */}
                {step === 'code' && (
                    <div className="consumer-auth-form">
                        <p className="consumer-auth-hint">
                            Code sent to <strong>{email}</strong>
                        </p>

                        <div className="consumer-auth-field">
                            <label className="consumer-auth-label" htmlFor="code">6-digit code</label>
                            <input
                                className="consumer-auth-input consumer-auth-otp-input"
                                type="text"
                                inputMode="numeric"
                                id="code"
                                placeholder="000000"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                autoComplete="one-time-code"
                                ref={codeInputRef}
                                onKeyDown={enterKeyHandler(handleVerifyOtp)}
                            />
                        </div>

                        <button className="consumer-auth-submit" onClick={handleVerifyOtp} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>

                        {error && <div className="consumer-auth-error">{error}</div>}

                        <div className="consumer-auth-actions">
                            <button className="consumer-auth-link" onClick={handleResend} disabled={resendCooldown > 0 || loading}>
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                            </button>
                            <span className="consumer-auth-divider">·</span>
                            <button className="consumer-auth-link" onClick={resetToEmail}>
                                Change email
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step: set-password (after OTP) ── */}
                {step === 'set-password' && (
                    <div className="consumer-auth-form">
                        <p className="consumer-auth-hint">
                            Create a password so you can sign in directly next time.
                        </p>

                        <div className="consumer-auth-field">
                            <label className="consumer-auth-label" htmlFor="password">Password</label>
                            <input
                                className="consumer-auth-input"
                                type="password"
                                id="password"
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                ref={passwordInputRef}
                                onKeyDown={enterKeyHandler(handleSetPassword)}
                            />
                        </div>

                        <div className="consumer-auth-field">
                            <label className="consumer-auth-label" htmlFor="confirmPassword">Confirm password</label>
                            <input
                                className="consumer-auth-input"
                                type="password"
                                id="confirmPassword"
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                onKeyDown={enterKeyHandler(handleSetPassword)}
                            />
                        </div>

                        <button className="consumer-auth-submit" onClick={handleSetPassword} disabled={loading}>
                            {loading ? 'Saving...' : 'Set password'}
                        </button>

                        {error && <div className="consumer-auth-error">{error}</div>}

                        <div className="consumer-auth-actions">
                            <button className="consumer-auth-link" onClick={() => navigate('/consumer')}>
                                Skip for now
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step: login (password login) ── */}
                {step === 'login' && (
                    <div className="consumer-auth-form">
                        <div className="consumer-auth-field">
                            <label className="consumer-auth-label" htmlFor="login-email">Email</label>
                            <input
                                className="consumer-auth-input"
                                type="email"
                                id="login-email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                autoFocus
                                onKeyDown={enterKeyHandler(handlePasswordLogin)}
                            />
                        </div>

                        <div className="consumer-auth-field">
                            <label className="consumer-auth-label" htmlFor="login-password">Password</label>
                            <input
                                className="consumer-auth-input"
                                type="password"
                                id="login-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                onKeyDown={enterKeyHandler(handlePasswordLogin)}
                            />
                        </div>

                        <button className="consumer-auth-submit" onClick={handlePasswordLogin} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                        <div className="consumer-auth-divider-row">
                            <span className="consumer-auth-divider-line" />
                            <span className="consumer-auth-divider-text">or</span>
                            <span className="consumer-auth-divider-line" />
                        </div>

                        <button className="consumer-auth-google-btn" onClick={handleGoogleSignIn} disabled={loading}>
                            <GoogleIcon />
                            Continue with Google
                        </button>

                        {error && <div className="consumer-auth-error">{error}</div>}

                        <div className="consumer-auth-actions">
                            <button className="consumer-auth-link" onClick={resetToEmail}>
                                Forgot password? Use a code
                            </button>
                        </div>
                    </div>
                )}

                <div className="consumer-auth-footer">Discover local</div>
            </div>
        </div>
    );
};

export default ConsumerAuth;
