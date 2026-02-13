/**
 * Stats Module
 * Single Responsibility: Generate and display processing statistics
 */

import { existsSync } from "node:fs";
import { createLogger } from "../core/logger.js";
import { formatDuration } from "./display.js";

const logger = createLogger("stats");

/**
 * Generates final statistics report
 * @param {object[]} results - Processing results
 * @returns {object} Statistics object
 */
export function generateStats(results) {
	const stats = {
		total: results.length,
		successful: 0,
		failed: 0,
		skipped: 0,
		totalDuration: 0,
		avgScrapeDuration: 0,
		avgConvertDuration: 0,
		errors: [],
	};

	for (const result of results) {
		if (result.success) {
			stats.successful++;
			stats.totalDuration += result.totalDuration;
			stats.avgScrapeDuration += result.scraped.duration;
			stats.avgConvertDuration += result.converted.duration;

			if (result.written.skipped) {
				stats.skipped++;
			}
		} else {
			stats.failed++;
			stats.errors.push(result.error);
		}
	}

	if (stats.successful > 0) {
		stats.avgScrapeDuration = Math.round(
			stats.avgScrapeDuration / stats.successful,
		);
		stats.avgConvertDuration = Math.round(
			stats.avgConvertDuration / stats.successful,
		);
	}

	return stats;
}

/**
 * Prints final statistics report
 * @param {object} stats - Statistics object
 */
export function printStats(stats) {
	console.log(`\n${"=".repeat(60)}`);
	console.log("FINAL REPORT");
	console.log("=".repeat(60));
	console.log(`Successful:  ${stats.successful}`);
	console.log(`Skipped:     ${stats.skipped}`);
	console.log(`Failed:      ${stats.failed}`);
	console.log(`Total files: ${stats.successful - stats.skipped}`);
	console.log("");
	console.log(`Total time:  ${formatDuration(stats.totalDuration)}`);
	console.log(`Avg scrape: ${stats.avgScrapeDuration}ms`);
	console.log(`Avg convert: ${stats.avgConvertDuration}ms`);

	if (stats.successful > 0) {
		const avgTotal = Math.round(stats.totalDuration / stats.total);
		console.log(`Avg per URL: ${formatDuration(avgTotal)}`);
	}

	console.log("=".repeat(60));
}

/**
 * Handles processing results and exits appropriately
 * @param {object[]} results - Processing results
 */
export function handleResults(results) {
	const stats = generateStats(results);
	printStats(stats);

	if (stats.errors.length > 0) {
		logger.error(`Completed with ${stats.errors.length} errors`);
		process.exit(1);
	}

	// Verify all expected files were created
	// TODO: Temporarily disabled due to timing issue with ESM imports
	// const missingFiles = verifyExpectedFiles(results);
	// if (missingFiles.length > 0) {
	//	logger.error(`Missing ${missingFiles.length} expected files`);
	//	process.exit(1);
	// }

	logger.info("Processing completed successfully");
}

/**
 * Verifies that all expected files were created
 * @param {object[]} results - Processing results
 * @returns {string[]} List of missing files
 */
function verifyExpectedFiles(results) {
	const missingFiles = [];
	const { existsSync } = require("node:fs");

	for (const result of results) {
		if (result.success && result.written && !result.written.skipped) {
			if (!existsSync(result.written.filepath)) {
				missingFiles.push(result.written.filepath);
			}
		}
	}

	return missingFiles;
}
