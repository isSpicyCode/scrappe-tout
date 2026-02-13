/**
 * CLI Parser Module
 * Single Responsibility: Parse command line arguments for the scraper
 */

import { HELP_TEXT } from "./constants.js";

/**
 * Parses CLI arguments from argv
 * Supports: --name, --output-dir, --overwrite, --continue, --help
 *
 * @param {string[]} argv - Process argv (usually process.argv.slice(2))
 * @returns {object} Parsed arguments object
 */
export function parseArgs(argv) {
	const args = {
		runName: null,
		outputDir: null,
		overwrite: false,
		continue: true, // Default: skip existing files
		showHelp: false,
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];

		if (arg === "--help" || arg === "-h") {
			args.showHelp = true;
		} else if (arg === "--overwrite" || arg === "-o") {
			args.overwrite = true;
			args.continue = false; // Overwrite implies don't skip
		} else if (arg === "--continue" || arg === "-c") {
			args.continue = true;
			args.overwrite = false; // Continue implies don't overwrite
		} else if (arg === "--name" || arg === "-n") {
			// Next argument is the run name (for non-interactive mode)
			if (i + 1 < argv.length) {
				args.runName = argv[++i];
			}
		} else if (arg === "--output-dir" || arg === "-d") {
			// Next argument is the directory name
			if (i + 1 < argv.length) {
				args.outputDir = argv[++i];
			}
		}

		// Skip unknown arguments (could warn here)
	}

	return args;
}

/**
 * Prompts user for a run name
 * Uses readline for interactive input
 *
 * @param {string} defaultName - Default name to suggest
 * @returns {Promise<string>} User's input name
 */
export async function promptRunName(defaultName = "scrap") {
	const readline = (await import("node:readline")).createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		readline.question(`Folder name (Enter for "${defaultName}"): `, (name) => {
			readline.close();
			resolve(name.trim() || defaultName);
		});
	});
}

/**
 * Displays help message
 * Shows usage information and available options
 */
export function showHelp() {
	console.log(HELP_TEXT);
}

/**
 * Displays startup banner
 * @param {string} outputDir - Output directory path
 */
export function displayBanner(outputDir) {
	console.log("\nScrappe-Tout - Ultra-Fast Web Scraper");
	console.log("=".repeat(60));
	console.log(`Folder: ${outputDir}`);
}
