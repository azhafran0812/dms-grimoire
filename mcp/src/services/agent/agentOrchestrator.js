/**
 * services/agent/agentOrchestrator.js
 * ═══ AGENTIC LAYER — Dynamic AI Item Discovery & Stylist Pipeline ═══
 *
 * Fully dynamic, unconstrained item discovery across 3,948 Growtopia items:
 *
 *   Step 1: AI analyzes prompt → defines character lore, race, class, aesthetic
 *           AND formulates dynamic search regex & keywords per equipment slot.
 *   Step 2: AI-driven dynamic item retrieval across the full 3,948-item database
 *           using regex scanning, keyword ranking, and direct AI suggestions.
 *   Step 3: Generate balanced D&D stats and combat attributes.
 *   Step 4: AI Stylist Agent selects the optimal item formula from candidates.
 *   Step 5: Smart collision auto-resolution (e.g., helmet hiding hair).
 *   Step 6: Render composite avatar via gtsetplanner.com.
 *   Step 7: Optional combat simulation against party members.
 *
 * No static theme locks. The AI dynamically searches, selects, and styles.
 */

import { suggestColors } from "../../core/colorPalette.js";
import {
	isCapeItem,
	isFullBodyShirt,
	isFullHeadwear,
	isWingItem,
} from "../../core/compatibilityEngine.js";
import {
	generateBalancedStats,
	simulateCombat,
	validateStats,
} from "../../core/statSimulator.js";
import { callLlm } from "../llmClient.js";
import { renderAvatar } from "../renderService.js";

export const EQUIPMENT_SLOTS = [
	"Hat",
	"Hair",
	"Face",
	"Shirt",
	"Pants",
	"Feet",
	"Back",
	"Hand",
];

// Standard preset theme IDs for color hints and fallback palettes
const PRESET_THEMES = [
	"cyberpunk",
	"steampunk",
	"dnd_fantasy",
	"gothic_horror",
	"celestial_angel",
	"demonic_underworld",
	"nature_elemental",
	"pirate",
	"ninja_samurai",
	"modern_streetwear",
];

const PRESET_FUZZY_MAP = {
	robot: "cyberpunk",
	mech: "cyberpunk",
	cyber: "cyberpunk",
	android: "cyberpunk",
	tech: "cyberpunk",
	steam: "steampunk",
	clockwork: "steampunk",
	gear: "steampunk",
	gothic: "gothic_horror",
	dark: "gothic_horror",
	necro: "gothic_horror",
	undead: "gothic_horror",
	skull: "gothic_horror",
	angel: "celestial_angel",
	holy: "celestial_angel",
	divine: "celestial_angel",
	seraph: "celestial_angel",
	demon: "demonic_underworld",
	hell: "demonic_underworld",
	devil: "demonic_underworld",
	infernal: "demonic_underworld",
	nature: "nature_elemental",
	druid: "nature_elemental",
	forest: "nature_elemental",
	beast: "nature_elemental",
	pirate: "pirate",
	sea: "pirate",
	ocean: "pirate",
	captain: "pirate",
	ninja: "ninja_samurai",
	samurai: "ninja_samurai",
	katana: "ninja_samurai",
	shinobi: "ninja_samurai",
	street: "modern_streetwear",
	casual: "modern_streetwear",
	hoodie: "modern_streetwear",
	fantasy: "dnd_fantasy",
	knight: "dnd_fantasy",
	paladin: "dnd_fantasy",
	magic: "dnd_fantasy",
	wizard: "dnd_fantasy",
};

function normalizePresetHint(raw) {
	if (!raw) return "dnd_fantasy";
	const lower = String(raw).toLowerCase().trim();
	if (PRESET_THEMES.includes(lower)) return lower;
	for (const [kw, theme] of Object.entries(PRESET_FUZZY_MAP)) {
		if (lower.includes(kw)) return theme;
	}
	return "dnd_fantasy";
}

// ─── SPECIALIST AGENTS & DOMAIN ROUTER ─────────────────────────────────────

export const SPECIALIST_AGENTS = Object.freeze({
	AGRICULTURAL_RANCHER: {
		id: "agricultural_rancher_agent",
		name: "Agricultural & Rancher Stylist Agent",
		title: "Spesialis Busana Peternakan & Pedesaan",
		domain: "Animal Husbandry, Agriculture & Rural Life",
		archetype: "farmer_rancher",
		defaultClass: "Commoner",
		defaultRace: "Human",
		disposition: "Ramah",
		theme: "Rustic Rancher & Livestock Caretaker / Peternak",
		presetHint: "nature_elemental",
		rules: [
			"CRITICAL: The subject is a HUMAN farmer/rancher (peternak), NOT an animal humanoid or beast (BUKAN 'manusia sapi')!",
			"The animal (cow, cattle, sheep, etc.) is the livestock or companion walking beside them via Hand slot ('calf leash').",
			"The head and hair must be natural human hair under a farmer hat (e.g. 'straw hat' or 'cowboy hat').",
			"FORBIDDEN: NEVER equip animal masks/heads like 'cow mask' or 'bull mask' on hair/head. The character is human!",
			"Equip standard authentic rancher attire: 'overalls', 'munchin\\' straw', 'cowboy boots', 'calf leash'.",
			"SLOT OPTIONALITY: Slots are flexible and OPTIONAL! If overalls (full body) are worn, Pants slot is optional/null. Back slot (wings/capes) should be null. Do NOT force all 8 slots!",
		],
		forbiddenItems: [
			"cow mask",
			"bull mask",
			"pig mask",
			"sheep mask",
			"dog mask",
			"cat mask",
			"wolf mask",
			"horse mask",
		],
	},
	ARCANE_KNIGHT: {
		id: "arcane_knight_agent",
		name: "Arcane & High Fantasy Stylist Agent",
		title: "Spesialis Ksatria & Sihir D&D",
		domain: "High Fantasy, Knights, Wizards & Paladins",
		archetype: "warrior",
		defaultClass: "Fighter",
		defaultRace: "Human",
		disposition: "Netral",
		theme: "D&D High Fantasy Adventurer",
		presetHint: "dnd_fantasy",
		rules: [
			"Equip noble medieval armor, robes, swords, shields, or mystical relics.",
			"Balance majestic fantasy aesthetics with classic heroic silhouette.",
			"SLOT OPTIONALITY: Full helmets cover hair (Hair: null). Full robes cover legs (Pants: null). Do not force unnecessary slots.",
		],
	},
	GOTHIC_HORROR: {
		id: "gothic_horror_agent",
		name: "Gothic Horror & Necromancy Agent",
		title: "Spesialis Kegelapan & Macabre",
		domain: "Gothic Horror, Vampires, Warlocks & Undead",
		archetype: "mage",
		defaultClass: "Warlock",
		defaultRace: "Tiefling",
		disposition: "Bermusuhan",
		theme: "Gothic Horror & Cursed Realm",
		presetHint: "gothic_horror",
		rules: [
			"Style dark macabre silhouettes with skulls, dark cloaks, and shadowy relics.",
		],
	},
	CYBER_MECHA: {
		id: "cyber_mecha_agent",
		name: "Cybernetic & Mecha Stylist Agent",
		title: "Spesialis Robotik & Teknologi Tinggi",
		domain: "Robotics, Cyborgs, Mecha & Futuristic Sci-Fi",
		archetype: "cyber_hacker",
		defaultClass: "Artificer",
		defaultRace: "Warforged",
		disposition: "Netral",
		theme: "Mechanized Combat Automaton",
		presetHint: "cyberpunk",
		rules: [
			"Style mechanized chassis, cybernetic limbs, visors, and high-tech conduits.",
		],
	},
	PRIMAL_BEAST: {
		id: "primal_beast_agent",
		name: "Primal Beast & Monster Agent",
		title: "Spesialis Monster & Manusia Hewan",
		domain: "Beasts, Lycanthropes, Minotaurs & Anthropomorphic Monsters",
		archetype: "beast_nature",
		defaultClass: "Barbarian",
		defaultRace: "Minotaur",
		disposition: "Bermusuhan",
		theme: "Primal Beastman / Mythical Monster",
		presetHint: "nature_elemental",
		rules: [
			"Used ONLY when the user explicitly requests an animal-human hybrid, minotaur, or beast monster ('manusia sapi', 'minotaur', 'werewolf').",
		],
	},
	HIGH_SEAS_PIRATE: {
		id: "high_seas_pirate_agent",
		name: "High Seas & Corsair Agent",
		title: "Spesialis Bajak Laut & Kelautan",
		domain: "Pirates, Swashbucklers & Naval Buccaneers",
		archetype: "rogue",
		defaultClass: "Rogue",
		defaultRace: "Human",
		disposition: "Netral",
		theme: "Swashbuckling Pirate Buccaneer",
		presetHint: "pirate",
		rules: [
			"Equip tricorn hats, cutlasses, corsair coats, anchors, or eye patches.",
		],
	},
	EASTERN_SHINOBI: {
		id: "eastern_shinobi_agent",
		name: "Eastern Shinobi & Samurai Agent",
		title: "Spesialis Bela Diri Timur & Samurai",
		domain: "Ninjas, Ronin, Katanas & Eastern Legends",
		archetype: "rogue",
		defaultClass: "Monk",
		defaultRace: "Human",
		disposition: "Netral",
		theme: "Eastern Shadow Shinobi",
		presetHint: "ninja_samurai",
		rules: ["Equip shinobi wraps, katanas, oni masks, and shadow garbs."],
	},
	URBAN_CONTEMPORARY: {
		id: "urban_contemporary_agent",
		name: "Urban & Streetwear Stylist Agent",
		title: "Spesialis Busana Kontemporer & Modern",
		domain: "Modern Streetwear, Urban Travelers & Casual",
		archetype: "rogue",
		defaultClass: "Bard",
		defaultRace: "Human",
		disposition: "Ramah",
		theme: "Modern Streetwear & Urban Explorer",
		presetHint: "modern_streetwear",
		rules: ["Equip trendy hoodies, denim, sneakers, and modern accessories."],
	},
});

