/**
 * io/response.js
 * ═══ LAYER 1: Unified I/O — Response Envelope ═══
 *
 * Every API/MCP response flows through this envelope:
 *   { ok: true/false, data, error, meta }
 */

/**
 * Creates a success response envelope.
 *
 * @param {any} data       — Payload data
 * @param {object} [meta]  — Extra metadata (source, duration, etc.)
 * @returns {object}
 */
export function successEnvelope(data, meta = {}) {
	return {
		ok: true,
		data,
		error: null,
		meta: {
			timestamp: new Date().toISOString(),
			...meta,
		},
	};
}

/**
 * Creates an error response envelope.
 *
 * @param {import('./AppError.js').AppError} appError
 * @param {object} [meta]
 * @returns {object}
 */
export function errorEnvelope(appError, meta = {}) {
	return {
		ok: false,
		data: null,
		error: appError.toJSON
			? appError.toJSON()
			: { code: "INTERNAL_ERROR", message: String(appError) },
		meta: {
			timestamp: new Date().toISOString(),
			...meta,
		},
	};
}

/**
 * Sends a success JSON response via Express `res`.
 *
 * @param {import('express').Response} res
 * @param {any} data
 * @param {object} [meta]
 * @param {number} [httpStatus=200]
 */
export function sendSuccess(res, data, meta = {}, httpStatus = 200) {
	return res.status(httpStatus).json(successEnvelope(data, meta));
}

/**
 * Sends an error JSON response via Express `res`.
 *
 * @param {import('express').Response} res
 * @param {import('./AppError.js').AppError} appError
 * @param {object} [meta]
 */
export function sendError(res, appError, meta = {}) {
	const status = appError.httpStatus || 500;
	return res.status(status).json(errorEnvelope(appError, meta));
}

/**
 * Formats a response for MCP tool return (content array).
 *
 * @param {object} envelope — success or error envelope
 * @returns {object} MCP-compatible content response
 */
export function toMcpContent(envelope) {
	if (envelope.ok) {
		return {
			content: [
				{ type: "text", text: formatNpcSummary(envelope.data) },
				{ type: "text", text: JSON.stringify(envelope, null, 2) },
			],
		};
	}
	return {
		content: [
			{
				type: "text",
				text: `❌ Error: [${envelope.error.code}] ${envelope.error.message}`,
			},
		],
		isError: true,
	};
}

/**
 * Formats NPC data into a human-readable markdown summary.
 * @param {object} data
 * @returns {string}
 */
function formatNpcSummary(data) {
	if (!data?.npc) return JSON.stringify(data, null, 2);

	const { npc, avatar, image, source } = data;
	const statsText = `STR ${npc.stats.str} | DEX ${npc.stats.dex} | CON ${npc.stats.con} | INT ${npc.stats.int} | WIS ${npc.stats.wis} | CHA ${npc.stats.cha}`;

	const itemsSummary = avatar?.items
		? avatar.items
				.map((i) => `- [${i.category}] ${i.name} (ID: ${i.itemID})`)
				.join("\n")
		: "(no items)";

	let text =
		`### 📜 Generated D&D Entity: ${npc.name}\n` +
		`*${npc.title}* [${npc.type}]\n\n` +
		`- **Race & Class**: ${npc.race} ${npc.class} (Level ${npc.level})\n` +
		`- **Hit Points (HP)**: ${npc.hp.current} / ${npc.hp.max}\n` +
		`- **Armor Class (AC)**: ${npc.armorClass}\n` +
		`- **Location**: ${npc.location}\n` +
		`- **Disposition**: **${npc.disposition}**\n` +
		`- **Stats**: ${statsText}\n\n` +
		`#### 🎭 Personality & Mannerisms\n${npc.personality}\n\n` +
		`#### 📖 Backstory & Lore\n${npc.lore}\n\n` +
		`#### 🗝️ Secret / Quest Hook\n${npc.secret}\n\n` +
		`#### 👕 Growtopia Avatar Set (${avatar?.theme} / ${avatar?.archetype})\n${itemsSummary}\n\n`;

	if (image?.rendered && image?.dataUrl) {
		text +=
			`#### 🖼️ Avatar Composite Image\n` +
			`- **Status**: Rendered successfully (${image.dimensions})\n` +
			`- **Source**: ${source}\n`;
	}

	return text;
}

export default {
	successEnvelope,
	errorEnvelope,
	sendSuccess,
	sendError,
	toMcpContent,
};
