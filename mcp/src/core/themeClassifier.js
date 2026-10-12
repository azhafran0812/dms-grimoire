/**
 * core/themeClassifier.js
 * ═══ LAYER 3: Pure Business Logic — Theme Classification ═══
 *
 * Multi-label thematic categorization, color detection, and archetype/mood mapping
 * for Growtopia Set Planner items. Pure logic — no I/O.
 */

export const THEMES = Object.freeze({
	DND_FANTASY: "dnd_fantasy",
	CYBERPUNK: "cyberpunk",
	GOTHIC_HORROR: "gothic_horror",
	NINJA_SAMURAI: "ninja_samurai",
	CELESTIAL_ANGEL: "celestial_angel",
	DEMONIC_UNDERWORLD: "demonic_underworld",
	STEAMPUNK: "steampunk",
	PIRATE: "pirate",
	MODERN_STREETWEAR: "modern_streetwear",
	NATURE_ELEMENTAL: "nature_elemental",
});

export const THEME_METADATA = Object.freeze({
	[THEMES.DND_FANTASY]: {
		id: THEMES.DND_FANTASY,
		name: "D&D Fantasy & Medieval High Magic",
		description:
			"Swords, sorcery, knights, wizards, dragons, ancient relics, and medieval adventurers.",
		archetypes: [
			"warrior",
			"mage",
			"rogue",
			"paladin",
			"cleric",
			"bard",
			"ranger",
		],
		moods: ["heroic", "mysterious", "epic"],
		palette: ["gold", "silver", "brown", "red", "blue", "purple"],
	},
	[THEMES.CYBERPUNK]: {
		id: THEMES.CYBERPUNK,
		name: "Cyberpunk & Futuristic Sci-Fi",
		description:
			"Neon tech, robotic augments, cyberspace, holograms, laser weaponry, and urban techwear.",
		archetypes: [
			"cyber_hacker",
			"cyborg_brawler",
			"android_assassin",
			"netrunner",
		],
		moods: ["rebellious", "sleek", "futuristic"],
		palette: ["cyan", "neon_green", "purple", "black", "silver"],
	},
	[THEMES.GOTHIC_HORROR]: {
		id: THEMES.GOTHIC_HORROR,
		name: "Gothic Horror & Dark Macabre",
		description:
			"Vampires, reapers, shadows, skulls, graveyards, spectral ghosts, and cursed relics.",
		archetypes: [
			"necromancer",
			"vampire_lord",
			"death_knight",
			"shadow_stalker",
		],
		moods: ["ominous", "macabre", "chilling"],
		palette: ["black", "blood_red", "dark_purple", "bone_white", "grey"],
	},
	[THEMES.NINJA_SAMURAI]: {
		id: THEMES.NINJA_SAMURAI,
		name: "Ninja, Samurai & Eastern Legends",
		description:
			"Katanas, shinobi garb, ronin armor, oni masks, dojo masters, and sacred martial arts.",
		archetypes: [
			"shinobi_assassin",
			"ronin_swordsman",
			"oni_warrior",
			"martial_master",
		],
		moods: ["disciplined", "silent", "fierce"],
		palette: ["black", "red", "white", "gold", "dark_blue"],
	},
	[THEMES.CELESTIAL_ANGEL]: {
		id: THEMES.CELESTIAL_ANGEL,
		name: "Celestial Angel & Divine Radiance",
		description:
			"Seraphic wings, golden halos, holy relics, starry robes, and divine sanctification.",
		archetypes: [
			"seraph_guardian",
			"divine_cleric",
			"celestial_herald",
			"solar_knight",
		],
		moods: ["serene", "radiant", "majestic"],
		palette: ["white", "gold", "light_blue", "yellow", "silver"],
	},
	[THEMES.DEMONIC_UNDERWORLD]: {
		id: THEMES.DEMONIC_UNDERWORLD,
		name: "Demonic Underworld & Infernal Flame",
		description:
			"Fiendish horns, hellfire, abyss armor, devil wings, brimstone, and corrupted malice.",
		archetypes: [
			"infernal_overlord",
			"brimstone_brawler",
			"corrupted_warlock",
			"hellhound_rider",
		],
		moods: ["fierce", "malevolent", "destructive"],
		palette: ["crimson_red", "black", "orange", "purple", "dark_grey"],
	},
	[THEMES.STEAMPUNK]: {
		id: THEMES.STEAMPUNK,
		name: "Steampunk & Victorian Clockwork",
		description:
			"Brass goggles, clockwork gears, steam-powered apparatus, top hats, and vintage airships.",
		archetypes: [
			"clockwork_inventor",
			"airship_captain",
			"steam_mechanic",
			"victorian_gentleman",
		],
		moods: ["curious", "eccentric", "adventurous"],
		palette: ["brass", "bronze", "copper", "brown", "gold", "leather"],
	},
	[THEMES.PIRATE]: {
		id: THEMES.PIRATE,
		name: "Pirate & Nautical High Seas",
		description:
			"Buccaneer tricornes, cutlasses, sea captains, anchors, parrots, eyepatches, and ocean voyage.",
		archetypes: [
			"swashbuckler",
			"sea_captain",
			"buccaneer_gunner",
			"kraken_slayer",
		],
		moods: ["daring", "raucous", "free_spirited"],
		palette: ["navy_blue", "brown", "red", "gold", "white", "black"],
	},
	[THEMES.MODERN_STREETWEAR]: {
		id: THEMES.MODERN_STREETWEAR,
		name: "Modern Streetwear & Urban Casual",
		description:
			"Hoodies, sneakers, denim jeans, stylish shades, caps, skater apparel, and trendy fashion.",
		archetypes: [
			"urban_skater",
			"street_artist",
			"trendsetter",
			"casual_adventurer",
		],
		moods: ["chill", "stylish", "energetic"],
		palette: ["black", "white", "blue", "grey", "red", "green"],
	},
	[THEMES.NATURE_ELEMENTAL]: {
		id: THEMES.NATURE_ELEMENTAL,
		name: "Nature, Elemental & Primal Wilds",
		description:
			"Druidic leaves, floral wreaths, elemental fire, water, ice, earth, beasts, and spirits.",
		archetypes: [
			"druid_shifter",
			"elemental_shaman",
			"forest_ranger",
			"primal_beastmaster",
			"farmer_rancher",
		],
		moods: ["wild", "tranquil", "elemental"],
		palette: [
			"emerald_green",
			"earth_brown",
			"water_blue",
			"ice_cyan",
			"sun_yellow",
		],
	},
});

