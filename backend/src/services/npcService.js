/**
 * services/npcService.js
 * ═══ LAYER 3: Service — NPC Business Logic ═══
 *
 * Orchestrates NPC operations and AI generation.
 * When AI generation is requested, this service:
 *   1. Fetches current party data for context injection
 *   2. Calls MCP (third-party AI) via mcpClient
 *   3. Saves the generated NPC to Firebase
 */

import * as NpcModel from "../models/npcModel.js";
import * as CharacterModel from "../models/characterModel.js";
import * as mcpClient from "./mcpClient.js";
import { AppError, ErrorCode } from "../io/AppError.js";
import { db, ref, set } from "../config/firebase.js";

/**
 * Creates a new NPC (manual entry by DM).
 */
export async function createNpc(data) {
	try {
		return await NpcModel.create({ ...data, source: "manual" });
	} catch (err) {
		throw new AppError(ErrorCode.FIREBASE_ERROR, `Failed to create NPC: ${err.message}`);
	}
}

/**
 * Retrieves all NPCs.
 */
export async function getAllNpcs() {
	try {
		return await NpcModel.findAll();
	} catch (err) {
		throw new AppError(ErrorCode.FIREBASE_ERROR, `Failed to fetch NPCs: ${err.message}`);
	}
}

/**
 * Retrieves a single NPC by ID.
 */
export async function getNpcById(id) {
	const npc = await NpcModel.findById(id);
	if (!npc) {
		throw new AppError(ErrorCode.NPC_NOT_FOUND, `NPC with ID "${id}" not found`);
	}
	return npc;
}

/**
 * Updates NPC fields (e.g. disposition change: Friendly → Hostile).
 */
export async function updateNpc(id, updates) {
	await getNpcById(id);
	try {
		await NpcModel.updateById(id, updates);
		return await NpcModel.findById(id);
	} catch (err) {
		if (err instanceof AppError) throw err;
		throw new AppError(ErrorCode.FIREBASE_ERROR, `Failed to update NPC: ${err.message}`);
	}
}

/**
 * Deletes an NPC permanently.
 */
export async function deleteNpc(id) {
	await getNpcById(id);
	try {
		await NpcModel.removeById(id);
	} catch (err) {
		throw new AppError(ErrorCode.FIREBASE_ERROR, `Failed to delete NPC: ${err.message}`);
	}
}

/**
 * Generates an NPC via MCP AI service, then auto-saves to Firebase.
 *
 * Flow:
 *   Frontend → Backend (this) → MCP (third-party AI) → Response
 *                                                     ↓
 *                              Firebase ← auto-save ←─┘
 */
export async function generateNpcWithAi({ prompt, type }) {
	// 1. Fetch current party data for context injection (Tugas 25)
	let partyContext = null;
	try {
		const party = await CharacterModel.findAll();
		if (party && Object.keys(party).length > 0) {
			const members = Object.values(party);
			partyContext = {
				memberCount: members.length,
				averageLevel: Math.round(
					members.reduce((sum, m) => sum + (m.level || 1), 0) / members.length,
				),
				members: members.map((m) => ({
					name: m.name,
					class: m.characterClass || m.class || "Fighter",
					race: m.race || "Human",
					level: m.level || 1,
					hp: m.combat
						? { current: m.combat.hpCurrent ?? 10, max: m.combat.hpMax ?? 10 }
						: (m.hp || { current: 10, max: 10 }),
				})),
			};
		}
	} catch {
		console.warn("[NpcService] Could not fetch party context, proceeding without it");
	}

	// 2. Call MCP (third-party AI service)
	const mcpResponse = await mcpClient.generateNpc({ prompt, type, partyContext, render: true });

	// 3. Extract NPC data from MCP response and save to Firebase (Tugas 28)
	const npcData = mcpResponse.data?.npc;
	if (!npcData) {
		throw new AppError(
			ErrorCode.MCP_PARSE_FAILED,
			"MCP response did not contain valid NPC data",
			{ mcpResponse: mcpResponse.data },
		);
	}

	const npcEntry = {
		name: npcData.name || "Unknown NPC",
		title: npcData.title || "",
		type: npcData.type || "NPC",
		race: npcData.race || "Human",
		class: npcData.class || "Commoner",
		level: npcData.level || 1,
		hp: npcData.hp || { current: 10, max: 10 },
		armorClass: npcData.armorClass || 10,
		stats: npcData.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
		disposition: npcData.disposition || "Neutral",
		location: npcData.location || "",
		personality: npcData.personality || "",
		lore: npcData.lore || "",
		secret: npcData.secret || "",
		source: "ai",
		aiMeta: {
			prompt,
			type,
			generatedAt: Date.now(),
			avatar: mcpResponse.data?.avatar || null,
			image: mcpResponse.data?.image || null,
		},
	};

	const saved = await NpcModel.create(npcEntry);

	// Sync to category-specific nodes so frontend views update live
	if (type === "Location lore") {
		await set(ref(db, `campaign/active/lore/${saved.id}`), {
			id: saved.id,
			title: npcData.name || npcData.title || "Ancient Location",
			category: "Location",
			content: npcData.lore || npcData.description || npcData.personality || "",
			createdAt: Date.now(),
		}).catch(() => {});
	} else if (type === "Story twist") {
		await set(ref(db, `chronicles/${saved.id}`), {
			id: saved.id,
			sessionNumber: 1,
			title: `Plot Twist: ${npcData.name || npcData.title || "Unexpected Turn"}`,
			description: npcData.secret || npcData.lore || npcData.personality || "",
			createdAt: Date.now(),
		}).catch(() => {});
	} else if (type === "Magic item") {
		await set(ref(db, `inventory/${saved.id}`), {
			id: saved.id,
			name: npcData.name || "Enchanted Relic",
			type: "treasure",
			quantity: 1,
			description: npcData.lore || npcData.personality || "",
			createdAt: Date.now(),
		}).catch(() => {});
	}

	return {
		id: saved.id,
		npc: saved.data,
		mcpMeta: mcpResponse.meta,
	};
}

export default { createNpc, getAllNpcs, getNpcById, updateNpc, deleteNpc, generateNpcWithAi };
