import React from 'react';
import './TooltipIcon.css'; // optional if you want separate styling; otherwise remove

const TooltipIcon = ({ src, alt, tooltip, className }) => (
    <div className="tooltip-wrapper">
        <img src={src} alt={alt} className={className} />
        <div className="tooltip-bubble">{tooltip}</div>
    </div>
);

export default TooltipIcon;
