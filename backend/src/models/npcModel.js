/**
 * models/npcModel.js
 * ═══ LAYER 2: Model — NPC Database Operations ═══
 *
 * Direct Firebase Realtime Database operations for the /campaign/active/npcs node
 * and /npcs node (dual-synced so frontend NPCView and backend REST API stay 100% aligned).
 *
 * Uses Firebase Client SDK (same as frontend).
 * No business logic — pure data access.
 */

import { db, ref, get, set, push, update, remove } from "../config/firebase.js";

const NODE = "npcs";
const CAMPAIGN_NODE = "campaign/active/npcs";

/**
 * Creates a new NPC entry.
 * Saves to both campaign/active/npcs (frontend live view) and npcs (backend catalog).
 *
 * @param {object} data — NPC data
 * @returns {Promise<{ id: string, data: object }>}
 */
export async function create(data) {
	const newRef = push(ref(db, CAMPAIGN_NODE));
	const id = data.id || newRef.key;

	const entry = {
		...data,
		id,
		role: data.role || data.title || data.class || "NPC",
		location: data.location || "The Ashen Crown",
		description: data.description || data.personality || data.lore || "",
		traits:
			data.traits ||
			[
				data.race && data.class ? `${data.race} ${data.class}` : null,
				data.disposition ? `Disposition: ${data.disposition}` : null,
			]
				.filter(Boolean)
				.join(" · "),
		createdAt: data.createdAt || Date.now(),
		updatedAt: Date.now(),
	};

	await set(ref(db, `${CAMPAIGN_NODE}/${id}`), entry);
	await set(ref(db, `${NODE}/${id}`), entry);

	return { id, data: entry };
}

/**
 * Retrieves all NPCs from campaign/active/npcs (or fallback to npcs).
 * @returns {Promise<object>} — Map of { [id]: npcData }
 */
export async function findAll() {
	const snapshot = await get(ref(db, CAMPAIGN_NODE));
	if (snapshot.exists() && Object.keys(snapshot.val() || {}).length > 0) {
		return snapshot.val();
	}
	const fallbackSnap = await get(ref(db, NODE));
	return fallbackSnap.val() || {};
}

/**
 * Retrieves a single NPC by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
	const snapshot = await get(ref(db, `${CAMPAIGN_NODE}/${id}`));
	if (snapshot.exists()) {
		return { id, ...snapshot.val() };
	}
	const fallbackSnap = await get(ref(db, `${NODE}/${id}`));
	return fallbackSnap.exists() ? { id, ...fallbackSnap.val() } : null;
}

/**
 * Updates an NPC by ID (partial merge on both nodes).
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<void>}
 */
export async function updateById(id, updates) {
	const payload = {
		...updates,
		updatedAt: Date.now(),
	};
	await update(ref(db, `${CAMPAIGN_NODE}/${id}`), payload).catch(() => {});
	await update(ref(db, `${NODE}/${id}`), payload).catch(() => {});
}

/**
 * Deletes an NPC by ID from both nodes.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeById(id) {
	await remove(ref(db, `${CAMPAIGN_NODE}/${id}`)).catch(() => {});
	await remove(ref(db, `${NODE}/${id}`)).catch(() => {});
}

export default { create, findAll, findById, updateById, removeById };