/**
 * Selects the optimal specialist agent based on user prompt semantics.
 * @param {string} prompt
 * @returns {typeof SPECIALIST_AGENTS[keyof typeof SPECIALIST_AGENTS]}
 */
export function selectSpecialistAgent(prompt = "") {
	const p = String(prompt).toLowerCase();

	// Explicit Beastman / Minotaur / Animal Humanoid
	const isExplicitBeastman =
		/\b(manusia sapi|manusia serigala|minotaur|werewolf|beastman|manusia binatang|kostum sapi|topeng sapi)\b/i.test(
			p,
		);
	if (isExplicitBeastman) {
		return SPECIALIST_AGENTS.PRIMAL_BEAST;
	}

	// Farmer / Rancher / Herder / Peternak / Petani / Animal husbandry
	const isFarmerOrRancher =
		/\b(peternak|petani|farmer|rancher|ternak|gembala|shepherd|breeder|cowboy|koboi|ladang|kebun|sawah|farm|ranch)\b/i.test(
			p,
		) ||
		(/\b(sapi|cow|cattle|bull|calf|kambing|goat|domba|sheep|ayam|chicken|kuda|horse)\b/i.test(
			p,
		) &&
			!isExplicitBeastman);

	if (isFarmerOrRancher) {
		return SPECIALIST_AGENTS.AGRICULTURAL_RANCHER;
	}

	// Robot / Mecha / Tech
	if (
		/\b(robot|mech|cyborg|automaton|android|mesin|baja|besi|cyber|titan)\b/i.test(
			p,
		)
	) {
		return SPECIALIST_AGENTS.CYBER_MECHA;
	}

	// Gothic / Necromancer / Undead
	if (
		/\b(necro|undead|tengkorak|skull|mayat|vampir|death|gothic|kutukan|zombie|reaper)\b/i.test(
			p,
		)
	) {
		return SPECIALIST_AGENTS.GOTHIC_HORROR;
	}

	// Pirate / Nautical
	if (/\b(pirate|bajak laut|laut|kapal|sea|captain|anchor|sailor)\b/i.test(p)) {
		return SPECIALIST_AGENTS.HIGH_SEAS_PIRATE;
	}

	// Ninja / Samurai
	if (/\b(ninja|samurai|shinobi|ronin|katana|bayangan|assassin)\b/i.test(p)) {
		return SPECIALIST_AGENTS.EASTERN_SHINOBI;
	}

	// Streetwear / Modern
	if (/\b(street|hoodie|sneaker|casual|modern|skater|urban)\b/i.test(p)) {
		return SPECIALIST_AGENTS.URBAN_CONTEMPORARY;
	}

	// Default to Arcane & High Fantasy
	return SPECIALIST_AGENTS.ARCANE_KNIGHT;
}

function normalizeArchetype(raw) {
	const valid = [
		"warrior",
		"mage",
		"rogue",
		"ranger",
		"healer",
		"monarch_noble",
		"beast_nature",
		"cyber_hacker",
		"farmer_rancher",
		"commoner_worker",
	];
	if (!raw) return "warrior";
	const lower = String(raw).toLowerCase().trim();
	if (valid.includes(lower)) return lower;
	const map = {
		farmer: "farmer_rancher",
		peternak: "farmer_rancher",
		rancher: "farmer_rancher",
		gembala: "farmer_rancher",
		commoner: "commoner_worker",
		worker: "commoner_worker",
		necro: "mage",
		wizard: "mage",
		sorcerer: "mage",
		warlock: "mage",
		knight: "warrior",
		fighter: "warrior",
		paladin: "warrior",
		juggernaut: "warrior",
		robot: "warrior",
		mech: "warrior",
		thief: "rogue",
		assassin: "rogue",
		ninja: "rogue",
		archer: "ranger",
		hunter: "ranger",
		cleric: "healer",
		priest: "healer",
		angel: "healer",
		hacker: "cyber_hacker",
		cyber: "cyber_hacker",
		android: "cyber_hacker",
		cyborg: "cyber_hacker",
		druid: "beast_nature",
		beast: "beast_nature",
	};
	for (const [k, v] of Object.entries(map)) {
		if (lower.includes(k)) return v;
	}
	return "warrior";
}

function normalizeMood(raw) {
	const valid = [
		"mysterious",
		"ominous",
		"heroic",
		"fierce",
		"serene",
		"playful",
		"urban_cool",
	];
	if (!raw) return "fierce";
	const lower = String(raw).toLowerCase().trim();
	if (valid.includes(lower)) return lower;
	const map = {
		dark: "ominous",
		dread: "ominous",
		eerie: "ominous",
		brave: "heroic",
		noble: "heroic",
		valiant: "heroic",
		savage: "fierce",
		aggressive: "fierce",
		battle: "fierce",
		war: "fierce",
		cold: "fierce",
		calm: "serene",
		peace: "serene",
		holy: "serene",
		fun: "playful",
		trick: "playful",
		tech: "urban_cool",
		cyber: "urban_cool",
		cool: "urban_cool",
	};
	for (const [k, v] of Object.entries(map)) {
		if (lower.includes(k)) return v;
	}
	return "fierce";
}

function normalizeDisposition(raw) {
	const lower = String(raw || "")
		.toLowerCase()
		.trim();
	if (
		lower.includes("ramah") ||
		lower.includes("friend") ||
		lower.includes("ally")
	)
		return "Ramah";
	if (
		lower.includes("musuh") ||
		lower.includes("hostile") ||
		lower.includes("bermusuhan")
	)
		return "Bermusuhan";
	return "Netral";
}

// Clean regex string: remove non-ASCII characters (e.g. Kanji 牧場) and strip noise
function sanitizeRegex(pattern, prompt = "") {
	if (!pattern) return "";
	// 1. Strip non-ASCII characters (Kanji, Hanzi, Kana, etc.)
	let clean = String(pattern).replace(/[^\u0020-\u007E]/g, "");
	// 2. Remove accidental noise words (dirt, mud, ash, charcoal) unless user asked for them
	const isEarthPrompt =
		/\b(dirt|mud|earth|tanah|lumpur|batu|mining|tambang|volcano|gunung berapi)\b/i.test(
			prompt,
		);
	if (!isEarthPrompt) {
		clean = clean
			.replace(/\b(dirt|mud|ash|charcoal)\b/gi, "")
			.replace(/\|+/g, "|")
			.replace(/^\||\|$/g, "");
	}
	return clean.trim();
}

/**
 * Extracts key entity concepts from user prompt (Indonesian and English)
 * and defines preferred signature items per equipment slot.
 */
function extractCoreEntities(prompt = "") {
	const p = String(prompt).toLowerCase();
	const entities = [];
	const isExplicitBeastman =
		/\b(manusia sapi|minotaur|werecow|monster sapi|kostum sapi|topeng sapi)\b/i.test(
			p,
		);

	// Cow / Cattle / Sapi / Peternak Sapi
	if (
		/\b(sapi|cow|cattle|bull|calf|bovine|ternak sapi|peternak sapi)\b/i.test(p)
	) {
		if (isExplicitBeastman) {
			entities.push({
				name: "cow_beastman",
				boostTerms: ["cow mask", "bull mask", "riding bull", "horns", "hooves"],
				preferredHair: "cow mask",
			});
		} else {
			entities.push({
				name: "cow_rancher",
				boostTerms: [
					"calf leash",
					"calf",
					"cow",
					"cattle",
					"bull",
					"riding bull",
					"overalls",
					"straw hat",
					"munchin' straw",
					"cowboy boots",
				],
				preferredHand: "calf leash",
				preferredHat: "straw hat",
				preferredShirt: "overalls",
				preferredFace: "munchin' straw",
				preferredFeet: "cowboy boots",
				preferredHair: "farmer hair",
			});
		}
	}
	// Cat / Kucing
	if (/\b(kucing|cat|kitten|feline)\b/i.test(p)) {
		entities.push({
			name: "cat",
			boostTerms: ["cat", "kitten", "black cat leash", "cat ears", "cat tail"],
			preferredHand: "black cat leash",
		});
	}
	// Dog / Anjing / Wolf / Serigala
	if (/\b(anjing|dog|puppy|hound|serigala|wolf)\b/i.test(p)) {
		entities.push({
			name: "canine",
			boostTerms: ["puppy leash", "dog", "wolf", "shadow wolf leash", "hound"],
			preferredHand: "puppy leash",
		});
	}
	// Dragon / Naga
	if (/\b(naga|dragon|drake|wyrm)\b/i.test(p)) {
		entities.push({
			name: "dragon",
			boostTerms: ["dragon", "drake", "protodrake", "wyrm", "dragon wings"],
			preferredHand: "violet protodrake leash",
		});
	}
	// Farmer / Petani / Peternak (general)
	if (
		/\b(petani|peternak|farmer|rancher|farm)\b/i.test(p) &&
		!entities.some((e) => e.name === "cow_rancher")
	) {
		entities.push({
			name: "farmer",
			boostTerms: [
				"farmer",
				"straw hat",
				"overalls",
				"pitchfork",
				"cowboy boots",
				"munchin' straw",
			],
			preferredHat: "straw hat",
			preferredShirt: "overalls",
			preferredHand: "pitchfork",
			preferredFace: "munchin' straw",
			preferredFeet: "cowboy boots",
		});
	}
	// Robot / Mecha / Mesin / Baja
	if (/\b(robot|mech|cyborg|automaton|android|mesin|baja)\b/i.test(p)) {
		entities.push({
			name: "robot",
			boostTerms: [
				"robot legs",
				"cybernetic arm",
				"robotic mk.iv wings",
				"iron mask",
				"mecha med helmet",
			],
			preferredPants: "robot legs",
			preferredHand: "cybernetic arm",
			preferredBack: "robotic mk.iv wings",
		});
	}

	return entities;
}

