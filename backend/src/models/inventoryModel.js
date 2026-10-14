/**
 * models/inventoryModel.js
 * ═══ LAYER 2: Model — Inventory Database Operations ═══
 *
 * Direct Firebase Realtime Database operations for the /inventory node.
 * Uses Firebase Client SDK (same as frontend).
 * No business logic — pure data access.
 */

import { db, ref, get, set, push, update, remove } from "../config/firebase.js";

const NODE = "inventory";

/**
 * Creates a new inventory item (loot).
 * @param {object} data — Item data
 * @returns {Promise<{ id: string, data: object }>}
 */
export async function create(data) {
	const newRef = push(ref(db, NODE));
	const entry = {
		...data,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(newRef, entry);
	return { id: newRef.key, data: entry };
}

/**
 * Retrieves all inventory items.
 * @returns {Promise<object>} — Map of { [id]: itemData }
 */
export async function findAll() {
	const snapshot = await get(ref(db, NODE));
	return snapshot.val() || {};
}

/**
 * Retrieves a single inventory item by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
	const snapshot = await get(ref(db, `${NODE}/${id}`));
	return snapshot.exists() ? { id, ...snapshot.val() } : null;
}

/**
 * Updates an inventory item by ID (partial merge).
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<void>}
 */
export async function updateById(id, updates) {
	await update(ref(db, `${NODE}/${id}`), {
		...updates,
		updatedAt: Date.now(),
	});
}

/**
 * Deletes an inventory item by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeById(id) {
	await remove(ref(db, `${NODE}/${id}`));
}

export default { create, findAll, findById, updateById, removeById };