// ─── Keyword Dictionaries ──────────────────────────────────

const THEME_KEYWORDS = {
	[THEMES.DND_FANTASY]: [
		"wizard",
		"sorcerer",
		"sorceress",
		"warlock",
		"mage",
		"magic",
		"spell",
		"wand",
		"staff",
		"knight",
		"paladin",
		"armor",
		"shield",
		"sword",
		"blade",
		"claymore",
		"excalibur",
		"dagger",
		"dragon",
		"dungeon",
		"quest",
		"castle",
		"king",
		"queen",
		"crown",
		"prince",
		"princess",
		"elf",
		"elven",
		"dwarf",
		"dwarven",
		"goblin",
		"orc",
		"troll",
		"mythic",
		"myth",
		"legend",
		"potion",
		"scroll",
		"chalice",
		"robe",
		"cape",
		"cloak",
		"bard",
		"lute",
		"harp",
		"flute",
		"cleric",
		"priest",
		"monk",
		"altar",
		"tome",
		"grimoire",
		"fairy",
		"fae",
		"pixie",
		"valkyrie",
	],
	[THEMES.CYBERPUNK]: [
		"cyber",
		"neon",
		"robot",
		"robotic",
		"droid",
		"android",
		"laser",
		"techno",
		"tech",
		"futuristic",
		"holo",
		"hologram",
		"matrix",
		"synth",
		"glitch",
		"chrome",
		"wire",
		"circuit",
		"visor",
		"mecha",
		"exo",
		"digital",
		"bionic",
		"space",
		"galaxy",
		"sci-fi",
		"quantum",
		"nano",
		"plasma",
		"photon",
		"reactor",
		"scanner",
		"satellite",
		"cyborg",
		"jetpack",
		"jet",
		"hover",
		"alien",
		"astronaut",
		"helmet",
		"blaster",
		"raygun",
	],
	[THEMES.GOTHIC_HORROR]: [
		"dark",
		"shadow",
		"vampire",
		"dracula",
		"blood",
		"skull",
		"reaper",
		"death",
		"dead",
		"ghost",
		"phantom",
		"specter",
		"wraith",
		"skeleton",
		"bone",
		"cursed",
		"curse",
		"grave",
		"tomb",
		"cemetery",
		"coffin",
		"bat",
		"raven",
		"goth",
		"gothic",
		"macabre",
		"zombie",
		"undead",
		"ghoul",
		"horror",
		"spooky",
		"haunted",
		"nightmare",
		"crypt",
		"witch",
		"black cat",
		"frankenstein",
		"monster",
		"creepy",
		"slayer",
		"executioner",
	],
	[THEMES.NINJA_SAMURAI]: [
		"ninja",
		"shinobi",
		"samurai",
		"ronin",
		"katana",
		"shuriken",
		"kunai",
		"oni",
		"kabuto",
		"kimono",
		"yukata",
		"dojo",
		"sensei",
		"bushido",
		"karate",
		"judo",
		"taekwondo",
		"nunchaku",
		"nunchuck",
		"sai",
		"bamboo",
		"cherry blossom",
		"sakura",
		"pagoda",
		"geisha",
		"tengu",
		"eastern",
		"asian",
		"oriental",
		"tatami",
		"sushi",
		"dragon robe",
	],
	[THEMES.CELESTIAL_ANGEL]: [
		"angel",
		"angelic",
		"seraph",
		"seraphim",
		"cherub",
		"divine",
		"holy",
		"halo",
		"sacred",
		"celestial",
		"heaven",
		"heavenly",
		"god",
		"goddess",
		"saint",
		"pure",
		"radiant",
		"light",
		"sun",
		"solar",
		"star",
		"stellar",
		"aurora",
		"blessed",
		"miracle",
		"sanctified",
		"hymn",
		"pegasus",
		"feather",
		"white wings",
		"valkyrie",
	],
	[THEMES.DEMONIC_UNDERWORLD]: [
		"demon",
		"demonic",
		"devil",
		"devilish",
		"hell",
		"hellish",
		"hellfire",
		"infernal",
		"inferno",
		"underworld",
		"satan",
		"lucifer",
		"fiend",
		"fiendish",
		"abyss",
		"abyssal",
		"brimstone",
		"torment",
		"doom",
		"corrupted",
		"corruption",
		"sin",
		"horns",
		"demon horn",
		"lava",
		"magma",
		"nether",
		"hades",
		"evil",
		"succubus",
		"incubus",
		"hellhound",
	],
	[THEMES.STEAMPUNK]: [
		"steampunk",
		"gear",
		"gears",
		"cog",
		"cogs",
		"clockwork",
		"clock",
		"monocle",
		"brass",
		"copper",
		"bronze",
		"goggles",
		"steam",
		"top hat",
		"piston",
		"boiler",
		"victorian",
		"dirigible",
		"zeppelin",
		"airship",
		"aviator",
		"chronometer",
		"gauge",
		"pipe",
		"wrench",
		"inventor",
		"mechanic",
		"machinist",
		"tinkerer",
	],
	[THEMES.PIRATE]: [
		"pirate",
		"buccaneer",
		"corsair",
		"swashbuckler",
		"captain",
		"sailor",
		"seaman",
		"sea",
		"ocean",
		"anchor",
		"ship",
		"boat",
		"skull and bones",
		"jolly roger",
		"compass",
		"eyepatch",
		"cutlass",
		"flintlock",
		"cannon",
		"parrot",
		"kraken",
		"treasure",
		"chest",
		"booty",
		"nautical",
		"maritime",
		"mermaid",
		"siren",
		"plank",
		"hook hand",
		"wooden peg",
	],
	[THEMES.MODERN_STREETWEAR]: [
		"streetwear",
		"hoodie",
		"sneakers",
		"sneaker",
		"shoes",
		"cap",
		"baseball",
		"jeans",
		"jacket",
		"denim",
		"beanie",
		"headphones",
		"earphones",
		"shades",
		"sunglasses",
		"glasses",
		"casual",
		"t-shirt",
		"shirt",
		"pants",
		"boxers",
		"skater",
		"skateboard",
		"urban",
		"backpack",
		"tracksuit",
		"jersey",
		"sweater",
		"vest",
		"cardigan",
		"shorts",
		"flip flop",
		"slippers",
		"boots",
		"tuxedo",
		"suit",
		"tie",
	],
	[THEMES.NATURE_ELEMENTAL]: [
		"nature",
		"leaf",
		"leaves",
		"flower",
		"floral",
		"blossom",
		"rose",
		"tree",
		"wood",
		"wooden",
		"forest",
		"jungle",
		"vine",
		"branch",
		"bloom",
		"plant",
		"herb",
		"garden",
		"earth",
		"stone",
		"rock",
		"crystal",
		"gem",
		"emerald",
		"water",
		"aqua",
		"ocean",
		"river",
		"rain",
		"fire",
		"flame",
		"blaze",
		"wind",
		"breeze",
		"gale",
		"ice",
		"frost",
		"snow",
		"blizzard",
		"frozen",
		"druid",
		"wolf",
		"bear",
		"deer",
		"stag",
		"bird",
		"owl",
		"beast",
		"animal",
		"creature",
	],
};

