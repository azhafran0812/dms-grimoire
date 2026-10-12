/**
 * services/itemSuggester.js
 * ═══ LAYER 4: Service — AI-Driven Item Suggestion ═══
 *
 * Replaces ALL random item selection (pickRandom / Math.random).
 * Uses LLM to suggest specific Growtopia item names per slot,
 * with deterministic scoring fallback when LLM is offline.
 */

import { suggestColors } from "../core/colorPalette.js";
import {
	isFullBodyShirt,
	isFullHeadwear,
} from "../core/compatibilityEngine.js";
import { THEMES } from "../core/themeClassifier.js";
import { callLlm } from "./llmClient.js";

/**
 * Deterministic string hash (djb2).
 * @param {string} str
 * @returns {number}
 */
function hashStr(str) {
	let h = 5381;
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) + h + str.charCodeAt(i);
		h = h & 0x7fffffff;
	}
	return h;
}

/**
 * Scores a candidate item against target criteria.
 * Higher score = better match. Deterministic.
 *
 * @param {object} item — Classified item
 * @param {string[]} targetColors
 * @param {string} targetArchetype
 * @param {string} targetMood
 * @returns {number}
 */
function scoreItem(
	item,
	targetColors = [],
	targetArchetype = null,
	targetMood = null,
) {
	let score = 1;
	if (targetColors?.length > 0 && item.colors) {
		for (const c of targetColors) {
			if (item.colors.includes(c.toLowerCase())) score += 5;
		}
	}
	if (
		targetArchetype &&
		item.archetypes?.includes(targetArchetype.toLowerCase())
	)
		score += 4;
	if (targetMood && item.moods?.includes(targetMood.toLowerCase())) score += 3;
	return score;
}

/**
 * Deterministic top-pick from scored candidates.
 * Uses hash-based selection from top tier instead of Math.random().
 *
 * @param {Array<{item: object, score: number}>} scored — Sorted descending
 * @param {string} seed — Deterministic seed string
 * @param {number} [tierSize=6]
 * @returns {object|null} Selected item
 */
function deterministicPick(scored, seed, tierSize = 6) {
	if (scored.length === 0) return null;
	const topTier = scored.slice(0, Math.min(tierSize, scored.length));
	const idx = hashStr(seed) % topTier.length;
	return topTier[idx].item;
}

/**
 * Attempts LLM-based item suggestion for all slots at once.
 * Returns a map of slot → suggested item name, or null if LLM fails.
 *
 * @param {object} params
 * @param {string} params.theme
 * @param {string} params.archetype
 * @param {string} params.mood
 * @param {string} params.npcName
 * @param {string} params.npcClass
 * @param {string[]} params.slots
 * @param {string[]} params.availableItemNames — Sample item names per slot for context
 * @returns {Promise<Record<string, string>|null>}
 */
async function askLlmForItems({
	theme,
	archetype,
	mood,
	npcName,
	npcClass,
	slots,
	availableItemNames,
}) {
	const systemPrompt = `You are a Growtopia avatar stylist AI. Given a D&D character's theme, class, archetype, and mood, suggest the BEST matching Growtopia item name for each equipment slot.

RULES:
- You MUST pick item names from the provided available items list ONLY
- Slots are OPTIONAL! You do NOT need to fill every slot. Return null or omit a slot if it should remain unequipped (e.g. hair under a closed helmet/mask, pants under a full robe/overalls, or no wings/back gear needed).
- Choose items that are visually cohesive and match the character's aesthetic
- Do NOT pick random items — pick items that tell a visual story
- Respond ONLY with a JSON object mapping slot name to item name (or null)

Available items (sample): ${JSON.stringify(availableItemNames).slice(0, 3000)}`;

	const userPrompt = `Character: "${npcName}" — ${npcClass}
Theme: ${theme} | Archetype: ${archetype} | Mood: ${mood}
Slots to fill: ${slots.join(", ")}

Pick the best Growtopia item for each slot. Return JSON: { "Hat": "item name", "Shirt": "item name", ... }`;

	try {
		const result = await callLlm({ systemPrompt, userPrompt });
		if (result && typeof result === "object") return result;
	} catch {
		// LLM unavailable — fall through to deterministic fallback
	}
	return null;
}

/**
 * Main item suggestion function.
 * Replaces all random item picking with AI + deterministic scoring.
 *
 * @param {object} params
 * @param {string} params.theme
 * @param {string} params.archetype
 * @param {string} params.mood
 * @param {string[]} params.preferredColors
 * @param {string} params.npcName — Used as deterministic seed
 * @param {string} params.npcClass
 * @param {string[]} [params.includedSlots]
 * @param {string[]} [params.excludedSlots]
 * @param {Record<string, object>} [params.lockItems] — Pre-locked items by slot
 * @param {import('../core/themeClassifier.js').ThemeClassifier} params.classifier
 * @returns {Promise<{ items: object[], equippedSlots: Record<string, object>, equippedTuples: Array }>}
 */
