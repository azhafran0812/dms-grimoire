/**
 * services/characterService.js
 * ═══ LAYER 3: Service — Character Business Logic ═══
 *
 * Orchestrates character operations between controller and model.
 * Contains validation, business rules, and error wrapping.
 */

import https from "node:https";
import * as CharacterModel from "../models/characterModel.js";
import * as mcpClient from "./mcpClient.js";
import { db, ref, update } from "../config/firebase.js";
import { AppError, ErrorCode } from "../io/AppError.js";
import { parseRequest, CreateCharacterSchema, UpdateCharacterSchema } from "../io/request.js";

const DEFAULT_GT_PAYLOAD = {
  searchQuery: '',
  selectedType: 'All',
  expression: 0,
  skincolor: 0,
  roleskin: 0,
  dyes: [255, 255, 255],
  drops: [255, 255, 255],
  lenses: [0, 0, 0],
  customskincolor: [240, 240, 240, 255],
  purebeingtrigger: 0,
  equinox: 0,
  crownseasons: [0, 0],
  willofthewild: 0,
  golgift: 0,
  perilous: 0,
  eqaura: 0,
  anomaly: 0,
  bbandolier: ['harlequin', null],
  infinitycrown: [[255, 200, 37], [255, 0, 64], [26, 45, 140], false, true, true, true],
  infinityaura: [[63, 251, 255], [255, 255, 255], [255, 255, 255], false, true, true, true, false, true, true],
  infinityfist: [[122, 10, 250], [65, 65, 65], [78, 255, 0], 0],
  wingsofinfinity: [[0, 120, 220], [255, 73, 255], [0, 120, 220], [255, 73, 255], [0, 120, 220], [255, 73, 255], [0, 120, 220], [255, 73, 255], [1, 1, 1, 1], [0, 0, 0, 0]],
  riftcape: [[147, 56, 143], [147, 56, 143], true, false, 3],
  riftwings: [[93, 22, 200], [220, 72, 255], true, 0],
  minokawa: [true, true],
  ahool: [true, true],
  celesdragcharm: 0,
  artlevel: [0, 0, 0, 0, 0],
};

function renderGrowtopiaComposite(equippedTuples) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      ...DEFAULT_GT_PAYLOAD,
      equipped: equippedTuples,
    });
    const req = https.request(
      'https://gtsetplanner.com/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        timeout: 12000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data.setimage || null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

/**
 * Creates a new party character.
 * @param {object} data — Validated character data
 * @returns {Promise<{ id: string, data: object }>}
 */
export async function createCharacter(data) {
	const validated = parseRequest(CreateCharacterSchema, data);
	try {
		return await CharacterModel.create(validated);
	} catch (err) {
		if (err instanceof AppError) throw err;
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to create character: ${err.message}`,
		);
	}
}

/**
 * Retrieves all party characters.
 * @returns {Promise<object>}
 */
export async function getAllCharacters() {
	try {
		return await CharacterModel.findAll();
	} catch (err) {
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to fetch characters: ${err.message}`,
		);
	}
}

/**
 * Retrieves a single character by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getCharacterById(id) {
	const character = await CharacterModel.findById(id);
	if (!character) {
		throw new AppError(
			ErrorCode.CHARACTER_NOT_FOUND,
			`Character with ID "${id}" not found`,
		);
	}
	return character;
}

/**
 * Updates character fields (e.g. HP mutation, level up).
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateCharacter(id, updates) {
	await getCharacterById(id);
	const validated = parseRequest(UpdateCharacterSchema, updates);
	try {
		await CharacterModel.updateById(id, validated);
		return await CharacterModel.findById(id);
	} catch (err) {
		if (err instanceof AppError) throw err;
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to update character: ${err.message}`,
		);
	}
}

/**
 * Updates a single stat path (e.g. 'combat/hpCurrent').
 * Matches frontend's partyController.updateCharacterStat() pattern.
 * @param {string} id
 * @param {string} path — Firebase path (e.g. 'combat/hpCurrent')
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function updateCharacterStat(id, path, value) {
	await getCharacterById(id);
	try {
		await CharacterModel.updatePath(id, path, value);
	} catch (err) {
		if (err instanceof AppError) throw err;
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to update character stat: ${err.message}`,
		);
	}
}

/**
 * Deletes a character permanently (permadeath).
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteCharacter(id) {
	await getCharacterById(id);
	try {
		await CharacterModel.removeById(id);
	} catch (err) {
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to delete character: ${err.message}`,
		);
	}
}

/**
 * Styles a character using AI-themed local generation.
 * Generates avatar, equipment formula, color palette, and optional combat simulation.
 * Stores results into Firebase under party/{id}/aiMeta.
 *
 * @param {string} id — Character ID
 * @param {object} options
 * @param {string} [options.prompt] — Vision or outfit description
 * @param {boolean} [options.render] — Whether to generate avatar data
 * @param {boolean} [options.simulate] — Run combat test
 * @returns {Promise<object>}
 */
