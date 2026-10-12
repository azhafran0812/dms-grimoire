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

	// 404 — Not Found
	ITEM_NOT_FOUND: "ITEM_NOT_FOUND",
	SESSION_NOT_FOUND: "SESSION_NOT_FOUND",

	// 502 — Upstream
	LLM_UNREACHABLE: "LLM_UNREACHABLE",
	LLM_PARSE_FAILED: "LLM_PARSE_FAILED",
	RENDER_FAILED: "RENDER_FAILED",

	// 503 — Service Unavailable
	DB_NOT_LOADED: "DB_NOT_LOADED",
	CLASSIFIER_NOT_READY: "CLASSIFIER_NOT_READY",

	// 504 — Timeout
	LLM_TIMEOUT: "LLM_TIMEOUT",
	RENDER_TIMEOUT: "RENDER_TIMEOUT",

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
	[ErrorCode.ITEM_NOT_FOUND]: 404,
	[ErrorCode.SESSION_NOT_FOUND]: 404,
	[ErrorCode.LLM_UNREACHABLE]: 502,
	[ErrorCode.LLM_PARSE_FAILED]: 502,
	[ErrorCode.RENDER_FAILED]: 502,
	[ErrorCode.DB_NOT_LOADED]: 503,
	[ErrorCode.CLASSIFIER_NOT_READY]: 503,
	[ErrorCode.LLM_TIMEOUT]: 504,
	[ErrorCode.RENDER_TIMEOUT]: 504,
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
