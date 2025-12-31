// server/config/cors.js
const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL, // e.g. https://yourapp.vercel.app or your custom domain
].filter(Boolean);

export const corsOptions = {
    origin(origin, cb) {
        // allow server-to-server / curl requests with no Origin header
        if (!origin) return cb(null, true);

        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
};
