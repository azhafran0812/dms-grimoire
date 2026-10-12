/**
 * services/renderService.js
 * ═══ LAYER 4: Service — Avatar Render Client ═══
 *
 * Sends equipped item sets to gtsetplanner.com for composite PNG rendering.
 */

import https from "node:https";
import { config } from "../config/env.js";

const MOCK_PNG_BASE64 =
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const DEFAULT_RENDER_PAYLOAD = Object.freeze({
	searchQuery: "",
	selectedType: "All",
	expression: 0,
	skincolor: 0,
	roleskin: 0,
	dyes: [255, 255, 255],
	drops: [255, 255, 255],
	lenses: [0, 0, 0],
	customskincolor: [240, 240, 240, 255],
	purebeingtrigger: 0,
	equinox: 0,
	crownseasons: [0, 0],
	willofthewild: 0,
	golgift: 0,
	perilous: 0,
	eqaura: 0,
	anomaly: 0,
	bbandolier: ["harlequin", null],
	infinitycrown: [
		[255, 200, 37],
		[255, 0, 64],
		[26, 45, 140],
		false,
		true,
		true,
		true,
	],
	infinityaura: [
		[63, 251, 255],
		[255, 255, 255],
		[255, 255, 255],
		false,
		true,
		true,
		true,
		false,
		true,
		true,
	],
	infinityfist: [[122, 10, 250], [65, 65, 65], [78, 255, 0], 0],
	wingsofinfinity: [
		[0, 120, 220],
		[255, 73, 255],
		[0, 120, 220],
		[255, 73, 255],
		[0, 120, 220],
		[255, 73, 255],
		[0, 120, 220],
		[255, 73, 255],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
	],
	riftcape: [[147, 56, 143], [147, 56, 143], true, false, 3],
	riftwings: [[93, 22, 200], [220, 72, 255], true, 0],
	minokawa: [true, true],
	ahool: [true, true],
	celesdragcharm: 0,
	artlevel: [0, 0, 0, 0, 0],
});

/**
 * Normalizes equipped items into [[id, category], ...] tuples.
 * @param {Array} items
 * @returns {Array<[string, string]>}
 */
export function normalizeEquippedTuples(items = []) {
	if (!Array.isArray(items)) return [];
	const tuples = [];
	for (const item of items) {
		if (!item) continue;
		if (Array.isArray(item) && item.length >= 2) {
			tuples.push([String(item[0]), String(item[1])]);
		} else if (typeof item === "object") {
			const id = item.itemID ?? item.id;
			const cat = item.category || item.slot || "Unknown";
			if (id != null) tuples.push([String(id), String(cat)]);
		}
	}
	return tuples;
}

/**
 * Renders avatar composite via gtsetplanner.com.
 *
 * @param {Array} equippedItems
 * @param {object} [opts]
 * @returns {Promise<object>}
 */
export async function renderAvatar(equippedItems = [], opts = {}) {
	const equipped = normalizeEquippedTuples(equippedItems);

	if (opts.offlineMock) {
		return {
			success: true,
			imageBase64: MOCK_PNG_BASE64,
			dataUrl: `data:image/png;base64,${MOCK_PNG_BASE64}`,
			equipped,
			items: equippedItems,
			offline: true,
			metadata: {
				timestamp: new Date().toISOString(),
				dimensions: "992x640",
				itemCount: equipped.length,
			},
		};
	}

	const endpoint = config.render.endpoint;
	const payload = {
		...DEFAULT_RENDER_PAYLOAD,
		equipped,
		expression: opts.expression ?? 0,
		skincolor: opts.skincolor ?? 0,
		customskincolor:
			opts.customskincolor ?? DEFAULT_RENDER_PAYLOAD.customskincolor,
		dyes: opts.dyes ?? DEFAULT_RENDER_PAYLOAD.dyes,
		drops: opts.drops ?? DEFAULT_RENDER_PAYLOAD.drops,
		lenses: opts.lenses ?? DEFAULT_RENDER_PAYLOAD.lenses,
	};

	const payloadStr = JSON.stringify(payload);
	const timeoutMs = opts.timeout || 15000;

	return new Promise((resolve) => {
		const req = https.request(
			endpoint,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(payloadStr),
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					Accept: "application/json, text/plain, */*",
				},
				timeout: timeoutMs,
			},
			(res) => {
				let body = "";
				res.on("data", (c) => {
					body += c;
				});
				res.on("end", () => {
					if (
						res.statusCode &&
						(res.statusCode < 200 || res.statusCode >= 300)
					) {
						return resolve({
							success: false,
							error: `HTTP ${res.statusCode}`,
							imageBase64: MOCK_PNG_BASE64,
							dataUrl: `data:image/png;base64,${MOCK_PNG_BASE64}`,
							equipped,
							items: equippedItems,
							fallback: true,
						});
					}
					try {
						const data = JSON.parse(body);
						const img = data.setimage || MOCK_PNG_BASE64;
						resolve({
							success: true,
							imageBase64: img,
							dataUrl: `data:image/png;base64,${img}`,
							equipped,
							items: data.equippeditems || equippedItems,
							metadata: {
								timestamp: new Date().toISOString(),
								dimensions: "992x640",
								itemCount: equipped.length,
							},
						});
					} catch (err) {
						resolve({
							success: false,
							error: `Parse error: ${err.message}`,
							imageBase64: MOCK_PNG_BASE64,
							dataUrl: `data:image/png;base64,${MOCK_PNG_BASE64}`,
							equipped,
							items: equippedItems,
							fallback: true,
						});
					}
				});
			},
		);

		req.on("timeout", () => {
			req.destroy();
			resolve({
				success: false,
				error: `Timeout ${timeoutMs}ms`,
				imageBase64: MOCK_PNG_BASE64,
				dataUrl: `data:image/png;base64,${MOCK_PNG_BASE64}`,
				equipped,
				items: equippedItems,
				fallback: true,
			});
		});
		req.on("error", (err) => {
			resolve({
				success: false,
				error: err.message,
				imageBase64: MOCK_PNG_BASE64,
				dataUrl: `data:image/png;base64,${MOCK_PNG_BASE64}`,
				equipped,
				items: equippedItems,
				fallback: true,
			});
		});

		req.write(payloadStr);
		req.end();
	});
}

export { MOCK_PNG_BASE64 };
