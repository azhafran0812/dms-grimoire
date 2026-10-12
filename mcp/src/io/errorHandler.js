/**
 * io/errorHandler.js
 * ═══ LAYER 1: Unified I/O — Global Error Handler ═══
 *
 * Express error-handling middleware and MCP error wrapper.
 * Catches any unhandled error, wraps it in AppError, and sends unified response.
 */

import { AppError } from "./AppError.js";
import { sendError } from "./response.js";

/**
 * Express error-handling middleware.
 * Must be registered AFTER all routes: app.use(expressErrorHandler)
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function expressErrorHandler(err, req, res, _next) {
	const appError = AppError.from(err);

	// Log in development
	if (process.env.NODE_ENV !== "production") {
		console.error(`[ErrorHandler] ${appError.code}: ${appError.message}`);
		if (appError.details?.stack) {
			console.error(appError.details.stack);
		}
	}

	sendError(res, appError, {
		path: req.originalUrl,
		method: req.method,
	});
}

/**
 * Wraps an async Express route handler with automatic error catching.
 * Usage: app.post('/api/foo', asyncWrap(myController))
 *
 * @param {Function} fn — async (req, res, next) => ...
 * @returns {Function}
 */
export function asyncWrap(fn) {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

/**
 * Wraps an MCP tool handler with error catching.
 * Returns MCP-formatted error content instead of throwing.
 *
 * @param {Function} fn — async (args) => { content: [...] }
 * @returns {Function}
 */
export function mcpToolWrap(fn) {
	return async (args) => {
		try {
			return await fn(args);
		} catch (err) {
			const appError = AppError.from(err);
			console.error(`[MCP Tool Error] ${appError.code}: ${appError.message}`);
			return {
				content: [
					{
						type: "text",
						text: `❌ Error [${appError.code}]: ${appError.message}\n\n${JSON.stringify(appError.details, null, 2)}`,
					},
				],
				isError: true,
			};
		}
	};
}

export default { expressErrorHandler, asyncWrap, mcpToolWrap };
