/**
 * core/statSimulator.js
 * ═══ LAYER 3: Pure Business Logic — D&D Stat Simulator ═══
 *
 * Level-based stat constraints (min/max) so NPCs aren't too OP.
 * Includes combat encounter simulation with dice rolls.
 *
 * ALL functions are PURE — no I/O, no side effects, no randomness.
 * Deterministic stat generation based on class/level/archetype hashing.
 */

// ─── Stat Constraints Per Level ────────────────────────────

/**
 * Level bracket definitions with stat constraints.
 * @readonly
 */
export const LEVEL_BRACKETS = Object.freeze([
	{
		minLevel: 1,
		maxLevel: 2,
		hpRange: [8, 16],
		totalStatRange: [60, 72],
		singleStatMax: 16,
		acRange: [10, 14],
	},
	{
		minLevel: 3,
		maxLevel: 4,
		hpRange: [20, 32],
		totalStatRange: [66, 78],
		singleStatMax: 18,
		acRange: [11, 16],
	},
	{
		minLevel: 5,
		maxLevel: 8,
		hpRange: [30, 55],
		totalStatRange: [72, 84],
		singleStatMax: 19,
		acRange: [12, 17],
	},
	{
		minLevel: 9,
		maxLevel: 12,
		hpRange: [55, 85],
		totalStatRange: [78, 96],
		singleStatMax: 20,
		acRange: [13, 18],
	},
	{
		minLevel: 13,
		maxLevel: 16,
		hpRange: [80, 120],
		totalStatRange: [84, 102],
		singleStatMax: 20,
		acRange: [14, 19],
	},
	{
		minLevel: 17,
		maxLevel: 20,
		hpRange: [100, 160],
		totalStatRange: [90, 108],
		singleStatMax: 20,
		acRange: [15, 20],
	},
]);

/**
 * Class-specific stat priorities (from highest to lowest).
 * @readonly
 */
export const CLASS_STAT_PRIORITY = Object.freeze({
	// Martial
	Fighter: ["str", "con", "dex", "wis", "cha", "int"],
	Barbarian: ["str", "con", "dex", "wis", "cha", "int"],
	Paladin: ["str", "cha", "con", "wis", "dex", "int"],
	Ranger: ["dex", "wis", "con", "str", "int", "cha"],
	Monk: ["dex", "wis", "con", "str", "int", "cha"],
	// Casters
	Wizard: ["int", "con", "dex", "wis", "cha", "str"],
	Sorcerer: ["cha", "con", "dex", "int", "wis", "str"],
	Warlock: ["cha", "con", "wis", "dex", "int", "str"],
	Cleric: ["wis", "con", "str", "cha", "dex", "int"],
	Druid: ["wis", "con", "dex", "int", "cha", "str"],
	Bard: ["cha", "dex", "con", "wis", "int", "str"],
	// Skill
	Rogue: ["dex", "int", "con", "cha", "wis", "str"],
	Artificer: ["int", "con", "dex", "wis", "cha", "str"],
	// Non-combat
	Merchant: ["cha", "wis", "int", "con", "dex", "str"],
	Blacksmith: ["str", "con", "dex", "int", "wis", "cha"],
	Adventurer: ["dex", "con", "str", "wis", "int", "cha"],
});

const DEFAULT_PRIORITY = ["str", "dex", "con", "int", "wis", "cha"];
const STAT_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

// ─── Deterministic Hash ────────────────────────────────────

/**
 * Deterministic integer hash from a string (djb2).
 * @param {string} str
 * @returns {number}
 */
function deterministicHash(str) {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) + hash + str.charCodeAt(i);
		hash = hash & 0x7fffffff;
	}
	return hash;
}

/**
 * Produces a deterministic value within [min, max] using a seed hash.
 * @param {number} seed
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function seededRange(seed, min, max) {
	return min + (Math.abs(seed) % (max - min + 1));
}

// ─── Core Functions ────────────────────────────────────────

/**
 * Gets the level bracket for a given level.
 *
 * @param {number} level — 1 to 20
 * @returns {object} Bracket config
 */
export function getBracket(level) {
	const lvl = Math.max(1, Math.min(20, level));
	return (
		LEVEL_BRACKETS.find((b) => lvl >= b.minLevel && lvl <= b.maxLevel) ||
		LEVEL_BRACKETS[0]
	);
}

/**
 * Generates balanced stats for an NPC based on class and level.
 * Deterministic — same input always produces same output.
 *
 * @param {object} params
 * @param {string} params.name     — NPC name (used as seed)
 * @param {string} params.className — D&D class name
 * @param {number} params.level    — Character level (1-20)
 * @returns {{ stats: object, hp: { current: number, max: number }, armorClass: number, bracket: object }}
 */
