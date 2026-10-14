/**
 * io/request.js
 * ═══ LAYER 1: Unified I/O — Request Validation ═══
 *
 * Zod-based schemas and parser for all incoming requests.
 * Every controller calls parseRequest() before processing.
 *
 * Fully aligned with frontend models and real-world inputs:
 *   - Character schema matches frontend/src/models/characterModel.js
 *   - Supports both nested and flat form payloads
 *   - AI schema supports preset mappings from ArcaneScribeModal
 */

import { z } from "zod";
import { AppError, ErrorCode } from "./AppError.js";

// ─── Character Schemas (matches frontend/src/models/characterModel.js) ──

const CombatSchema = z.object({
	hpMax: z.coerce.number().int().min(1).default(10),
	hpCurrent: z.coerce.number().int().min(0).default(10),
	hpTemp: z.coerce.number().int().min(0).default(0),
	ac: z.coerce.number().int().min(1).max(30).default(10),
	initiativeModifier: z.coerce.number().int().default(0),
	speed: z.coerce.number().int().min(0).default(30),
	hitDice: z
		.object({
			total: z.coerce.number().int().min(0).default(1),
			current: z.coerce.number().int().min(0).default(1),
			dieType: z.string().default("d10"),
		})
		.default({ total: 1, current: 1, dieType: "d10" }),
	deathSaves: z
		.object({
			successes: z.coerce.number().int().min(0).max(3).default(0),
			failures: z.coerce.number().int().min(0).max(3).default(0),
		})
		.default({ successes: 0, failures: 0 }),
});

const StatsSchema = z.object({
	str: z.coerce.number().int().min(1).max(30).default(10),
	dex: z.coerce.number().int().min(1).max(30).default(10),
	con: z.coerce.number().int().min(1).max(30).default(10),
	int: z.coerce.number().int().min(1).max(30).default(10),
	wis: z.coerce.number().int().min(1).max(30).default(10),
	cha: z.coerce.number().int().min(1).max(30).default(10),
});

export const CreateCharacterSchema = z
	.object({
		id: z.string().optional(),
		playerId: z.string().nullable().optional().default(null),
		name: z
			.string({ required_error: 'Field "name" is required' })
			.min(1, "Name must not be empty")
			.max(100, "Name exceeds 100 character limit")
			.transform((s) => s.trim()),
		characterClass: z.string().min(1).max(50).default("Fighter").transform((s) => s.trim()),
		race: z.string().min(1).max(50).default("Human").transform((s) => s.trim()),
		level: z.coerce.number().int().min(1).max(20).default(1),
		background: z.string().max(100).default("Folk Hero").transform((s) => s.trim()),
		alignment: z.string().max(50).default("True Neutral").transform((s) => s.trim()),
		xp: z.coerce.number().int().min(0).default(0),

		// Nested combat and stats
		combat: CombatSchema.default({}),
		stats: StatsSchema.default({}),

		// Root-level combat / stats fallbacks (from simplified forms like AddCharacterModal)
		hpMax: z.coerce.number().int().min(1).optional(),
		hpCurrent: z.coerce.number().int().min(0).optional(),
		ac: z.coerce.number().int().min(1).max(30).optional(),
		str: z.coerce.number().int().min(1).max(30).optional(),
		dex: z.coerce.number().int().min(1).max(30).optional(),
		con: z.coerce.number().int().min(1).max(30).optional(),
		int: z.coerce.number().int().min(1).max(30).optional(),
		wis: z.coerce.number().int().min(1).max(30).optional(),
		cha: z.coerce.number().int().min(1).max(30).optional(),

		proficiencies: z
			.object({
				savingThrows: z.array(z.string()).default([]),
				skills: z.array(z.string()).default([]),
				languages: z.array(z.string()).default(["Common"]),
				tools: z.array(z.string()).default([]),
			})
			.default({
				savingThrows: [],
				skills: [],
				languages: ["Common"],
				tools: [],
			}),

		inventory: z
			.object({
				wealth: z
					.object({
						cp: z.number().default(0),
						sp: z.number().default(0),
						ep: z.number().default(0),
						gp: z.number().default(0),
						pp: z.number().default(0),
					})
					.default({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }),
				equipment: z.array(z.any()).default([]),
				attunedItems: z.array(z.any()).default([]),
			})
			.default({
				wealth: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
				equipment: [],
				attunedItems: [],
			}),

		spellcasting: z
			.object({
				spellcastingAbility: z.string().default(""),
				spellSaveDC: z.number().int().default(8),
				spellAttackBonus: z.number().int().default(0),
				spellSlots: z.record(z.any()).default({ level1: { total: 0, current: 0 } }),
			})
			.default({
				spellcastingAbility: "",
				spellSaveDC: 8,
				spellAttackBonus: 0,
				spellSlots: { level1: { total: 0, current: 0 } },
			}),
	})
	.passthrough()
	.transform((data) => {
		// Merge root-level combat fields into data.combat if provided
		const combat = { ...data.combat };
		if (data.hpMax !== undefined) combat.hpMax = data.hpMax;
		if (data.hpCurrent !== undefined) combat.hpCurrent = data.hpCurrent;
		else if (data.hpMax !== undefined && data.combat.hpCurrent === 10) combat.hpCurrent = data.hpMax;
		if (data.ac !== undefined) combat.ac = data.ac;

		// Merge root-level stat fields into data.stats if provided
		const stats = { ...data.stats };
		if (data.str !== undefined) stats.str = data.str;
		if (data.dex !== undefined) stats.dex = data.dex;
		if (data.con !== undefined) stats.con = data.con;
		if (data.int !== undefined) stats.int = data.int;
		if (data.wis !== undefined) stats.wis = data.wis;
		if (data.cha !== undefined) stats.cha = data.cha;

		const { hpMax, hpCurrent, ac, str, dex, con, int, wis, cha, ...clean } = data;
		return {
			...clean,
			combat,
			stats,
		};
	});

