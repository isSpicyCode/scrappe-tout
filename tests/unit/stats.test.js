/**
 * Unit Tests for Stats Module
 * Tests statistics generation and display
 */

import { strict } from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStats } from "../../src/utils/stats.js";

describe("Stats Module", () => {
	describe("generateStats", () => {
		it("should calculate stats for all successful results", () => {
			const results = [
				{
					success: true,
					scraped: { duration: 100 },
					converted: { duration: 50 },
					written: { skipped: false },
					totalDuration: 150,
				},
				{
					success: true,
					scraped: { duration: 200 },
					converted: { duration: 80 },
					written: { skipped: false },
					totalDuration: 280,
				},
			];

			const stats = generateStats(results);

			strict.equal(stats.total, 2);
			strict.equal(stats.successful, 2);
			strict.equal(stats.failed, 0);
			strict.equal(stats.skipped, 0);
			strict.equal(stats.totalDuration, 430);
			strict.equal(stats.avgScrapeDuration, 150);
			strict.equal(stats.avgConvertDuration, 65);
		});

		it("should handle skipped files correctly", () => {
			const results = [
				{
					success: true,
					scraped: { duration: 100 },
					converted: { duration: 50 },
					written: { skipped: true },
					totalDuration: 150,
				},
			];

			const stats = generateStats(results);

			strict.equal(stats.successful, 1);
			strict.equal(stats.skipped, 1);
		});

		it("should handle failed results correctly", () => {
			const results = [
				{
					success: false,
					error: { message: "Test error" },
				},
				{
					success: true,
					scraped: { duration: 100 },
					converted: { duration: 50 },
					written: { skipped: false },
					totalDuration: 150,
				},
			];

			const stats = generateStats(results);

			strict.equal(stats.total, 2);
			strict.equal(stats.successful, 1);
			strict.equal(stats.failed, 1);
			strict.equal(stats.errors.length, 1);
		});

		it("should handle empty results", () => {
			const stats = generateStats([]);

			strict.equal(stats.total, 0);
			strict.equal(stats.successful, 0);
			strict.equal(stats.failed, 0);
			strict.equal(stats.skipped, 0);
		});
	});
});