// ─── Step 1: AI Concept Analysis & Dynamic Search Formulation ─────────────

/**
 * AI analyzes prompt without theme constraints, creating a full character profile
 * and formulating dynamic search regex, keywords, and direct item suggestions.
 */
async function stepAnalyzeConcept({
	prompt,
	type,
	partyContext,
	selectedAgent = null,
}) {
	const agentHeader = selectedAgent
		? `\nCURRENT SPECIALIST AGENT ASSIGNED:
Agent: ${selectedAgent.name} (${selectedAgent.title})
Domain: ${selectedAgent.domain}
Specialist Directives:
${selectedAgent.rules.map((r) => ` - ${r}`).join("\n")}\n`
		: "";

	const systemPrompt = `You are an elite Character Designer & Avatar Stylist AI for D&D / RPG games and Growtopia Set Planner (database has 3,948 items).
Analyze the user's prompt deeply and formulate a comprehensive character profile AND an agentic item search strategy with keywords and regex.
${agentHeader}
CRITICAL INSTRUCTIONS:
1. INDONESIAN LANGUAGE & ENTITY COMPREHENSION:
   - The user writes prompts in Indonesian (e.g. "peternak sapi", "pasukan robot", "ksatria naga", "petani", "pemburu"):
   - Accurately translate Indonesian concepts into exact English Growtopia item entities:
     * "peternak sapi" / "ternak sapi" ➔ Cattle Rancher / Cow Farmer:
       CRITICAL: A "peternak sapi" is a HUMAN rancher/farmer who raises cows (BUKAN "manusia sapi" / bukan monster sapi!).
       Race MUST BE "Human" (or standard humanoid like Halfling/Dwarf).
       Archetype MUST BE "farmer_rancher" or "commoner_worker" (NOT "beast_nature"!).
       Class: "Commoner", "Ranger (Herder)", or "Rancher".
       The cow companion item is [Hand] "calf leash" (#870) for a real pet cow/calf walking beside the player!
       [Hat]: "straw hat" (#890) or "cowboy hat" (#1022).
       [Hair]: Natural human hair (e.g. "farmer hair", "messy brown hair", "short hair", "wig").
       FORBIDDEN: NEVER pick "cow mask" or animal head masks on hair/face! The character is a human caretaker, NOT a cow!
       [Shirt]: "overalls" (#892).
       [Feet]: "cowboy boots" (#1030).
       [Face]: "munchin' straw" (#6898).
     * "petani" / "peternak" ➔ Farmer / Rancher (items: "straw hat", "overalls", "munchin' straw", "pitchfork", human hair).
     * "kucing" ➔ Cat ("black cat leash", "cat ears").
     * "anjing" ➔ Dog ("puppy leash").
     * "serigala" ➔ Wolf ("shadow wolf leash").
     * "naga" ➔ Dragon ("violet protodrake leash", "dragon wings").
     * "robot" ➔ Robot / Mech ("robot legs", "cybernetic arm", "robotic mk.iv wings", "iron mask").
   - COMPANION RULE: If the prompt specifies an animal or pet (e.g. "sapi" / cow), the Hand slot MUST be the animal pet leash ("calf leash" for cow)! NEVER pick unrelated objects like dirt ("blyoshi's free dirt") or flashlights!

2. CLEAN REGEX & KEYWORD RULES:
   - "searchRegex": MUST use ONLY clean Latin/English alphanumeric characters (a-z, 0-9) and regex operators.
   - NEVER output Chinese or Japanese characters (e.g. do NOT output 牧場 or kanji)!
   - NEVER include irrelevant noise words like "dirt", "mud", "ash", "charcoal" unless specifically requested! (A cow farmer is about COWS and FARMING, NOT dirt blocks!)
   - Use word boundaries \\b for short words (e.g. "\\b(cow|calf|cattle|bull|farmer|overalls|pitchfork|straw|cowboy)\\b").

3. DYNAMIC SEARCH STRATEGY (Executed across 3,948 items):
   - "searchRegex": Clean regex string without non-ASCII or noise words.
   - "searchKeywords": Array of 8-15 visual keywords.
   - "slotQueries": Specific keywords per slot (Hat, Hair, Face, Shirt, Pants, Feet, Back, Hand).
   - "directItemSuggestions": Specific authentic Growtopia items matching the concept (e.g. for peternak sapi: {"Hand": "calf leash", "Hat": "straw hat", "Hair": "farmer hair", "Shirt": "overalls", "Face": "munchin' straw", "Feet": "cowboy boots"}).

4. SLOT OPTIONALITY (AVOID CLUTTER):
   - Equipment slots are OPTIONAL! Do NOT feel forced to fill all 8 slots.
   - If wearing overalls/robe, Pants is optional/null. If full helmet/mask, Hair is optional/null.
   - If character does not need wings/cape, Back is optional/null. If no face accessory needed, Face is optional/null.

RESPOND ONLY with valid JSON (no markdown formatting, no code blocks):
{
  "name": "Character Name",
  "title": "Short Epithet",
  "race": "Human / Warforged / Elf / etc",
  "class": "Commoner / Ranger / Fighter / Artificer / etc",
  "level": 3,
  "location": "Location name",
  "disposition": "Ramah or Netral or Bermusuhan",
  "personality": "Detailed personality description",
  "lore": "Compelling backstory",
  "secret": "Quest hook or hidden secret",
  "theme": "Rich visual theme description (e.g. Rustic Cow Rancher / Peternak Sapi)",
  "presetHint": "one of: nature_elemental, dnd_fantasy, modern_streetwear, cyberpunk, steampunk, gothic_horror",
  "archetype": "farmer_rancher / warrior / rogue / ranger / cyber_hacker / commoner_worker",
  "mood": "serene / heroic / fierce / mysterious",
  "preferredColors": ["color1", "color2", "color3"],
  "searchRegex": "clean_regex_pattern_without_noise",
  "searchKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "slotQueries": {
    "Hat": ["keyword1", "keyword2"],
    "Hair": ["keyword1", "keyword2"],
    "Face": ["keyword1", "keyword2"],
    "Shirt": ["keyword1", "keyword2"],
    "Pants": ["keyword1", "keyword2"],
    "Feet": ["keyword1", "keyword2"],
    "Back": ["keyword1", "keyword2"],
    "Hand": ["keyword1", "keyword2"]
  },
  "directItemSuggestions": {
    "Hat": "optional item name",
    "Hair": "optional item name",
    "Face": "optional item name",
    "Shirt": "optional item name",
    "Pants": "optional item name",
    "Feet": "optional item name",
    "Back": "optional item name"
  }
}`;

	const ctx =
		typeof partyContext === "string"
			? partyContext
			: JSON.stringify(partyContext || {});
	const userPrompt = `Create an authentic, richly themed character based on this prompt:
Prompt: "${prompt}"
Category: "${type}"
Party Context: ${ctx}

Formulate the complete profile and dynamic item search strategy. Respond with JSON now.`;

	try {
		const result = await callLlm({ systemPrompt, userPrompt });
		if (result && typeof result === "object") {
			result.presetHint = normalizePresetHint(
				result.presetHint || result.theme,
			);
			result.archetype = normalizeArchetype(result.archetype);
			if (
				selectedAgent?.id === "agricultural_rancher_agent" &&
				(result.archetype === "beast_nature" || !result.archetype)
			) {
				result.archetype = "farmer_rancher";
			}
			result.mood = normalizeMood(result.mood);
			result.disposition = normalizeDisposition(result.disposition);
			return result;
		}
	} catch (err) {
		console.error("[Agent Step 1] LLM error:", err.message);
	}

	return null;
}

// ─── Step 2: Dynamic DB Retrieval via AI Regex & Keywords ─────────────────

/**
 * Builds candidate pool for each slot by querying ItemDatabase with AI regex,
 * slot keywords, global keywords, and direct item suggestions.
 *
 * @param {object} params
 * @param {import('../../database/itemDatabase.js').ItemDatabase} params.itemDb
 * @param {import('../../core/themeClassifier.js').ThemeClassifier} params.classifier
 * @param {object} params.analysis
 * @returns {{ pool: Record<string, object[]>, stats: Record<string, object> }}
 */
