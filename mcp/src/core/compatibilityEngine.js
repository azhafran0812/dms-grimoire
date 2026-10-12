/**
 * core/compatibilityEngine.js
 * ═══ LAYER 3: Pure Business Logic — Equipment Compatibility ═══
 *
 * Rule-based equipment collision detection and resolution.
 * Prevents visual clipping, sprite overlap, and illogical gear combos.
 * Pure logic — no I/O.
 */

export const CONFLICT_RULES = Object.freeze({
	DUPLICATE_SLOT: "DUPLICATE_SLOT",
	FULL_HEADWEAR_HIDES_HAIR: "FULL_HEADWEAR_HIDES_HAIR",
	FULL_BODY_SHIRT_CONFLICTS_PANTS: "FULL_BODY_SHIRT_CONFLICTS_PANTS",
	FACE_MASK_VS_EYEWEAR: "FACE_MASK_VS_EYEWEAR",
	WING_VS_CAPE_CONFLICT: "WING_VS_CAPE_CONFLICT",
	BULKY_ARMOR_VS_NECKWEAR: "BULKY_ARMOR_VS_NECKWEAR",
});

const FULL_HEADWEAR_KW = [
	"helmet",
	"helm",
	"hood",
	"full mask",
	"gas mask",
	"astronaut helmet",
	"space helmet",
	"welding mask",
	"diving helmet",
	"bucket helm",
	"great helm",
	"knight helmet",
	"bear head",
	"wolf head",
	"dragon head",
	"pumpkin head",
	"mascot",
	"cardboard box",
	"paper bag",
	"tiki mask",
	"oni mask",
	"samurai helmet",
	"kabuto",
	"beak mask",
	"plague doctor mask",
	"ninja hood",
	"ninja mask",
];

const FULL_BODY_SHIRT_KW = [
	"onesie",
	"costume",
	"full suit",
	"bodysuit",
	"jumpsuit",
	"robe",
	"dress",
	"kimono",
	"yukata",
	"toga",
	"pajamas",
	"leotard",
	"tutu",
	"spacesuit",
	"diving suit",
	"golem body",
	"exo suit body",
	"dinosaur suit",
	"bear suit",
	"chicken suit",
];

const FACE_COVER_KW = [
	"mask",
	"gas mask",
	"respirator",
	"bandana",
	"face mask",
	"ninja mask",
	"plague mask",
	"muzzle",
	"veil",
	"beard",
	"mustache",
	"full beard",
	"balaclava",
];

const EYEWEAR_KW = [
	"shades",
	"sunglasses",
	"glasses",
	"monocle",
	"spectacles",
	"goggles",
	"eyepatch",
	"visor",
	"blindfold",
];

const WING_KW = [
	"wing",
	"wings",
	"fairy wings",
	"angel wings",
	"devil wings",
	"dragon wings",
	"bat wings",
];
const CAPE_KW = [
	"cape",
	"cloak",
	"mantle",
	"shroud",
	"vampire cape",
	"superhero cape",
];

function hasKw(name, keywords) {
	const lower = String(name || "").toLowerCase();
	return keywords.some((kw) => lower.includes(kw));
}

export function isFullHeadwear(item) {
	return (
		item &&
		(item.category || "").toLowerCase() === "hat" &&
		hasKw(item.nameLower || item.name, FULL_HEADWEAR_KW)
	);
}
export function isFullBodyShirt(item) {
	return (
		item &&
		(item.category || "").toLowerCase() === "shirt" &&
		hasKw(item.nameLower || item.name, FULL_BODY_SHIRT_KW)
	);
}
export function isFaceCovering(item) {
	return item ? hasKw(item.nameLower || item.name, FACE_COVER_KW) : false;
}
export function isEyewear(item) {
	return item ? hasKw(item.nameLower || item.name, EYEWEAR_KW) : false;
}
export function isWingItem(item) {
	return item ? hasKw(item.nameLower || item.name, WING_KW) : false;
}
export function isCapeItem(item) {
	return item ? hasKw(item.nameLower || item.name, CAPE_KW) : false;
}

export function isItemHiddenBy(target, equipping) {
	if (!target || !equipping) return false;
	const tCat = (target.category || "").toLowerCase();
	if (tCat === "hair" && isFullHeadwear(equipping)) return true;
	if (tCat === "pants" && isFullBodyShirt(equipping)) return true;
	return false;
}

