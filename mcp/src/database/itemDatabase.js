/**
 * database/itemDatabase.js
 * ═══ LAYER 2: Data Access — Item Database ═══
 *
 * Ingestion, decryption, normalization, indexing, and search for
 * Growtopia Set Planner items (3,948 items across 10 categories).
 *
 * This module handles ONLY data access — no business logic.
 */

import https from "node:https";
import { AppError, ErrorCode } from "../io/AppError.js";
import { readJsonCache, writeJsonCache } from "./cache.js";
import { decryptJson } from "./crypto.js";

export const EQUIPMENT_CATEGORIES = Object.freeze([
	"Hand",
	"Shirt",
	"Hat",
	"Feet",
	"Face",
	"Hair",
	"Back",
	"Chest",
	"Pants",
	"Artifact",
]);

// ─── Helpers ───────────────────────────────────────────────

/**
 * Extracts normalized equipment category from raw Type string.
 * @param {string|Array} rawType
 * @returns {string}
 */
export function parseCategory(rawType) {
	if (!rawType) return "Unknown";
	if (Array.isArray(rawType)) return rawType[0] || "Unknown";

	const str = String(rawType).trim();
	const match = str.match(/['"]([a-zA-Z0-9_\s-]+)['"]/);
	if (!match?.[1]) return "Unknown";

	const cat = match[1].trim();
	const found = EQUIPMENT_CATEGORIES.find(
		(c) => c.toLowerCase() === cat.toLowerCase(),
	);
	return found || cat;
}

function safeInt(val, fallback = 0) {
	const num = Number.parseInt(val ?? fallback, 10);
	return Number.isNaN(num) ? fallback : num;
}

/**
 * Normalizes a raw gtsetplanner item into structured schema.
 * @param {object} raw
 * @returns {object}
 */
export function normalizeItem(raw) {
	const name = String(raw.name || "").trim();
	return {
		itemID: safeInt(raw.itemID, 0),
		name,
		nameWithCaps: String(raw.nameWithCaps || raw.name || "").trim(),
		nameLower: name.toLowerCase(),
		category: parseCategory(String(raw.Type || "")),
		rawType: String(raw.Type || ""),
		textureX: safeInt(raw.textureX, 0),
		textureY: safeInt(raw.textureY, 0),
	};
}

// ─── HTTP Fetcher ──────────────────────────────────────────

/**
 * Downloads binary payload over HTTPS.
 * @param {string} url
 * @param {number} [timeoutMs=30000]
 * @returns {Promise<Buffer>}
 */
export function fetchBinary(url, timeoutMs = 30000) {
	return new Promise((resolve, reject) => {
		const req = https.get(
			new URL(url),
			{
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					Accept: "*/*",
				},
				timeout: timeoutMs,
			},
			(res) => {
				if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
					res.resume();
					return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
				}
				const chunks = [];
				res.on("data", (chunk) => chunks.push(chunk));
				res.on("end", () => resolve(Buffer.concat(chunks)));
			},
		);
		req.on("timeout", () => {
			req.destroy();
			reject(new Error(`Timeout after ${timeoutMs}ms: ${url}`));
		});
		req.on("error", reject);
	});
}

// ─── ItemDatabase Class ────────────────────────────────────

export class ItemDatabase {
	/**
	 * @param {object} dbConfig — { itemsUrl, xorKey, cachePath }
	 */
	constructor(dbConfig) {
		this.remoteUrl = dbConfig.itemsUrl;
		this.cachePath = dbConfig.cachePath;
		this.xorKey = dbConfig.xorKey;

		this.items = [];
		this.itemsById = new Map();
		this.itemsByCategory = new Map();
		this.isLoaded = false;
	}

	/**
	 * Initializes the database from cache or remote.
	 *
	 * @param {{ forceRefresh?: boolean, offlineOnly?: boolean }} [opts]
	 * @returns {Promise<ItemDatabase>}
	 */
	async init(opts = {}) {
		const { forceRefresh = false, offlineOnly = false } = opts;

		// Try cache first
		if (!forceRefresh) {
			const cached = await readJsonCache(this.cachePath);
			if (Array.isArray(cached) && cached.length > 0) {
				this._index(cached);
				return this;
			}
		}

		if (offlineOnly) {
			throw new AppError(
				ErrorCode.DB_NOT_LOADED,
				`Offline cache not found: ${this.cachePath}`,
			);
		}

		// Fetch + decrypt + cache
		const rawBuffer = await fetchBinary(this.remoteUrl);
		const decrypted = decryptJson(rawBuffer, this.xorKey);

		if (!Array.isArray(decrypted)) {
			throw new AppError(
				ErrorCode.DB_NOT_LOADED,
				`Decrypted payload is not an array (got ${typeof decrypted})`,
			);
		}

		const normalized = decrypted.map(normalizeItem);
		await writeJsonCache(this.cachePath, normalized);
		this._index(normalized);
		return this;
	}