export function generateBalancedStats({ name, className, level }) {
	const bracket = getBracket(level);
	const priority = CLASS_STAT_PRIORITY[className] || DEFAULT_PRIORITY;
	const seed = deterministicHash(`${name}:${className}:${level}`);

	// Calculate total stat pool within bracket range
	const totalPool = seededRange(
		seed,
		bracket.totalStatRange[0],
		bracket.totalStatRange[1],
	);

	// Distribute stats according to class priority
	const stats = {};
	let remaining = totalPool;
	const minStat = 8;

	for (let i = 0; i < priority.length; i++) {
		const statKey = priority[i];
		const statSeed = deterministicHash(`${seed}:${statKey}:${i}`);

		if (i === priority.length - 1) {
			// Last stat gets whatever remains, clamped
			stats[statKey] = Math.max(
				minStat,
				Math.min(bracket.singleStatMax, remaining),
			);
		} else {
			// Higher priority stats get larger share
			const priorityBonus = Math.max(0, 3 - i); // +3, +2, +1, 0, 0, 0
			const base = minStat + priorityBonus;
			const maxForThis = Math.min(
				bracket.singleStatMax,
				remaining - (priority.length - i - 1) * minStat,
			);
			const value = seededRange(statSeed, base, Math.max(base, maxForThis));
			stats[statKey] = value;
			remaining -= value;
		}
	}

	// HP based on level and CON modifier
	const conMod = Math.floor((stats.con - 10) / 2);
	const hpSeed = deterministicHash(`${seed}:hp`);
	const baseHp = seededRange(hpSeed, bracket.hpRange[0], bracket.hpRange[1]);
	const hpMax = Math.max(bracket.hpRange[0], baseHp + conMod * level);
	const hpClamped = Math.max(
		bracket.hpRange[0],
		Math.min(bracket.hpRange[1], hpMax),
	);

	// AC
	const acSeed = deterministicHash(`${seed}:ac`);
	const armorClass = seededRange(
		acSeed,
		bracket.acRange[0],
		bracket.acRange[1],
	);

	return {
		stats,
		hp: { current: hpClamped, max: hpClamped },
		armorClass,
		bracket: {
			level,
			hpRange: bracket.hpRange,
			totalStatRange: bracket.totalStatRange,
			singleStatMax: bracket.singleStatMax,
			acRange: bracket.acRange,
		},
	};
}

/**
 * Validates stats against level bracket constraints.
 *
 * @param {object} params
 * @param {number} params.level
 * @param {object} params.stats  — { str, dex, con, int, wis, cha }
 * @param {{ current: number, max: number }} params.hp
 * @param {number} params.armorClass
 * @returns {{ valid: boolean, warnings: string[], adjustedStats?: object, adjustedHp?: object }}
 */
export function validateStats({ level, stats, hp, armorClass }) {
	const bracket = getBracket(level);
	const warnings = [];
	const adjusted = { ...stats };
	let adjustedHp = { ...hp };

	// Check individual stat caps
	for (const key of STAT_KEYS) {
		const val = Number(stats[key]) || 10;
		if (val > bracket.singleStatMax) {
			warnings.push(
				`${key.toUpperCase()} ${val} exceeds max ${bracket.singleStatMax} for level ${level} → clamped`,
			);
			adjusted[key] = bracket.singleStatMax;
		}
		if (val < 3) {
			warnings.push(`${key.toUpperCase()} ${val} below minimum 3 → raised`);
			adjusted[key] = 8;
		}
	}

	// Check total stat pool
	const total = STAT_KEYS.reduce((sum, k) => sum + (adjusted[k] || 10), 0);
	if (total > bracket.totalStatRange[1]) {
		warnings.push(
			`Total stats ${total} exceeds max ${bracket.totalStatRange[1]} for level ${level}`,
		);
	}
	if (total < bracket.totalStatRange[0]) {
		warnings.push(
			`Total stats ${total} below min ${bracket.totalStatRange[0]} for level ${level}`,
		);
	}

	// Validate Armor Class
	if (armorClass !== undefined) {
		if (armorClass > bracket.acRange[1]) {
			warnings.push(
				`AC ${armorClass} exceeds max ${bracket.acRange[1]} for level ${level}`,
			);
		} else if (armorClass < bracket.acRange[0]) {
			warnings.push(
				`AC ${armorClass} below min ${bracket.acRange[0]} for level ${level}`,
			);
		}
	}

	// Check HP
	if (hp.max > bracket.hpRange[1]) {
		warnings.push(
			`HP max ${hp.max} exceeds bracket max ${bracket.hpRange[1]} → clamped`,
		);
		adjustedHp = { current: bracket.hpRange[1], max: bracket.hpRange[1] };
	}
	if (hp.max < bracket.hpRange[0]) {
		warnings.push(
			`HP max ${hp.max} below bracket min ${bracket.hpRange[0]} → raised`,
		);
		adjustedHp = { current: bracket.hpRange[0], max: bracket.hpRange[0] };
	}

	return {
		valid: warnings.length === 0,
		warnings,
		adjustedStats: adjusted,
		adjustedHp,
	};
}