export async function suggestItems({
	theme,
	archetype,
	mood,
	preferredColors,
	npcName,
	npcClass,
	includedSlots,
	excludedSlots,
	lockItems,
	classifier,
}) {
	const DEFAULT_SLOTS = [
		"Hat",
		"Hair",
		"Face",
		"Shirt",
		"Pants",
		"Feet",
		"Back",
		"Hand",
	];

	let targetSlots =
		Array.isArray(includedSlots) && includedSlots.length > 0
			? [...includedSlots]
			: [...DEFAULT_SLOTS];

	if (Array.isArray(excludedSlots)) {
		const excl = excludedSlots.map((s) => s.toLowerCase());
		targetSlots = targetSlots.filter((s) => !excl.includes(s.toLowerCase()));
	}

	const colors =
		preferredColors?.length > 0
			? preferredColors.map((c) => c.toLowerCase())
			: suggestColors(theme, archetype, mood);

	const equippedSlots = {};
	const selectedItems = [];

	// Apply locked items first
	if (lockItems) {
		for (const [slot, locked] of Object.entries(lockItems)) {
			let itemObj = null;
			if (typeof locked === "number" || typeof locked === "string") {
				itemObj = classifier.getClassifiedItemById(locked);
			} else if (typeof locked === "object" && locked !== null) {
				itemObj = locked;
			}
			if (itemObj) {
				equippedSlots[slot] = itemObj;
				selectedItems.push(itemObj);
			}
		}
	}

	// Try LLM suggestion first
	const slotsToFill = targetSlots.filter((s) => !equippedSlots[s]);
	const sampleNames = {};
	for (const slot of slotsToFill) {
		const candidates = classifier.getItemsByTheme(theme, {
			category: slot,
			limit: 30,
		});
		sampleNames[slot] = candidates
			.map((c) => c.nameWithCaps || c.name)
			.slice(0, 20);
	}

	const llmSuggestions = await askLlmForItems({
		theme,
		archetype,
		mood,
		npcName,
		npcClass,
		slots: slotsToFill,
		availableItemNames: sampleNames,
	});

	// Slot priority order for deterministic filling
	const slotOrder = [
		"Shirt",
		"Hat",
		"Pants",
		"Hand",
		"Back",
		"Face",
		"Feet",
		"Hair",
	];
	const orderedSlots = slotOrder.filter((s) => slotsToFill.includes(s));

	for (const slot of orderedSlots) {
		// Skip incompatible combos
		if (
			slot === "Hair" &&
			equippedSlots.Hat &&
			isFullHeadwear(equippedSlots.Hat)
		)
			continue;
		if (
			slot === "Pants" &&
			equippedSlots.Shirt &&
			isFullBodyShirt(equippedSlots.Shirt)
		)
			continue;

		// Try LLM-suggested item name first
		let chosen = null;
		if (llmSuggestions) {
			const rawSuggestion = llmSuggestions[slot];
			if (
				!rawSuggestion ||
				rawSuggestion === "none" ||
				rawSuggestion === "null" ||
				rawSuggestion === "empty"
			) {
				// AI specifically chose not to equip this slot: leave it empty!
				continue;
			}
			const suggestedName = String(rawSuggestion).toLowerCase();
			const allForSlot = classifier.getItemsByTheme(theme, {
				category: slot,
				limit: 200,
			});
			chosen = allForSlot.find(
				(i) =>
					(i.nameLower || "").includes(suggestedName) ||
					suggestedName.includes(i.nameLower || ""),
			);
			// If AI suggested an item but it wasn't found, leave unequipped rather than picking random item
			if (!chosen) continue;
		}

		// Fallback: deterministic scoring ONLY if LLM was completely offline
		if (!chosen && !llmSuggestions) {
			let candidates = classifier.getItemsByTheme(theme, {
				category: slot,
				limit: 150,
			});
			if (candidates.length === 0) {
				candidates = classifier.getItemsByTheme(THEMES.MODERN_STREETWEAR, {
					category: slot,
					limit: 50,
				});
			}
			if (candidates.length === 0) continue;

			// Filter compatibility
			const compatible = candidates.filter((cand) => {
				if (slot === "Hat" && equippedSlots.Hair && isFullHeadwear(cand))
					return false;
				if (slot === "Shirt" && equippedSlots.Pants && isFullBodyShirt(cand))
					return false;
				return true;
			});

			const pool = compatible.length > 0 ? compatible : candidates;
			const scored = pool.map((item) => ({
				item,
				score: scoreItem(item, colors, archetype, mood),
			}));
			scored.sort((a, b) => b.score - a.score);

			chosen = deterministicPick(scored, `${npcName}:${slot}:${theme}`);
		}

		if (chosen) {
			equippedSlots[slot] = chosen;
			selectedItems.push(chosen);
		}
	}

	const equippedTuples = selectedItems.map((i) => [
		String(i.itemID),
		i.category,
	]);

	return { items: selectedItems, equippedSlots, equippedTuples };
}
