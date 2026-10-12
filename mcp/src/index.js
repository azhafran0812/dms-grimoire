/**
 * src/index.js
 * ═══ ENTRY POINT — DM's Grimoire MCP Server ═══
 *
 * Bootstrap sequence:
 *   1. Load config (.env)
 *   2. Initialize item database (Layer 2)
 *   3. Classify items into themes (Layer 3)
 *   4. Create controller (Layer 5)
 *   5. Start server transport (Layer 6)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config/env.js";
import { createNpcController } from "./controllers/npcController.js";
import { ThemeClassifier } from "./core/themeClassifier.js";
import { ItemDatabase } from "./database/itemDatabase.js";
import { createExpressApp } from "./server/express.js";
import { createMcpServer } from "./server/mcp.js";

// ─── Singleton Instances ───────────────────────────────────

const itemDb = new ItemDatabase(config.database);
const classifier = new ThemeClassifier();

// ─── Bootstrap ─────────────────────────────────────────────

async function bootstrap() {
	console.log("[Grimoire] Initializing item database...");
	await itemDb.init({ offlineOnly: true }).catch(async () => {
		console.log("[Grimoire] Cache miss — fetching from remote...");
		await itemDb.init();
	});
	console.log(`[Grimoire] Loaded ${itemDb.getItemCount()} items`);

	console.log("[Grimoire] Classifying items by theme...");
	classifier.classifyAll(itemDb.getAllItems());
	console.log(
		`[Grimoire] Classified into ${Object.keys(classifier.getThemeCounts()).length} themes`,
	);

	return { itemDb, classifier };
}

// ─── Server Starters ──────────────────────────────────────

async function startHttpServer(port) {
	await bootstrap();
	const npcCtrl = createNpcController(classifier, itemDb);
	const app = createExpressApp(npcCtrl);

	return new Promise((resolve) => {
		const server = app.listen(port, () => {
			console.log(
				`\n[Grimoire MCP Server] ✅ Running on http://localhost:${port}`,
			);
			console.log(
				`[Grimoire MCP Server] Health:    GET  http://localhost:${port}/health`,
			);
			console.log(
				`[Grimoire MCP Server] Generate:  POST http://localhost:${port}/api/generate-npc`,
			);
			console.log(
				`[Grimoire MCP Server] MCP SSE:   GET  http://localhost:${port}/sse`,
			);
			console.log(
				`[Grimoire MCP Server] Architecture: Micro Arch Layer + Unified I/O\n`,
			);
			resolve(server);
		});
	});
}

async function startStdioServer() {
	await bootstrap();
	const npcCtrl = createNpcController(classifier, itemDb);
	const mcpServer = createMcpServer(npcCtrl);
	const transport = new StdioServerTransport();
	await mcpServer.connect(transport);
	return mcpServer;
}

// ─── Main ──────────────────────────────────────────────────

async function main(argv = process.argv.slice(2)) {
	const arg0 = argv[0]?.toLowerCase();

	if (arg0 === "mcp") {
		return await startStdioServer();
	}

	const port = Number(argv[0]) || config.server.port;
	return await startHttpServer(port);
}

// ─── Auto-run ──────────────────────────────────────────────

const currentFile = fileURLToPath(import.meta.url);
const executedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (executedFile && path.resolve(currentFile) === executedFile) {
	main().catch((err) => {
		console.error("[Grimoire Fatal Error]:", err.message || err);
		process.exit(1);
	});
}

export {
	bootstrap,
	classifier,
	itemDb,
	main,
	startHttpServer,
	startStdioServer,
};