// ─── Combat Simulation ─────────────────────────────────────

/**
 * Calculates ability modifier from stat value.
 * @param {number} stat
 * @returns {number}
 */
export function abilityModifier(stat) {
	return Math.floor((stat - 10) / 2);
}

/**
 * Simulates a single combat encounter turn.
 * Deterministic based on seed.
 *
 * @param {object} params
 * @param {object} params.attacker — { name, stats, level }
 * @param {object} params.defender — { name, stats, hp, armorClass }
 * @param {string} [params.seed]  — Deterministic seed
 * @returns {object} Turn result
 */
export function simulateTurn({ attacker, defender, seed = "turn" }) {
	const atkSeed = deterministicHash(`${seed}:atk:${attacker.name}`);
	const dmgSeed = deterministicHash(`${seed}:dmg:${attacker.name}`);

	// Determine primary attack stat
	const atkMod = Math.max(
		abilityModifier(attacker.stats.str),
		abilityModifier(attacker.stats.dex),
	);
	const profBonus = Math.ceil(attacker.level / 4) + 1;

	// D20 attack roll
	const d20 = seededRange(atkSeed, 1, 20);
	const attackRoll = d20 + atkMod + profBonus;
	const isCrit = d20 === 20;
	const isHit = isCrit || attackRoll >= defender.armorClass;

	// Damage (1d8 + modifier)
	let damage = 0;
	if (isHit) {
		const baseDmg = seededRange(dmgSeed, 1, 8);
		damage = baseDmg + atkMod;
		if (isCrit) damage = damage * 2;
		damage = Math.max(1, damage);
	}

	const remainingHp = Math.max(0, defender.hp.current - damage);

	return {
		attacker: attacker.name,
		defender: defender.name,
		d20Roll: d20,
		attackRoll,
		targetAC: defender.armorClass,
		hit: isHit,
		critical: isCrit,
		damage,
		defenderHpBefore: defender.hp.current,
		defenderHpAfter: remainingHp,
		defenderDown: remainingHp <= 0,
	};
}

/**
 * Runs a full combat simulation for N rounds.
 *
 * @param {object} params
 * @param {object} params.combatantA — Full NPC-like object
 * @param {object} params.combatantB — Full NPC-like object
 * @param {number} [params.maxRounds=10]
 * @returns {object} Full simulation log
 */
export function simulateCombat({ combatantA, combatantB, maxRounds = 10 }) {
	const aHp = { current: combatantA.hp.max, max: combatantA.hp.max };
	const bHp = { current: combatantB.hp.max, max: combatantB.hp.max };
	const log = [];

	for (let round = 1; round <= maxRounds; round++) {
		// A attacks B
		const turnA = simulateTurn({
			attacker: combatantA,
			defender: { ...combatantB, hp: bHp },
			seed: `r${round}:a`,
		});
		bHp.current = turnA.defenderHpAfter;
		log.push({ round, ...turnA });

		if (bHp.current <= 0) break;

		// B attacks A
		const turnB = simulateTurn({
			attacker: combatantB,
			defender: { ...combatantA, hp: aHp },
			seed: `r${round}:b`,
		});
		aHp.current = turnB.defenderHpAfter;
		log.push({ round, ...turnB });

		if (aHp.current <= 0) break;
	}

	const winner =
		aHp.current > 0
			? combatantA.name
			: bHp.current > 0
				? combatantB.name
				: "Draw";

	return {
		combatants: {
			a: { name: combatantA.name, finalHp: aHp },
			b: { name: combatantB.name, finalHp: bHp },
		},
		rounds: Math.ceil(log.length / 2),
		winner,
		log,
	};
}

export default {
	LEVEL_BRACKETS,
	CLASS_STAT_PRIORITY,
	getBracket,
	generateBalancedStats,
	validateStats,
	abilityModifier,
	simulateTurn,
	simulateCombat,
};
