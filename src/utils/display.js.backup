/**
 * Display Module
 * Formats data for display and renders progress bar in terminal
 */

import { PROGRESS_BAR } from "./constants.js";

/**
 * Formats duration in human-readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
	if (ms < 1000) {
		return `${ms}ms`;
	}
	const seconds = Math.floor(ms / 1000);
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Displays a progress bar in the terminal
 * @param {number} current - Current item number
 * @param {number} total - Total number of items
 * @param {string} url - Current URL being processed
 * @param {number} percent - Progress percentage (0-100) for current URL
 * @param {number} duration - Processing duration in ms
 * @param {boolean} done - True if URL processing is complete (move to next line)
 */
export function showProgress(current, total, url, percent, duration, done = false) {
	const filledLength = Math.floor((percent / 100) * PROGRESS_BAR.length);
	const emptyLength = PROGRESS_BAR.length - filledLength;

	const bar =
		PROGRESS_BAR.filled.repeat(filledLength) +
		PROGRESS_BAR.empty.repeat(emptyLength);

	const formattedUrl = url.length > 50 ? `${url.substring(0, 47)}...` : url;
	const formattedDuration = formatDuration(duration);

	const eol = done ? "\n" : "\r";
	process.stdout.write(
		`\r[${current}/${total}] [${percent}%] [${bar}] ${formattedUrl} (${formattedDuration})${eol}`,
	);
}
