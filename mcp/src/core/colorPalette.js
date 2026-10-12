/**
 * core/colorPalette.js
 * ═══ LAYER 3: Pure Business Logic — Color Palettes ═══
 *
 * Full curated color palettes per theme.
 * Each theme has primary, accent, metallic, and glow color groups.
 * Used by AI suggester and avatar generator for cohesive aesthetics.
 */

export const THEME_PALETTES = Object.freeze({
	dnd_fantasy: Object.freeze({
		primary: ["royal_gold", "deep_blue", "forest_green", "burgundy"],
		accent: ["silver", "ivory", "scarlet", "midnight_blue"],
		metallic: ["polished_steel", "brass", "mithril", "iron"],
		glow: ["arcane_blue", "holy_gold", "enchanted_purple"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	gothic_horror: Object.freeze({
		primary: ["crimson", "black", "dark_purple", "midnight"],
		accent: ["bone_white", "blood_red", "shadow_grey", "ashen"],
		metallic: ["tarnished_silver", "rusted_iron", "blackened_steel"],
		glow: ["sickly_green", "eerie_violet", "ghostly_blue"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	celestial_angel: Object.freeze({
		primary: ["pure_white", "divine_gold", "sky_blue", "pearl"],
		accent: ["rose_gold", "ivory", "soft_yellow", "cloud_grey"],
		metallic: ["radiant_gold", "celestial_silver", "platinum"],
		glow: ["holy_aura", "starlight", "dawn_amber"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	demonic_underworld: Object.freeze({
		primary: [
			"hellfire_red",
			"abyss_black",
			"brimstone_orange",
			"corruption_purple",
		],
		accent: ["molten_gold", "dark_grey", "ember_orange", "toxic_green"],
		metallic: ["infernal_iron", "blackened_brass", "demonic_steel"],
		glow: ["lava_glow", "nether_purple", "soul_fire_blue"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	nature_elemental: Object.freeze({
		primary: ["emerald_green", "earth_brown", "sky_blue", "sun_yellow"],
		accent: ["moss_green", "bark_brown", "petal_pink", "river_blue"],
		metallic: ["copper", "bronze", "natural_iron"],
		glow: ["bioluminescent_green", "aurora_cyan", "firefly_gold"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	steampunk: Object.freeze({
		primary: ["brass", "copper", "mahogany_brown", "gear_gold"],
		accent: ["leather_tan", "coal_grey", "burgundy", "ivory"],
		metallic: ["polished_brass", "oxidized_copper", "bronze", "nickel"],
		glow: ["steam_white", "electric_blue", "amber_light"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	pirate: Object.freeze({
		primary: ["navy_blue", "plank_brown", "sail_white", "treasure_gold"],
		accent: ["blood_red", "rope_tan", "ocean_teal", "parrot_green"],
		metallic: ["tarnished_gold", "anchor_iron", "cannon_grey"],
		glow: ["compass_gold", "ghostship_green", "kraken_purple"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	ninja_samurai: Object.freeze({
		primary: ["shadow_black", "blood_red", "snow_white", "midnight_blue"],
		accent: ["bamboo_green", "sakura_pink", "silk_gold", "stone_grey"],
		metallic: ["katana_silver", "shuriken_steel", "oni_bronze"],
		glow: ["chi_blue", "fire_red", "spirit_white"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	cyberpunk: Object.freeze({
		primary: ["neon_cyan", "neon_pink", "carbon_black", "chrome_silver"],
		accent: ["electric_blue", "laser_red", "hologram_purple", "matrix_green"],
		metallic: ["chrome", "titanium", "circuit_gold"],
		glow: ["neon_glow_cyan", "plasma_pink", "holo_white"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),

	modern_streetwear: Object.freeze({
		primary: ["jet_black", "clean_white", "denim_blue", "heather_grey"],
		accent: ["fire_red", "forest_green", "mustard_yellow", "blush_pink"],
		metallic: ["silver_chain", "gold_buckle", "gunmetal"],
		glow: ["reflective_silver", "uv_white"],
		all() {
			return [...this.primary, ...this.accent, ...this.metallic, ...this.glow];
		},
	}),
});

/**
 * Gets the full curated palette for a theme.
 *
 * @param {string} theme — Theme key
 * @returns {object|null} Palette object or null
 */
export function getPalette(theme) {
	return THEME_PALETTES[theme] || null;
}

/**
 * Selects curated colors for an NPC based on theme and archetype.
 * Returns 3 harmonious colors — deterministic, not random.
 *
 * @param {string} theme
 * @param {string} archetype
 * @param {string} mood
 * @returns {string[]}
 */
export function suggestColors(theme, archetype, mood) {
	const palette = THEME_PALETTES[theme];
	if (!palette) {
		return ["gold", "black", "purple"];
	}

	// Deterministic selection based on archetype + mood hash
	const archetypeIndex =
		hashString(archetype || "warrior") % palette.primary.length;
	const moodIndex = hashString(mood || "heroic") % palette.accent.length;
	const metallicIndex =
		(archetypeIndex + moodIndex) % (palette.metallic?.length || 1);

	return [
		palette.primary[archetypeIndex],
		palette.accent[moodIndex],
		palette.metallic?.[metallicIndex] || palette.primary[0],
	];
}

/**
 * Simple deterministic string hash (djb2).
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) + hash + str.charCodeAt(i);
		hash = hash & 0x7fffffff; // Keep positive
	}
	return hash;
}

export default { THEME_PALETTES, getPalette, suggestColors };
