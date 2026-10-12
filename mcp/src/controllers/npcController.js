/**
 * controllers/npcController.js
 * ═══ LAYER 5: Controller — NPC Generation ═══
 *
 * Handles both REST API and MCP tool calls.
 * Now uses the AGENTIC pipeline by default.
 */

import { GenerateNpcSchema, parseRequest } from "../io/request.js";
import { sendSuccess } from "../io/response.js";
import { agenticGenerate } from "../services/agent/agentOrchestrator.js";

const DEFAULT_PARTY = {
	campaign: "The Ashen Crown",
	averageLevel: 3,
	members: [
		{
			name: "Krakatoa Abysswhirl",
			class: "Sorcerer",
			race: "Dragonborn",
			level: 3,
			hp: { current: 22, max: 22 },
		},
		{
			name: "Bryn",
			class: "Rogue",
			race: "Human",
			level: 3,
			hp: { current: 26, max: 26 },
		},
	],
};

/**
 * Creates the NPC controller bound to classifier and itemDb instances.
 *
 * @param {import('../core/themeClassifier.js').ThemeClassifier} classifier
 * @param {import('../database/itemDatabase.js').ItemDatabase} itemDb
 */
export function createNpcController(classifier, itemDb) {
	/**
	 * REST handler: POST /api/generate-npc
	 */
	async function handleGenerateNpc(req, res) {
		const input = parseRequest(GenerateNpcSchema, req.body);

		const startTime = Date.now();
		const result = await agenticGenerate({
			prompt: input.prompt,
			type: input.type,
			partyContext: input.partyContext || DEFAULT_PARTY,
			render: input.render,
			simulate: req.body?.simulate || false,
			classifier,
			itemDb,
		});
		const duration = Date.now() - startTime;

		sendSuccess(res, result, { source: result.source, durationMs: duration });
	}

	/**
	 * MCP tool handler: generate_npc
	 */
	async function handleMcpGenerateNpc(args) {
		const result = await agenticGenerate({
			prompt: args.prompt,
			type: args.type || "Mysterious NPC",
			partyContext: args.partyContext || DEFAULT_PARTY,
			render: args.render !== false,
			simulate: args.simulate || false,
			classifier,
			itemDb,
		});
		return result;
	}

	return { handleGenerateNpc, handleMcpGenerateNpc };
}
