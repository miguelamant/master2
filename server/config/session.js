// server/config/session.js
import { env } from "./env.js";

const isProd = process.env.NODE_ENV === "production";

// Allow overriding secure cookies for local production testing
const cookieSecure =
    process.env.COOKIE_SECURE != null
        ? process.env.COOKIE_SECURE === "true"
        : isProd;

export const sessionConfig = {
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: cookieSecure,
        // Native app calls the backend cross-site (webview origin is
        // https://localhost), so the session cookie must be SameSite=None to be
        // sent — but None requires Secure, so only use it when cookies are secure
        // (prod/HTTPS). Dev stays Lax (Secure is off on http://localhost).
        sameSite: cookieSecure ? "none" : "lax",
    },
};
