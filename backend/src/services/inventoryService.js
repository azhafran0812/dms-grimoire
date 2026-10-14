/**
 * services/inventoryService.js
 * ═══ LAYER 3: Service — Inventory Business Logic ═══
 *
 * Orchestrates inventory operations between controller and model.
 * Contains business rules like quantity checks and auto-delete on zero.
 */

import * as InventoryModel from "../models/inventoryModel.js";
import { AppError, ErrorCode } from "../io/AppError.js";

/**
 * Adds a new loot item to party inventory.
 * @param {object} data — Validated item data
 * @returns {Promise<{ id: string, data: object }>}
 */
export async function addItem(data) {
	try {
		return await InventoryModel.create(data);
	} catch (err) {
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to add inventory item: ${err.message}`,
		);
	}
}

/**
 * Retrieves all inventory items.
 * @returns {Promise<object>}
 */
export async function getAllItems() {
	try {
		return await InventoryModel.findAll();
	} catch (err) {
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to fetch inventory: ${err.message}`,
		);
	}
}

/**
 * Retrieves a single inventory item by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getItemById(id) {
	const item = await InventoryModel.findById(id);
	if (!item) {
		throw new AppError(
			ErrorCode.INVENTORY_ITEM_NOT_FOUND,
			`Inventory item with ID "${id}" not found`,
		);
	}
	return item;
}

/**
 * Updates an inventory item (e.g. quantity change on potion consumption).
 * Auto-deletes item if quantity reaches 0.
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object|null>} — Updated item, or null if auto-deleted
 */
export async function updateItem(id, updates) {
	await getItemById(id);
	try {
		if (updates.quantity !== undefined && updates.quantity <= 0) {
			await InventoryModel.removeById(id);
			return null;
		}
		await InventoryModel.updateById(id, updates);
		return await InventoryModel.findById(id);
	} catch (err) {
		if (err instanceof AppError) throw err;
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to update inventory item: ${err.message}`,
		);
	}
}

/**
 * Removes an item from party inventory permanently.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeItem(id) {
	await getItemById(id);
	try {
		await InventoryModel.removeById(id);
	} catch (err) {
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to delete inventory item: ${err.message}`,
		);
	}
}

export default { addItem, getAllItems, getItemById, updateItem, removeItem };
