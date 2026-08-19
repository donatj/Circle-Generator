import assert from "node:assert/strict";
import test from "node:test";

import { CircleModes, isCircleFilled } from "../src/Generators/Circle.ts";
import { StateHandler } from "../src/State.ts";

function filledCellCount(width, height, mode) {
	let count = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (isCircleFilled(x, y, width, height, mode)) {
				count++;
			}
		}
	}
	return count;
}

class MemoryStorage {
	values = new Map();

	getItem(key) {
		return this.values.get(key) ?? null;
	}

	setItem(key, value) {
		this.values.set(key, value);
	}
}

test("circle modes produce stable 5x5 cell counts", () => {
	assert.equal(filledCellCount(5, 5, CircleModes.filled), 21);
	assert.equal(filledCellCount(5, 5, CircleModes.thick), 16);
	assert.equal(filledCellCount(5, 5, CircleModes.thin), 12);
	assert.equal(isCircleFilled(0, 0, 5, 5, CircleModes.filled), false);
	assert.equal(isCircleFilled(2, 2, 5, 5, CircleModes.filled), true);
	assert.equal(isCircleFilled(0, 0, 0, 5, CircleModes.filled), false);
	assert.equal(isCircleFilled(0, 0, 5, -1, CircleModes.filled), false);
	assert.equal(isCircleFilled(0, 0, 2.5, 5, CircleModes.filled), false);
});

test("state ignores malformed JSON and preserves defaults", () => {
	const storage = new MemoryStorage();
	storage.setItem("test-state", "not valid JSON");

	const state = new StateHandler(storage, "test-state");
	const circle = state.get("circle", { width: 13, height: 13, force: true });

	assert.deepEqual(circle.getValue(), { width: 13, height: 13, force: true });
});

test("state restores compatible values and saves changes", () => {
	const storage = new MemoryStorage();
	storage.setItem("test-state", JSON.stringify({
		circle: { width: 21, height: "invalid", force: false, unknown: true },
	}));

	const state = new StateHandler(storage, "test-state");
	const circle = state.get("circle", { width: 13, height: 13, force: true });

	assert.deepEqual(circle.getValue(), { width: 21, height: 13, force: false });

	circle.set("height", 9);
	assert.deepEqual(JSON.parse(storage.getItem("test-state")), {
		circle: { width: 21, height: 9, force: false },
	});
});
