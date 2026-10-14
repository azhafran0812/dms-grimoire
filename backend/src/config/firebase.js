/**
 * config/firebase.js
 * ═══ LAYER 0: Configuration — Firebase Client SDK ═══
 *
 * Initializes Firebase Client SDK using credentials from .env (via config).
 * NO credentials are hardcoded — all read from environment variables.
 */

import { initializeApp } from "firebase/app";
import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	sendEmailVerification,
	signOut,
} from "firebase/auth";
import {
	getDatabase,
	ref,
	get,
	set,
	push,
	update,
	remove,
	onValue,
} from "firebase/database";
import { config } from "./env.js";

// ── Firebase Config from .env ──
const firebaseConfig = {
	apiKey: config.firebase.apiKey,
	authDomain: config.firebase.authDomain,
	databaseURL: config.firebase.databaseURL,
	projectId: config.firebase.projectId,
	storageBucket: config.firebase.storageBucket,
	messagingSenderId: config.firebase.messagingSenderId,
	appId: config.firebase.appId,
};

// ── Initialize ──
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

console.log(
	`[Firebase] Initialized with Client SDK (project: ${config.firebase.projectId})`,
);

// ── Auth Helpers ──────────────────────────────────────────

/**
 * Register a new user + send email verification.
 * @param {string} email
 * @param {string} password
 * @param {string} role — "dm" or "player"
 * @returns {Promise<object>}
 */
export async function registerUser(email, password, role) {
	const userCredential = await createUserWithEmailAndPassword(
		auth,
		email,
		password,
	);
	const user = userCredential.user;

	// Send email verification (Webmailer — Tugas 7)
	await sendEmailVerification(user);

	// Save user profile + role to Realtime Database
	await set(ref(db, `users/${user.uid}`), {
		email: user.email,
		role,
		createdAt: Date.now(),
	});

	return {
		uid: user.uid,
		email: user.email,
		role,
		emailVerified: user.emailVerified,
		message: `Registrasi berhasil sebagai ${role.toUpperCase()}! Silakan cek kotak masuk email untuk verifikasi.`,
	};
}

/**
 * Login user and return user data with role.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>}
 */
export async function loginUser(email, password) {
	const userCredential = await signInWithEmailAndPassword(
		auth,
		email,
		password,
	);
	const user = userCredential.user;

	// Gatekeeper: block unverified email (Tugas 8)
	if (!user.emailVerified) {
		throw new Error(
			"Email belum diverifikasi. Silakan cek kotak masuk email Anda.",
		);
	}

	// Get user role from database
	const snapshot = await get(ref(db, `users/${user.uid}`));
	const userData = snapshot.exists() ? snapshot.val() : { role: "player" };

	// Get ID token for frontend to use
	const idToken = await user.getIdToken();

	return {
		uid: user.uid,
		email: user.email,
		role: userData.role,
		emailVerified: user.emailVerified,
		idToken,
	};
}

/**
 * Logout current user.
 */
export async function logoutUser() {
	await signOut(auth);
}

/**
 * Verify a Firebase ID token via Google's public REST API.
 * Works WITHOUT Admin SDK / service account.
 *
 * @param {string} idToken — Firebase ID token from client
 * @returns {Promise<object>} — Decoded token payload
 */
export async function verifyIdToken(idToken) {
	const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${config.firebase.apiKey}`;

	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken }),
	});

	if (!response.ok) {
		const errBody = await response.json().catch(() => ({}));
		throw new Error(errBody?.error?.message || "Invalid or expired token");
	}

	const data = await response.json();
	const user = data.users?.[0];

	if (!user) {
		throw new Error("Token valid but user data not found");
	}

	return {
		uid: user.localId,
		email: user.email,
		emailVerified: user.emailVerified || false,
		displayName: user.displayName || null,
	};
}

// ── Database Helpers (re-export for Models) ───────────────

export { app, auth, db, ref, get, set, push, update, remove, onValue };

export default {
	app,
	auth,
	db,
	registerUser,
	loginUser,
	logoutUser,
	verifyIdToken,
};