function buildDynamicCandidatePool({
	itemDb,
	classifier,
	analysis,
	selectedAgent = null,
}) {
	const pool = {};
	const allCandidates = {};
	const stats = {};

	const promptText = analysis.prompt || analysis.theme || analysis.lore || "";
	const detectedEntities = extractCoreEntities(promptText);
	const regex = sanitizeRegex(analysis.searchRegex || "", promptText);
	const searchKeywords = analysis.searchKeywords || [];
	const slotQueries = analysis.slotQueries || {};
	const directSuggestions = analysis.directItemSuggestions || {};
	const presetHint = analysis.presetHint;
	const isEarthPrompt =
		/\b(dirt|mud|earth|tanah|lumpur|batu|mining|tambang|volcano|gunung berapi)\b/i.test(
			promptText,
		);

	for (const slot of EQUIPMENT_SLOTS) {
		const candidatesMap = new Map();
		const slotKws = slotQueries[slot] || [];

		// 0. Entity Preferred Signature Items (MASSIVE BOOST: 250 points)
		// Guarantees signature items (like calf leash for Hand in cow farmer concept) are candidate #1!
		for (const entity of detectedEntities) {
			const prefKey = `preferred${slot}`;
			const prefName = entity[prefKey];
			if (prefName) {
				const prefMatches = itemDb.searchItems(prefName, { category: slot });
				for (const item of prefMatches) {
					candidatesMap.set(item.itemID, {
						item,
						score: 250,
						source: `entity_signature_${entity.name}`,
					});
				}
			}
		}

		// 1. Direct AI suggested item for this slot (if specified)
		if (directSuggestions[slot]) {
			const directMatches = itemDb.searchItems(directSuggestions[slot], {
				category: slot,
			});
			for (const item of directMatches) {
				const existing = candidatesMap.get(item.itemID);
				if (existing) {
					existing.score += 100;
				} else {
					candidatesMap.set(item.itemID, {
						item,
						score: 120,
						source: "ai_direct_suggestion",
					});
				}
			}
		}

		// 2. Regex scan across the full database for this slot
		if (regex) {
			const regexMatches = itemDb.searchByRegex(regex, {
				category: slot,
				limit: 50,
			});
			for (const item of regexMatches) {
				const existing = candidatesMap.get(item.itemID);
				if (existing) {
					existing.score += 25;
					existing.source += "+regex";
				} else {
					candidatesMap.set(item.itemID, { item, score: 30, source: "regex" });
				}
			}
		}

		// 3. Slot-specific keywords scan
		if (slotKws.length > 0) {
			const slotKwMatches = itemDb.searchByKeywords(slotKws, {
				category: slot,
				limit: 50,
			});
			for (const item of slotKwMatches) {
				const existing = candidatesMap.get(item.itemID);
				if (existing) {
					existing.score += 20;
					existing.source += "+slotKw";
				} else {
					candidatesMap.set(item.itemID, { item, score: 22, source: "slotKw" });
				}
			}
		}

		// 4. Global keywords scan
		if (searchKeywords.length > 0) {
			const globalKwMatches = itemDb.searchByKeywords(searchKeywords, {
				category: slot,
				limit: 50,
			});
			for (const item of globalKwMatches) {
				const existing = candidatesMap.get(item.itemID);
				if (existing) {
					existing.score += 15;
					existing.source += "+globalKw";
				} else {
					candidatesMap.set(item.itemID, {
						item,
						score: 14,
						source: "globalKw",
					});
				}
			}
		}

		// 5. Supplementary theme classifier items
		if (classifier && presetHint) {
			try {
				const themeItems = classifier.getItemsByTheme(presetHint, {
					category: slot,
					limit: 20,
				});
				for (const item of themeItems) {
					const existing = candidatesMap.get(item.itemID);
					if (existing) {
						existing.score += 5;
					} else {
						candidatesMap.set(item.itemID, {
							item,
							score: 8,
							source: "theme_hint",
						});
					}
				}
			} catch {
				/* ignore */
			}
		}

		// 6. Boost items matching entity boostTerms and penalize noise clutter
		const isFarmerOrRancher =
			selectedAgent?.id === "agricultural_rancher_agent" ||
			detectedEntities.some(
				(e) => e.name === "cow_rancher" || e.name === "farmer",
			) ||
			/\b(peternak|petani|farmer|rancher|gembala|shepherd|breeder|ternak)\b/i.test(
				promptText,
			);
		const isExplicitBeastman =
			/\b(manusia sapi|minotaur|werecow|monster sapi|kostum sapi|topeng sapi)\b/i.test(
				promptText,
			);

		for (const entry of candidatesMap.values()) {
			const n = (entry.item.nameLower || "").toLowerCase();
			for (const entity of detectedEntities) {
				for (const term of entity.boostTerms || []) {
					if (n.includes(term.toLowerCase())) {
						entry.score += 60;
						break;
					}
				}
			}

			// If not an earth/dirt prompt, heavily penalize accidental dirt block clutter
			if (!isEarthPrompt) {
				if (
					n.includes("dirt") ||
					n.includes("mud") ||
					n.includes("flashlight")
				) {
					entry.score -= 150;
				}
			}

			// SPECIALIST GUARD: For human peternak/farmer, forbid animal masks on head/hair/face
			if (isFarmerOrRancher && !isExplicitBeastman) {
				if (slot === "Hair" || slot === "Face" || slot === "Hat") {
					if (
						n.includes("cow mask") ||
						n.includes("bull mask") ||
						n.includes("pig mask") ||
						n.includes("sheep mask") ||
						n.includes("dog mask") ||
						n.includes("cat mask") ||
						n.includes("wolf mask") ||
						n.includes("horse mask")
					) {
						entry.score -= 600;
					}
				}
				// Boost natural human hair in Hair slot
				if (slot === "Hair") {
					if (
						n.includes("farmer hair") ||
						n.includes("messy hair") ||
						n.includes("brown hair") ||
						n.includes("short hair") ||
						n.includes("parted hair") ||
						n.includes("hair") ||
						n.includes("wig")
					) {
						entry.score += 80;
					}
				}
			}
		}

		// 7. Guarantee variety: if < 15 items in slot, add top category items (filtering out blacklisted items)
		let candidateEntries = Array.from(candidatesMap.values()).filter(
			(c) => c.score > -200,
		);
		if (candidateEntries.length < 15) {
			const allCategoryItems = itemDb.getItemsByCategory(slot);
			for (const item of allCategoryItems) {
				if (!candidatesMap.has(item.itemID)) {
					candidatesMap.set(item.itemID, {
						item,
						score: 1,
						source: "category_fill",
					});
					if (candidatesMap.size >= 35) break;
				}
			}
			candidateEntries = Array.from(candidatesMap.values());
		}

		// Sort by relevance score descending
		candidateEntries.sort((a, b) => b.score - a.score);

		// Full candidate list (every single item found by regex/keywords)
		allCandidates[slot] = candidateEntries.map((c) => ({
			itemID: c.item.itemID,
			name: c.item.nameWithCaps || c.item.name,
			category: c.item.category,
			rarity: c.item.rarity || "Common",
			score: c.score,
			source: c.source,
			colors: c.item.colors || [],
		}));

		// Top 40 candidates for LLM prompt context
		const topCandidates = candidateEntries.slice(0, 40).map((c) => c.item);

		pool[slot] = topCandidates;
		stats[slot] = {
			totalFound: candidateEntries.length,
			topCandidatesCount: topCandidates.length,
			samples: topCandidates.slice(0, 4).map((i) => i.nameWithCaps || i.name),
			allItemNames: candidateEntries.map(
				(i) => i.item.nameWithCaps || i.item.name,
			),
		};
	}

	return { pool, allCandidates, stats };
}

// ─── Step 3: AI Stylist Outfit Selection & Formula Assembly ───────────────

/**
 * AI sees real candidate items found in the database and selects
 * one item per slot to create a unified outfit formula.
 */
async function stepSelectItems({
	npcName,
	npcRace,
	npcClass,
	theme,
	archetype,
	mood,
	preferredColors,
	personality,
	directSuggestions,
	itemPool,
	agentContext = null,
}) {
	const catalogLines = [];
	for (const [slot, items] of Object.entries(itemPool)) {
		const names = items.map((i) => i.nameWithCaps || i.name).join(", ");
		catalogLines.push(`[${slot}] (${items.length} candidates): ${names}`);
	}

	const directHint =
		directSuggestions && Object.keys(directSuggestions).length > 0
			? `\nAI Concept Ideas: ${JSON.stringify(directSuggestions)}`
			: "";

	const promptContext = agentContext?.sessionPrompt
		? `\nUser Concept Prompt: "${agentContext.sessionPrompt}"`
		: "";
	const detectedEntitiesContext = agentContext?.detectedEntities?.length
		? `\nDetected Entities: [${agentContext.detectedEntities.map((e) => e.name).join(", ")}]`
		: "";
	const regexContext = agentContext?.searchFormulation?.regex
		? `\nDiscovery Regex Used: /${agentContext.searchFormulation.regex}/`
		: "";

	const systemPrompt = `You are a master Growtopia avatar stylist and fashion coordinator AI.
Your task: Select specific item names for equipment slots to craft an aesthetically stunning, lore-accurate outfit formula.

CRITICAL RULES:
1. OPTIONAL SLOTS & NATURAL SILHOUETTES (CRITICAL — DO NOT FORCE ALL 8 SLOTS):
   - You DO NOT need to fill all 8 slots! Slots are OPTIONAL. Never force unnecessary or redundant items!
   - If wearing a mask, helmet, or full headwear that covers the head, set "Hair": null. Do NOT force hair under full headwear!
   - If wearing a robe, long tunic, overalls, or one-piece outfit, set "Pants": null (no separate pants needed).
   - If the character doesn't have wings, jetpacks, or back gear, set "Back": null (never force random wings/capes onto a simple farmer, commoner, or ninja!).
   - If no face accessory is needed, set "Face": null.
   - If no hat is needed (e.g. stylish hair only), set "Hat": null.
   - An uncluttered, authentic outfit with 4-6 well-matched items is MUCH better than an over-stuffed, noisy 8-slot avatar.

2. CORE SUBJECT FIDELITY & IDENTITY INTEGRITY (CRITICAL):
   - Always honor the core entity and human nature of the character concept!
   - If the character is a cow farmer / peternak sapi:
     * The character is a HUMAN farmer (BUKAN manusia sapi / bukan monster sapi)!
     * Hand slot: MUST BE "calf leash" (#870) so an authentic pet cow/calf walks beside them! NEVER pick dirt ("blyoshi's free dirt") or flashlights!
     * Hair slot: MUST BE natural human hair (e.g. "farmer hair", "messy brown hair", "short hair", "wig"). NEVER choose "cow mask" or animal head!
     * Hat slot: choose "straw hat" (#890) or "cowboy hat" (#1022)
     * Shirt slot: choose "overalls" (#892)
     * Pants slot: set to null (covered by overalls)
     * Back slot: set to null (farmers do not wear wings or capes)
     * Face slot: choose "munchin' straw" (#6898)
     * Feet slot: choose "cowboy boots" (#1030) or "riding bull" (#6966)
   - If the character is a cat owner: Hand slot must be "black cat leash"!
   - If the character is a dog/wolf handler: Hand slot must be "puppy leash" or "shadow wolf leash"!
   - If the character is a robot: equip "robot legs", "cybernetic arm", "robotic mk.iv wings", "iron mask"!
3. Prefer exact names from the Candidate Catalog below (top candidates are ranked by relevance).
4. Coordinate colors and aesthetic tone across all equipment slots.
5. Output valid JSON with the chosen item names (or null for omitted slots).

RESPOND ONLY with JSON:
{
  "Hat": "chosen item name or null",
  "Hair": "chosen item name or null",
  "Face": "chosen item name or null",
  "Shirt": "chosen item name or null",
  "Pants": "chosen item name or null",
  "Feet": "chosen item name or null",
  "Back": "chosen item name or null",
  "Hand": "chosen item name or null",
  "reasoning": "Detailed explanation of the visual formula, item synergies, and why certain slots were omitted for cleaner silhouette"
}`;

	const userPrompt = `AGENT LOOP STAGE: Step 4 — Stylist Outfit Assembly${promptContext}${detectedEntitiesContext}${regexContext}

Character: "${npcName}"
Race: ${npcRace || "Warforged"} | Class: ${npcClass}
Visual Theme: ${theme}
Archetype: ${archetype} | Mood: ${mood}
Colors: ${(preferredColors || []).join(", ")}
Personality: ${personality}${directHint}

CANDIDATE CATALOG DISCOVERED FROM DATABASE:
${catalogLines.join("\n")}

Assemble the complete outfit formula now. Return JSON.`;

	try {
		const result = await callLlm({ systemPrompt, userPrompt });
		if (result && typeof result === "object") {
			const { reasoning, ...selections } = result;
			return { selections, reasoning: reasoning || "" };
		}
	} catch (err) {
		console.error("[Agent Step 3] LLM error:", err.message);
	}

	return null;
}

