/**
 * controllers/healthController.js
 * ═══ LAYER 5: Controller — Health Check ═══
 */

import { config } from "../config/env.js";
import { sendSuccess } from "../io/response.js";

/**
 * GET /health
 */
export function healthCheck(_req, res) {
	sendSuccess(res, {
		status: "ok",
		service: "dms-grimoire-mcp",
		version: "2.0.0",
		architecture: "micro-arch-layer",
		model: config.llm.model,
		llmEndpoint: config.llm.endpoint,
		tools: ["generate_npc"],
		environment: config.server.nodeEnv,
	});
}