const COLOR_KEYWORDS = [
	{
		name: "red",
		keywords: ["red", "crimson", "ruby", "scarlet", "blood", "cherry", "flame"],
	},
	{
		name: "blue",
		keywords: [
			"blue",
			"cyan",
			"azure",
			"sapphire",
			"navy",
			"sky",
			"aqua",
			"cobalt",
		],
	},
	{
		name: "green",
		keywords: ["green", "emerald", "lime", "olive", "mint", "forest", "jade"],
	},
	{
		name: "yellow",
		keywords: ["yellow", "amber", "lemon", "canary", "sun", "solar"],
	},
	{
		name: "purple",
		keywords: ["purple", "violet", "amethyst", "magenta", "lavender", "plum"],
	},
	{
		name: "black",
		keywords: [
			"black",
			"dark",
			"shadow",
			"night",
			"ebony",
			"onyx",
			"midnight",
			"charcoal",
		],
	},
	{
		name: "white",
		keywords: [
			"white",
			"pure",
			"snow",
			"pearl",
			"ivory",
			"bone",
			"clean",
			"light",
		],
	},
	{ name: "gold", keywords: ["gold", "golden", "gilded", "auric"] },
	{
		name: "silver",
		keywords: [
			"silver",
			"platinum",
			"chrome",
			"metallic",
			"steel",
			"grey",
			"gray",
		],
	},
	{
		name: "pink",
		keywords: ["pink", "rose", "blush", "bubblegum", "candy", "pastel"],
	},
	{
		name: "orange",
		keywords: ["orange", "tangerine", "amber", "sunset", "copper", "brass"],
	},
	{
		name: "brown",
		keywords: [
			"brown",
			"tan",
			"leather",
			"wood",
			"chestnut",
			"chocolate",
			"dirt",
		],
	},
];

