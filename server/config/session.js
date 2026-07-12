// server/config/session.js
import { env } from "./env.js";
import { SupabaseSessionStore } from "./supabaseSessionStore.js";

const isProd = process.env.NODE_ENV === "production";

// Allow overriding secure cookies for local production testing
const cookieSecure =
    process.env.COOKIE_SECURE != null
        ? process.env.COOKIE_SECURE === "true"
        : isProd;

// 90 days — set explicitly on consumer logins (see upsertConsumerSession /
// consumer/login) so the mobile app stays signed in like a normal consumer
// app. Business dashboard logins don't set this, so they keep the default
// plain session cookie.
export const CONSUMER_SESSION_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export const sessionConfig = {
    secret: env.SESSION_SECRET,
    store: new SupabaseSessionStore(),
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