	/** @private */
	_index(items) {
		this.items = items;
		this.itemsById.clear();
		this.itemsByCategory.clear();

		for (const cat of EQUIPMENT_CATEGORIES) {
			this.itemsByCategory.set(cat, []);
		}

		for (const item of items) {
			this.itemsById.set(item.itemID, item);
			if (!this.itemsByCategory.has(item.category)) {
				this.itemsByCategory.set(item.category, []);
			}
			this.itemsByCategory.get(item.category).push(item);
		}

		this.isLoaded = true;
	}

	/** @private */
	_guard() {
		if (!this.isLoaded) {
			throw new AppError(
				ErrorCode.DB_NOT_LOADED,
				"ItemDatabase not loaded. Call init() first.",
			);
		}
	}

	getAllItems() {
		this._guard();
		return this.items;
	}
	getItemCount() {
		this._guard();
		return this.items.length;
	}

	getItemById(id) {
		this._guard();
		return this.itemsById.get(Number.parseInt(id, 10)) || null;
	}

	getItemsByCategory(category) {
		this._guard();
		const norm =
			EQUIPMENT_CATEGORIES.find(
				(c) => c.toLowerCase() === String(category).toLowerCase(),
			) || category;
		return this.itemsByCategory.get(norm) || [];
	}

	getCategories() {
		this._guard();
		return Array.from(this.itemsByCategory.keys());
	}

	getCategoryCounts() {
		this._guard();
		const counts = {};
		for (const [cat, items] of this.itemsByCategory.entries()) {
			counts[cat] = items.length;
		}
		return counts;
	}

	/**
	 * Searches items by name query and optional category filter.
	 *
	 * @param {string} query
	 * @param {{ category?: string, limit?: number }} [opts]
	 * @returns {Array<object>}
	 */
	searchItems(query = "", opts = {}) {
		this._guard();
		const q = String(query).toLowerCase().trim();
		const limit = opts.limit || 50;
		const pool = opts.category
			? this.getItemsByCategory(opts.category)
			: this.items;

		if (!q) return pool.slice(0, limit);

		const matches = [];
		for (const item of pool) {
			if ((item.nameLower || item.name.toLowerCase()).includes(q)) {
				matches.push(item);
				if (matches.length >= limit) break;
			}
		}
		return matches;
	}

	/**
	 * Searches items by regular expression pattern with optional category filter.
	 *
	 * @param {string|RegExp} pattern
	 * @param {{ category?: string, limit?: number }} [opts]
	 * @returns {Array<object>}
	 */
	searchByRegex(pattern, opts = {}) {
		this._guard();
		if (!pattern) return [];

		let re;
		if (pattern instanceof RegExp) {
			re = pattern;
		} else {
			try {
				const cleanPattern = String(pattern)
					.trim()
					.replace(/^\/|\/[a-z]*$/gi, "");
				re = new RegExp(cleanPattern, "i");
			} catch {
				const escaped = String(pattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				re = new RegExp(escaped, "i");
			}
		}

		const limit = opts.limit || 80;
		const pool = opts.category
			? this.getItemsByCategory(opts.category)
			: this.items;
		const matches = [];

		for (const item of pool) {
			const target = item.nameWithCaps || item.name || "";
			if (re.test(target) || (item.nameLower && re.test(item.nameLower))) {
				matches.push(item);
				if (matches.length >= limit) break;
			}
		}
		return matches;
	}

	/**
	 * Searches items by multiple keywords with relevance ranking.
	 *
	 * @param {string[]|string} keywords
	 * @param {{ category?: string, limit?: number }} [opts]
	 * @returns {Array<object>}
	 */
	searchByKeywords(keywords, opts = {}) {
		this._guard();
		const list = (
			Array.isArray(keywords) ? keywords : String(keywords).split(/[,\s|]+/)
		)
			.map((k) => String(k).trim().toLowerCase())
			.filter((k) => k.length > 1);

		if (list.length === 0) return [];

		const limit = opts.limit || 80;
		const pool = opts.category
			? this.getItemsByCategory(opts.category)
			: this.items;
		const scored = [];

		for (const item of pool) {
			const name = item.nameLower || (item.name || "").toLowerCase();
			let score = 0;
			for (const kw of list) {
				if (name === kw) {
					score += 20;
				} else if (name.includes(kw)) {
					score += kw.length > 4 ? 8 : 4;
				}
			}
			if (score > 0) {
				scored.push({ item, score });
			}
		}

		scored.sort((a, b) => b.score - a.score);
		return scored.slice(0, limit).map((s) => s.item);
	}
}
