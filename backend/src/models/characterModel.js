/**
 * models/characterModel.js
 * ═══ LAYER 2: Model — Character Database Operations ═══
 *
 * Direct Firebase Realtime Database operations for the /party node.
 * Uses Firebase Client SDK (same as frontend).
 *
 * Data structure matches frontend/src/models/characterModel.js:
 *   { id, name, race, characterClass, combat: { hpMax, hpCurrent, ac }, stats: {...} }
 */

import { db, ref, get, set, push, update, remove } from "../config/firebase.js";

const NODE = "party";

/**
 * Flattens nested object into dot-notation keys for Firebase partial update.
 * Example: { combat: { hpCurrent: 5 } } → { "combat/hpCurrent": 5 }
 *
 * This prevents Firebase from overwriting the entire nested object.
 *
 * @param {object} obj — Nested update object
 * @param {string} [prefix] — Current key prefix
 * @returns {object} — Flattened object with slash-separated keys
 */
function flattenForUpdate(obj, prefix = "") {
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}/${key}` : key;
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(result, flattenForUpdate(value, fullKey));
		} else {
			result[fullKey] = value;
		}
	}
	return result;
}

/**
 * Creates a new character entry.
 * Supports both frontend-generated IDs (uuidv4) and auto-generated Firebase IDs.
 *
 * @param {object} data — Character data (may include `id` from frontend)
 * @returns {Promise<{ id: string, data: object }>}
 */
export async function create(data) {
	// Frontend generates its own ID via uuidv4() in characterModel.js
	const { id: customId, ...rest } = data;
	const characterId = customId || push(ref(db, NODE)).key;

	const entry = {
		...rest,
		id: characterId,
		createdAt: data.createdAt || Date.now(),
		updatedAt: Date.now(),
	};

	await set(ref(db, `${NODE}/${characterId}`), entry);
	return { id: characterId, ...entry, data: entry };
}

/**
 * Retrieves all characters.
 * @returns {Promise<object>} — Map of { [id]: characterData }
 */
export async function findAll() {
	const snapshot = await get(ref(db, NODE));
	return snapshot.val() || {};
}

/**
 * Retrieves a single character by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
	const snapshot = await get(ref(db, `${NODE}/${id}`));
	return snapshot.exists() ? { id, ...snapshot.val() } : null;
}

/**
 * Updates a character by ID (deep partial merge).
 * Flattens nested objects so Firebase doesn't overwrite entire sub-objects.
 *
 * Example: updateById("abc", { combat: { hpCurrent: 5 } })
 *   → Firebase update: { "combat/hpCurrent": 5, updatedAt: ... }
 *   → Only hpCurrent changes, hpMax/ac/etc remain untouched.
 *
 * @param {string} id
 * @param {object} updates — Nested or flat update object
 * @returns {Promise<void>}
 */
export async function updateById(id, updates) {
	const flattened = flattenForUpdate(updates);
	flattened.updatedAt = Date.now();
	await update(ref(db, `${NODE}/${id}`), flattened);
}

/**
 * Updates a specific nested path directly.
 * Matches frontend's partyController.js pattern:
 *   updateCharacterStat(id, 'combat/hpCurrent', newValue)
 *
 * @param {string} id — Character ID
 * @param {string} path — Dot/slash path (e.g. 'combat/hpCurrent')
 * @param {any} value — New value
 * @returns {Promise<void>}
 */
export async function updatePath(id, path, value) {
	await set(ref(db, `${NODE}/${id}/${path}`), value);
}

/**
 * Deletes a character by ID (permadeath).
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeById(id) {
	await remove(ref(db, `${NODE}/${id}`));
}

export default { create, findAll, findById, updateById, updatePath, removeById };
