/**
 * services/avatarService.js
 * ═══ LAYER 4: Service — Avatar Assembly Orchestrator ═══
 *
 * Orchestrates: item suggestion → compatibility check → render.
 * No random — delegates to itemSuggester for AI-driven selection.
 */

import {
	checkCompatibility,
	resolveConflicts,
} from "../core/compatibilityEngine.js";
import { suggestItems } from "./itemSuggester.js";
import { renderAvatar } from "./renderService.js";

/**
 * Generates a complete avatar set with optional rendering.
 *
 * @param {object} params
 * @param {string} params.theme
 * @param {string} params.archetype
 * @param {string} params.mood
 * @param {string[]} params.preferredColors
 * @param {string} params.npcName — Deterministic seed
 * @param {string} params.npcClass
 * @param {boolean} [params.render=false]
 * @param {object} [params.renderOptions]
 * @param {import('../core/themeClassifier.js').ThemeClassifier} params.classifier
 * @returns {Promise<object>}
 */
export async function generateAvatar({
	theme,
	archetype,
	mood,
	preferredColors,
	npcName,
	npcClass,
	render = false,
	renderOptions = {},
	includedSlots,
	excludedSlots,
	lockItems,
	classifier,
}) {
	// 1. AI-driven item suggestion
	const suggestion = await suggestItems({
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
	});

	// 2. Compatibility check & resolution
	const compatCheck = checkCompatibility(suggestion.items);
	const finalItems = compatCheck.compatible
		? suggestion.items
		: resolveConflicts(suggestion.items);

	const equippedTuples = finalItems.map((i) => [String(i.itemID), i.category]);

	const result = {
		theme,
		archetype,
		mood,
		colorPalette: preferredColors || [],
		items: finalItems,
		equipped: equippedTuples,
		slots: suggestion.equippedSlots,
		compatibility: {
			compatible: true,
			conflictsResolved: !compatCheck.compatible,
			originalWarnings: compatCheck.warnings,
		},
		renderResult: null,
	};

	// 3. Optional rendering
	if (render) {
		result.renderResult = await renderAvatar(equippedTuples, renderOptions);
	}

	return result;
}