const ARCHETYPE_KEYWORDS = [
	{
		name: "warrior",
		keywords: [
			"knight",
			"paladin",
			"sword",
			"blade",
			"armor",
			"shield",
			"fighter",
			"warrior",
			"gladiator",
			"axe",
		],
	},
	{
		name: "mage",
		keywords: [
			"wizard",
			"sorcerer",
			"mage",
			"wand",
			"staff",
			"robe",
			"spell",
			"magic",
			"grimoire",
			"scroll",
			"tome",
		],
	},
	{
		name: "rogue",
		keywords: [
			"dagger",
			"stealth",
			"shadow",
			"assassin",
			"thief",
			"ninja",
			"hood",
			"mask",
			"poison",
			"boots",
		],
	},
	{
		name: "ranger",
		keywords: [
			"bow",
			"arrow",
			"quiver",
			"crossbow",
			"ranger",
			"hunter",
			"scout",
			"feather",
			"trapper",
		],
	},
	{
		name: "healer",
		keywords: [
			"cleric",
			"priest",
			"halo",
			"holy",
			"angel",
			"cross",
			"relic",
			"potion",
			"doctor",
			"medic",
		],
	},
	{
		name: "cyber_hacker",
		keywords: [
			"cyber",
			"neon",
			"robot",
			"laser",
			"tech",
			"visor",
			"matrix",
			"wire",
			"circuit",
			"exo",
		],
	},
	{
		name: "monarch_noble",
		keywords: [
			"king",
			"queen",
			"crown",
			"royal",
			"throne",
			"emperor",
			"tuxedo",
			"diamond",
			"golden",
		],
	},
	{
		name: "beast_nature",
		keywords: [
			"druid",
			"wolf",
			"bear",
			"deer",
			"leaf",
			"flower",
			"vine",
			"animal",
			"beast",
			"horn",
		],
	},
	{
		name: "farmer_rancher",
		keywords: [
			"farmer",
			"rancher",
			"peternak",
			"petani",
			"overalls",
			"straw hat",
			"pitchfork",
			"calf",
			"cattle",
			"cow",
			"bull",
			"munchin",
			"gembala",
			"shepherd",
			"pastoral",
			"cowboy boots",
		],
	},
];

