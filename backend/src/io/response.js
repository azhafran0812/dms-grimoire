/**
 * io/response.js
 * ═══ LAYER 1: Unified I/O — Response Envelope ═══
 *
 * Every API response flows through this envelope:
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

export default { successEnvelope, errorEnvelope, sendSuccess, sendError };
