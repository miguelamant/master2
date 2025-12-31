const CTX = require.context('../../../Images/presets', false, /\.(png|jpe?g|svg)$/i);

// One-time log of what's available
console.info("[presetImg] available files:", CTX.keys());

export function presetImg(filename) {
    try {
        const url = CTX('./' + filename);
        console.debug("[presetImg] resolved", filename, "->", url);
        return url;
    } catch (e) {
        console.warn("[presetImg] NOT FOUND:", filename, "from", CTX.keys(), e?.message);
        return null;
    }
}
