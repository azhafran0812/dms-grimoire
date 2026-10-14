/**
 * io/AppError.js
 * ═══ LAYER 1: Unified I/O — Error Class ═══
 *
 * Custom application error class with structured error codes.
 * Every thrown error in the app should be an AppError or wrapped into one.
 */

/**
 * Enum of all application error codes.
 * @readonly
 */
export const ErrorCode = Object.freeze({
	// 400 — Client
	VALIDATION_FAILED: "VALIDATION_FAILED",
	MISSING_FIELD: "MISSING_FIELD",
	INVALID_INPUT: "INVALID_INPUT",

	// 401 — Unauthorized
	AUTH_REQUIRED: "AUTH_REQUIRED",
	AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
	AUTH_EMAIL_NOT_VERIFIED: "AUTH_EMAIL_NOT_VERIFIED",

	// 403 — Forbidden
	AUTH_FORBIDDEN: "AUTH_FORBIDDEN",

	// 404 — Not Found
	CHARACTER_NOT_FOUND: "CHARACTER_NOT_FOUND",
	INVENTORY_ITEM_NOT_FOUND: "INVENTORY_ITEM_NOT_FOUND",
	NPC_NOT_FOUND: "NPC_NOT_FOUND",
	USER_NOT_FOUND: "USER_NOT_FOUND",

	// 409 — Conflict
	ALREADY_EXISTS: "ALREADY_EXISTS",

	// 502 — Upstream
	MCP_UNREACHABLE: "MCP_UNREACHABLE",
	MCP_PARSE_FAILED: "MCP_PARSE_FAILED",
	FIREBASE_ERROR: "FIREBASE_ERROR",

	// 504 — Timeout
	MCP_TIMEOUT: "MCP_TIMEOUT",

	// 500 — Internal
	INTERNAL_ERROR: "INTERNAL_ERROR",
});

/**
 * Maps error codes to default HTTP status codes.
 * @readonly
 */
const CODE_TO_HTTP = Object.freeze({
	[ErrorCode.VALIDATION_FAILED]: 400,
	[ErrorCode.MISSING_FIELD]: 400,
	[ErrorCode.INVALID_INPUT]: 400,
	[ErrorCode.AUTH_REQUIRED]: 401,
	[ErrorCode.AUTH_INVALID_TOKEN]: 401,
	[ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 403,
	[ErrorCode.AUTH_FORBIDDEN]: 403,
	[ErrorCode.CHARACTER_NOT_FOUND]: 404,
	[ErrorCode.INVENTORY_ITEM_NOT_FOUND]: 404,
	[ErrorCode.NPC_NOT_FOUND]: 404,
	[ErrorCode.USER_NOT_FOUND]: 404,
	[ErrorCode.ALREADY_EXISTS]: 409,
	[ErrorCode.MCP_UNREACHABLE]: 502,
	[ErrorCode.MCP_PARSE_FAILED]: 502,
	[ErrorCode.FIREBASE_ERROR]: 502,
	[ErrorCode.MCP_TIMEOUT]: 504,
	[ErrorCode.INTERNAL_ERROR]: 500,
});

export class AppError extends Error {
	/**
	 * @param {string} code    — One of ErrorCode values
	 * @param {string} message — Human-readable description
	 * @param {object} [details] — Additional context (safe to serialize)
	 */
	constructor(code, message, details = {}) {
		super(message);
		this.name = "AppError";
		this.code = code;
		this.httpStatus = CODE_TO_HTTP[code] || 500;
		this.details = details;
		this.timestamp = new Date().toISOString();
	}

	/**
	 * Serializes for API response.
	 * @returns {object}
	 */
	toJSON() {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
			timestamp: this.timestamp,
		};
	}

	/**
	 * Wraps any unknown error into an AppError.
	 * If already an AppError, returns it unchanged.
	 * @param {Error|any} err
	 * @returns {AppError}
	 */
	static from(err) {
		if (err instanceof AppError) return err;
		return new AppError(
			ErrorCode.INTERNAL_ERROR,
			err?.message || "An unexpected error occurred",
			{ originalName: err?.name, stack: err?.stack },
		);
	}
}

export default AppError;
