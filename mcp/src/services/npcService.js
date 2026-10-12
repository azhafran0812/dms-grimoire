/**
 * services/npcService.js
 * ═══ LAYER 4: Service — NPC Generation Orchestrator ═══
 *
 * Master orchestrator:
 *   1. LLM call → generate NPC data
 *   2. Validate & balance stats via statSimulator
 *   3. Generate avatar via avatarService
 *   4. Return unified result
 *
 * Fallback: deterministic NPC generation when LLM is offline.
 */

import { suggestColors } from "../core/colorPalette.js";
import {
	generateBalancedStats,
	simulateCombat,
	validateStats,
} from "../core/statSimulator.js";
import { generateAvatar } from "./avatarService.js";
import { callLlm } from "./llmClient.js";

// ─── Constants ─────────────────────────────────────────────

export const DEFAULT_PARTY_CONTEXT = Object.freeze({
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
});

// ─── Prompt Builders ───────────────────────────────────────

function buildSystemPrompt() {
	return `You are Arcane Scribe, the master AI assistant and lore weaver for DM's Grimoire (a D&D Campaign Manager).
When given a user prompt, campaign context, and entry type, generate a comprehensive D&D entity.

THEMATIC AVATAR GUIDE:
Select "theme" from: "dnd_fantasy", "gothic_horror", "celestial_angel", "demonic_underworld", "nature_elemental", "steampunk", "pirate", "ninja_samurai", "cyberpunk", "modern_streetwear"
Select "archetype" from: "warrior", "mage", "rogue", "ranger", "healer", "monarch_noble", "beast_nature", "farmer_rancher"
Select "mood" from: "mysterious", "ominous", "heroic", "fierce", "serene", "playful", "urban_cool"
Select "preferredColors": Pick 3 harmonious colors from the theme palette.

STAT BALANCING RULES (IMPORTANT — DO NOT make OP characters):
- Level 1-2: HP 8-16, total stats 60-72, single stat max 16
- Level 3-4: HP 20-32, total stats 66-78, single stat max 18
- Level 5-8: HP 30-55, total stats 72-84, single stat max 19
- Level 9-12: HP 55-85, total stats 78-96, single stat max 20
- Level 13-16: HP 80-120, total stats 84-102, single stat max 20
- Level 17-20: HP 100-160, total stats 90-108, single stat max 20

RESPOND ONLY with valid JSON:
{
  "name": "NPC Name",
  "title": "Short epithet",
  "type": "Mysterious NPC",
  "race": "D&D Race",
  "class": "D&D Class",
  "level": 3,
  "hp": { "current": 28, "max": 28 },
  "stats": { "str": 10, "dex": 16, "con": 14, "int": 12, "wis": 13, "cha": 15 },
  "armorClass": 14,
  "location": "Location name",
  "disposition": "Ramah" | "Netral" | "Bermusuhan",
  "personality": "Detailed mannerisms",
  "lore": "Backstory",
  "secret": "Quest hook or secret",
  "avatar": {
    "theme": "dnd_fantasy",
    "archetype": "rogue",
    "mood": "mysterious",
    "preferredColors": ["purple", "black", "gold"]
  }
}`;
}

function buildUserPrompt({ prompt, type, partyContext }) {
	const ctx =
		typeof partyContext === "string"
			? partyContext
			: JSON.stringify(partyContext);
	return `Generate a D&D Campaign Entry:
- Category: ${type}
- Prompt: "${prompt}"
- Party Context: ${ctx}

Generate the complete JSON entity now.`;
}

// ─── Deterministic Fallback ────────────────────────────────

/**
 * Deterministic NPC generation when LLM is offline.
 * Uses keyword inference + statSimulator for balanced stats.
 * NO Math.random() — everything is seeded from the prompt.
 */
