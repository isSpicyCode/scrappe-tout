/**
 * URLs Service
 * Single Responsibility: Read and validate URLs from files
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "../core/logger.js";

const logger = createLogger("urls");

/**
 * Reads URLs from a file
 * @param {string} filepath - Path to URLs file
 * @returns {Promise<string[]>} Array of URLs
 */
export async function readUrls(filepath) {
	try {
		const content = await readFile(filepath, "utf8");
		return content
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0 && !line.startsWith("#"));
	} catch (error) {
		logger.error(`Failed to read URLs from ${filepath}`, error);
		throw error;
	}
}

/**
 * Loads and validates URLs from file
 * @returns {Promise<string[]>} Array of validated URLs
 */
export async function loadAndValidateUrls() {
	const urlsFile = join(process.cwd(), "urls.txt");
	logger.info(`Reading URLs from ${urlsFile}`);

	let urls;
	try {
		urls = await readUrls(urlsFile);
	} catch {
		logger.error("urls.txt not found. Please create it with one URL per line.");
		process.exit(1);
	}

	if (urls.length === 0) {
		logger.error("No URLs found in urls.txt");
		process.exit(1);
	}

	return urls;
}
