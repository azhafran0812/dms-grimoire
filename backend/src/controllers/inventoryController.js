/**
 * controllers/inventoryController.js
 * ═══ LAYER 4: Controller — Inventory CRUD Endpoints ═══
 *
 * Handles HTTP requests for party inventory management.
 * Maps to CRUD Inventaris tasks 15-18.
 */

import * as InventoryService from "../services/inventoryService.js";
import { parseRequest, CreateInventoryItemSchema, UpdateInventoryItemSchema } from "../io/request.js";
import { sendSuccess } from "../io/response.js";

/**
 * POST /api/inventory — Add new loot item
 */
export async function handleCreate(req, res) {
	const data = parseRequest(CreateInventoryItemSchema, req.body);
	const result = await InventoryService.addItem(data);
	sendSuccess(res, result, { action: "inventory.create" }, 201);
}

/**
 * GET /api/inventory — List all inventory items
 */
export async function handleGetAll(req, res) {
	const items = await InventoryService.getAllItems();
	sendSuccess(res, items, { action: "inventory.list" });
}

/**
 * GET /api/inventory/:id — Get single item
 */
export async function handleGetById(req, res) {
	const item = await InventoryService.getItemById(req.params.id);
	sendSuccess(res, item, { action: "inventory.get" });
}

/**
 * PATCH /api/inventory/:id — Update item quantity (consumption)
 */
export async function handleUpdate(req, res) {
	const updates = parseRequest(UpdateInventoryItemSchema, req.body);
	const item = await InventoryService.updateItem(req.params.id, updates);

	if (item === null) {
		// Auto-deleted because quantity reached 0
		sendSuccess(res, { deleted: true, id: req.params.id, reason: "quantity_zero" }, { action: "inventory.auto_delete" });
	} else {
		sendSuccess(res, item, { action: "inventory.update" });
	}
}

/**
 * DELETE /api/inventory/:id — Discard item from party bag
 */
export async function handleDelete(req, res) {
	await InventoryService.removeItem(req.params.id);
	sendSuccess(res, { deleted: true, id: req.params.id }, { action: "inventory.delete" });
}

export default { handleCreate, handleGetAll, handleGetById, handleUpdate, handleDelete };
