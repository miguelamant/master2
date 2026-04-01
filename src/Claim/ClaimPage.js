import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../apiService';
import LocationPicker from '../Scan/LocationPicker';
import '../Scan/ScanPage.css';
import './ClaimPage.css';

const SOCIAL_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'linkedin.com', 'youtube.com'];

function extractDomain(urlOrEmail) {
  try {
    if (urlOrEmail.includes('@')) {
      return urlOrEmail.split('@')[1].toLowerCase().replace(/^www\./, '');
    }
    const url = new URL(urlOrEmail.startsWith('http') ? urlOrEmail : `https://${urlOrEmail}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export default function ClaimPage() {
  const navigate = useNavigate();

  // Step tracking
  const [step, setStep] = useState(1);

  // Step 1: Venue
  const [location, setLocation] = useState(null);

  // Step 2: Email
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  // Step 3: Code
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [verifyResult, setVerifyResult] = useState(null);

  // Step 4: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingPw, setSettingPw] = useState(false);
  const [pwError, setPwError] = useState(null);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Check if already logged in
  useEffect(() => {
    api.get('/api/user')
      .then(() => navigate('/scan'))
      .catch(() => {}); // not logged in, stay on claim page
  }, [navigate]);

  // Domain matching logic
  const websiteDomain = location?.website ? extractDomain(location.website) : null;
  const emailDomain = email.includes('@') ? extractDomain(email) : null;
  const isSocialWebsite = websiteDomain && SOCIAL_DOMAINS.some(d => websiteDomain.endsWith(d));
  const needsDomainMatch = websiteDomain && !isSocialWebsite;
  const domainMatches = !needsDomainMatch || (emailDomain === websiteDomain);

  const handleSendCode = async () => {
    setSending(true);
    setSendError(null);
    try {
      await api.post('/api/claim/send-code', {
        email,
        place_id: location.place_id,
        venue_name: location.name,
        website: location.website || null,
      });
      setStep(3);
      setCooldown(60);
    } catch (e) {
      setSendError(e.response?.data?.message || 'Failed to send code');
    }
    setSending(false);
  };

  const handleResend = async () => {
    setCooldown(60);
    setSendError(null);
    try {
      await api.post('/api/claim/send-code', {
        email,
        place_id: location.place_id,
        venue_name: location.name,
        website: location.website || null,
      });
    } catch (e) {
      setSendError(e.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const { data } = await api.post('/api/claim/verify-code', {
        email,
        code,
        place_id: location.place_id,
        venue_name: location.name,
        website: location.website || null,
      });
      setVerifyResult(data);
      // Always go to set-password step so user can set their own password
      setStep(4);
    } catch (e) {
      setVerifyError(e.response?.data?.message || 'Verification failed');
    }
    setVerifying(false);
  };

  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    setSettingPw(true);
    setPwError(null);
    try {
      await api.post('/api/claim/set-password', { password });
      setStep(5);
    } catch (e) {
      setPwError(e.response?.data?.message || 'Failed to set password');
    }
    setSettingPw(false);
  };

  return (
    <div className="claim-page">
      <div className="claim-header">
        <button className="claim-header__back" onClick={() => window.history.back()}>
          &larr; Back
        </button>
        <h1>Claim Your Venue</h1>
      </div>

      {/* Step 1: Select Venue */}
      <div className="scan-section">
        <h2 className="scan-section__title">
          <span className="scan-section__step">1</span>
          Find your venue
        </h2>
        <LocationPicker
          location={location}
          onSelect={(loc) => {
            setLocation(loc);
            if (loc.place_id) setStep(2);
          }}
          onClear={() => {
            setLocation(null);
            setStep(1);
            setEmail('');
            setCode('');
          }}
        />
      </div>

      {/* Step 2: Enter Email */}
      {step >= 2 && location && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">2</span>
            Verify your email
          </h2>

          <div className="claim-venue-banner">
            <div className="claim-venue-banner__info">
              <div className="claim-venue-banner__name">{location.name}</div>
              <div className="claim-venue-banner__address">{location.formatted_address}</div>
              {location.website && (
                <div className="claim-venue-banner__website">{location.website}</div>
              )}
            </div>
          </div>

          {step === 2 && (
            <>
              <input
                type="email"
                className="claim-email-input"
                placeholder={needsDomainMatch
                  ? `Enter your email (e.g. info@${websiteDomain})`
                  : 'Enter your business email'
                }
                value={email}
                onChange={e => { setEmail(e.target.value); setSendError(null); }}
              />

              {/* Domain hint */}
              {email && needsDomainMatch && (
                <div className={`claim-domain-hint ${domainMatches ? 'claim-domain-hint--ok' : 'claim-domain-hint--error'}`}>
                  {domainMatches
                    ? `Domain matches ${websiteDomain}`
                    : `Email domain must match ${websiteDomain}`
                  }
                </div>
              )}

              {!location.website && email && (
                <div className="claim-domain-hint">
                  No website listed on Google Maps — any business email is accepted.
                </div>
              )}

              {isSocialWebsite && email && (
                <div className="claim-domain-hint">
                  Social media URL detected — any business email is accepted.
                </div>
              )}

              {sendError && (
                <div className="claim-domain-hint claim-domain-hint--error">{sendError}</div>
              )}

              <button
                className="claim-btn"
                onClick={handleSendCode}
                disabled={!email || !domainMatches || sending}
              >
                {sending ? 'Sending...' : 'Send verification code'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: Enter Code */}
      {step === 3 && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">3</span>
            Enter verification code
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          <input
            type="text"
            className="claim-code-input"
            maxLength={6}
            value={code}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              setCode(val);
              setVerifyError(null);
            }}
            placeholder="000000"
          />

          {verifyError && (
            <div className="claim-domain-hint claim-domain-hint--error">{verifyError}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="claim-btn"
              onClick={handleVerify}
              disabled={code.length !== 6 || verifying}
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>

            <button
              className="claim-resend"
              onClick={handleResend}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Set Password */}
      {step === 4 && (
        <div className="scan-section">
          <h2 className="scan-section__title">
            <span className="scan-section__step">4</span>
            Set your password
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
            Choose a password so you can log in again later.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="password"
              className="claim-password-input"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={e => { setPassword(e.target.value); setPwError(null); }}
            />
            <input
              type="password"
              className="claim-password-input"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPwError(null); }}
            />
          </div>

          {pwError && (
            <div className="claim-domain-hint claim-domain-hint--error">{pwError}</div>
          )}

          <button
            className="claim-btn"
            onClick={handleSetPassword}
            disabled={!password || !confirmPassword || settingPw}
          >
            {settingPw ? 'Saving...' : 'Set password'}
          </button>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <div className="scan-section">
          <div className="claim-success">
            <div className="claim-success__check">&#10003;</div>
            <h2>Venue claimed!</h2>
            <p>
              <strong>{location.name}</strong> is now linked to your account.
              You can log in anytime with <strong>{email}</strong> and your password.
            </p>
            <div className="claim-success__actions">
              <button
                className="claim-btn claim-btn--success"
                onClick={() => navigate('/scan')}
              >
                Scan your menu card
              </button>
              <button
                className="claim-btn"
                onClick={() => navigate('/dashboard')}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
