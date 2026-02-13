/**
 * Unit Tests for Display Module
 * Tests the formatDuration function
 */

import { strict } from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDuration } from "../../src/utils/display.js";

describe("Formatters Module", () => {
	describe("formatDuration", () => {
		it('should format milliseconds as "ms" for values < 1000', () => {
			strict.equal(formatDuration(500), "500ms");
			strict.equal(formatDuration(999), "999ms");
			strict.equal(formatDuration(1), "1ms");
		});

		it('should format seconds as "s" for values >= 1000 and < 60000', () => {
			strict.equal(formatDuration(1000), "1s");
			strict.equal(formatDuration(5000), "5s");
			strict.equal(formatDuration(59000), "59s");
		});

		it("should format minutes and seconds for values >= 60000", () => {
			strict.equal(formatDuration(60000), "1m 0s");
			strict.equal(formatDuration(60000), "1m 0s");
			strict.equal(formatDuration(120000), "2m 0s");
			strict.equal(formatDuration(3661000), "61m 1s");
		});
	});
});
