#!/usr/bin/env node
/**
 * Scrappe-Tout - Main Entry Point
 * Single Responsibility: Orchestrate the scraping workflow
 */

import { join } from "node:path";
import { createLogger, initLogFile } from "./core/logger.js";
import { getConfig } from "./services/config.js";
import { determineRunName, prepareOutputDir } from "./services/path.js";
import { processAllUrls } from "./services/pipeline.js";
import { loadAndValidateUrls } from "./services/urls.js";
import { displayBanner, parseArgs, showHelp } from "./utils/cli.js";
import { handleResults } from "./utils/stats.js";

const logger = createLogger("main");

/**
 * Main function - Entry point for the application
 */
async function main() {
	// Parse CLI arguments
	const args = parseArgs(process.argv.slice(2));

	// Show help if requested
	if (args.showHelp) {
		showHelp();
		process.exit(0);
	}

	console.log("\nScrappe-Tout - Ultra-Fast Web Scraper");
	console.log("=".repeat(60));

	// Determine run name (interactive or non-interactive)
	const runName = await determineRunName(args);

	// Initialize log file with run name
	await initLogFile(runName);

	// Prepare output directory
	const { outputDir } = prepareOutputDir(args, runName);

	// Load configuration
	const userConfig = args.outputDir
		? { outputDir: join(process.cwd(), args.outputDir) }
		: {};
	const config = getConfig(userConfig);

	// Display banner with output directory
	displayBanner(outputDir);

	// Load and validate URLs
	const urls = await loadAndValidateUrls();

	// Process all URLs through the pipeline
	const results = await processAllUrls(urls, config);

	// Handle results (stats display, error handling, exit)
	handleResults(results);
}

// Run the application
main().catch((error) => {
	console.error("Fatal error details:", error.message, error.stack);
	logger.error("Fatal error", error);
	process.exit(1);
});
