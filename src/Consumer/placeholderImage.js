// Generic backup shown when a product has no photo, or its photo fails to load.
const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#f3f4f6"/>
  <circle cx="24" cy="23" r="5" fill="#d1d5db"/>
  <path d="M10 46 L24 32 L33 40 L44 26 L54 38 V50 A2 2 0 0 1 52 52 H12 A2 2 0 0 1 10 50 Z" fill="#d1d5db"/>
</svg>
`.trim();

export const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

export const withImageFallback = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = PLACEHOLDER_IMAGE;
};
