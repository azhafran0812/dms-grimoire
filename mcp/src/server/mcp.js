/**
 * server/mcp.js
 * ═══ LAYER 6: Transport — MCP Server Factory ═══
 *
 * Creates McpServer with tool registration.
 * Delegates to controller for actual logic.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mcpToolWrap } from "../io/errorHandler.js";
import { successEnvelope, toMcpContent } from "../io/response.js";

/**
 * Creates and configures an MCP server with the generate_npc tool.
 *
 * @param {{ handleMcpGenerateNpc: Function }} npcCtrl
 * @returns {McpServer}
 */
export function createMcpServer(npcCtrl) {
	const server = new McpServer({
		name: "dms-grimoire-mcp",
		version: "2.0.0",
	});

	server.tool(
		"generate_npc",
		"Generates a complete D&D NPC with balanced stats, rich lore, disposition, and a Growtopia avatar composite image. AI suggests specific item names — nothing is random.",
		{
			prompt: z
				.string()
				.describe("Describe an NPC, encounter, or idea for the D&D campaign"),
			type: z
				.string()
				.optional()
				.default("Mysterious NPC")
				.describe(
					'Category: "Mysterious NPC", "Story twist", "Location lore", "Magic item"',
				),
			partyContext: z
				.union([z.string(), z.record(z.any())])
				.optional()
				.describe("Active party context"),
			render: z
				.boolean()
				.optional()
				.default(true)
				.describe("Render composite avatar PNG"),
			simulate: z
				.boolean()
				.optional()
				.default(false)
				.describe("Run combat simulation vs party member"),
		},
		mcpToolWrap(async (args) => {
			const result = await npcCtrl.handleMcpGenerateNpc(args);
			const envelope = successEnvelope(result, { source: result.source });
			return toMcpContent(envelope);
		}),
	);

	return server;
}
