/**
 * database/crypto.js
 * ═══ LAYER 2: Data Access — XOR Decryption ═══
 *
 * Rotating byte-by-byte XOR stream decryption for gtsetplanner data.
 */

/**
 * Decrypts (or encrypts) data using rotating XOR key.
 *
 * @param {string|Buffer|Uint8Array} data — Ciphertext or plaintext
 * @param {string} key — Decryption key
 * @returns {Buffer} Decrypted raw byte buffer
 */
export function xorCrypt(data, key) {
	if (!data) return Buffer.alloc(0);

	const dataBuffer = Buffer.isBuffer(data)
		? data
		: data instanceof Uint8Array
			? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
			: Buffer.from(String(data), "utf8");

	const keyBuffer = Buffer.from(String(key || ""), "utf8");
	if (keyBuffer.length === 0) return Buffer.from(dataBuffer);

	const result = Buffer.alloc(dataBuffer.length);
	for (let i = 0; i < dataBuffer.length; i++) {
		result[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
	}

	return result;
}

/**
 * Decrypts data using XOR key and returns UTF-8 string.
 *
 * @param {string|Buffer|Uint8Array} data
 * @param {string} key
 * @returns {string}
 */
export function xorDecrypt(data, key) {
	return xorCrypt(data, key).toString("utf8");
}

/**
 * Decrypts XOR encrypted JSON payload and parses into JS object.
 *
 * @param {string|Buffer|Uint8Array} data
 * @param {string} key
 * @returns {any}
 */
export function decryptJson(data, key) {
	const decryptedString = xorDecrypt(data, key);
	try {
		return JSON.parse(decryptedString);
	} catch (err) {
		throw new Error(`Failed to parse decrypted JSON payload: ${err.message}`);
	}
}