export const UpdateCharacterSchema = z
	.object({
		name: z.string().min(1).max(100).trim().optional(),
		characterClass: z.string().min(1).max(50).trim().optional(),
		race: z.string().min(1).max(50).trim().optional(),
		level: z.number().int().min(1).max(20).optional(),
		background: z.string().max(100).trim().optional(),
		alignment: z.string().max(50).trim().optional(),
		xp: z.number().int().min(0).optional(),
		combat: CombatSchema.partial().optional(),
		stats: StatsSchema.partial().optional(),
		hpCurrent: z.number().int().min(0).optional(),
		hpMax: z.number().int().min(1).optional(),
		ac: z.number().int().min(1).max(30).optional(),
	})
	.passthrough()
	.transform((data) => {
		const result = { ...data };
		if (data.hpCurrent !== undefined || data.hpMax !== undefined || data.ac !== undefined) {
			result.combat = {
				...(result.combat || {}),
				...(data.hpCurrent !== undefined ? { hpCurrent: data.hpCurrent } : {}),
				...(data.hpMax !== undefined ? { hpMax: data.hpMax } : {}),
				...(data.ac !== undefined ? { ac: data.ac } : {}),
			};
			delete result.hpCurrent;
			delete result.hpMax;
			delete result.ac;
		}
		return result;
	});

// ─── Inventory Schemas ─────────────────────────────────────

export const CreateInventoryItemSchema = z
	.object({
		name: z
			.string({ required_error: 'Field "name" is required' })
			.min(1, "Item name must not be empty")
			.max(200)
			.transform((s) => s.trim()),
		type: z
			.enum(["weapon", "armor", "potion", "scroll", "treasure", "misc"])
			.default("misc"),
		quantity: z.number().int().min(1).default(1),
		description: z.string().max(1000).default("").transform((s) => s.trim()),
	})
	.passthrough();

export const UpdateInventoryItemSchema = z
	.object({
		name: z.string().min(1).max(200).trim().optional(),
		type: z
			.enum(["weapon", "armor", "potion", "scroll", "treasure", "misc"])
			.optional(),
		quantity: z.number().int().min(0).optional(),
		description: z.string().max(1000).trim().optional(),
	})
	.passthrough();

