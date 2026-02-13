/**
 * Path Service
 * Single Responsibility: Determine and prepare output directory paths
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { setOutputDirectory } from "../core/writer.js";
import { showFolderMenu } from "../utils/menu.js";
import { ensureDir } from "../utils/timestamp.js";

/**
 * Determines the run name based on environment (interactive or non-interactive)
 * @param {object} args - CLI arguments
 * @returns {Promise<string>} Run name for the output folder
 */
export async function determineRunName(args) {
	// Priority 1: If --name is provided, use it directly
	if (args.runName) {
		console.log(`Folder name from --name: "${args.runName}"`);
		return args.runName;
	}

	// Priority 2: Interactive terminal - show TUI menu
	if (process.stdin.isTTY) {
		return await showFolderMenu("captures", "scrap");
	}

	// Priority 3: Check for scrap-folder-name.txt file
	const folderNameFile = join(process.cwd(), "scrap-folder-name.txt");

	try {
		const folderNameContent = await readFile(folderNameFile, "utf8");
		const runName = folderNameContent.trim();
		console.log(`Folder name from scrap-folder-name.txt: "${runName}"`);
		return runName;
	} catch {
		// File doesn't exist, continue to fallback
	}

	// Priority 4: Non-interactive fallback - use timestamp
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const runName = `scrap-${timestamp}`;
	console.log("No scrap-folder-name.txt file found");
	console.log(`Using automatic name: "${runName}"`);
	console.log(
		`Tip: Create a "scrap-folder-name.txt" file with your desired folder name!`,
	);
	return runName;
}

/**
 * Prepares output directory
 * @param {object} args - CLI arguments
 * @param {string} runName - Run name
 * @returns {object} Output directory info
 */
export function prepareOutputDir(args, runName) {
	const baseDir = args.outputDir
		? join(process.cwd(), args.outputDir)
		: "captures";
	const outputDir = join(baseDir, runName);
	ensureDir(outputDir);
	setOutputDirectory(outputDir);
	return { baseDir, outputDir };
}
