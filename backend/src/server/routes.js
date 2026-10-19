/**
 * server/routes.js
 * ═══ LAYER 5: Transport — Route Definitions ═══
 *
 * Registers all Express routes with proper middleware chain.
 *
 * API Design:
 *   /api/auth/*        — Authentication (register, login, logout)
 *   /api/characters    — Party character CRUD
 *   /api/inventory     — Party inventory CRUD
 *   /api/npcs          — NPC CRUD + AI generation
 *   /health            — Health check (public)
 */

import { asyncWrap } from "../io/errorHandler.js";
import { healthCheck } from "../controllers/healthController.js";
import {
	authMiddleware,
	optionalAuthMiddleware,
	handleRegister,
	handleLogin,
	handleLogout,
} from "../controllers/authController.js";
import * as characterCtrl from "../controllers/characterController.js";
import * as inventoryCtrl from "../controllers/inventoryController.js";
import * as npcCtrl from "../controllers/npcController.js";

/**
 * Registers all routes on the Express app.
 * @param {import('express').Application} app
 */
export function registerRoutes(app) {
	// ── Public ──
	app.get("/health", asyncWrap(healthCheck));

	// ── Auth Endpoints (Public — no token needed) ──
	app.post("/api/auth/register", asyncWrap(handleRegister));
	app.post("/api/auth/login", asyncWrap(handleLogin));
	app.post("/api/auth/logout", asyncWrap(handleLogout));

	// ── Character AI & Styling (Proxied to MCP) ──
	// MUST be registered BEFORE /api/characters/:id to avoid parameter collision
	app.post("/api/characters/generate-ai", optionalAuthMiddleware, asyncWrap(characterCtrl.handleGenerateCharacterAi));
	app.post("/api/characters/:id/style", optionalAuthMiddleware, asyncWrap(characterCtrl.handleStyleCharacter));

	// ── Character CRUD (Protected) ──
	app.post("/api/characters", authMiddleware, asyncWrap(characterCtrl.handleCreate));
	app.get("/api/characters", authMiddleware, asyncWrap(characterCtrl.handleGetAll));
	app.get("/api/characters/:id", authMiddleware, asyncWrap(characterCtrl.handleGetById));
	app.patch("/api/characters/:id/stat", authMiddleware, asyncWrap(characterCtrl.handleUpdateStat));
	app.patch("/api/characters/:id", authMiddleware, asyncWrap(characterCtrl.handleUpdate));
	app.delete("/api/characters/:id", authMiddleware, asyncWrap(characterCtrl.handleDelete));

	// ── Inventory CRUD (Protected) ──
	app.post("/api/inventory", authMiddleware, asyncWrap(inventoryCtrl.handleCreate));
	app.get("/api/inventory", authMiddleware, asyncWrap(inventoryCtrl.handleGetAll));
	app.get("/api/inventory/:id", authMiddleware, asyncWrap(inventoryCtrl.handleGetById));
	app.patch("/api/inventory/:id", authMiddleware, asyncWrap(inventoryCtrl.handleUpdate));
	app.delete("/api/inventory/:id", authMiddleware, asyncWrap(inventoryCtrl.handleDelete));

	// ── AI Generation (Protected/Optional — proxied to MCP) ──
	// MUST be registered BEFORE /api/npcs/:id to prevent "generate" matching as :id
	app.post("/api/npcs/generate", optionalAuthMiddleware, asyncWrap(npcCtrl.handleGenerateAi));
	app.post("/api/generate-npc", optionalAuthMiddleware, asyncWrap(npcCtrl.handleGenerateAi));

	// ── NPC CRUD (Protected) ──
	app.post("/api/npcs", authMiddleware, asyncWrap(npcCtrl.handleCreate));
	app.get("/api/npcs", authMiddleware, asyncWrap(npcCtrl.handleGetAll));
	app.get("/api/npcs/:id", authMiddleware, asyncWrap(npcCtrl.handleGetById));
	app.patch("/api/npcs/:id", authMiddleware, asyncWrap(npcCtrl.handleUpdate));
	app.delete("/api/npcs/:id", authMiddleware, asyncWrap(npcCtrl.handleDelete));
}

export default { registerRoutes };