// ─── Step 4.5: Agentic Review & Refinement Loop (Sent Back to LLM) ─────────

/**
 * Sends the selected outfit back to the LLM in an agentic feedback loop:
 * - LLM critiques the outfit formula, checks color harmony and thematic fit
 * - Evaluates which items fit and which might need refinement or substitution
 * - Can replace or swap items from candidate alternatives to reach optimal synergy
 *
 * @param {object} params
 * @returns {Promise<{ approved: boolean, synergyScore: number, critique: string, stylistAdvice: string, refinements: Record<string, string> }|null>}
 */
async function stepRefineOutfit({
	npcName,
	npcRace,
	npcClass,
	theme,
	preferredColors,
	personality,
	equippedSlots,
	itemPool,
	agentContext = null,
}) {
	const currentItems = [];
	const alternatives = [];

	for (const slot of EQUIPMENT_SLOTS) {
		const item = equippedSlots[slot];
		if (item) {
			currentItems.push(
				`- [${slot}]: "${item.nameWithCaps || item.name}" (ID: ${item.itemID})`,
			);
		} else {
			currentItems.push(`- [${slot}]: [Empty]`);
		}

		const alts = (itemPool[slot] || [])
			.slice(0, 10)
			.map((i) => i.nameWithCaps || i.name);
		alternatives.push(`[${slot}] Available Alternatives: ${alts.join(", ")}`);
	}

	const promptContext = agentContext?.sessionPrompt
		? `\nOriginal User Concept Prompt: "${agentContext.sessionPrompt}"`
		: "";
	const detectedEntitiesContext = agentContext?.detectedEntities?.length
		? `\nDetected Core Entities from Concept: [${agentContext.detectedEntities.map((e) => e.name).join(", ")}]`
		: "";
	const stylistReasoningContext = agentContext?.stylistSelection?.reasoning
		? `\nStylist Rationale from Previous Assembly Step: "${agentContext.stylistSelection.reasoning}"`
		: "";

	const systemPrompt = `You are the Lead Art Director and Avatar Fashion Stylist AI.
You are performing an AGENTIC CRITIQUE & REFINEMENT on an assembled avatar outfit.

CRITICAL INSTRUCTIONS:
1. SILHOUETTE CLEANLINESS & OPTIONAL SLOTS:
   - Not all slots need to be filled! If an equipped item causes clutter, clips, or is redundant:
     * Hair under a full mask or closed helmet: remove Hair by setting { "Hair": null } in "refinements"!
     * Pants under a full robe or overalls: remove Pants by setting { "Pants": null } in "refinements"!
     * Unnecessary wings or capes on grounded characters (like farmers or rogues): remove Back by setting { "Back": null }!
2. CORE ENTITY, HUMAN IDENTITY & COMPANION AUDIT:
   - Check if the outfit respects the user's primary concept:
   - For cow farmer / peternak sapi:
     * The character is a HUMAN farmer, NOT a cow humanoid (BUKAN manusia sapi / bukan monster sapi)! If Hair or Face currently has "cow mask" or any animal head, YOU MUST REPLACE Hair WITH natural human hair (e.g. "farmer hair" or "messy brown hair") in "refinements"!
     * Hand slot MUST be "calf leash" (#870). If the character is currently holding a dirt block ("blyoshi's free dirt"), flashlight, or weapon instead of a cow pet, YOU MUST REPLACE Hand WITH "calf leash" in "refinements"!
   - For any pet/animal concept, ensure the corresponding animal leash is held!
3. Assess visual cohesion, silhouette balance, and color palette coordination.
4. Score the outfit synergy from 1 to 100 ("synergyScore").
5. If an item looks mismatched, can be upgraded, or should be removed, specify the change in "refinements": { "Slot": "Better Item Name from Alternatives" or null to remove }.
6. If the outfit is already harmonious and well-coordinated, set "approved": true and leave "refinements" empty {}.
7. Provide an insightful "critique" and "stylistAdvice".

RESPOND ONLY with JSON (no markdown):
{
  "synergyScore": 92,
  "approved": true,
  "critique": "Critique of the outfit silhouette, visual theme, and item interactions",
  "stylistAdvice": "Lore explanation and styling advice for this set",
  "refinements": {
    "Slot": "Better Item Name from Alternatives"
  }
}`;

	const userPrompt = `AGENT LOOP STAGE: Step 5 — Art Director Critique & Refinement${promptContext}${detectedEntitiesContext}${stylistReasoningContext}

Character: "${npcName}"
Race: ${npcRace} | Class: ${npcClass}
Theme: ${theme}
Colors: ${(preferredColors || []).join(", ")}
Personality: ${personality}

CURRENT ASSEMBLED OUTFIT DRAFT:
${currentItems.join("\n")}

CANDIDATE ALTERNATIVES AVAILABLE IN DATABASE:
${alternatives.join("\n")}

Review the outfit now. Audit core entities and companions. Approve or provide refined item swaps. Return JSON.`;

	try {
		const result = await callLlm({ systemPrompt, userPrompt });
		if (result && typeof result === "object") {
			return result;
		}
	} catch (err) {
		console.error("[Agent Step 4.5] Refinement loop LLM error:", err.message);
	}

	return null;
}

// ─── Deep Item Resolution (Candidate Pool + Full 3,948 Items) ─────────────

/**
 * Resolves an item name chosen by the AI against candidate pool and full database.
 */
function resolveItemSelection(suggestedName, slot, pool, itemDb) {
	if (!suggestedName) return null;
	const suggested = String(suggestedName).trim().toLowerCase();
	if (
		suggested === "" ||
		suggested === "none" ||
		suggested === "null" ||
		suggested === "empty" ||
		suggested === "tidak ada" ||
		suggested === "kosong" ||
		suggested === "n/a"
	) {
		return null;
	}

	// 1. Exact match in candidate pool
	let match = pool.find(
		(i) => (i.nameWithCaps || i.name || "").toLowerCase() === suggested,
	);
	if (match) return match;

	// 2. Exact match in full itemDb for this slot
	const allSlotItems = itemDb.getItemsByCategory(slot);
	match = allSlotItems.find(
		(i) => (i.nameWithCaps || i.name || "").toLowerCase() === suggested,
	);
	if (match) return match;

	// 3. Substring match in candidate pool
	match = pool.find((i) => {
		const n = (i.nameLower || i.name || "").toLowerCase();
		return n.includes(suggested) || suggested.includes(n);
	});
	if (match) return match;

	// 4. Substring match in full itemDb for this slot
	match = allSlotItems.find((i) => {
		const n = (i.nameLower || i.name || "").toLowerCase();
		return n.includes(suggested) || suggested.includes(n);
	});
	if (match) return match;

	// 5. Fuzzy word match in candidate pool
	const tokens = suggested.split(/[\s-]+/).filter((t) => t.length > 2);
	let bestScore = 0,
		bestItem = null;
	for (const item of pool) {
		const n = (item.nameLower || item.name || "").toLowerCase();
		let score = 0;
		for (const t of tokens) {
			if (n.includes(t)) score += t.length;
		}
		if (score > bestScore) {
			bestScore = score;
			bestItem = item;
		}
	}
	if (bestItem && bestScore > 0) return bestItem;

	// If no match found, do NOT equip random pool[0]. Leave unequipped.
	return null;
}

// ─── Deterministic Fallback ────────────────────────────────────────────────

function hashStr(str) {
	let h = 5381;
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) + h + str.charCodeAt(i);
		h = h & 0x7fffffff;
	}
	return h;
}

