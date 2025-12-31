// src/Dashboard/ToAdd/components/PresetInfo.jsx
import React, { useMemo } from "react";
import "./PresetInfo.css";

export default function PresetInfo({ preset }) {
    // LOG: props seen by the component
    console.debug("[PresetInfo] render", {
        hasPreset: !!preset,
        id: preset?.id,
        name: preset?.name,
        hasInfo: !!preset?.info,
        info: preset?.info
    });

    const info = preset?.info;
    const src = useMemo(() => info?.image || null, [info]);

    // LOG: resolved src
    console.debug("[PresetInfo] image src =", src, "type:", typeof src);

    // Always render a box so you can **see** its space even if image is null
    return (
        <div className="preset-info" role="note" aria-label="Preset explanation" style={{outline:'1px dashed rgba(0,0,0,.15)'}}>
            {src ? (
                <img
                    className="preset-info__img"
                    src={src}
                    alt=""
                    aria-hidden="true"
                    onLoad={() => console.debug("[PresetInfo] image loaded")}
                    onError={(e) => console.warn("[PresetInfo] image failed to load", { src, naturalWidth: e.currentTarget.naturalWidth })}
                />
            ) : (
                <div className="preset-info__img preset-info__img--placeholder">no image</div>
            )}

            <div className="preset-info__text">
                {info?.line1 && <p className="preset-info__line">{info.line1}</p>}
                {info?.line2 && <p className="preset-info__line preset-info__line--muted">{info.line2}</p>}
            </div>
        </div>
    );
}
