/**
 * controllers/npcController.js
 * ═══ LAYER 4: Controller — NPC CRUD + AI Generation Endpoints ═══
 *
 * Handles HTTP requests for NPC management and AI-powered generation.
 * AI generation proxies through this backend to MCP (third-party).
 * Frontend NEVER calls MCP directly.
 *
 * Maps to CRUD NPC tasks 19-22 and AI tasks 23-28.
 */

import * as NpcService from "../services/npcService.js";
import { parseRequest, CreateNpcSchema, UpdateNpcSchema, GenerateNpcAiSchema } from "../io/request.js";
import { sendSuccess } from "../io/response.js";

/**
 * POST /api/npcs — Create NPC manually
 */
export async function handleCreate(req, res) {
	const data = parseRequest(CreateNpcSchema, req.body);
	const result = await NpcService.createNpc(data);
	sendSuccess(res, result, { action: "npc.create", source: "manual" }, 201);
}

/**
 * GET /api/npcs — List all NPCs
 */
export async function handleGetAll(req, res) {
	const npcs = await NpcService.getAllNpcs();
	sendSuccess(res, npcs, { action: "npc.list" });
}

/**
 * GET /api/npcs/:id — Get single NPC
 */
export async function handleGetById(req, res) {
	const npc = await NpcService.getNpcById(req.params.id);
	sendSuccess(res, npc, { action: "npc.get" });
}

/**
 * PATCH /api/npcs/:id — Update NPC (e.g. disposition change)
 */
export async function handleUpdate(req, res) {
	const updates = parseRequest(UpdateNpcSchema, req.body);
	const npc = await NpcService.updateNpc(req.params.id, updates);
	sendSuccess(res, npc, { action: "npc.update" });
}

/**
 * DELETE /api/npcs/:id — Remove NPC permanently
 */
export async function handleDelete(req, res) {
	await NpcService.deleteNpc(req.params.id);
	sendSuccess(res, { deleted: true, id: req.params.id }, { action: "npc.delete" });
}

/**
 * POST /api/npcs/generate — Generate NPC via AI (proxied through MCP)
 *
 * Flow:  Frontend → Backend (here) → MCP (AI third-party) → Firebase (auto-save)
 *
 * This is the ONLY endpoint that touches MCP.
 * The frontend sends a prompt, and gets back a fully-saved NPC.
 */
export async function handleGenerateAi(req, res) {
	const { prompt, type } = parseRequest(GenerateNpcAiSchema, req.body);
	const result = await NpcService.generateNpcWithAi({ prompt, type });
	sendSuccess(res, result, { action: "npc.generate_ai", source: "mcp" }, 201);
}

export default { handleCreate, handleGetAll, handleGetById, handleUpdate, handleDelete, handleGenerateAi };
