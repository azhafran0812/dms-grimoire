/**
 * tests/alignment.test.js
 * Comprehensive tests verifying backend and frontend alignment:
 * 1. Zod schemas handle both frontend form data & full character payloads
 * 2. Nested partial updates don't clobber sibling properties
 * 3. AI schema maps ArcaneScribeModal presets correctly
 * 4. Model CRUD operations work properly against Firebase
 */

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import {
	CreateCharacterSchema,
	UpdateCharacterSchema,
	GenerateNpcAiSchema,
	parseRequest,
} from "../src/io/request.js";
import * as CharacterService from "../src/services/characterService.js";
import * as InventoryService from "../src/services/inventoryService.js";
import * as NpcService from "../src/services/npcService.js";

describe("Frontend <-> Backend Schema Alignment", () => {
	it("should parse flat AddCharacterModal form data into nested structure", () => {
		const formData = {
			name: "Krakatoa Abysswhirl",
			characterClass: "Barbarian",
			race: "Goliath",
			hpMax: 24,
			hpCurrent: 24,
			ac: 14,
		};

		const parsed = parseRequest(CreateCharacterSchema, formData);

		assert.equal(parsed.name, "Krakatoa Abysswhirl");
		assert.equal(parsed.characterClass, "Barbarian");
		assert.equal(parsed.race, "Goliath");
		assert.equal(parsed.combat.hpMax, 24);
		assert.equal(parsed.combat.hpCurrent, 24);
		assert.equal(parsed.combat.ac, 14);
		assert.equal(parsed.stats.str, 10);
		assert.ok(Array.isArray(parsed.proficiencies.languages));
	});

	it("should parse full characterModel.js payload and preserve all fields", () => {
		const fullPayload = {
			id: "custom-uuid-12345",
			playerId: null,
			name: "Elowen Starseeker",
			race: "Elf",
			characterClass: "Wizard",
			level: 3,
			background: "Sage",
			alignment: "Neutral Good",
			xp: 900,
			combat: {
				hpMax: 18,
				hpCurrent: 14,
				hpTemp: 5,
				ac: 12,
				initiativeModifier: 2,
				speed: 30,
				hitDice: { total: 3, current: 3, dieType: "d6" },
				deathSaves: { successes: 0, failures: 0 },
			},
			stats: { str: 8, dex: 14, con: 12, int: 18, wis: 13, cha: 10 },
			proficiencies: {
				savingThrows: ["Intelligence", "Wisdom"],
				skills: ["Arcana", "History"],
				languages: ["Common", "Elvish", "Draconic"],
				tools: [],
			},
			inventory: {
				wealth: { cp: 10, sp: 5, ep: 0, gp: 50, pp: 0 },
				equipment: ["Spellbook", "Arcane Focus"],
				attunedItems: [],
			},
			spellcasting: {
				spellcastingAbility: "Intelligence",
				spellSaveDC: 14,
				spellAttackBonus: 6,
				spellSlots: { level1: { total: 4, current: 2 } },
			},
		};

		const parsed = parseRequest(CreateCharacterSchema, fullPayload);

		assert.equal(parsed.id, "custom-uuid-12345");
		assert.equal(parsed.playerId, null);
		assert.equal(parsed.combat.hpMax, 18);
		assert.equal(parsed.combat.hpCurrent, 14);
		assert.equal(parsed.combat.hpTemp, 5);
		assert.equal(parsed.stats.int, 18);
		assert.equal(parsed.proficiencies.languages.length, 3);
		assert.equal(parsed.inventory.wealth.gp, 50);
		assert.equal(parsed.spellcasting.spellSaveDC, 14);
	});

	it("should parse UpdateCharacterSchema with flat hpCurrent", () => {
		const updateData = { hpCurrent: 5 };
		const parsed = parseRequest(UpdateCharacterSchema, updateData);

		assert.equal(parsed.combat.hpCurrent, 5);
	});

	it("should parse UpdateCharacterSchema with nested combat object", () => {
		const updateData = { combat: { hpCurrent: 8, ac: 16 } };
		const parsed = parseRequest(UpdateCharacterSchema, updateData);

		assert.equal(parsed.combat.hpCurrent, 8);
		assert.equal(parsed.combat.ac, 16);
	});

	it("should map ArcaneScribe presets correctly into full type and provide fallback prompt", () => {
		const fromFrontend1 = { preset: "npc" };
		const parsed1 = parseRequest(GenerateNpcAiSchema, fromFrontend1);
		assert.equal(parsed1.type, "Mysterious NPC");
		assert.ok(parsed1.prompt.includes("Mysterious NPC"));

		const fromFrontend2 = { preset: "twist", prompt: "A secret spy among the guild" };
		const parsed2 = parseRequest(GenerateNpcAiSchema, fromFrontend2);
		assert.equal(parsed2.type, "Story twist");
		assert.equal(parsed2.prompt, "A secret spy among the guild");

		const fromFrontend3 = { preset: "lore" };
		const parsed3 = parseRequest(GenerateNpcAiSchema, fromFrontend3);
		assert.equal(parsed3.type, "Location lore");

		const fromFrontend4 = { preset: "item" };
		const parsed4 = parseRequest(GenerateNpcAiSchema, fromFrontend4);
		assert.equal(parsed4.type, "Magic item");
	});

	it("should coerce string values (e.g. from HTML form inputs) into numbers", () => {
		const formWithStringNumbers = {
			name: "String Number Hero",
			level: "5",
			hpMax: "25",
			ac: "16",
			str: "18",
		};
		const parsed = parseRequest(CreateCharacterSchema, formWithStringNumbers);
		assert.equal(typeof parsed.level, "number");
		assert.equal(parsed.level, 5);
		assert.equal(typeof parsed.combat.hpMax, "number");
		assert.equal(parsed.combat.hpMax, 25);
		assert.equal(typeof parsed.combat.ac, "number");
		assert.equal(parsed.combat.ac, 16);
		assert.equal(typeof parsed.stats.str, "number");
		assert.equal(parsed.stats.str, 18);
	});
});

