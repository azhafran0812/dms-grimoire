/**
 * src/index.js
 * ═══ ENTRY POINT — DM's Grimoire Game Backend ═══
 *
 * Bootstrap sequence:
 *   1. Load config (.env)                         — Layer 0
 *   2. Initialize Firebase Client SDK             — Layer 0 (auto on import)
 *   3. Create Express app with routes             — Layer 5
 *   4. Start HTTP server
 *
 * Architecture:
 *   Frontend (React/Vite :5173)
 *       ↓ REST API calls
 *   Game Backend (this server :4000)
 *       ↓ Firebase Client SDK     ↓ HTTP proxy
 *   Firebase Realtime DB      MCP Server (:3000)
 *                                  ↓ AI generation
 *                             Google Gemini / LLM
 */

import { config } from "./config/env.js";
// Firebase auto-initializes on import:
import "./config/firebase.js";
import { createExpressApp } from "./server/express.js";

// ─── Server Start ──────────────────────────────────────────

async function startServer(port) {
	const app = createExpressApp();

	return new Promise((resolve) => {
		const server = app.listen(port, () => {
			console.log(
				`\n[Grimoire Backend] ✅ Running on http://localhost:${port}`,
			);
			console.log(
				`[Grimoire Backend] Health:      GET  http://localhost:${port}/health`,
			);
			console.log(
				`[Grimoire Backend] Auth:        POST http://localhost:${port}/api/auth/register`,
			);
			console.log(
				`[Grimoire Backend]              POST http://localhost:${port}/api/auth/login`,
			);
			console.log(
				`[Grimoire Backend] Characters:  CRUD http://localhost:${port}/api/characters`,
			);
			console.log(
				`[Grimoire Backend] Inventory:   CRUD http://localhost:${port}/api/inventory`,
			);
			console.log(
				`[Grimoire Backend] NPCs:        CRUD http://localhost:${port}/api/npcs`,
			);
			console.log(
				`[Grimoire Backend] AI Generate: POST http://localhost:${port}/api/npcs/generate`,
			);
			console.log(
				`[Grimoire Backend] MCP Proxy:   → ${config.mcp.baseUrl}`,
			);
			console.log(
				`[Grimoire Backend] Architecture: Micro Arch Layer + Unified I/O\n`,
			);
			resolve(server);
		});
	});
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
	const port = Number(process.argv[2]) || config.server.port;
	return await startServer(port);
}

main().catch((err) => {
	console.error("[Grimoire Backend Fatal Error]:", err.message || err);
	process.exit(1);
});

export { main, startServer };