function fallbackAnalyze(prompt, _type) {
	const p = (prompt || "").toLowerCase();

	const isCow = /sapi|cow|cattle|bull|calf|ternak sapi|peternak sapi/i.test(p);
	const isFarmer = /petani|peternak|farmer|ranch/i.test(p);
	const isRobot =
		/robot|mech|droid|cyborg|android|\bbot\b|automaton|mesin|baja|besi|cyber|titan/i.test(
			p,
		);
	const isNecro =
		/necro|undead|tengkorak|skull|mayat|vampir|death|gothic|kutukan|zombie/i.test(
			p,
		);
	const isNinja =
		/ninja|samurai|shinobi|ronin|katana|bayangan|pedang|assassin/i.test(p);
	const isAngel =
		/angel|malaikat|divine|celestial|holy|suci|seraph|sayap/i.test(p);
	const isDemon = /demon|iblis|devil|hell|neraka|fiend|abyss|tanduk/i.test(p);
	const isPirate =
		/pirate|bajak laut|laut|kapal|sea|captain|anchor|sailor/i.test(p);
	const isNature = /druid|nature|hutan|alam|daun|beast|hewan|wolf|forest/i.test(
		p,
	);

	let race = "Human",
		className = "Fighter",
		theme = "D&D Adventurer",
		presetHint = "dnd_fantasy";
	let archetype = "warrior",
		mood = "heroic",
		disposition = "Netral";
	let searchRegex = "sword|shield|armor|knight|iron|blade|cloak";
	let searchKeywords = ["knight", "armor", "sword", "shield", "plate", "iron"];
	let slotQueries = {
		Hat: ["helmet", "crown", "hood", "hat"],
		Hair: ["hair", "head", "wig"],
		Face: ["mask", "eye", "visor", "scarf"],
		Shirt: ["armor", "plate", "chainmail", "shirt"],
		Pants: ["pants", "legs", "greaves", "cuisses"],
		Feet: ["boots", "shoes", "greaves"],
		Back: ["cape", "wings", "cloak", "shield"],
		Hand: ["sword", "blade", "axe", "spear", "wand"],
	};
	let directItemSuggestions = {};

	if (isCow || isFarmer) {
		race = "Human";
		className = "Commoner";
		theme = "Rustic Cow Rancher / Peternak Sapi";
		presetHint = "nature_elemental";
		archetype = "farmer_rancher";
		mood = "serene";
		disposition = "Ramah";
		searchRegex =
			"\\b(cow|calf|cattle|bull|farmer|overalls|pitchfork|straw|cowboy|boots|hat|hair)\\b";
		searchKeywords = [
			"cow",
			"calf",
			"cattle",
			"farmer",
			"overalls",
			"pitchfork",
			"straw",
			"hat",
			"hair",
		];
		slotQueries = {
			Hat: ["straw hat", "cowboy hat", "farmer hat"],
			Hair: [
				"farmer hair",
				"messy hair",
				"brown hair",
				"short hair",
				"wig",
				"hair",
			],
			Face: ["munchin' straw"],
			Shirt: ["overalls", "shirt", "flannel"],
			Pants: ["overalls", "pants", "jeans"],
			Feet: ["cowboy boots", "boots"],
			Back: ["basket", "cape", "backpack"],
			Hand: ["calf leash", "pitchfork"],
		};
		directItemSuggestions = {
			Hat: "straw hat",
			Hair: "farmer hair",
			Face: "munchin' straw",
			Shirt: "overalls",
			Feet: "cowboy boots",
			Hand: "calf leash",
		};
	} else if (isRobot) {
		race = "Warforged";
		className = "Artificer";
		theme = "Mechanized Combat Automaton";
		presetHint = "cyberpunk";
		archetype = "cyber_hacker";
		mood = "fierce";
		searchRegex =
			"robot|mech|droid|cyborg|android|bot\\b|iron|steel|titan|cyber|laser|armor";
		searchKeywords = [
			"robot",
			"mech",
			"cyborg",
			"droid",
			"iron",
			"steel",
			"titan",
			"cyber",
			"laser",
			"armor",
		];
		slotQueries = {
			Hat: ["helmet", "visor", "crest", "robot", "mech", "iron", "steel"],
			Hair: ["helmet", "antenna", "cables", "wires", "cyber", "mech"],
			Face: [
				"visor",
				"mask",
				"eye",
				"scanner",
				"goggles",
				"cybernetic",
				"robot",
			],
			Shirt: [
				"armor",
				"chassis",
				"plate",
				"mech",
				"robot",
				"iron",
				"cyber",
				"mail",
			],
			Pants: ["legs", "greaves", "strider", "mech", "robot", "armor", "plate"],
			Feet: ["boots", "thrusters", "treads", "mech", "robot", "iron", "shoes"],
			Back: ["wings", "jetpack", "booster", "cannon", "cape", "robot", "cyber"],
			Hand: [
				"arm",
				"fist",
				"cannon",
				"blaster",
				"blade",
				"laser",
				"wrench",
				"bot",
			],
		};
		directItemSuggestions = {
			Pants: "robot legs",
			Hand: "cybernetic arm",
			Back: "robotic mk.iv wings",
			Face: "cybernetic eye",
			Hair: "mecha med helmet",
		};
	} else if (isNecro) {
		race = "Tiefling";
		className = "Warlock";
		theme = "Gothic Necromancer Lord";
		presetHint = "gothic_horror";
		archetype = "mage";
		mood = "ominous";
		disposition = "Bermusuhan";
		searchRegex =
			"necro|skull|bone|death|reaper|shadow|dark|ghost|phantom|undead";
		searchKeywords = [
			"necro",
			"skull",
			"bone",
			"death",
			"shadow",
			"reaper",
			"dark",
		];
		slotQueries = {
			Hat: ["hood", "skull", "crown", "dark", "reaper"],
			Hair: ["hair", "black", "ghost", "silver"],
			Face: ["skull", "mask", "bone", "shadow"],
			Shirt: ["robe", "tunic", "bone", "dark", "reaper"],
			Pants: ["robe", "pants", "bone", "dark"],
			Feet: ["boots", "bone", "dark", "shoes"],
			Back: ["wings", "cape", "death", "shadow", "bone"],
			Hand: ["scythe", "staff", "skull", "wand", "tome"],
		};
	} else if (isNinja) {
		race = "Human";
		className = "Monk";
		theme = "Shadow Shinobi Infiltrator";
		presetHint = "ninja_samurai";
		archetype = "rogue";
		mood = "fierce";
		searchRegex = "ninja|samurai|shinobi|ronin|katana|shadow|oni|blade";
		searchKeywords = ["ninja", "samurai", "shinobi", "katana", "shadow", "oni"];
		slotQueries = {
			Hat: ["mask", "headband", "kabuto", "hat", "ninja"],
			Hair: ["hair", "topknot", "black"],
			Face: ["mask", "oni", "veil", "ninja"],
			Shirt: ["armor", "gi", "tunic", "samurai", "ninja"],
			Pants: ["pants", "hakama", "ninja", "leg"],
			Feet: ["sandals", "tabi", "boots", "shoes"],
			Back: ["katana", "swords", "scroll", "cape"],
			Hand: ["katana", "kunai", "shuriken", "blade", "dagger"],
		};
	} else if (isAngel) {
		race = "Aasimar";
		className = "Cleric";
		theme = "Celestial Seraph Herald";
		presetHint = "celestial_angel";
		archetype = "healer";
		mood = "serene";
		disposition = "Ramah";
		searchRegex =
			"angel|halo|holy|divine|seraph|gold|radiant|white|light|wings";
		searchKeywords = [
			"angel",
			"halo",
			"holy",
			"divine",
			"seraph",
			"gold",
			"wings",
		];
		slotQueries = {
			Hat: ["halo", "crown", "circlet", "angel"],
			Hair: ["hair", "blonde", "gold", "white"],
			Face: ["veil", "glasses", "pure", "eyes"],
			Shirt: ["robe", "tunic", "armor", "holy", "white"],
			Pants: ["robe", "pants", "white", "gold"],
			Feet: ["boots", "shoes", "sandals", "gold"],
			Back: ["wings", "angel wings", "halo", "cape"],
			Hand: ["staff", "scepter", "wand", "holy", "blade"],
		};
	} else if (isDemon) {
		race = "Tiefling";
		className = "Warlock";
		theme = "Fiendish Hellspawn Warlock";
		presetHint = "demonic_underworld";
		archetype = "mage";
		mood = "ominous";
		disposition = "Bermusuhan";
		searchRegex = "demon|devil|hell|horns|fiend|flame|fire|abyss|infernal";
		searchKeywords = ["demon", "devil", "hell", "horns", "flame", "fiend"];
		slotQueries = {
			Hat: ["horns", "crown", "hood", "demon"],
			Hair: ["hair", "black", "red", "flame"],
			Face: ["horns", "mask", "evil", "eyes"],
			Shirt: ["robe", "armor", "flame", "dark"],
			Pants: ["pants", "robe", "dark", "flame"],
			Feet: ["boots", "hooves", "dark"],
			Back: ["wings", "demon wings", "cape", "tail"],
			Hand: ["staff", "pitchfork", "blade", "scythe", "tome"],
		};
	} else if (isPirate) {
		race = "Human";
		className = "Rogue";
		theme = "Swashbuckling Pirate Buccaneer";
		presetHint = "pirate";
		archetype = "rogue";
		mood = "fierce";
		disposition = "Netral";
		searchRegex =
			"pirate|captain|anchor|cutlass|sea|corsair|buccaneer|eye patch|hook";
		searchKeywords = [
			"pirate",
			"captain",
			"anchor",
			"cutlass",
			"sea",
			"corsair",
		];
		slotQueries = {
			Hat: ["tricorn", "bandana", "captain", "hat", "pirate"],
			Hair: ["hair", "dreadlocks", "ponytail"],
			Face: ["eye patch", "beard", "pipe", "mask"],
			Shirt: ["corsair", "vest", "coat", "pirate", "shirt"],
			Pants: ["pants", "breeches", "trousers", "pirate"],
			Feet: ["boots", "peg leg", "shoes"],
			Back: ["parrot", "cape", "anchor", "sword"],
			Hand: ["cutlass", "saber", "hook", "pistol", "bottle"],
		};
	} else if (isNature) {
		race = "Elf";
		className = "Druid";
		theme = "Verdant Forest Druid Guardian";
		presetHint = "nature_elemental";
		archetype = "beast_nature";
		mood = "serene";
		disposition = "Ramah";
		searchRegex = "druid|nature|leaf|flora|tree|forest|wood|vine|beast|wolf";
		searchKeywords = ["druid", "nature", "leaf", "forest", "wood", "vine"];
		slotQueries = {
			Hat: ["wreath", "leaf", "antlers", "hood", "druid"],
			Hair: ["hair", "green", "leaf", "flower"],
			Face: ["mask", "leaves", "paint", "eyes"],
			Shirt: ["robe", "tunic", "bark", "leaf", "druid"],
			Pants: ["pants", "leaves", "druid"],
			Feet: ["boots", "sandals", "bark", "shoes"],
			Back: ["wings", "leaf wings", "cape", "wolf"],
			Hand: ["staff", "branch", "wand", "vine", "flower"],
		};
	}

	const colors = suggestColors(presetHint, archetype, mood);
	const seed = hashStr(p);
	const names = [
		"Unit-7X Praetor",
		"Valen Shadowsteel",
		"Aegis Ironclad",
		"Kaelen Ashborne",
		"Centurion MK-IX",
	];
	const titles = [
		"The Mechanized Praetorian",
		"The Steel Vanguard",
		"The Iron Legionnaire",
		"The Silent Watcher",
	];

	return {
		name: names[seed % names.length],
		title: titles[seed % titles.length],
		race,
		class: className,
		level: 3,
		location: isRobot ? "The Galvanic Foundry" : "The Ashen Citadel",
		disposition,
		personality: isRobot
			? "Cold, relentless, and calculating. Driven by tactical directives and mechanical efficiency."
			: "Quiet and observant, analyzing threats before acting.",
		lore: isRobot
			? "Constructed during the Forgotten Siege, this armored automaton continues its eternal patrol."
			: "A seasoned operative who has seen countless battles across the realm.",
		secret:
			"Holds the master override codes to an ancient subterranean foundry.",
		theme,
		presetHint,
		archetype,
		mood,
		preferredColors: colors,
		searchRegex,
		searchKeywords,
		slotQueries,
		directItemSuggestions,
	};
}

