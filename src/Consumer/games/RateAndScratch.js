import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { CoreModule, CaptureVisionRouter, LicenseManager } from 'dynamsoft-barcode-reader-bundle';
import { api } from 'apiService';
import { lookupProduct } from '../productCatalog';
import WillyIcon from '../WillyIcon';
import './RateAndScratch.css';

const STEPS = { SCAN: 'scan', RATE: 'rate', DONE: 'done' };

const NATIVE_DETECTOR = typeof window.BarcodeDetector !== 'undefined';
const CAMERA_CONSTRAINTS = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } };

// Set once Dynamsoft fails (e.g. expired trial license) so later scanner (re)starts
// this session skip straight to the fallback instead of retrying a call known to fail.
let dynamsoftUnavailable = false;

// Dynamsoft — preload WASM in background so it's ready when scanner opens
CoreModule.engineResourcePaths.rootDirectory = 'https://cdn.jsdelivr.net/npm/';
LicenseManager.initLicense('DLS2eyJoYW5kc2hha2VDb2RlIjoiMTA1NjU3MzE4LU1UQTFOalUzTXpFNExYZGxZaTFVY21saGJGQnliMm8iLCJtYWluU2VydmVyVVJMIjoiaHR0cHM6Ly9tZGxzLmR5bmFtc29mdG9ubGluZS5jb20vIiwib3JnYW5pemF0aW9uSUQiOiIxMDU2NTczMTgiLCJzdGFuZGJ5U2VydmVyVVJMIjoiaHR0cHM6Ly9zZGxzLmR5bmFtc29mdG9ubGluZS5jb20vIiwiY2hlY2tDb2RlIjotMTAzOTk0NTcxM30=');
CoreModule.loadWasm(['DBR']);

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
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const dynamsoftRouterRef = useRef(null);
    const scanningRef = useRef(false);
    const lastScanRef = useRef({ gtin: null, at: 0 });
    const lastFrameAtRef = useRef(0);
    const lastAttemptAtRef = useRef(0);

    // Min ms between decode attempts — avoids hammering the WASM decoder on every
    // rendered frame, which was starving the video compositor on mid-range devices
    // (visible as brief black flashes) when a barcode is slow/hard to decode.
    const MIN_ATTEMPT_INTERVAL_MS = 120;
    // Log if either the rAF cadence or a single decode call takes noticeably longer
    // than expected, so we can tell which resource (main thread vs. decoder) is stalling.
    const FRAME_GAP_WARN_MS = 250;
    const DECODE_WARN_MS = 150;

    const stopScanner = useCallback(() => {
        if (dynamsoftRouterRef.current) {
            try { dynamsoftRouterRef.current.dispose(); } catch (_) {}
            dynamsoftRouterRef.current = null;
        }
        if (readerRef.current) {
            try { readerRef.current.reset(); } catch (_) {}
            readerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        scanningRef.current = false;
    }, []);

    const startScanner = useCallback(async () => {
        if (scanningRef.current) return;
        scanningRef.current = true;
        setScanError(null);
        lastFrameAtRef.current = 0;
        lastAttemptAtRef.current = 0;

        // Returns true when the scan loop should stop (product matched); false means
        // keep the camera stream running and keep decoding — a "not found" result must
        // NOT tear down/reacquire the camera, since that stop+start cycle of the real
        // hardware is what caused the visible black flash on repeated unmatched scans.
        const handleCode = (code, scanner, durationMs) => {
            if (code === lastScanRef.current.gtin && Date.now() - lastScanRef.current.at < 5000) return false;
            lastScanRef.current = { gtin: code, at: Date.now() };
            const found = lookupProduct(code);
            api.post('/api/consumer/log-scan', { scanner, gtin: code, found: !!found, duration_ms: durationMs }).catch(() => {});
            if (found) {
                stopScanner();
                setGtin(code);
                setProduct(found);
                setStep(STEPS.RATE);
                return true;
            }
            setScanError(`Product not found (${code}). Try another.`);
            return false;
        };

        // Primary: Dynamsoft
        try {
            if (dynamsoftUnavailable) throw new Error('Dynamsoft previously unavailable this session');
            const router = await CaptureVisionRouter.createInstance();
            dynamsoftRouterRef.current = router;

            const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            const tick = async () => {
                if (!scanningRef.current) return;
                const now = performance.now();
                const frameGap = now - lastFrameAtRef.current;
                if (lastFrameAtRef.current && frameGap > FRAME_GAP_WARN_MS) {
                    console.warn(`[scanner] frame gap ${frameGap.toFixed(0)}ms — rendering stalled`);
                }
                lastFrameAtRef.current = now;

                const dueForAttempt = now - lastAttemptAtRef.current >= MIN_ATTEMPT_INTERVAL_MS;
                if (dueForAttempt && videoRef.current?.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
                    lastAttemptAtRef.current = now;
                    try {
                        const t0 = performance.now();
                        const result = await router.capture(videoRef.current, 'ReadSingleBarcode');
                        const decodeMs = performance.now() - t0;
                        if (decodeMs > DECODE_WARN_MS) {
                            console.warn(`[scanner] slow decode: ${decodeMs.toFixed(0)}ms`);
                        }
                        const barcodes = (result.items ?? []).filter(i => i.type === 2);
                        if (barcodes.length > 0 && handleCode(barcodes[0].text, 'dynamsoft', Math.round(decodeMs))) {
                            return;
                        }
                    } catch (_) {}
                }
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
            return;
        } catch (e) {
            dynamsoftUnavailable = true;
            console.warn('[scanner] Dynamsoft failed, falling back:', e);
            if (dynamsoftRouterRef.current) {
                try { dynamsoftRouterRef.current.dispose(); } catch (_) {}
                dynamsoftRouterRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        }

        // Fallback: BarcodeDetector
        if (NATIVE_DETECTOR) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });

                const tick = async () => {
                    if (!scanningRef.current) return;
                    const now = performance.now();
                    const frameGap = now - lastFrameAtRef.current;
                    if (lastFrameAtRef.current && frameGap > FRAME_GAP_WARN_MS) {
                        console.warn(`[scanner] frame gap ${frameGap.toFixed(0)}ms — rendering stalled`);
                    }
                    lastFrameAtRef.current = now;

                    const dueForAttempt = now - lastAttemptAtRef.current >= MIN_ATTEMPT_INTERVAL_MS;
                    if (dueForAttempt && videoRef.current?.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
                        lastAttemptAtRef.current = now;
                        try {
                            const t0 = performance.now();
                            const barcodes = await detector.detect(videoRef.current);
                            const decodeMs = performance.now() - t0;
                            if (decodeMs > DECODE_WARN_MS) {
                                console.warn(`[scanner] slow decode: ${decodeMs.toFixed(0)}ms`);
                            }
                            if (barcodes.length > 0 && handleCode(barcodes[0].rawValue, 'native', Math.round(decodeMs))) {
                                return;
                            }
                        } catch (_) {}
                    }
                    rafRef.current = requestAnimationFrame(tick);
                };
                rafRef.current = requestAnimationFrame(tick);
                return;
            } catch (e) {
                setScanError('Camera access denied. Allow camera permission and try again.');
                scanningRef.current = false;
            }
        }

        // Last resort: ZXing
        try {
            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;
            await reader.decodeFromConstraints(CAMERA_CONSTRAINTS, videoRef.current, (result, err) => {
                if (result) handleCode(result.getText(), 'zxing', null);
                if (err && !(err instanceof NotFoundException)) console.warn('[scanner]', err);
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
        lastScanRef.current = { gtin, at: Date.now() };
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
                    {alreadyRated ? (
                        <>
                            <div className="ras-done-emoji">👍</div>
                            <div className="ras-done-title">Rating updated!</div>
                            <div className="ras-done-product">{product.brand} {product.name}</div>
                        </>
                    ) : (
                        <>
                            <div className="ras-done-title">Thank you!</div>
                            <div className="ras-willy-earned">
                                <WillyIcon size={32} />
                                <span>+1 Willy</span>
                            </div>
                            <div className="ras-done-product">{product.brand} {product.name}</div>
                        </>
                    )}
                    <button className="ras-submit" onClick={handleScanAnother}>Next rating</button>
                    <button className="ras-link" onClick={() => navigate('/consumer/home')}>Back to home</button>
                </div>
            )}
        </div>
    );
};

export default RateAndScratch;
