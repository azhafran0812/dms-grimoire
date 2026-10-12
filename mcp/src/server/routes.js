/**
 * server/routes.js
 * ═══ LAYER 6: Transport — Route Definitions ═══
 *
 * Registers all Express routes.
 * Each route delegates to a controller wrapped with asyncWrap.
 */

import { healthCheck } from "../controllers/healthController.js";
import { asyncWrap } from "../io/errorHandler.js";

/**
 * Registers all routes on the Express app.
 *
 * @param {import('express').Application} app
 * @param {{ handleGenerateNpc: Function }} npcCtrl
 */
export function registerRoutes(app, npcCtrl) {
	// Health
	app.get("/health", healthCheck);

	// NPC Generation (REST)
	app.post("/api/generate-npc", asyncWrap(npcCtrl.handleGenerateNpc));
	app.post("/api/generate", asyncWrap(npcCtrl.handleGenerateNpc));
}
