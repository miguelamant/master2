// server/app.js
import express from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import { corsOptions } from "./config/cors.js";
import { sessionConfig } from "./config/session.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import productsRoutes from "./routes/products.routes.js";
import miscRoutes from "./routes/misc.routes.js";
import layersRoutes from "./routes/layers.routes.js";
import personaRoutes from "./routes/persona.routes.js";
import businessPersonasRoutes from "./routes/businessPersonas.routes.js";
import explainRoutes from "./routes/explain.routes.js";
import assortmentsRoutes from "./routes/assortments.routes.js";
import stereotypeBenchmarksRoutes from "./routes/stereotypeBenchmarks.routes.js";
import engineDistributionsRoutes from "./routes/engineDistributions.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import claimRoutes from "./routes/claim.routes.js";
import menuConfigRoutes from "./routes/menuConfig.routes.js";
import consumerRoutes from "./routes/consumer.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import plonsremorkRoutes from "./routes/plonsremork.routes.js";

export const app = express();

// Needed behind hosted proxies (Render, etc.) so secure cookies work correctly
app.set("trust proxy", 1);

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS: needed in dev (separate :3000 frontend) AND in prod for the Capacitor
// native app, whose webview origin (https://localhost / capacitor://localhost)
// is cross-origin to this backend. Same-origin web requests are unaffected:
// unknown origins fall through without CORS headers (see config/cors.js).
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(session(sessionConfig));
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => res.send("ok"));

// API routes
app.use("/api", authRoutes);
app.use("/api", menuRoutes);
app.use("/api", salesRoutes);
app.use("/api", productsRoutes);
app.use("/api", miscRoutes);
app.use("/api", layersRoutes);
app.use("/api", personaRoutes);
app.use("/api", businessPersonasRoutes);
app.use("/api", explainRoutes);
app.use("/api", assortmentsRoutes);
app.use("/api", stereotypeBenchmarksRoutes);
app.use("/api", engineDistributionsRoutes);
app.use("/api", scanRoutes);
app.use("/api", claimRoutes);
app.use("/api", menuConfigRoutes);
app.use("/api", consumerRoutes);
app.use("/api", catalogRoutes);
app.use("/api", plonsremorkRoutes);

// Serve React build in production
if (process.env.NODE_ENV === "production") {
    const buildPath = path.join(__dirname, "..", "build");

    app.use(express.static(buildPath));

    // React Router fallback, but DO NOT swallow API routes
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path.join(buildPath, "index.html"));
    });
}

// Error handler last
app.use(errorHandler);
