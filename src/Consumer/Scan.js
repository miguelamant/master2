import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { CoreModule, CaptureVisionRouter, LicenseManager } from 'dynamsoft-barcode-reader-bundle';
import { api } from 'apiService';
import ProductSheet from './ProductSheet';
import './Scan.css';

const NATIVE_DETECTOR = typeof window.BarcodeDetector !== 'undefined';
const CAMERA_CONSTRAINTS = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } };

// Set once Dynamsoft fails (e.g. expired trial license) so later scanner (re)starts
// this session skip straight to the fallback instead of retrying a call known to fail.
let dynamsoftUnavailable = false;

// Dynamsoft — preload WASM in background so it's ready when scanner opens
CoreModule.engineResourcePaths.rootDirectory = 'https://cdn.jsdelivr.net/npm/';
LicenseManager.initLicense('DLS2eyJoYW5kc2hha2VDb2RlIjoiMTA1NjU3MzE4LU1UQTFOalUzTXpFNExYZGxZaTFVY21saGJGQnliMm8iLCJtYWluU2VydmVyVVJMIjoiaHR0cHM6Ly9tZGxzLmR5bmFtc29mdG9ubGluZS5jb20vIiwib3JnYW5pemF0aW9uSUQiOiIxMDU2NTczMTgiLCJzdGFuZGJ5U2VydmVyVVJMIjoiaHR0cHM6Ly9zZGxzLmR5bmFtc29mdG9ubGluZS5jb20vIiwiY2hlY2tDb2RlIjotMTAzOTk0NTcxM30=');
CoreModule.loadWasm(['DBR']);

const Scan = () => {
    const [scanError, setScanError] = useState(null);
    const [catalog, setCatalog] = useState(null);
    const [catalogError, setCatalogError] = useState(false);
    const [matchedProduct, setMatchedProduct] = useState(null); // { gtin, product }

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
            const found = catalog[code] ?? null;
            api.post('/api/consumer/log-scan', { scanner, gtin: code, found: !!found, duration_ms: durationMs }).catch(() => {});
            if (found) {
                stopScanner();
                setMatchedProduct({ gtin: code, product: found });
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
    }, [stopScanner, catalog]);

    const loadCatalog = useCallback(() => {
        setCatalogError(false);
        api.get('/api/consumer/products')
            .then(res => setCatalog(res.data.products))
            .catch(() => setCatalogError(true));
    }, []);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    useEffect(() => {
        if (catalog && !matchedProduct) startScanner();
        return () => stopScanner();
    }, [catalog, matchedProduct, startScanner, stopScanner]);

    const handleSheetClose = () => {
        if (matchedProduct) {
            lastScanRef.current = { gtin: matchedProduct.gtin, at: Date.now() };
        }
        setMatchedProduct(null);
    };

    return (
        <div className="scan-root">
            {catalogError && (
                <div className="scan-step">
                    <div className="scan-error">Couldn't load products. Check your connection and try again.</div>
                    <button className="scan-retry" onClick={loadCatalog}>Retry</button>
                </div>
            )}

            {!catalogError && !catalog && (
                <div className="scan-step">
                    <p className="scan-hint">Loading products…</p>
                </div>
            )}

            {!catalogError && catalog && (
                <div className="scan-step">
                    <div className="scan-viewfinder">
                        <video ref={videoRef} className="scan-video" autoPlay muted playsInline />
                        <div className="scan-frame">
                            <span className="scan-corner tl" />
                            <span className="scan-corner tr" />
                            <span className="scan-corner bl" />
                            <span className="scan-corner br" />
                            <div className="scan-line" />
                        </div>
                    </div>
                    <p className="scan-hint">Point at the barcode on the back of the package</p>
                    {scanError && <div className="scan-error">{scanError}</div>}
                </div>
            )}

            {matchedProduct && (
                <ProductSheet
                    gtin={matchedProduct.gtin}
                    product={matchedProduct.product}
                    onClose={handleSheetClose}
                />
            )}
        </div>
    );
};

export default Scan;
