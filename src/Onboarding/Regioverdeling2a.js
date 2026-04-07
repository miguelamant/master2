import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../apiService";
import { clamp, setValueKeep100 } from "./components/distributionMath";
import Layout from "./layoutOnboarding";
import "./Regioverdeling2a.css";

const PERSONAS = [
  { key: "belgian", label: "Belgian", flag: "🇧🇪", color: "#F59E0B" },
  { key: "french",  label: "French",  flag: "🇫🇷", color: "#EF4444" },
  { key: "german",  label: "German",  flag: "🇩🇪", color: "#6366F1" },
  { key: "dutch",   label: "Dutch",   flag: "🇳🇱", color: "#10B981" },
];

const KEYS = PERSONAS.map((p) => p.key);
const DEFAULT = { belgian: 25, french: 25, german: 25, dutch: 25 };

export default function Regioverdeling2a() {
  const navigate = useNavigate();
  const [weights, setWeights] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Load from DB on mount
  useEffect(() => {
    api.get("/api/assortments/persona-weights")
      .then(({ data }) => {
        setWeights({
          belgian: data.belgian ?? 25,
          french:  data.french  ?? 25,
          german:  data.german  ?? 25,
          dutch:   data.dutch   ?? 25,
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError("Could not load persona weights.");
      });
  }, []);

  // Drag state per row
  const barRefs = useRef({});
  const [dragging, setDragging] = useState(null);

  const onPointerDown = (e, key) => {
    setDragging(key);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e, key) => {
    if (dragging !== key) return;
    const el = barRefs.current[key];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
    setWeights((prev) => setValueKeep100(prev, KEYS, key, pct));
  };

  const onPointerUp = () => setDragging(null);

  const onKeyDown = (e, key) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const cur = Number(weights[key] || 0);
    const next = e.key === "ArrowLeft" ? cur - step : cur + step;
    setWeights((prev) => setValueKeep100(prev, KEYS, key, next));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.patch("/api/assortments/persona-weights", weights);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Clientele" showFooter={false}>
      <div className="pw-page">
        <p className="pw-subtitle">
          Set the distribution of your clientele by nationality. This affects the
          recommendation engine.
        </p>

        {loading ? (
          <div className="pw-loading">Loading…</div>
        ) : (
          <div className="pw-rows">
            {PERSONAS.map(({ key, label, flag, color }) => {
              const pct = Number(weights[key] || 0);
              return (
                <div key={key} className="pw-row">
                  <div className="pw-row-label">
                    <span className="pw-flag">{flag}</span>
                    <span className="pw-name">{label}</span>
                  </div>

                  <div
                    className="pw-bar-wrap"
                    ref={(el) => (barRefs.current[key] = el)}
                  >
                    {/* Filled portion */}
                    <div
                      className="pw-bar-fill"
                      style={{ width: `${pct}%`, background: color }}
                    />

                    {/* Drag handle */}
                    <div
                      className="pw-handle"
                      style={{ left: `${pct}%`, borderColor: color, color }}
                      role="slider"
                      tabIndex={0}
                      aria-label={`${label} weight`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      onPointerDown={(e) => onPointerDown(e, key)}
                      onPointerMove={(e) => onPointerMove(e, key)}
                      onPointerUp={onPointerUp}
                      onKeyDown={(e) => onKeyDown(e, key)}
                    >
                      <span className="pw-handle-pct">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pw-actions">
          {error && <div className="pw-error">{error}</div>}
          {saved && <div className="pw-success">Saved!</div>}
          <button
            className="start-button small"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            className="pw-back-btn"
            onClick={() => navigate("/optimize-assortment")}
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
}
