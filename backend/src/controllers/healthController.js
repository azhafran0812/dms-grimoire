/**
 * controllers/healthController.js
 * ═══ LAYER 4: Controller — Health Check ═══
 *
 * Returns server status and MCP connectivity.
 */

import * as mcpClient from "../services/mcpClient.js";
import { sendSuccess } from "../io/response.js";

/**
 * GET /health
 */
export async function healthCheck(req, res) {
	const mcpHealthy = await mcpClient.checkHealth();

	sendSuccess(res, {
		status: "ok",
		service: "dms-grimoire-backend",
		uptime: process.uptime(),
		mcp: {
			status: mcpHealthy ? "connected" : "unreachable",
		},
	});
}

export default { healthCheck };
