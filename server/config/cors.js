// server/config/cors.js
const allowedOrigins = [
    "http://localhost:3000",
    "https://localhost",       // Capacitor Android native webview origin
    "capacitor://localhost",   // Capacitor iOS native webview origin
    process.env.FRONTEND_URL, // e.g. https://yourapp.vercel.app or your custom domain
].filter(Boolean);

export const corsOptions = {
    origin(origin, cb) {
        // allow server-to-server / curl requests with no Origin header
        if (!origin) return cb(null, true);

        if (allowedOrigins.includes(origin)) return cb(null, true);
        // Unknown origin: don't set CORS headers (browser blocks cross-origin),
        // but don't throw — that would 500 same-origin requests from the web app.
        return cb(null, false);
    },
    credentials: true,
};
