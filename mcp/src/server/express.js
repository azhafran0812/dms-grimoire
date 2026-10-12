/**
 * server/express.js
 * ═══ LAYER 6: Transport — Express App Factory ═══
 *
 * Creates Express application with middleware stack, routes, SSE, and error handler.
 */

import path from "node:path";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { config } from "../config/env.js";
import { AppError, ErrorCode } from "../io/AppError.js";
import { expressErrorHandler } from "../io/errorHandler.js";
import { sendError } from "../io/response.js";
import { createMcpServer } from "./mcp.js";
import { registerRoutes } from "./routes.js";

/**
 * Creates and configures the Express HTTP application.
 *
 * @param {{ handleGenerateNpc: Function, handleMcpGenerateNpc: Function }} npcCtrl
 * @returns {express.Application}
 */
export function createExpressApp(npcCtrl) {
	const app = express();

	// ── Middleware Stack ──
	app.use(cors());
	app.use(express.json({ limit: "10mb" }));
	app.use(express.static(path.join(config.root, "public")));

	// ── REST Routes ──
	registerRoutes(app, npcCtrl);

	// ── MCP SSE Transport ──
	const activeTransports = new Map();

	app.get("/sse", async (req, res) => {
		try {
			const transport = new SSEServerTransport("/messages", res);
			const mcpServer = createMcpServer(npcCtrl);
			await mcpServer.connect(transport);

			const sessionId = transport.sessionId;
			activeTransports.set(sessionId, transport);

			req.on("close", () => {
				activeTransports.delete(sessionId);
			});
		} catch (err) {
			sendError(res, AppError.from(err));
		}
	});

	app.post("/messages", async (req, res) => {
		const parsed = z
			.object({
				sessionId: z
					.string()
					.min(1)
					.max(128)
					.regex(/^[a-zA-Z0-9_.-]+$/),
			})
			.safeParse(req.query);

		if (!parsed.success) {
			return sendError(
				res,
				new AppError(
					ErrorCode.VALIDATION_FAILED,
					"Invalid or missing sessionId",
				),
			);
		}

		const transport = activeTransports.get(parsed.data.sessionId);
		if (!transport) {
			return sendError(
				res,
				new AppError(
					ErrorCode.SESSION_NOT_FOUND,
					`Session not found: ${parsed.data.sessionId}`,
				),
			);
		}

		await transport.handlePostMessage(req, res, req.body);
	});

	// ── Global Error Handler (MUST be last) ──
	app.use(expressErrorHandler);

	return app;
}
