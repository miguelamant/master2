import React, { useState, useEffect } from 'react';
import { api } from 'apiService';
import WillyIcon from './WillyIcon';
import { getRatingPercent } from './ratingStats';
import './ProductSheet.css';

const ProductSheet = ({ gtin, product, onClose }) => {
    const [expanded, setExpanded] = useState(false);
    const [previousScore, setPreviousScore] = useState(null);
    const [loadingPrevious, setLoadingPrevious] = useState(true);
    const [score, setScore] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const reference = product.reference;
    const [showReferenceStep, setShowReferenceStep] = useState(false);
    const [refScore, setRefScore] = useState(null);
    const [refSubmitting, setRefSubmitting] = useState(false);
    const [refError, setRefError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        api.get(`/api/consumer/rating/${gtin}`)
            .then((res) => {
                if (cancelled) return;
                const prev = res.data?.score ?? null;
                setPreviousScore(prev);
                setScore(prev);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoadingPrevious(false); });
        return () => { cancelled = true; };
    }, [gtin]);

    const handleSubmit = async () => {
        if (score === null) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await api.post('/api/consumer/rate-product', { gtin, score });
            if (res.data?.success) {
                setResult({ alreadyRated: res.data?.already_rated ?? false });
                if (reference) {
                    api.get(`/api/consumer/rating/${reference.gtin}`)
                        .then((r) => setRefScore(r.data?.score ?? null))
                        .catch(() => {});
                    setShowReferenceStep(true);
                }
            } else {
                setError(res.data?.message || 'Something went wrong');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Unable to save — try again');
        }
        setSubmitting(false);
    };

    const handleReferenceSubmit = async () => {
        if (refScore === null || !reference) return;
        setRefSubmitting(true);
        setRefError(null);
        try {
            const res = await api.post('/api/consumer/rate-product', { gtin: reference.gtin, score: refScore });
            if (res.data?.success) {
                setShowReferenceStep(false);
            } else {
                setRefError(res.data?.message || 'Something went wrong');
            }
        } catch (e) {
            setRefError(e.response?.data?.message || 'Unable to save — try again');
        }
        setRefSubmitting(false);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const formatScore = (s) => (s % 1 === 0 ? s + '.0' : s);

    const ratingPct = getRatingPercent(gtin);
    const ratingCompareText = ratingPct !== null
        ? `${ratingPct}% of people rate this as highly as the leading reference product`
        : 'No public ratings';

    return (
        <div className="ps-backdrop" onClick={handleBackdropClick}>
            <div className={`ps-sheet${expanded ? ' ps-sheet-expanded' : ''}`}>
                <button className="ps-close" onClick={onClose} aria-label="Close">✕</button>

                <div className="ps-header" onClick={() => !result && setExpanded((v) => !v)}>
                    <div className="ps-handle" />
                    <img src={product.image} alt={product.name} className="ps-image" />
                    <div className="ps-title">
                        <div className="ps-brand">{product.brand}</div>
                        <div className="ps-name">{product.name}</div>
                    </div>
                </div>

                {!expanded && !result && (
                    <div className="ps-collapsed">
                        <div className="ps-prev-rating">
                            {loadingPrevious
                                ? '…'
                                : previousScore !== null
                                    ? `You rated this ${formatScore(previousScore)}/10`
                                    : 'Not rated yet'}
                        </div>
                        {!loadingPrevious && previousScore !== null && (
                            <div className="ps-rating-compare">{ratingCompareText}</div>
                        )}
                        <button className="ps-cta" onClick={() => setExpanded(true)}>
                            {previousScore !== null ? 'Update rating' : 'Rate it'}
                        </button>
                    </div>
                )}

                {expanded && !result && (
                    <div className="ps-expanded">
                        <p className="ps-rate-prompt">How would you rate the taste?</p>

                        <div className="ps-slider-wrap">
                            <div className="ps-score-display">
                                {score !== null
                                    ? <><span className="ps-score-num">{formatScore(score)}</span><span className="ps-score-denom">/10</span></>
                                    : <span className="ps-score-placeholder">—</span>}
                            </div>
                            <input
                                type="range"
                                className="ps-slider"
                                min="1"
                                max="10"
                                step="0.5"
                                value={score ?? 5.5}
                                onChange={(e) => setScore(parseFloat(e.target.value))}
                            />
                            <div className="ps-slider-labels">
                                <span>1</span><span>5</span><span>10</span>
                            </div>
                        </div>

                        {score !== null && (
                            <div className="ps-score-label">
                                {score <= 3 ? '😕 Not great' : score <= 5 ? '😐 Decent' : score <= 7 ? '😊 Good' : score <= 8.5 ? '🎉 Very good' : '🤩 Amazing!'}
                            </div>
                        )}

                        {error && <div className="ps-error">{error}</div>}

                        <button className="ps-cta" onClick={handleSubmit} disabled={score === null || submitting}>
                            {submitting ? 'Saving…' : 'Submit rating'}
                        </button>
                    </div>
                )}

                {result && showReferenceStep && reference && (
                    <div className="ps-expanded ps-ref-step">
                        <div className="ps-ref-label">Now rate the reference</div>
                        <div className="ps-ref-product">
                            {reference.image && <img src={reference.image} alt={reference.name} className="ps-ref-image" />}
                            <div className="ps-title">
                                <div className="ps-brand">{reference.brand}</div>
                                <div className="ps-name">{reference.name}</div>
                            </div>
                        </div>
                        <p className="ps-rate-prompt">How would you rate the taste?</p>

                        <div className="ps-slider-wrap">
                            <div className="ps-score-display">
                                {refScore !== null
                                    ? <><span className="ps-score-num">{formatScore(refScore)}</span><span className="ps-score-denom">/10</span></>
                                    : <span className="ps-score-placeholder">—</span>}
                            </div>
                            <input
                                type="range"
                                className="ps-slider"
                                min="1"
                                max="10"
                                step="0.5"
                                value={refScore ?? 5.5}
                                onChange={(e) => setRefScore(parseFloat(e.target.value))}
                            />
                            <div className="ps-slider-labels">
                                <span>1</span><span>5</span><span>10</span>
                            </div>
                        </div>

                        {refError && <div className="ps-error">{refError}</div>}

                        <div className="ps-ref-actions">
                            <button className="ps-skip" onClick={() => setShowReferenceStep(false)}>Skip</button>
                            <button className="ps-cta" onClick={handleReferenceSubmit} disabled={refScore === null || refSubmitting}>
                                {refSubmitting ? 'Saving…' : 'Submit rating'}
                            </button>
                        </div>
                    </div>
                )}

                {result && !showReferenceStep && (
                    <div className="ps-done">
                        {result.alreadyRated ? (
                            <>
                                <div className="ps-done-emoji">👍</div>
                                <div className="ps-done-title">Rating updated!</div>
                            </>
                        ) : (
                            <>
                                <div className="ps-done-title">Thank you!</div>
                                <div className="ps-willy-earned">
                                    <WillyIcon size={28} />
                                    <span>+1 Willy</span>
                                </div>
                            </>
                        )}
                        <div className="ps-rating-compare">{ratingCompareText}</div>
                        <button className="ps-cta" onClick={onClose}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductSheet;
