/**
 * controllers/authController.js
 * ═══ LAYER 4: Controller — Authentication ═══
 *
 * Handles:
 *   1. Auth Middleware — verifies Firebase ID tokens on protected routes
 *   2. Auth Endpoints — register, login, logout (proxied through backend)
 *
 * Flow:
 *   Frontend sends email/password → Backend authenticates via Firebase Auth
 *   Backend returns ID token → Frontend stores token for subsequent requests
 *   Frontend sends Bearer token → Backend verifies via Google REST API
 */

import { registerUser, loginUser, logoutUser, verifyIdToken } from "../config/firebase.js";
import { AppError, ErrorCode } from "../io/AppError.js";
import { sendSuccess } from "../io/response.js";
import { parseRequest } from "../io/request.js";
import { z } from "zod";

// ─── Schemas ───────────────────────────────────────────────

const RegisterSchema = z.object({
	email: z.string().email("Email tidak valid"),
	password: z.string().min(6, "Password minimal 6 karakter").max(128),
	role: z.enum(["dm", "player"]).default("player"),
});

const LoginSchema = z.object({
	email: z.string().email("Email tidak valid"),
	password: z.string().min(1, "Password wajib diisi"),
});

// ─── Auth Middleware ───────────────────────────────────────

/**
 * Express middleware: verifies Firebase ID token from Authorization header.
 * Attaches decoded user info to req.user.
 *
 * Usage: app.get('/api/protected', authMiddleware, myController)
 */
export async function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return next(
			new AppError(
				ErrorCode.AUTH_REQUIRED,
				"Authorization header with Bearer token is required",
			),
		);
	}

	const idToken = authHeader.split("Bearer ")[1];

	try {
		const decoded = await verifyIdToken(idToken);

		// Gatekeeper: block unverified emails (Tugas 8)
		if (!decoded.emailVerified) {
			return next(
				new AppError(
					ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
					"Email belum diverifikasi. Silakan cek kotak masuk email Anda.",
				),
			);
		}

		req.user = {
			uid: decoded.uid,
			email: decoded.email,
			emailVerified: decoded.emailVerified,
		};

		next();
	} catch (err) {
		return next(
			new AppError(
				ErrorCode.AUTH_INVALID_TOKEN,
				`Token autentikasi tidak valid: ${err.message}`,
			),
		);
	}
}

/**
 * Optional auth middleware — does not block if no token is present.
 */
export async function optionalAuthMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		req.user = null;
		return next();
	}

	try {
		const idToken = authHeader.split("Bearer ")[1];
		const decoded = await verifyIdToken(idToken);
		req.user = {
			uid: decoded.uid,
			email: decoded.email,
			emailVerified: decoded.emailVerified,
		};
	} catch {
		req.user = null;
	}
	next();
}

// ─── Auth Endpoints ───────────────────────────────────────

/**
 * POST /api/auth/register — Register new user (Player or DM)
 * Also sends email verification (Webmailer — Tugas 7)
 */
export async function handleRegister(req, res) {
	const { email, password, role } = parseRequest(RegisterSchema, req.body);

	try {
		const result = await registerUser(email, password, role);
		sendSuccess(res, result, { action: "auth.register" }, 201);
	} catch (err) {
		// Firebase Auth error messages
		const msg = err.message || "";
		if (msg.includes("email-already-in-use")) {
			throw new AppError(ErrorCode.ALREADY_EXISTS, "Email sudah terdaftar. Silakan gunakan email lain atau login.");
		}
		if (msg.includes("weak-password")) {
			throw new AppError(ErrorCode.VALIDATION_FAILED, "Password terlalu lemah. Gunakan minimal 6 karakter.");
		}
		if (msg.includes("invalid-email")) {
			throw new AppError(ErrorCode.VALIDATION_FAILED, "Format email tidak valid.");
		}
		throw new AppError(ErrorCode.FIREBASE_ERROR, `Registrasi gagal: ${msg}`);
	}
}

/**
 * POST /api/auth/login — Login and receive ID token
 * Blocks unverified emails (Gatekeeper — Tugas 8)
 */
export async function handleLogin(req, res) {
	const { email, password } = parseRequest(LoginSchema, req.body);

	try {
		const result = await loginUser(email, password);
		sendSuccess(res, result, { action: "auth.login" });
	} catch (err) {
		const msg = err.message || "";
		if (msg.includes("belum diverifikasi")) {
			throw new AppError(ErrorCode.AUTH_EMAIL_NOT_VERIFIED, msg);
		}
		if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
			throw new AppError(ErrorCode.AUTH_INVALID_TOKEN, "Email atau password salah.");
		}
		throw new AppError(ErrorCode.FIREBASE_ERROR, `Login gagal: ${msg}`);
	}
}

/**
 * POST /api/auth/logout — Logout current user
 */
export async function handleLogout(req, res) {
	try {
		await logoutUser();
		sendSuccess(res, { message: "Berhasil logout" }, { action: "auth.logout" });
	} catch (err) {
		throw new AppError(ErrorCode.FIREBASE_ERROR, `Logout gagal: ${err.message}`);
	}
}

export default {
	authMiddleware,
	optionalAuthMiddleware,
	handleRegister,
	handleLogin,
	handleLogout,
};
