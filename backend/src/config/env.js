/**
 * config/env.js
 * ═══ LAYER 0: Configuration ═══
 *
 * Loads .env, validates required variables, exports a frozen config object.
 * All other layers import config from here — never from process.env directly.
 *
 * NO credentials are hardcoded. Everything is read from .env.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(ROOT, ".env") });

function env(key, fallback = undefined) {
	const val = process.env[key];
	if (val !== undefined && val !== "") return val;
	if (fallback !== undefined) return fallback;
	throw new Error(`[config] Missing required environment variable: ${key}`);
}

function envInt(key, fallback = undefined) {
	const raw = env(key, fallback !== undefined ? String(fallback) : undefined);
	const num = Number.parseInt(raw, 10);
	if (Number.isNaN(num))
		throw new Error(
			`[config] Environment variable ${key} must be an integer, got: "${raw}"`,
		);
	return num;
}

export const config = Object.freeze({
	server: Object.freeze({
		port: envInt("PORT", 4000),
		nodeEnv: env("NODE_ENV", "development"),
	}),

	firebase: Object.freeze({
		apiKey: env("FIREBASE_API_KEY"),
		authDomain: env("FIREBASE_AUTH_DOMAIN"),
		databaseURL: env("FIREBASE_DATABASE_URL"),
		projectId: env("FIREBASE_PROJECT_ID"),
		storageBucket: env("FIREBASE_STORAGE_BUCKET"),
		messagingSenderId: env("FIREBASE_MESSAGING_SENDER_ID"),
		appId: env("FIREBASE_APP_ID"),
	}),

	mcp: Object.freeze({
		baseUrl: env("MCP_BASE_URL", "http://localhost:3000"),
	}),

	cors: Object.freeze({
		frontendOrigin: env("FRONTEND_ORIGIN", "http://localhost:5173"),
	}),

	root: ROOT,
});

export default config;
