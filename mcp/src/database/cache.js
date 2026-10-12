/**
 * database/cache.js
 * ═══ LAYER 2: Data Access — Cache Manager ═══
 *
 * Read/write JSON cache files with directory auto-creation.
 * Isolated from business logic — only handles file I/O.
 */

import fs, { promises as fsPromises } from "node:fs";
import path from "node:path";

/**
 * Reads a JSON file from disk.
 *
 * @param {string} filePath — Absolute path to JSON file
 * @returns {Promise<any|null>} Parsed data or null if not found/invalid
 */
export async function readJsonCache(filePath) {
	if (!fs.existsSync(filePath)) return null;
	try {
		const raw = await fsPromises.readFile(filePath, "utf8");
		const parsed = JSON.parse(raw);
		return parsed;
	} catch {
		return null;
	}
}

/**
 * Writes data as JSON to disk. Creates parent directories if needed.
 *
 * @param {string} filePath — Absolute path
 * @param {any} data — Data to serialize
 * @returns {Promise<void>}
 */
export async function writeJsonCache(filePath, data) {
	const dir = path.dirname(filePath);
	await fsPromises.mkdir(dir, { recursive: true });
	await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Checks if a cache file exists.
 *
 * @param {string} filePath
 * @returns {boolean}
 */
export function cacheExists(filePath) {
	return fs.existsSync(filePath);
}
