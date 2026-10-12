/**
 * io/request.js
 * ═══ LAYER 1: Unified I/O — Request Validation ═══
 *
 * Zod-based schemas and parser for all incoming requests.
 * Every controller calls parseRequest() before processing.
 */

import { z } from "zod";
import { AppError, ErrorCode } from "./AppError.js";

// ─── Schemas ───────────────────────────────────────────────

export const GenerateNpcSchema = z.object({
	prompt: z
		.string({ required_error: 'Field "prompt" is required' })
		.min(1, "Prompt must not be empty")
		.max(2000, "Prompt exceeds 2000 character limit")
		.transform((s) => s.trim()),
	type: z
		.enum(["Mysterious NPC", "Story twist", "Location lore", "Magic item"])
		.default("Mysterious NPC"),
	partyContext: z.union([z.string(), z.record(z.any())]).optional(),
	render: z.boolean().default(true),
});

export const SessionIdSchema = z.object({
	sessionId: z
		.string()
		.min(1)
		.max(128)
		.regex(/^[a-zA-Z0-9_.-]+$/, "Invalid sessionId format"),
});

// ─── Parser ────────────────────────────────────────────────

/**
 * Validates input data against a Zod schema.
 * Throws AppError(VALIDATION_FAILED) on failure.
 *
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {any} data
 * @returns {T} Validated and transformed data
 * @throws {AppError}
 */
export function parseRequest(schema, data) {
	const result = schema.safeParse(data);
	if (!result.success) {
		const issues = result.error.issues.map((i) => ({
			path: i.path.join("."),
			message: i.message,
		}));
		throw new AppError(
			ErrorCode.VALIDATION_FAILED,
			`Request validation failed: ${issues.map((i) => i.message).join("; ")}`,
			{ issues },
		);
	}
	return result.data;
}

export default { GenerateNpcSchema, SessionIdSchema, parseRequest };