const MOOD_KEYWORDS = [
	{
		name: "heroic",
		keywords: [
			"golden",
			"holy",
			"knight",
			"radiant",
			"paladin",
			"champion",
			"grand",
			"valiant",
		],
	},
	{
		name: "ominous",
		keywords: [
			"dark",
			"shadow",
			"skull",
			"cursed",
			"death",
			"reaper",
			"vampire",
			"demon",
			"blood",
		],
	},
	{
		name: "playful",
		keywords: [
			"bunny",
			"candy",
			"party",
			"funny",
			"cute",
			"balloon",
			"clown",
			"silly",
			"heart",
		],
	},
	{
		name: "mysterious",
		keywords: [
			"veil",
			"hood",
			"ghost",
			"phantom",
			"crystal",
			"mask",
			"secret",
			"enigma",
			"cryptic",
		],
	},
	{
		name: "fierce",
		keywords: [
			"flame",
			"fire",
			"dragon",
			"beast",
			"savage",
			"fury",
			"rage",
			"warrior",
			"blade",
		],
	},
	{
		name: "serene",
		keywords: [
			"angel",
			"pure",
			"peace",
			"calm",
			"flower",
			"zen",
			"lotus",
			"halo",
			"saint",
		],
	},
	{
		name: "urban_cool",
		keywords: [
			"shades",
			"sneakers",
			"hoodie",
			"headphones",
			"cool",
			"skater",
			"streetwear",
			"stylish",
		],
	},
];

// ─── Classification Logic ──────────────────────────────────

function matchesKeyword(text, keyword) {
	if (keyword.includes(" ")) return text.includes(keyword);
	const regex = new RegExp(`(^|[^a-zA-Z0-9])${keyword}([^a-zA-Z0-9]|$)`, "i");
	return regex.test(text);
}

/**
 * Classifies a single item into themes, colors, archetypes, and moods.
 * @param {object} item
 * @returns {object}
 */
