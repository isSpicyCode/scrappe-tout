/**
 * Timestamp Utility
 * Single Responsibility: Generate timestamp strings for output directories
 */

import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Creates a directory recursively
 *
 * @param {string} dir - Directory path to create
 */
export function ensureDir(dir) {
	mkdirSync(dir, { recursive: true });
}

/**
 * Generates a timestamp string for current date/time
 * Format: YYYY-MM-DD_HH-MM-SS
 *
 * @returns {string} Timestamp string
 */
export function generateTimestamp() {
	const now = new Date();

	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");

	return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Creates a timestamped output directory path
 * Format: captures/YYYY-MM-DD_HH-MM-SS
 *
 * @param {string} baseDir - Base directory (default: 'captures')
 * @returns {string} Full path to timestamped directory
 */
export function createTimestampedDir(baseDir = "captures") {
	const timestamp = generateTimestamp();
	return `${baseDir}/${timestamp}`;
}

/**
 * Extracts timestamp from a directory path
 * Parses: captures/2025-01-13_14-30-00 -> Date object
 *
 * @param {string} path - Path containing timestamp
 * @returns {Date|null} Parsed date or null if invalid format
 */
export function parseTimestamp(path) {
	const match = path.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
	if (!match) return null;

	const [datePart, timePart] = match[1].split("_");
	const [year, month, day] = datePart.split("-");
	const [hours, minutes, seconds] = timePart.split("-");

	return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Lists all capture directories sorted by timestamp (newest first)
 *
 * @param {string} baseDir - Base directory containing captures
 * @returns {string[]} Array of directory paths
 */
export function listCaptureDirs(baseDir = "captures") {
	try {
		const entries = readdirSync(baseDir, { withFileTypes: true });
		const dirs = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => join(baseDir, entry.name))
			.sort((a, b) => {
				const dateA = parseTimestamp(a);
				const dateB = parseTimestamp(b);
				return dateB - dateA; // Newest first
			});

		return dirs;
	} catch {
		return [];
	}
}