// ─── Main Agentic Orchestrator ─────────────────────────────────────────────

/**
 * Executes the complete agentic pipeline for NPC generation and avatar styling.
 *
 * @param {object} params
 * @param {string} params.prompt — User concept / prompt
 * @param {string} [params.type] — Category (e.g. Mysterious NPC)
 * @param {object} [params.partyContext] — Current campaign / party context
 * @param {boolean} [params.render=true] — Whether to render avatar image
 * @param {boolean} [params.simulate=false] — Whether to run combat simulation
 * @param {import('../../core/themeClassifier.js').ThemeClassifier} params.classifier
 * @param {import('../../database/itemDatabase.js').ItemDatabase} params.itemDb
 * @returns {Promise<object>}
 */
export async function agenticGenerate({
	prompt,
	type = "Mysterious NPC",
	partyContext = null,
	render = true,
	simulate = false,
	classifier,
	itemDb,
}) {
	const defaultParty = {
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
	const party = partyContext || defaultParty;
	const steps = [];
	let source = "agentic-llm";
	const detectedEntities = extractCoreEntities(prompt || "");

	// ═══ STEP 1: Specialized Agent Selection & Domain Routing ═══
	const selectedAgent = selectSpecialistAgent(prompt || "");
	steps.push({
		step: 1,
		name: "select_specialist_agent",
		agentId: selectedAgent.id,
		agentName: selectedAgent.name,
		specialty: selectedAgent.title,
		domain: selectedAgent.domain,
		archetype: selectedAgent.archetype,
		directives: selectedAgent.rules,
	});

	// ═══ Initialize Context Across Agent Loop ═══
	const agentContext = {
		sessionPrompt: prompt || "",
		categoryType: type,
		selectedAgent,
		detectedEntities,
		conceptAnalysis: null,
		stats: null,
		searchFormulation: null,
		candidateDiscovery: null,
		stylistSelection: null,
		critiqueAndRefinement: null,
		conflictResolution: null,
		loopHistory: [],
	};

	// ═══ STEP 2: AI Prompt Analysis & Dynamic Search Formulation ═══
	let analysis = await stepAnalyzeConcept({
		prompt,
		type,
		partyContext: party,
		selectedAgent,
	});

	if (!analysis) {
		source = "agentic-fallback";
		analysis = fallbackAnalyze(prompt, type);
		steps.push({
			step: 2,
			name: "analyze_concept",
			source: "fallback",
			theme: analysis.theme,
			race: analysis.race,
			class: analysis.class,
			archetype: analysis.archetype,
		});
	} else {
		steps.push({
			step: 2,
			name: "analyze_concept",
			source: "llm",
			theme: analysis.theme,
			race: analysis.race,
			class: analysis.class,
			archetype: analysis.archetype,
			searchRegex: analysis.searchRegex,
			searchKeywords: analysis.searchKeywords,
		});
	}

	agentContext.conceptAnalysis = {
		theme: analysis.theme,
		presetHint: analysis.presetHint,
		race: analysis.race,
		class: analysis.class,
		level: analysis.level || 3,
		archetype: analysis.archetype,
		mood: analysis.mood,
		disposition: analysis.disposition,
		preferredColors: analysis.preferredColors,
		personality: analysis.personality,
		source,
	};

	// ═══ STEP 3: Balanced D&D Stats Generation ═══
	const avgLevel = (typeof party === "object" && party.averageLevel) || 3;
	const npcLevel = analysis.level || avgLevel;
	const npcName = analysis.name || "Mysterious Wanderer";
	const npcClass = analysis.class || "Adventurer";

	const balanced = generateBalancedStats({
		name: npcName,
		className: npcClass,
		level: npcLevel,
	});
	const validation = validateStats({
		level: npcLevel,
		stats: balanced.stats,
		hp: balanced.hp,
		armorClass: balanced.armorClass,
	});

	steps.push({
		step: 3,
		name: "generate_stats",
		valid: validation.valid,
		warnings: validation.warnings,
	});

	agentContext.stats = {
		level: npcLevel,
		stats: balanced.stats,
		hp: balanced.hp,
		armorClass: balanced.armorClass,
		valid: validation.valid,
		warnings: validation.warnings,
	};

	// ═══ STEP 4: Dynamic Item Discovery via AI Regex & Keywords (Across 3,948 Items) ═══
	const {
		pool: itemPool,
		allCandidates: discoveredCandidates,
		stats: searchStats,
	} = buildDynamicCandidatePool({
		itemDb,
		classifier,
		analysis,
		selectedAgent,
	});

	const totalDiscoveredCount = Object.values(discoveredCandidates).reduce(
		(acc, list) => acc + list.length,
		0,
	);

	const discoveredSummary = {};
	for (const [slot, s] of Object.entries(searchStats)) {
		discoveredSummary[slot] =
			`${s.totalFound} items (top: ${s.samples.slice(0, 2).join(", ")})`;
	}

	steps.push({
		step: 3,
		name: "dynamic_item_discovery",
		source: "itemDb",
		method: "regex_and_keyword_scan",
		regexUsed: analysis.searchRegex,
		totalSlotsDiscovered: Object.keys(itemPool).length,
		totalDiscoveredCount,
		summary: discoveredSummary,
	});

	agentContext.searchFormulation = {
		regex: analysis.searchRegex,
		keywords: analysis.searchKeywords,
		slotQueries: analysis.slotQueries,
	};
	agentContext.candidateDiscovery = {
		totalFoundAcrossAllSlots: totalDiscoveredCount,
		stats: searchStats,
		allCandidatesBySlot: discoveredCandidates,
	};

	// ═══ STEP 5: AI Stylist Selection & Formula Assembly ═══
	let aiSelections = null;
	if (source === "agentic-llm") {
		aiSelections = await stepSelectItems({
			npcName,
			npcRace: analysis.race,
			npcClass,
			theme: analysis.theme,
			archetype: analysis.archetype,
			mood: analysis.mood,
			preferredColors: analysis.preferredColors,
			personality: analysis.personality || "",
			directSuggestions: analysis.directItemSuggestions,
			itemPool,
			agentContext,
		});
	}

	const equippedSlots = {};
	const selectedItems = [];

	if (aiSelections?.selections) {
		steps.push({
			step: 5,
			name: "select_items",
			source: "llm",
			reasoning: aiSelections.reasoning,
			selections: aiSelections.selections,
		});

		for (const [slot, suggestedName] of Object.entries(
			aiSelections.selections,
		)) {
			if (!EQUIPMENT_SLOTS.includes(slot)) continue;
			const pool = itemPool[slot] || [];
			const resolved = resolveItemSelection(suggestedName, slot, pool, itemDb);
			if (resolved) {
				equippedSlots[slot] = resolved;
				selectedItems.push(resolved);
			}
		}
	} else {
		// Fallback when LLM is offline: Equip ONLY items explicitly suggested by concept heuristics
		const directSuggestions = analysis.directItemSuggestions || {};
		for (const [slot, name] of Object.entries(directSuggestions)) {
			if (!EQUIPMENT_SLOTS.includes(slot) || !name) continue;
			const pool = itemPool[slot] || [];
			const resolved = resolveItemSelection(name, slot, pool, itemDb);
			if (resolved) {
				equippedSlots[slot] = resolved;
				selectedItems.push(resolved);
			}
		}

		// Ensure basic clothing modesty (Shirt / Pants) only if character is completely unclad
		if (!equippedSlots.Shirt && !equippedSlots.Pants) {
			const shirtPool = itemPool.Shirt || [];
			if (shirtPool.length > 0) {
				equippedSlots.Shirt = shirtPool[0];
				selectedItems.push(shirtPool[0]);
			}
		}
		if (
			!equippedSlots.Pants &&
			(!equippedSlots.Shirt || !isFullBodyShirt(equippedSlots.Shirt))
		) {
			const pantsPool = itemPool.Pants || [];
			if (pantsPool.length > 0) {
				equippedSlots.Pants = pantsPool[0];
				selectedItems.push(pantsPool[0]);
			}
		}

		steps.push({
			step: 5,
			name: "select_items",
			source: "fallback",
			reasoning:
				"Equipped concept-specific items from heuristic suggestions; optional slots left clean without forced random items.",
		});
	}

	agentContext.stylistSelection = {
		reasoning:
			aiSelections?.reasoning ||
			"Heuristic candidate scoring and formula assembly",
		selections: aiSelections?.selections || {},
		draftSlots: Object.fromEntries(
			Object.entries(equippedSlots).map(([slot, item]) => [
				slot,
				item ? item.nameWithCaps || item.name : null,
			]),
		),
	};

	// ═══ STEP 6: Agentic Review & Refinement Loop (Sent Back to LLM) ═══
	let refinementResult = null;
	const swaps = [];

	if (source === "agentic-llm" && Object.keys(equippedSlots).length > 0) {
		refinementResult = await stepRefineOutfit({
			npcName,
			npcRace: analysis.race,
			npcClass,
			theme: analysis.theme,
			preferredColors: analysis.preferredColors,
			personality: analysis.personality || "",
			equippedSlots,
			itemPool,
			agentContext,
		});

		if (
			refinementResult?.refinements &&
			typeof refinementResult.refinements === "object"
		) {
			for (const [slot, newName] of Object.entries(
				refinementResult.refinements,
			)) {
				if (!EQUIPMENT_SLOTS.includes(slot)) continue;
				const oldItem = equippedSlots[slot];
				if (
					!newName ||
					newName === "none" ||
					newName === "null" ||
					newName === "remove" ||
					newName === "empty"
				) {
					if (oldItem) {
						delete equippedSlots[slot];
						swaps.push({
							slot,
							from: oldItem.nameWithCaps || oldItem.name,
							to: "none (cleared to avoid clutter/clipping)",
						});
					}
					continue;
				}
				const pool = itemPool[slot] || [];
				const resolved = resolveItemSelection(newName, slot, pool, itemDb);
				if (resolved && (!oldItem || resolved.itemID !== oldItem.itemID)) {
					equippedSlots[slot] = resolved;
					swaps.push({
						slot,
						from: oldItem ? oldItem.nameWithCaps || oldItem.name : "none",
						to: resolved.nameWithCaps || resolved.name,
					});
				}
			}
		}

		steps.push({
			step: 6,
			name: "agentic_refinement_loop",
			source: "llm",
			synergyScore: refinementResult?.synergyScore || 90,
			approved: refinementResult?.approved !== false,
			critique:
				refinementResult?.critique ||
				"Outfit evaluated for visual cohesion and silhouette balance.",
			stylistAdvice: refinementResult?.stylistAdvice || "",
			swaps: swaps.length > 0 ? swaps : null,
			message:
				swaps.length > 0
					? `Art Director refined ${swaps.length} item(s) for higher synergy: ${swaps.map((s) => `${s.slot} (${s.from} ➔ ${s.to})`).join(", ")}`
					: `Outfit formula approved by Art Director with synergy score ${refinementResult?.synergyScore || 90}/100`,
		});
	}

	agentContext.critiqueAndRefinement = refinementResult
		? {
				synergyScore: refinementResult.synergyScore || 90,
				approved: refinementResult.approved !== false,
				critique: refinementResult.critique || "",
				stylistAdvice: refinementResult.stylistAdvice || "",
				swaps,
			}
		: null;

	// ═══ STEP 7: Smart Collision Auto-Resolution ═══
	const hat = equippedSlots.Hat,
		hair = equippedSlots.Hair;
	const shirt = equippedSlots.Shirt,
		pants = equippedSlots.Pants;
	const back = equippedSlots.Back,
		chest = equippedSlots.Chest;

	const removed = [];

	if (hat && hair && isFullHeadwear(hat)) {
		delete equippedSlots.Hair;
		removed.push({
			slot: "Hair",
			item: hair.nameWithCaps || hair.name,
			reason: `hidden by helmet '${hat.nameWithCaps || hat.name}'`,
		});
	}

	if (shirt && pants && isFullBodyShirt(shirt)) {
		delete equippedSlots.Pants;
		removed.push({
			slot: "Pants",
			item: pants?.nameWithCaps || pants?.name,
			reason: `covered by outfit '${shirt.nameWithCaps || shirt.name}'`,
		});
	}

	if (back && chest && isWingItem(back) && isCapeItem(chest)) {
		delete equippedSlots.Chest;
		removed.push({
			slot: "Chest",
			item: chest?.nameWithCaps || chest?.name,
			reason: `clips with wings '${back.nameWithCaps || back.name}'`,
		});
	}

	let finalItems = Object.values(equippedSlots).filter(Boolean);
	const seenSlots = new Set();
	finalItems = finalItems.filter((item) => {
		if (seenSlots.has(item.category)) return false;
		seenSlots.add(item.category);
		return true;
	});

	steps.push({
		step: 7,
		name: "auto_resolve_conflicts",
		source: "system",
		removed: removed.length > 0 ? removed : null,
		finalSlots: finalItems.map((i) => i.category),
		message:
			removed.length > 0
				? `Auto-removed ${removed.length} hidden item(s) for visual cleanliness: ${removed.map((r) => r.slot).join(", ")}`
				: "All equipment slots compatible and visually harmonious",
	});

	agentContext.conflictResolution = {
		removed,
		finalSlots: finalItems.map((i) => i.category),
	};
	agentContext.loopHistory = steps;

	const equippedTuples = finalItems.map((i) => [String(i.itemID), i.category]);

	// ═══ STEP 8: Render Avatar Composite ═══
	let renderResult = null;
	if (render) {
		renderResult = await renderAvatar(equippedTuples);
		steps.push({
			step: 8,
			name: "render_avatar",
			success: Boolean(renderResult?.success),
			dimensions: renderResult?.metadata?.dimensions || "992x640",
		});
	}

	// ═══ STEP 9: Optional Combat Simulation ═══
	let simulation = null;
	if (simulate && party?.members?.[0]) {
		const member = party.members[0];
		const memberStats = generateBalancedStats({
			name: member.name,
			className: member.class,
			level: member.level,
		});
		simulation = simulateCombat({
			combatantA: {
				name: npcName,
				stats: balanced.stats,
				level: npcLevel,
				hp: balanced.hp,
				armorClass: balanced.armorClass,
			},
			combatantB: {
				name: member.name,
				stats: memberStats.stats,
				level: member.level,
				hp: memberStats.hp,
				armorClass: memberStats.armorClass,
			},
			maxRounds: 10,
		});
		steps.push({
			step: 9,
			name: "combat_simulation",
			winner: simulation.winner,
			rounds: simulation.rounds,
		});
	}

	// ═══ Final Response ═══
	return {
		ok: true,
		source,
		prompt: prompt || "",
		type: analysis.type || type,
		selectedAgent: {
			id: selectedAgent.id,
			name: selectedAgent.name,
			title: selectedAgent.title,
			domain: selectedAgent.domain,
			archetype: selectedAgent.archetype,
		},
		agentContext,
		agentSteps: steps,
		npc: {
			name: npcName,
			title: analysis.title || `The ${npcClass}`,
			race: analysis.race || "Human",
			class: npcClass,
			level: npcLevel,
			hp: balanced.hp,
			stats: balanced.stats,
			armorClass: balanced.armorClass,
			location: analysis.location || "The Ashen Crown",
			disposition: analysis.disposition || "Netral",
			personality: analysis.personality || "Tactical, observant, and resolute.",
			lore:
				analysis.lore ||
				"A legendary figure whose deeds echo through the realm.",
			secret:
				analysis.secret ||
				"Holds knowledge that could alter the fate of nations.",
			statValidation: validation.warnings.length > 0 ? validation : null,
		},
		avatar: {
			theme: analysis.theme || "Custom Agentic Style",
			presetHint: analysis.presetHint || "dnd_fantasy",
			archetype: analysis.archetype || "warrior",
			mood: analysis.mood || "fierce",
			colorPalette: analysis.preferredColors || [],
			searchRegex: analysis.searchRegex || null,
			searchKeywords: analysis.searchKeywords || [],
			items: finalItems.map((i) => ({
				itemID: i.itemID,
				name: i.nameWithCaps || i.name,
				category: i.category,
				colors: i.colors || [],
			})),
			discoveredCandidates,
			totalDiscoveredCount,
			review: refinementResult
				? {
						synergyScore: refinementResult.synergyScore || 90,
						approved: refinementResult.approved !== false,
						critique: refinementResult.critique || "",
						stylistAdvice: refinementResult.stylistAdvice || "",
					}
				: null,
			compatibility: {
				compatible: removed.length === 0,
				autoResolved: removed.length > 0,
				removedItems: removed,
			},
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
