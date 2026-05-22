import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { api } from 'apiService';
import { lookupProduct } from '../productCatalog';
import './RateAndScratch.css';

const STEPS = { SCAN: 'scan', RATE: 'rate', DONE: 'done' };

const RateAndScratch = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState(STEPS.SCAN);
    const [product, setProduct] = useState(null);
    const [gtin, setGtin] = useState(null);
    const [score, setScore] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [alreadyRated, setAlreadyRated] = useState(false);

    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const scanningRef = useRef(false);

    const stopScanner = useCallback(() => {
        if (readerRef.current) {
            try { readerRef.current.reset(); } catch (_) {}
            readerRef.current = null;
        }
        scanningRef.current = false;
    }, []);

    const startScanner = useCallback(async () => {
        if (scanningRef.current) return;
        scanningRef.current = true;
        setScanError(null);

        try {
            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                if (result) {
                    const code = result.getText();
                    stopScanner();
                    const found = lookupProduct(code);
                    if (found) {
                        setGtin(code);
                        setProduct(found);
                        setStep(STEPS.RATE);
                    } else {
                        setScanError(`Product not found (${code}). Try another.`);
                        scanningRef.current = false;
                        startScanner();
                    }
                }
                if (err && !(err instanceof NotFoundException)) {
                    console.warn('[scanner]', err);
                }
            });
        } catch (e) {
            setScanError('Camera access denied. Allow camera permission and try again.');
            scanningRef.current = false;
        }
    }, [stopScanner]);

    useEffect(() => {
        if (step === STEPS.SCAN) startScanner();
        return () => stopScanner();
    }, [step, startScanner, stopScanner]);

    const handleSubmit = async () => {
        if (score === null) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await api.post('/api/consumer/rate-product', { gtin, score });
            if (res.data?.success) {
                setAlreadyRated(res.data?.already_rated ?? false);
                setStep(STEPS.DONE);
            } else {
                setError(res.data?.message || 'Something went wrong');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Unable to save — try again');
        }
        setSubmitting(false);
    };

    const handleScanAnother = () => {
        setStep(STEPS.SCAN);
        setProduct(null);
        setGtin(null);
        setScore(null);
        setError(null);
        setAlreadyRated(false);
    };

    return (
        <div className="ras-root">
            {/* header */}
            <header className="ras-header">
                <button className="ras-back" onClick={() => navigate(`/consumer/category/${categoryId}`)}>←</button>
                <span className="ras-title">Rate &amp; Scratch</span>
            </header>

            {/* ── STEP: SCAN ── */}
            {step === STEPS.SCAN && (
                <div className="ras-scan-step">
                    <div className="ras-viewfinder">
                        <video ref={videoRef} className="ras-video" autoPlay muted playsInline />
                        <div className="ras-scan-frame">
                            <span className="ras-scan-corner tl" />
                            <span className="ras-scan-corner tr" />
                            <span className="ras-scan-corner bl" />
                            <span className="ras-scan-corner br" />
                            <div className="ras-scan-line" />
                        </div>
                    </div>
                    <p className="ras-scan-hint">Point at the barcode on the back of the package</p>
                    {scanError && <div className="ras-scan-error">{scanError}</div>}
                </div>
            )}

            {/* ── STEP: RATE ── */}
            {step === STEPS.RATE && product && (
                <div className="ras-rate-step">
                    <div className="ras-product-card">
                        <img src={product.image} alt={product.name} className="ras-product-img" />
                        <div className="ras-product-brand">{product.brand}</div>
                        <div className="ras-product-name">{product.name}</div>
                    </div>

                    <p className="ras-rate-prompt">How would you rate the taste?</p>

                    <div className="ras-slider-wrap">
                        <div className="ras-score-display">
                            {score !== null
                                ? <><span className="ras-score-num">{score % 1 === 0 ? score + '.0' : score}</span><span className="ras-score-denom">/10</span></>
                                : <span className="ras-score-placeholder">—</span>
                            }
                        </div>
                        <input
                            type="range"
                            className="ras-slider"
                            min="1"
                            max="10"
                            step="0.5"
                            value={score ?? 5.5}
                            onChange={(e) => setScore(parseFloat(e.target.value))}
                        />
                        <div className="ras-slider-labels">
                            <span>1</span><span>5</span><span>10</span>
                        </div>
                    </div>

                    {score !== null && (
                        <div className="ras-score-label">
                            {score <= 3 ? '😕 Not great' : score <= 5 ? '😐 Decent' : score <= 7 ? '😊 Good' : score <= 8.5 ? '🎉 Very good' : '🤩 Amazing!'}
                        </div>
                    )}

                    {error && <div className="ras-error">{error}</div>}

                    <button
                        className="ras-submit"
                        onClick={handleSubmit}
                        disabled={score === null || submitting}
                    >
                        {submitting ? 'Saving...' : 'Submit rating'}
                    </button>

                    <button className="ras-link" onClick={handleScanAnother}>Scan a different product</button>
                </div>
            )}

            {/* ── STEP: DONE ── */}
            {step === STEPS.DONE && product && (
                <div className="ras-done-step">
                    <div className="ras-done-emoji">{score >= 9 ? '🤩' : score >= 7 ? '🎉' : score >= 5 ? '👍' : '📝'}</div>
                    <div className="ras-done-title">
                        {alreadyRated ? 'Rating updated!' : 'Rating saved!'}
                    </div>
                    <div className="ras-done-product">{product.brand} {product.name}</div>
                    {!alreadyRated && <div className="ras-willy-earned">+1 Willy earned 🐛</div>}
                    <div className="ras-done-score">
                        <span className="ras-done-score-num">{score}</span>
                        <span className="ras-done-score-denom">/10</span>
                    </div>
                    <button className="ras-submit" onClick={handleScanAnother}>Rate another product</button>
                    <button className="ras-link" onClick={() => navigate(`/consumer/category/${categoryId}`)}>Back to category</button>
                </div>
            )}
        </div>
    );
};

export default RateAndScratch;