export function classifyItem(item) {
	const nameLower = (item.nameLower || item.name || "").toLowerCase();
	const categoryLower = (item.category || "").toLowerCase();
	const fullText = `${nameLower} ${categoryLower}`;

	const matchedThemes = [];
	const themeScores = {};

	for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
		let score = 0;
		for (const kw of keywords) {
			if (matchesKeyword(fullText, kw)) {
				score += kw.length > 4 ? 2 : 1;
			}
		}
		if (score > 0) {
			themeScores[theme] = score;
			matchedThemes.push(theme);
		}
	}

	matchedThemes.sort((a, b) => themeScores[b] - themeScores[a]);

	if (matchedThemes.length === 0) {
		matchedThemes.push(
			["shirt", "pants", "feet", "hair", "face"].includes(categoryLower)
				? THEMES.MODERN_STREETWEAR
				: THEMES.DND_FANTASY,
		);
	}

	const detectedColors = [];
	for (const { name, keywords } of COLOR_KEYWORDS) {
		for (const kw of keywords) {
			if (matchesKeyword(nameLower, kw)) {
				if (!detectedColors.includes(name)) detectedColors.push(name);
				break;
			}
		}
	}

	const matchedArchetypes = [];
	for (const { name, keywords } of ARCHETYPE_KEYWORDS) {
		for (const kw of keywords) {
			if (matchesKeyword(fullText, kw)) {
				if (!matchedArchetypes.includes(name)) matchedArchetypes.push(name);
				break;
			}
		}
	}

	const matchedMoods = [];
	for (const { name, keywords } of MOOD_KEYWORDS) {
		for (const kw of keywords) {
			if (matchesKeyword(fullText, kw)) {
				if (!matchedMoods.includes(name)) matchedMoods.push(name);
				break;
			}
		}
	}

	return {
		...item,
		themes: matchedThemes,
		primaryTheme: matchedThemes[0],
		colors: detectedColors,
		archetypes: matchedArchetypes,
		moods: matchedMoods,
	};
}

// ─── ThemeClassifier Class ─────────────────────────────────

export class ThemeClassifier {
	constructor() {
		this.classifiedItems = [];
		this.classifiedById = new Map();
		this.itemsByTheme = new Map();
		this.isClassified = false;
	}

	/**
	 * Classifies and indexes all items.
	 * @param {Array<object>} items — Raw/normalized items from ItemDatabase
	 * @returns {ThemeClassifier}
	 */
	classifyAll(items) {
		this.classifiedItems = [];
		this.classifiedById.clear();
		this.itemsByTheme.clear();

		for (const themeKey of Object.values(THEMES)) {
			this.itemsByTheme.set(themeKey, []);
		}

		for (const rawItem of items) {
			const enriched = classifyItem(rawItem);
			this.classifiedItems.push(enriched);
			this.classifiedById.set(enriched.itemID, enriched);

			for (const t of enriched.themes) {
				if (!this.itemsByTheme.has(t)) this.itemsByTheme.set(t, []);
				this.itemsByTheme.get(t).push(enriched);
			}
		}

		this.isClassified = true;
		return this;
	}

	getClassifiedItemById(id) {
		return this.classifiedById.get(Number.parseInt(id, 10)) || null;
	}

	getAvailableThemes() {
		return Object.values(THEMES).map((id) => {
			const meta = THEME_METADATA[id] || {};
			return {
				id,
				name: meta.name || id,
				description: meta.description || "",
				archetypes: meta.archetypes || [],
				moods: meta.moods || [],
				palette: meta.palette || [],
				itemCount: this.itemsByTheme.get(id)?.length || 0,
			};
		});
	}

	/**
	 * Query items by theme with optional filters.
	 * @param {string} theme
	 * @param {{ category?: string, archetype?: string, mood?: string, color?: string, query?: string, limit?: number }} [opts]
	 * @returns {Array<object>}
	 */
	getItemsByTheme(theme, opts = {}) {
		if (!this.isClassified) {
			throw new Error(
				"ThemeClassifier not initialized. Call classifyAll() first.",
			);
		}

		const pool =
			this.itemsByTheme.get(
				String(theme || "")
					.toLowerCase()
					.trim(),
			) || [];
		const { category, archetype, mood, color, query, limit = 100 } = opts;

		const filtered = [];
		for (const item of pool) {
			if (category && item.category.toLowerCase() !== category.toLowerCase())
				continue;
			if (archetype && !item.archetypes.includes(archetype.toLowerCase()))
				continue;
			if (mood && !item.moods.includes(mood.toLowerCase())) continue;
			if (color && !item.colors.includes(color.toLowerCase())) continue;
			if (query && !item.nameLower.includes(query.toLowerCase())) continue;

			filtered.push(item);
			if (filtered.length >= limit) break;
		}

		return filtered;
	}

	getThemeCounts() {
		const counts = {};
		for (const [t, items] of this.itemsByTheme.entries()) {
			counts[t] = items.length;
		}
		return counts;
	}
}