// ─── NPC Schemas ───────────────────────────────────────────

export const CreateNpcSchema = z
	.object({
		name: z
			.string({ required_error: 'Field "name" is required' })
			.min(1, "NPC name must not be empty")
			.max(200)
			.transform((s) => s.trim()),
		title: z.string().max(200).default("").transform((s) => s.trim()),
		type: z.string().max(100).default("NPC").transform((s) => s.trim()),
		race: z.string().max(50).default("Human").transform((s) => s.trim()),
		class: z.string().max(50).default("Commoner").transform((s) => s.trim()),
		level: z.number().int().min(1).max(30).default(1),
		hp: z
			.object({
				current: z.number().int().min(0),
				max: z.number().int().min(1),
			})
			.optional(),
		armorClass: z.number().int().min(1).max(30).default(10),
		stats: StatsSchema.optional(),
		disposition: z.enum(["Friendly", "Neutral", "Hostile"]).default("Neutral"),
		location: z.string().max(200).default("").transform((s) => s.trim()),
		personality: z.string().max(2000).default("").transform((s) => s.trim()),
		lore: z.string().max(5000).default("").transform((s) => s.trim()),
		secret: z.string().max(2000).default("").transform((s) => s.trim()),
		source: z.enum(["manual", "ai"]).default("manual"),
	})
	.passthrough();

export const UpdateNpcSchema = z
	.object({
		name: z.string().min(1).max(200).trim().optional(),
		title: z.string().max(200).trim().optional(),
		disposition: z.enum(["Friendly", "Neutral", "Hostile"]).optional(),
		location: z.string().max(200).trim().optional(),
		personality: z.string().max(2000).trim().optional(),
		lore: z.string().max(5000).trim().optional(),
		secret: z.string().max(2000).trim().optional(),
		hp: z
			.object({
				current: z.number().int().min(0).optional(),
				max: z.number().int().min(1).optional(),
			})
			.optional(),
	})
	.passthrough();

// ─── AI Generate Schema ────────────────────────────────────

const PRESET_MAP = {
	npc: "Mysterious NPC",
	twist: "Story twist",
	lore: "Location lore",
	item: "Magic item",
	"Mysterious NPC": "Mysterious NPC",
	"Story twist": "Story twist",
	"Location lore": "Location lore",
	"Magic item": "Magic item",
};

export const GenerateNpcAiSchema = z
	.object({
		prompt: z
			.string()
			.max(2000, "Prompt exceeds 2000 character limit")
			.default("")
			.transform((s) => s.trim()),
		preset: z.string().optional(),
		type: z.string().optional(),
	})
	.passthrough()
	.transform((data) => {
		const rawType = data.preset || data.type || "Mysterious NPC";
		const mappedType = PRESET_MAP[rawType] || "Mysterious NPC";
		const finalPrompt =
			data.prompt && data.prompt.length > 0
				? data.prompt
				: `Create a compelling, detailed ${mappedType} suited for an ongoing D&D 5e fantasy campaign.`;

		return {
			prompt: finalPrompt,
			type: mappedType,
		};
	});

// ─── Parser ────────────────────────────────────────────────

/**
 * Validates input data against a Zod schema.
 * Throws AppError(VALIDATION_FAILED) on failure.
 *
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {any} data
 * @returns {T} Validated and transformed data
 * @throws {AppError}
 */
export function parseRequest(schema, data) {
	const result = schema.safeParse(data);
	if (!result.success) {
		const issues = result.error.issues.map((i) => ({
			path: i.path.join("."),
			message: i.message,
		}));
		throw new AppError(
			ErrorCode.VALIDATION_FAILED,
			`Request validation failed: ${issues.map((i) => i.message).join("; ")}`,
			{ issues },
		);
	}
	return result.data;
}

export default {
	CreateCharacterSchema,
	UpdateCharacterSchema,
	CreateInventoryItemSchema,
	UpdateInventoryItemSchema,
	CreateNpcSchema,
	UpdateNpcSchema,
	GenerateNpcAiSchema,
	parseRequest,
};
