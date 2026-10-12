/**
 * services/llmClient.js
 * ═══ LAYER 4: Service — LLM HTTP Client ═══
 *
 * Calls local/remote OpenAI-compatible LLM endpoint.
 * Handles timeout, error wrapping, and JSON extraction.
 */

import { config } from "../config/env.js";
import { AppError, ErrorCode } from "../io/AppError.js";

/**
 * Extracts and cleans JSON from LLM response text.
 * @param {string} rawText
 * @returns {object|null}
 */
export function extractJsonFromText(rawText) {
	if (!rawText || typeof rawText !== "string") return null;

	let cleaned = rawText.trim();
	if (cleaned.startsWith("```")) {
		cleaned = cleaned
			.replace(/^```(?:json)?\s*/i, "")
			.replace(/\s*```$/, "")
			.trim();
	}

	try {
		return JSON.parse(cleaned);
	} catch {
		const start = cleaned.indexOf("{");
		const end = cleaned.lastIndexOf("}");
		if (start !== -1 && end > start) {
			try {
				return JSON.parse(cleaned.slice(start, end + 1));
			} catch {
				return null;
			}
		}
		return null;
	}
}

/**
 * Calls the LLM endpoint with system + user messages.
 *
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {string} params.userPrompt
 * @param {object} [params.llmOverride] — Override config.llm partially
 * @returns {Promise<object|null>} Parsed JSON response or null
 * @throws {AppError} On timeout or parse failure (non-fatal, caught upstream)
 */
export async function callLlm({ systemPrompt, userPrompt, llmOverride = {} }) {
	const llm = { ...config.llm, ...llmOverride };

	const payload = {
		model: llm.model,
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		],
		stream: false,
	};

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), llm.timeoutMs);

	try {
		const response = await fetch(llm.endpoint, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${llm.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
			signal: controller.signal,
		});

		clearTimeout(timer);

		if (!response.ok) {
			const errText = await response.text().catch(() => "");
			throw new AppError(
				ErrorCode.LLM_UNREACHABLE,
				`LLM HTTP ${response.status}: ${errText.slice(0, 200)}`,
			);
		}

		const data = await response.json();
		const content = data?.choices?.[0]?.message?.content;

		if (!content) {
			throw new AppError(
				ErrorCode.LLM_PARSE_FAILED,
				"LLM response contained no message content",
			);
		}

		const parsed = extractJsonFromText(content);
		if (!parsed) {
			throw new AppError(
				ErrorCode.LLM_PARSE_FAILED,
				"Failed to parse valid JSON from LLM response",
			);
		}

		return parsed;
	} catch (err) {
		clearTimeout(timer);
		if (err instanceof AppError) throw err;
		if (err.name === "AbortError") {
			throw new AppError(
				ErrorCode.LLM_TIMEOUT,
				`LLM request timed out after ${llm.timeoutMs}ms`,
			);
		}
		// Network error — return null so caller can fallback
		return null;
	}
}