describe("Firebase Live CRUD Operations & Partial Merging", () => {
	let testCharId;

	it("should create character and verify nested combat fields in Realtime Database", async () => {
		const result = await CharacterService.createCharacter({
			name: "Test Hero Alignment",
			characterClass: "Paladin",
			race: "Human",
			hpMax: 20,
			ac: 18,
		});

		assert.ok(result.id);
		testCharId = result.id;

		const fetched = await CharacterService.getCharacterById(testCharId);
		assert.equal(fetched.name, "Test Hero Alignment");
		assert.equal(fetched.characterClass, "Paladin");
		assert.equal(fetched.combat.hpMax, 20);
		assert.equal(fetched.combat.hpCurrent, 20);
		assert.equal(fetched.combat.ac, 18);
	});

	it("should update single stat path without overwriting other combat fields", async () => {
		// Update hpCurrent via updateCharacterStat (matches PartyCard live HP changes)
		await CharacterService.updateCharacterStat(testCharId, "combat/hpCurrent", 12);

		const fetched = await CharacterService.getCharacterById(testCharId);
		assert.equal(fetched.combat.hpCurrent, 12);
		assert.equal(fetched.combat.hpMax, 20, "hpMax must remain intact!");
		assert.equal(fetched.combat.ac, 18, "ac must remain intact!");
	});

	it("should update nested combat object without overwriting sibling fields", async () => {
		// Update via updateCharacter with nested object (deep merge)
		await CharacterService.updateCharacter(testCharId, {
			combat: { hpCurrent: 5 },
		});

		const fetched = await CharacterService.getCharacterById(testCharId);
		assert.equal(fetched.combat.hpCurrent, 5);
		assert.equal(fetched.combat.hpMax, 20, "hpMax must NOT be wiped by shallow merge!");
		assert.equal(fetched.combat.ac, 18, "ac must NOT be wiped by shallow merge!");
	});

	it("should delete character permanently (permadeath)", async () => {
		await CharacterService.deleteCharacter(testCharId);
		await assert.rejects(
			async () => await CharacterService.getCharacterById(testCharId),
			(err) => err.code === "CHARACTER_NOT_FOUND" || err.message.includes("not found"),
		);
	});

	it("should test inventory CRUD and auto-delete on quantity zero", async () => {
		const item = await InventoryService.addItem({
			name: "Potion of Healing",
			type: "potion",
			quantity: 1,
			description: "Heals 2d4+2 hit points",
		});
		assert.ok(item.id);

		// Consume potion -> quantity 0 -> auto delete
		const updated = await InventoryService.updateItem(item.id, { quantity: 0 });
		assert.equal(updated, null, "Item should be null on auto-deletion");

		await assert.rejects(
			async () => await InventoryService.getItemById(item.id),
			(err) => err.code === "INVENTORY_ITEM_NOT_FOUND",
		);
	});

	it("should test NPC CRUD operations", async () => {
		const npc = await NpcService.createNpc({
			name: "Elminster",
			title: "Sage of Shadowdale",
			disposition: "Friendly",
			race: "Human",
			class: "Wizard",
		});
		assert.ok(npc.id);

		// Update disposition
		const updated = await NpcService.updateNpc(npc.id, { disposition: "Neutral" });
		assert.equal(updated.disposition, "Neutral");

		// Clean up
		await NpcService.deleteNpc(npc.id);
	});

	after(() => {
		// Exit after tests complete so open Firebase RTDB sockets don't keep process alive
		setTimeout(() => process.exit(0), 1000);
	});
});
