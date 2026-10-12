import test from "node:test";
import assert from "node:assert/strict";
import { ThemeClassifier } from "../src/core/themeClassifier.js";
import { ItemDatabase } from "../src/database/itemDatabase.js";
import {
	SPECIALIST_AGENTS,
	selectSpecialistAgent,
	agenticGenerate,
} from "../src/services/agent/agentOrchestrator.js";
import { config } from "../src/config/env.js";

test("SPECIALIST AGENT ROUTING: selects Agricultural Rancher for 'peternak sapi'", () => {
	const agent = selectSpecialistAgent("peternak sapi");
	assert.equal(agent.id, "agricultural_rancher_agent");
	assert.equal(agent.archetype, "farmer_rancher");
	assert.equal(agent.defaultRace, "Human");
	assert.ok(
		agent.rules.some((r) => r.includes("CRITICAL: The subject is a HUMAN farmer/rancher")),
	);
});

test("SPECIALIST AGENT ROUTING: distinguishes 'manusia sapi' (beast) from 'peternak sapi' (human)", () => {
	const beastAgent = selectSpecialistAgent("manusia sapi");
	assert.equal(beastAgent.id, "primal_beast_agent");

	const rancherAgent = selectSpecialistAgent("peternak sapi");
	assert.equal(rancherAgent.id, "agricultural_rancher_agent");

	const farmerAgent = selectSpecialistAgent("petani ladang dan kebun");
	assert.equal(farmerAgent.id, "agricultural_rancher_agent");
});

test("AGENTIC PIPELINE: 'peternak sapi' produces human rancher with calf leash and NO cow mask", async () => {
	const itemDb = new ItemDatabase(config.database);
	await itemDb.init({ offlineOnly: true }).catch(async () => {
		await itemDb.init();
	});

	const classifier = new ThemeClassifier();
	classifier.classifyAll(itemDb.getAllItems());

	const result = await agenticGenerate({
		prompt: "peternak sapi",
		render: false,
		simulate: false,
		classifier,
		itemDb,
	});

	assert.equal(result.ok, true);
	// Specialist agent check
	assert.equal(result.selectedAgent.id, "agricultural_rancher_agent");
	assert.equal(result.selectedAgent.archetype, "farmer_rancher");

	// Step 1 check in agentSteps
	const step1 = result.agentSteps.find((s) => s.step === 1);
	assert.ok(step1);
	assert.equal(step1.name, "select_specialist_agent");
	assert.equal(step1.agentId, "agricultural_rancher_agent");

	// NPC identity check
	assert.equal(result.npc.race, "Human");
	assert.ok(
		["Commoner", "Rancher", "Farmer"].includes(result.npc.class),
		`Expected class to be agricultural/commoner, got ${result.npc.class}`,
	);
	assert.equal(result.avatar.archetype, "farmer_rancher");

	// Item check: Must NOT equip cow mask
	const equippedItems = result.avatar.items;
	const hairItem = equippedItems.find((i) => i.category === "Hair");
	const hatItem = equippedItems.find((i) => i.category === "Hat");
	const handItem = equippedItems.find((i) => i.category === "Hand");

	const itemNames = equippedItems.map((i) => i.name.toLowerCase());
	assert.ok(
		!itemNames.includes("cow mask"),
		"Avatar must NOT equip 'cow mask' on a human farmer/rancher",
	);

	// Hair must not be animal mask
	if (hairItem) {
		assert.ok(
			!hairItem.name.toLowerCase().includes("mask"),
			`Hair item '${hairItem.name}' should be human hair, not a mask`,
		);
	}

	// Hand item should be calf leash (the animal companion)
	if (handItem) {
		assert.equal(
			handItem.name.toLowerCase(),
			"calf leash",
			"Hand item should be calf leash for a cow rancher",
		);
	}

	// Slot Optionality: Back slot (wings/capes) must NOT be forced on a simple rancher
	const backItem = equippedItems.find((i) => i.category === "Back");
	assert.equal(
		backItem,
		undefined,
		"Back slot should remain optional/null (no forced wings/capes on a rancher)",
	);

	// Slot Optionality: Pants must NOT be forced when wearing overalls (full-body shirt)
	const pantsItem = equippedItems.find((i) => i.category === "Pants");
	assert.equal(
		pantsItem,
		undefined,
		"Pants slot should remain optional/null when overalls are worn",
	);
});

test("SLOT OPTIONALITY & NO RANDOM FILL: unselected slots remain clean and unequipped", async () => {
	const itemDb = new ItemDatabase(config.database);
	await itemDb.init({ offlineOnly: true }).catch(async () => {
		await itemDb.init();
	});

	const classifier = new ThemeClassifier();
	classifier.classifyAll(itemDb.getAllItems());

	const result = await agenticGenerate({
		prompt: "peternak sapi",
		render: false,
		simulate: false,
		classifier,
		itemDb,
	});

	// Check total equipped items: should NOT blindly fill all 8 slots!
	const equippedSlots = result.avatar.items.map((i) => i.category);
	assert.ok(
		equippedSlots.length < 8,
		`Avatar should have uncluttered silhouette (< 8 slots), got ${equippedSlots.length} slots: ${equippedSlots.join(", ")}`,
	);
});