function generateFallbackNpc({ prompt, type, partyContext }) {
	const pLower = (prompt || "").toLowerCase();
	const seed = hashStr(pLower);

	// Keyword-based inference
	let race = "Human",
		className = "Rogue",
		disposition = "Netral";
	let theme = "dnd_fantasy",
		archetype = "rogue",
		mood = "mysterious";

	if (
		pLower.includes("warlock") ||
		pLower.includes("dark") ||
		pLower.includes("demon") ||
		pLower.includes("shadow")
	) {
		race = "Tiefling";
		className = "Warlock";
		theme = "gothic_horror";
		archetype = "mage";
		mood = "ominous";
		disposition = "Bermusuhan";
	} else if (
		pLower.includes("knight") ||
		pLower.includes("paladin") ||
		pLower.includes("warrior") ||
		pLower.includes("guard")
	) {
		race = "Human";
		className = "Paladin";
		theme = "dnd_fantasy";
		archetype = "warrior";
		mood = "heroic";
		disposition = "Ramah";
	} else if (
		pLower.includes("mage") ||
		pLower.includes("wizard") ||
		pLower.includes("arcane")
	) {
		race = "Elf";
		className = "Wizard";
		theme = "dnd_fantasy";
		archetype = "mage";
		mood = "mysterious";
		disposition = "Netral";
	} else if (
		pLower.includes("healer") ||
		pLower.includes("cleric") ||
		pLower.includes("angel")
	) {
		race = "Aasimar";
		className = "Cleric";
		theme = "celestial_angel";
		archetype = "healer";
		mood = "serene";
		disposition = "Ramah";
	} else if (
		pLower.includes("cyber") ||
		pLower.includes("tech") ||
		pLower.includes("hacker")
	) {
		race = "Cyborg Human";
		className = "Artificer";
		theme = "cyberpunk";
		archetype = "cyber_hacker";
		mood = "urban_cool";
	} else if (
		pLower.includes("pirate") ||
		pLower.includes("captain") ||
		pLower.includes("sea")
	) {
		race = "Human";
		className = "Rogue";
		theme = "pirate";
		archetype = "rogue";
		mood = "fierce";
		disposition = "Netral";
	} else if (
		pLower.includes("ninja") ||
		pLower.includes("samurai") ||
		pLower.includes("ronin")
	) {
		race = "Human";
		className = "Monk";
		theme = "ninja_samurai";
		archetype = "warrior";
		mood = "fierce";
		disposition = "Netral";
	} else if (
		pLower.includes("druid") ||
		pLower.includes("forest") ||
		pLower.includes("nature")
	) {
		race = "Firbolg";
		className = "Druid";
		theme = "nature_elemental";
		archetype = "beast_nature";
		mood = "serene";
		disposition = "Ramah";
	} else if (
		pLower.includes("peternak") ||
		pLower.includes("petani") ||
		pLower.includes("farmer") ||
		pLower.includes("rancher") ||
		pLower.includes("gembala") ||
		(pLower.includes("sapi") && !pLower.includes("manusia sapi"))
	) {
		race = "Human";
		className = "Commoner";
		theme = "nature_elemental";
		archetype = "farmer_rancher";
		mood = "serene";
		disposition = "Ramah";
	}

	const avgLevel =
		(typeof partyContext === "object" && partyContext?.averageLevel) || 3;
	const colors = suggestColors(theme, archetype, mood);

	// Deterministic name from seed
	const names = [
		"Valen Nightshade",
		"Kaelen Ashborne",
		"Morvath Palehand",
		"Lyra Windstrider",
		"Theron Emberfist",
		"Seris Dawnveil",
		"Corvus Blackthorn",
		"Elara Moonwhisper",
		"Draven Ironclaw",
		"Zara Stormweaver",
	];
	const titles = [
		"The Veiled",
		"The Ashen",
		"Silent",
		"Keeper of Secrets",
		"Shadowed",
		"The Wandering",
		"Flame-Touched",
		"Star-Marked",
		"The Enigmatic",
		"Iron-Willed",
	];

	const name = names[seed % names.length];
	const title = `${titles[seed % titles.length]} ${className}`;

	// Balanced stats via statSimulator (deterministic)
	const balanced = generateBalancedStats({ name, className, level: avgLevel });

	return {
		name,
		title,
		type,
		race,
		class: className,
		level: avgLevel,
		hp: balanced.hp,
		stats: balanced.stats,
		armorClass: balanced.armorClass,
		location: "The Ashen Crown",
		disposition,
		personality: `Quiet, calculating, and watchful. Speaks in measured tones and observes the party closely.`,
		lore: `Born in the surrounding reaches of The Ashen Crown, this ${className} has witnessed ancient rituals and guards crucial lore.`,
		secret: `Harbors knowledge of a hidden passage beneath The Ashen Crown and knows why the local wards are failing.`,
		avatar: { theme, archetype, mood, preferredColors: colors },
	};
}

function hashStr(str) {
	let h = 5381;
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) + h + str.charCodeAt(i);
		h = h & 0x7fffffff;
	}
	return h;
}

// ─── Sanitizer ─────────────────────────────────────────────

