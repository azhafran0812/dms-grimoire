/**
 * services/characterService.js
 * ═══ LAYER 3: Service — Character Business Logic ═══
 *
 * Orchestrates character operations between controller and model.
 * Contains validation, business rules, and error wrapping.
 */

import * as CharacterModel from "../models/characterModel.js";
import { AppError, ErrorCode } from "../io/AppError.js";
import { parseRequest, CreateCharacterSchema, UpdateCharacterSchema } from "../io/request.js";

/**
 * Creates a new party character.
 * @param {object} data — Validated character data
 * @returns {Promise<{ id: string, data: object }>}
 */
export async function createCharacter(data) {
	const validated = parseRequest(CreateCharacterSchema, data);
	try {
		return await CharacterModel.create(validated);
	} catch (err) {
		if (err instanceof AppError) throw err;
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to create character: ${err.message}`,
		);
	}
}

/**
 * Retrieves all party characters.
 * @returns {Promise<object>}
 */
export async function getAllCharacters() {
	try {
		return await CharacterModel.findAll();
	} catch (err) {
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to fetch characters: ${err.message}`,
		);
	}
}

/**
 * Retrieves a single character by ID.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getCharacterById(id) {
	const character = await CharacterModel.findById(id);
	if (!character) {
		throw new AppError(
			ErrorCode.CHARACTER_NOT_FOUND,
			`Character with ID "${id}" not found`,
		);
	}
	return character;
}

/**
 * Updates character fields (e.g. HP mutation, level up).
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateCharacter(id, updates) {
	await getCharacterById(id);
	const validated = parseRequest(UpdateCharacterSchema, updates);
	try {
		await CharacterModel.updateById(id, validated);
		return await CharacterModel.findById(id);
	} catch (err) {
		if (err instanceof AppError) throw err;
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to update character: ${err.message}`,
		);
	}
}

/**
 * Updates a single stat path (e.g. 'combat/hpCurrent').
 * Matches frontend's partyController.updateCharacterStat() pattern.
 * @param {string} id
 * @param {string} path — Firebase path (e.g. 'combat/hpCurrent')
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function updateCharacterStat(id, path, value) {
	await getCharacterById(id);
	try {
		await CharacterModel.updatePath(id, path, value);
	} catch (err) {
		if (err instanceof AppError) throw err;
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to update character stat: ${err.message}`,
		);
	}
}

/**
 * Deletes a character permanently (permadeath).
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteCharacter(id) {
	await getCharacterById(id);
	try {
		await CharacterModel.removeById(id);
	} catch (err) {
		throw new AppError(
			ErrorCode.FIREBASE_ERROR,
			`Failed to delete character: ${err.message}`,
		);
	}
}

export default {
	createCharacter,
	getAllCharacters,
	getCharacterById,
	updateCharacter,
	updateCharacterStat,
	deleteCharacter,
};
