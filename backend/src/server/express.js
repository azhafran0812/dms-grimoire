/**
 * server/express.js
 * ═══ LAYER 5: Transport — Express App Factory ═══
 *
 * Creates Express application with middleware stack, routes, and error handler.
 * Unlike MCP's express.js, this does NOT have SSE/MCP transport —
 * it's a pure REST API server for the game frontend.
 */

import cors from "cors";
import express from "express";
import { config } from "../config/env.js";
import { expressErrorHandler } from "../io/errorHandler.js";
import { registerRoutes } from "./routes.js";

/**
 * Creates and configures the Express HTTP application.
 * @returns {express.Application}
 */
export function createExpressApp() {
	const app = express();

	// ── Middleware Stack ──
	app.use(
		cors({
			origin: (origin, callback) => {
				if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:") || origin === config.cors.frontendOrigin) {
					return callback(null, true);
				}
				callback(new Error("Not allowed by CORS"));
			},
			credentials: true,
		}),
	);
	app.use(express.json({ limit: "5mb" }));

	// ── Request Logger (development) ──
	if (config.server.nodeEnv !== "production") {
		app.use((req, res, next) => {
			const start = Date.now();
			res.on("finish", () => {
				const duration = Date.now() - start;
				console.log(
					`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${duration}ms)`,
				);
			});
			next();
		});
	}

	// ── REST Routes ──
	registerRoutes(app);

	// ── Global Error Handler (MUST be last) ──
	app.use(expressErrorHandler);

	return app;
}

export default { createExpressApp };