function sanitizeNpc(npc = {}, prompt = "", type = "Mysterious NPC") {
	const level = Math.max(1, Math.min(20, Number(npc.level) || 3));
	const className = npc.class || "Adventurer";
	const name = npc.name || "Mysterious Wanderer";

	// Validate & clamp stats using statSimulator
	const rawStats = npc.stats || {};
	const rawHp = {
		current: Number(npc.hp?.current ?? 25),
		max: Number(npc.hp?.max ?? 25),
	};
	const rawAc = Number(npc.armorClass) || 13;

	const validation = validateStats({
		level,
		stats: {
			str: Number(rawStats.str) || 10,
			dex: Number(rawStats.dex) || 12,
			con: Number(rawStats.con) || 12,
			int: Number(rawStats.int) || 12,
			wis: Number(rawStats.wis) || 12,
			cha: Number(rawStats.cha) || 12,
		},
		hp: rawHp,
		armorClass: rawAc,
	});

	// If validation fails, regenerate balanced stats
	let finalStats, finalHp, finalAc;
	if (!validation.valid) {
		const balanced = generateBalancedStats({ name, className, level });
		finalStats = balanced.stats;
		finalHp = balanced.hp;
		finalAc = balanced.armorClass;
	} else {
		finalStats = validation.adjustedStats;
		finalHp = validation.adjustedHp;
		finalAc = rawAc;
	}

	const avatarMeta = npc.avatar || {};
	const colors =
		Array.isArray(avatarMeta.preferredColors) &&
		avatarMeta.preferredColors.length > 0
			? avatarMeta.preferredColors
			: suggestColors(
					avatarMeta.theme || "dnd_fantasy",
					avatarMeta.archetype || "rogue",
					avatarMeta.mood || "mysterious",
				);

	return {
		name,
		title: npc.title || `Wanderer of The Ashen Crown`,
		type: npc.type || type,
		race: npc.race || "Human",
		class: className,
		level,
		hp: finalHp,
		stats: finalStats,
		armorClass: finalAc,
		location: npc.location || "The Ashen Crown",
		disposition: ["Ramah", "Netral", "Bermusuhan"].includes(npc.disposition)
			? npc.disposition
			: "Netral",
		personality:
			npc.personality ||
			"Enigmatic and cautious, assessing intentions of strangers.",
		lore:
			npc.lore ||
			`An enigmatic figure wandering the realm regarding ${prompt || "ancient ruins"}.`,
		secret:
			npc.secret || "Knows a hidden secret that could alter the campaign.",
		avatarMeta: {
			theme: avatarMeta.theme || "dnd_fantasy",
			archetype: avatarMeta.archetype || "rogue",
			mood: avatarMeta.mood || "mysterious",
			preferredColors: colors,
		},
		statValidation: validation.warnings.length > 0 ? validation : null,
	};
}

// ─── Main Orchestrator ─────────────────────────────────────

/**
 * Generates a complete NPC with lore, balanced stats, avatar, and optional render.
 *
 * @param {object} params
 * @param {string} params.prompt
 * @param {string} [params.type]
 * @param {object|string} [params.partyContext]
 * @param {boolean} [params.render]
 * @param {boolean} [params.simulate] — Run combat simulation
 * @param {import('../core/themeClassifier.js').ThemeClassifier} params.classifier
 * @returns {Promise<object>}
 */
export async function generateNpc({
	prompt,
	type = "Mysterious NPC",
	partyContext = DEFAULT_PARTY_CONTEXT,
	render = true,
	simulate = false,
	classifier,
}) {
	let rawNpc = null;
	let source = "local-llm";

	// 1. Try LLM
	try {
		rawNpc = await callLlm({
			systemPrompt: buildSystemPrompt(),
			userPrompt: buildUserPrompt({ prompt, type, partyContext }),
		});
	} catch {
		// LLM failed — will use fallback
	}

	// 2. Fallback
	if (!rawNpc) {
		source = "procedural-fallback";
		rawNpc = generateFallbackNpc({ prompt, type, partyContext });
	}

	// 3. Sanitize + validate stats
	const npc = sanitizeNpc(rawNpc, prompt, type);

	// 4. Generate avatar
	const avatarResult = await generateAvatar({
		theme: npc.avatarMeta.theme,
		archetype: npc.avatarMeta.archetype,
		mood: npc.avatarMeta.mood,
		preferredColors: npc.avatarMeta.preferredColors,
		npcName: npc.name,
		npcClass: npc.class,
		render: render !== false,
		classifier,
	});

	const renderResult = avatarResult.renderResult || null;

	// 5. Optional combat simulation
	let simulation = null;
	if (simulate && partyContext?.members?.[0]) {
		const partyMember = partyContext.members[0];
		const memberStats = generateBalancedStats({
			name: partyMember.name,
			className: partyMember.class,
			level: partyMember.level,
		});

		simulation = simulateCombat({
			combatantA: {
				name: npc.name,
				stats: npc.stats,
				level: npc.level,
				hp: npc.hp,
				armorClass: npc.armorClass,
			},
			combatantB: {
				name: partyMember.name,
				stats: memberStats.stats,
				level: partyMember.level,
				hp: memberStats.hp,
				armorClass: memberStats.armorClass,
			},
			maxRounds: 10,
		});
	}

	return {
		ok: true,
		source,
		prompt: prompt || "",
		type: npc.type,
		npc: {
			name: npc.name,
			title: npc.title,
			race: npc.race,
			class: npc.class,
			level: npc.level,
			hp: npc.hp,
			stats: npc.stats,
			armorClass: npc.armorClass,
			location: npc.location,
			disposition: npc.disposition,
			personality: npc.personality,
			lore: npc.lore,
			secret: npc.secret,
			statValidation: npc.statValidation,
		},
		avatar: {
			theme: avatarResult.theme,
			archetype: avatarResult.archetype,
			mood: avatarResult.mood,
			colorPalette: avatarResult.colorPalette,
			items: avatarResult.items.map((i) => ({
				itemID: i.itemID,
				name: i.nameWithCaps || i.name,
				category: i.category,
				colors: i.colors || [],
			})),
			compatibility: avatarResult.compatibility,
		},
		image: {
			rendered: Boolean(renderResult?.success),
			dimensions: renderResult?.metadata?.dimensions || "992x640",
			dataUrl: renderResult?.dataUrl || null,
			imageBase64: renderResult?.imageBase64 || null,
		},
		simulation,
	};
}