export async function styleCharacter(id, { prompt, render = true, simulate = false } = {}) {
	const character = await getCharacterById(id);
	const sessionPrompt =
		prompt?.trim() ||
		`${character.name}, a Level ${character.level || 1} ${character.race || "Human"} ${character.characterClass || "Fighter"}`;

	// Parse prompt keywords for theming
	const promptLower = sessionPrompt.toLowerCase();
	const themes = ['dark', 'holy', 'cyber', 'pirate', 'ninja', 'steam', 'forest', 'celestial', 'fire', 'ice', 'shadow', 'arcane'];
	const detectedTheme = themes.find(t => promptLower.includes(t)) || 'fantasy';
	
	const archetypes = ['necromancer', 'paladin', 'rogue', 'warrior', 'mage', 'ranger', 'druid', 'bard', 'cleric', 'monk'];
	const detectedArchetype = archetypes.find(a => promptLower.includes(a)) || (character.characterClass || 'warrior').toLowerCase();
	
	const moods = ['heroic', 'dark', 'mysterious', 'noble', 'savage', 'serene', 'menacing', 'ethereal'];
	const detectedMood = moods.find(m => promptLower.includes(m)) || 'heroic';

	// Generate authentic 8-slot Growtopia equipment formulas from items_cache.json
	const equipmentSets = {
		dark: [
			{ category: 'Hat', name: 'Dark Cult Hood', itemID: '3416' },
			{ category: 'Hair', name: 'Ninja Mask', itemID: '290' },
			{ category: 'Face', name: 'Eyepatch', itemID: '314' },
			{ category: 'Shirt', name: 'Ninja Vest', itemID: '294' },
			{ category: 'Pants', name: 'Ninja Tights', itemID: '292' },
			{ category: 'Feet', name: 'Ninja Slippers', itemID: '296' },
			{ category: 'Back', name: 'Vampire Cape', itemID: '1166' },
			{ category: 'Hand', name: 'Legendary Katana', itemID: '2592' },
		],
		ninja: [
			{ category: 'Hat', name: 'Dark Cult Hood', itemID: '3416' },
			{ category: 'Hair', name: 'Ninja Mask', itemID: '290' },
			{ category: 'Face', name: 'Eyepatch', itemID: '314' },
			{ category: 'Shirt', name: 'Ninja Vest', itemID: '294' },
			{ category: 'Pants', name: 'Ninja Tights', itemID: '292' },
			{ category: 'Feet', name: 'Ninja Slippers', itemID: '296' },
			{ category: 'Back', name: 'Vampire Cape', itemID: '1166' },
			{ category: 'Hand', name: 'Legendary Katana', itemID: '2592' },
		],
		holy: [
			{ category: 'Hat', name: "Knight's Helm - Crusader", itemID: '7278' },
			{ category: 'Hair', name: 'Blonde Bombshell', itemID: '90' },
			{ category: 'Face', name: 'Gold-Rimmed Glasses', itemID: '146' },
			{ category: 'Shirt', name: "Knight's Chainmail - Sun", itemID: '7262' },
			{ category: 'Pants', name: 'Black Pants', itemID: '76' },
			{ category: 'Feet', name: 'Boots', itemID: '42' },
			{ category: 'Back', name: 'Angel Wings', itemID: '362' },
			{ category: 'Hand', name: 'Golden Sword', itemID: '604' },
		],
		paladin: [
			{ category: 'Hat', name: "Knight's Helm - Crusader", itemID: '7278' },
			{ category: 'Hair', name: 'Blonde Bombshell', itemID: '90' },
			{ category: 'Face', name: 'Gold-Rimmed Glasses', itemID: '146' },
			{ category: 'Shirt', name: "Knight's Chainmail - Sun", itemID: '7262' },
			{ category: 'Pants', name: 'Black Pants', itemID: '76' },
			{ category: 'Feet', name: 'Boots', itemID: '42' },
			{ category: 'Back', name: 'Angel Wings', itemID: '362' },
			{ category: 'Hand', name: 'Golden Sword', itemID: '604' },
		],
		fantasy: [
			{ category: 'Hat', name: 'Knight Helmet', itemID: '1736' },
			{ category: 'Hair', name: 'Blonde Bombshell', itemID: '90' },
			{ category: 'Face', name: 'Iron Mask', itemID: '692' },
			{ category: 'Shirt', name: "Knight's Chainmail - Sun", itemID: '7262' },
			{ category: 'Pants', name: 'Black Pants', itemID: '76' },
			{ category: 'Feet', name: 'Boots', itemID: '42' },
			{ category: 'Back', name: 'Heroman Cape', itemID: '350' },
			{ category: 'Hand', name: 'Golden Sword', itemID: '604' },
		],
		pirate: [
			{ category: 'Hat', name: 'Pirate Hat', itemID: '312' },
			{ category: 'Hair', name: 'Brown Hair', itemID: '68' },
			{ category: 'Face', name: 'Eyepatch', itemID: '314' },
			{ category: 'Shirt', name: 'Black Tuxedo', itemID: '54' },
			{ category: 'Pants', name: 'Black Pants', itemID: '76' },
			{ category: 'Feet', name: 'Boots', itemID: '42' },
			{ category: 'Back', name: 'Heroman Cape', itemID: '350' },
			{ category: 'Hand', name: 'Sword', itemID: '94' },
		],
		arcane: [
			{ category: 'Hat', name: 'Wizard Hat', itemID: '582' },
			{ category: 'Hair', name: 'Long Black Hair', itemID: '266' },
			{ category: 'Face', name: 'Monocle', itemID: '310' },
			{ category: 'Shirt', name: 'Black Tuxedo', itemID: '54' },
			{ category: 'Pants', name: 'Black Pants', itemID: '76' },
			{ category: 'Feet', name: 'Boots', itemID: '42' },
			{ category: 'Back', name: 'Crystal Cape', itemID: '1738' },
			{ category: 'Hand', name: 'Golden Sword', itemID: '604' },
		],
	};

	const items = equipmentSets[detectedTheme] || equipmentSets.fantasy;
	
	const colorPalettes = {
		dark: ['Obsidian Black', 'Midnight Purple', 'Blood Crimson', 'Shadow Grey'],
		ninja: ['Midnight Black', 'Shadow Obsidian', 'Stealth Grey', 'Blood Crimson'],
		holy: ['Divine Gold', 'Pure White', 'Azure Blue', 'Sacred Silver'],
		paladin: ['Divine Gold', 'Pure White', 'Azure Blue', 'Sacred Silver'],
		fantasy: ['Forest Green', 'Leather Brown', 'Steel Grey', 'Crimson Red'],
		pirate: ['Sea Salt White', 'Deep Navy', 'Gold Trim', 'Leather Tan'],
		arcane: ['Mystic Violet', 'Astral Blue', 'Rune Gold', 'Void Black'],
	};

	const avatar = {
		theme: detectedTheme.charAt(0).toUpperCase() + detectedTheme.slice(1),
		archetype: detectedArchetype.charAt(0).toUpperCase() + detectedArchetype.slice(1),
		mood: detectedMood.charAt(0).toUpperCase() + detectedMood.slice(1),
		items,
		colorPalette: colorPalettes[detectedTheme] || colorPalettes.fantasy,
		searchRegex: `/(${detectedTheme}|${detectedArchetype}|${character.characterClass || 'fighter'})/gi`,
		review: {
			synergyScore: 75 + Math.floor(Math.random() * 25),
			critique: `This ${detectedTheme} ${detectedArchetype} ensemble captures the essence of ${character.name}'s journey. The color harmony between the armor pieces creates a cohesive visual identity that commands attention.`,
			stylistAdvice: `Consider adding accent pieces that complement the ${detectedTheme} palette. The current setup scores well on thematic consistency.`,
		},
		compatibility: { autoResolved: false, removedItems: [] },
	};

	// Optional combat simulation
	let simulation = null;
	if (simulate) {
		const opponent = 'Training Dummy';
		const rounds = 3;
		const log = [];
		let charHp = character.combat?.hpCurrent || character.combat?.hpMax || 10;
		let oppHp = 15;

		for (let round = 1; round <= rounds && charHp > 0 && oppHp > 0; round++) {
			// Character attacks
			const charD20 = Math.floor(Math.random() * 20) + 1;
			const charHit = charD20 >= 10;
			const charDmg = charHit ? Math.floor(Math.random() * 8) + 1 : 0;
			const charResult = charD20 === 20 ? 'CRIT' : charHit ? 'HIT' : 'MISS';
			const actualCharDmg = charResult === 'CRIT' ? charDmg * 2 : charDmg;
			oppHp = Math.max(0, oppHp - actualCharDmg);
			log.push({ round, attacker: character.name, defender: opponent, d20: charD20, result: charResult, damage: actualCharDmg, defenderHp: oppHp });

			if (oppHp <= 0) break;

			// Opponent attacks
			const oppD20 = Math.floor(Math.random() * 20) + 1;
			const oppHit = oppD20 >= 12;
			const oppDmg = oppHit ? Math.floor(Math.random() * 6) + 1 : 0;
			const oppResult = oppD20 === 20 ? 'CRIT' : oppHit ? 'HIT' : 'MISS';
			const actualOppDmg = oppResult === 'CRIT' ? oppDmg * 2 : oppDmg;
			charHp = Math.max(0, charHp - actualOppDmg);
			log.push({ round, attacker: opponent, defender: character.name, d20: oppD20, result: oppResult, damage: actualOppDmg, defenderHp: charHp });
		}

		simulation = {
			rounds,
			winner: charHp > 0 ? character.name : opponent,
			log,
		};
	}

	let dataUrl = null;
	if (render) {
		const equippedTuples = items.map((i) => [String(i.itemID), String(i.category)]);
		const gtBase64 = await renderGrowtopiaComposite(equippedTuples);
		if (gtBase64) {
			dataUrl = `data:image/png;base64,${gtBase64}`;
		}
	}
	if (!dataUrl) {
		dataUrl = character.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(character.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
	}

	const image = render ? {
		rendered: true,
		dataUrl,
		dimensions: '992x640',
		format: 'png',
		source: 'growtopia-gtsetplanner',
	} : null;

	const aiMeta = {
		prompt: sessionPrompt,
		styledAt: Date.now(),
		avatar,
		image,
		simulation,
		selectedAgent: {
			name: 'Arcane Art Director',
			title: `${detectedTheme.charAt(0).toUpperCase() + detectedTheme.slice(1)} Visual Specialist`,
			domain: 'Character Styling & Equipment Curation',
		},
		agentSteps: [],
		source: "local-stylist",
	};

	await update(ref(db, `party/${id}`), {
		aiMeta,
		avatarUrl: dataUrl,
		updatedAt: Date.now(),
	});

	const updated = await CharacterModel.findById(id);
	return {
		id,
		character: updated,
		aiMeta,
	};
}

/**
 * Generates a brand new Character with MCP AI Stylist and adds to party.
 *
 * @param {object} options
 * @param {string} options.prompt
 * @param {boolean} [options.render]
 * @param {boolean} [options.simulate]
 * @returns {Promise<object>}
 */
export async function generateCharacterWithAi({ prompt, render = true, simulate = false } = {}) {
	const sessionPrompt = prompt?.trim() || "Valiant D&D Adventurer hero";

	const mcpResponse = await mcpClient.generateNpc({
		prompt: sessionPrompt,
		type: "Character",
		render,
		simulate,
	});

	const npcData = mcpResponse.data?.npc;
	if (!npcData) {
		throw new AppError(
			ErrorCode.MCP_PARSE_FAILED,
			"MCP response did not contain valid character data",
			{ mcpResponse: mcpResponse.data },
		);
	}

	const charEntry = {
		name: npcData.name || "Hero",
		race: npcData.race || "Human",
		characterClass: npcData.class || "Fighter",
		level: npcData.level || 1,
		background: "Adventurer",
		alignment: "True Neutral",
		combat: {
			hpMax: npcData.hp?.max || 10,
			hpCurrent: npcData.hp?.current || 10,
			ac: npcData.armorClass || 10,
			speed: 30,
			initiativeModifier: 0,
			hitDice: { total: 1, current: 1, dieType: "d10" },
			deathSaves: { successes: 0, failures: 0 },
		},
		stats: npcData.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
		aiMeta: {
			prompt: sessionPrompt,
			styledAt: Date.now(),
			avatar: mcpResponse.data?.avatar || null,
			image: mcpResponse.data?.image || null,
			simulation: mcpResponse.data?.simulation || null,
			selectedAgent: mcpResponse.data?.selectedAgent || null,
			agentSteps: mcpResponse.data?.agentSteps || [],
			source: mcpResponse.data?.source || "mcp-agentic",
		},
	};

	const created = await CharacterModel.create(charEntry);
	return {
		id: created.id,
		character: created.data,
		mcpMeta: mcpResponse.meta,
	};
}

export default {
	createCharacter,
	getAllCharacters,
	getCharacterById,
	updateCharacter,
	updateCharacterStat,
	deleteCharacter,
	styleCharacter,
	generateCharacterWithAi,
};
