/**
 * controllers/characterController.js
 * ═══ LAYER 4: Controller — Character CRUD Endpoints ═══
 *
 * Handles HTTP requests for party character management.
 * Data structure matches frontend/src/models/characterModel.js:
 *   { id, name, race, characterClass, combat: { hpMax, hpCurrent, ac }, stats, ... }
 */

import * as CharacterService from "../services/characterService.js";
import { parseRequest, CreateCharacterSchema, UpdateCharacterSchema } from "../io/request.js";
import { sendSuccess } from "../io/response.js";
import { AppError, ErrorCode } from "../io/AppError.js";

/**
 * POST /api/characters — Create new character
 * Accepts the full payload from frontend's createCharacterPayload()
 */
export async function handleCreate(req, res) {
	const data = parseRequest(CreateCharacterSchema, req.body);
	const result = await CharacterService.createCharacter(data);
	sendSuccess(res, result, { action: "character.create" }, 201);
}

/**
 * GET /api/characters — List all characters (real-time monitoring)
 */
export async function handleGetAll(req, res) {
	const characters = await CharacterService.getAllCharacters();
	sendSuccess(res, characters, { action: "character.list" });
}

/**
 * GET /api/characters/:id — Get single character
 */
export async function handleGetById(req, res) {
	const character = await CharacterService.getCharacterById(req.params.id);
	sendSuccess(res, character, { action: "character.get" });
}

/**
 * PATCH /api/characters/:id — Update character (nested-safe)
 * Supports nested updates: { combat: { hpCurrent: 5 } }
 * Without overwriting other combat fields (hpMax, ac, etc.)
 */
export async function handleUpdate(req, res) {
	const updates = parseRequest(UpdateCharacterSchema, req.body);
	const character = await CharacterService.updateCharacter(req.params.id, updates);
	sendSuccess(res, character, { action: "character.update" });
}

/**
 * PATCH /api/characters/:id/stat — Update a single stat path
 * Matches frontend's: updateCharacterStat(id, 'combat/hpCurrent', newValue)
 *
 * Body: { path: "combat/hpCurrent", value: 5 }
 */
export async function handleUpdateStat(req, res) {
	const { path, value } = req.body;
	if (!path) {
		throw new AppError(
			ErrorCode.MISSING_FIELD,
			'Field "path" is required (e.g. "combat/hpCurrent")',
		);
	}
	await CharacterService.updateCharacterStat(req.params.id, path, value);
	sendSuccess(res, { id: req.params.id, path, value }, { action: "character.update_stat" });
}

/**
 * DELETE /api/characters/:id — Permadeath removal
 */
export async function handleDelete(req, res) {
	await CharacterService.deleteCharacter(req.params.id);
	sendSuccess(res, { deleted: true, id: req.params.id }, { action: "character.delete" });
}

export default { handleCreate, handleGetAll, handleGetById, handleUpdate, handleUpdateStat, handleDelete };