/**
 * Checks equipment set for conflicts.
 * @param {Array<object>} items
 * @returns {{ compatible: boolean, conflicts: Array<object>, warnings: string[] }}
 */
export function checkCompatibility(items = []) {
	const conflicts = [];
	const warnings = [];

	if (!Array.isArray(items) || items.length === 0) {
		return { compatible: true, conflicts: [], warnings: [] };
	}

	const slotMap = new Map();
	for (const item of items) {
		if (!item?.category) continue;
		if (slotMap.has(item.category)) {
			const existing = slotMap.get(item.category);
			conflicts.push({
				slotA: item.category,
				itemA: existing,
				slotB: item.category,
				itemB: item,
				rule: CONFLICT_RULES.DUPLICATE_SLOT,
				message: `Duplicate slot '${item.category}': '${existing.name}' and '${item.name}'`,
				severity: "error",
			});
		} else {
			slotMap.set(item.category, item);
		}
	}

	const hat = slotMap.get("Hat"),
		hair = slotMap.get("Hair"),
		face = slotMap.get("Face");
	const shirt = slotMap.get("Shirt"),
		pants = slotMap.get("Pants");
	const back = slotMap.get("Back"),
		chest = slotMap.get("Chest");

	if (hair && hat && isFullHeadwear(hat)) {
		conflicts.push({
			slotA: "Hat",
			itemA: hat,
			slotB: "Hair",
			itemB: hair,
			rule: CONFLICT_RULES.FULL_HEADWEAR_HIDES_HAIR,
			message: `Helmet '${hat.name}' covers hair '${hair.name}'.`,
			severity: "warning",
		});
		warnings.push(`Hair '${hair.name}' hidden by helmet '${hat.name}'.`);
	}
	if (shirt && pants && isFullBodyShirt(shirt)) {
		conflicts.push({
			slotA: "Shirt",
			itemA: shirt,
			slotB: "Pants",
			itemB: pants,
			rule: CONFLICT_RULES.FULL_BODY_SHIRT_CONFLICTS_PANTS,
			message: `Full outfit '${shirt.name}' covers pants '${pants.name}'.`,
			severity: "warning",
		});
		warnings.push(
			`Pants '${pants.name}' overridden by outfit '${shirt.name}'.`,
		);
	}
	if (face && hat && isFaceCovering(face) && isEyewear(hat)) {
		conflicts.push({
			slotA: "Face",
			itemA: face,
			slotB: "Hat",
			itemB: hat,
			rule: CONFLICT_RULES.FACE_MASK_VS_EYEWEAR,
			message: `Face '${face.name}' collides with eyewear '${hat.name}'.`,
			severity: "warning",
		});
	}
	if (back && chest && isWingItem(back) && isCapeItem(chest)) {
		conflicts.push({
			slotA: "Back",
			itemA: back,
			slotB: "Chest",
			itemB: chest,
			rule: CONFLICT_RULES.WING_VS_CAPE_CONFLICT,
			message: `Wings '${back.name}' clip with cape '${chest.name}'.`,
			severity: "warning",
		});
		warnings.push(`Back wings and chest cape creates visual clutter.`);
	}

	return {
		compatible: conflicts.filter((c) => c.severity === "error").length === 0,
		conflicts,
		warnings,
	};
}

/**
 * Resolves conflicts by deduplicating and removing clashing items.
 * @param {Array<object>} items
 * @param {{ strategy?: string }} [opts]
 * @returns {Array<object>}
 */
export function resolveConflicts(items = [], opts = {}) {
	if (!Array.isArray(items) || items.length === 0) return [];

	const bySlot = new Map();
	for (const item of items) {
		if (!item?.category) continue;
		if (!bySlot.has(item.category)) bySlot.set(item.category, item);
	}

	const hat = bySlot.get("Hat"),
		hair = bySlot.get("Hair");
	const shirt = bySlot.get("Shirt"),
		pants = bySlot.get("Pants");

	if (hat && hair && isFullHeadwear(hat)) {
		bySlot.delete(opts.strategy === "keep_hair" ? "Hat" : "Hair");
	}
	if (shirt && pants && isFullBodyShirt(shirt)) {
		bySlot.delete(opts.strategy === "keep_pants" ? "Shirt" : "Pants");
	}

	return Array.from(bySlot.values());
}
