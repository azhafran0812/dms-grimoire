/**
 * services/mcpClient.js
 * ═══ LAYER 3: Service — MCP Third-Party API Client ═══
 *
 * HTTP client to call MCP server endpoints.
 * MCP is treated as an external third-party AI service.
 * The frontend NEVER hits MCP directly — only through this backend.
 */

import { config } from "../config/env.js";
import { AppError, ErrorCode } from "../io/AppError.js";

const MCP_TIMEOUT_MS = 180000; // 60s — AI generation can be slow

/**
 * Calls the MCP /api/generate-npc endpoint to generate an NPC via AI.
 *
 * @param {object} params
 * @param {string} params.prompt       — User prompt describing the desired NPC
 * @param {string} [params.type]       — Preset type (e.g. "Mysterious NPC")
 * @param {object} [params.partyContext] — Current party data to inject into AI context
 * @param {boolean} [params.render]    — Whether to render avatar image
 * @returns {Promise<object>} — MCP response envelope { ok, data, error, meta }
 * @throws {AppError} On timeout, network error, or invalid response
 */
export async function generateNpc({ prompt, type = "Mysterious NPC", partyContext = null, render = true, simulate = false }) {
	const url = `${config.mcp.baseUrl}/api/generate-npc`;

	const body = {
		prompt,
		type,
		render,
		simulate,
	};

	// Inject party context if available (Tugas 25: auto-inject party data)
	if (partyContext) {
		body.partyContext = partyContext;
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!response.ok) {
			const errorBody = await response.text().catch(() => "No response body");
			throw new AppError(
				ErrorCode.MCP_UNREACHABLE,
				`MCP returned HTTP ${response.status}: ${errorBody}`,
				{ status: response.status },
			);
		}

		const envelope = await response.json();

		if (!envelope.ok) {
			throw new AppError(
				ErrorCode.MCP_PARSE_FAILED,
				`MCP returned error: ${envelope.error?.message || "Unknown MCP error"}`,
				{ mcpError: envelope.error },
			);
		}

		return envelope;
	} catch (err) {
		if (err instanceof AppError) throw err;

		if (err.name === "AbortError") {
			throw new AppError(
				ErrorCode.MCP_TIMEOUT,
				`MCP request timed out after ${MCP_TIMEOUT_MS}ms`,
			);
		}

		throw new AppError(
			ErrorCode.MCP_UNREACHABLE,
			`Failed to connect to MCP server at ${config.mcp.baseUrl}: ${err.message}`,
			{ originalError: err.message },
		);
	}
}

/**
 * Checks MCP server health.
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
	try {
		const response = await fetch(`${config.mcp.baseUrl}/health`, {
			method: "GET",
			signal: AbortSignal.timeout(5000),
		});
		return response.ok;
	} catch {
		return false;
	}
}

export default { generateNpc, checkHealth };
