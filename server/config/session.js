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
        sameSite: "lax",
    },
};
