/**
 * Writer Module
 * Single Responsibility: Write markdown content to files
 */

import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { ErrorType, wrapError } from "../services/error.js";
import { createLogger } from "./logger.js";

const logger = createLogger("writer");

// Global timestamp directory - set once per script run
let globalOutputDir = null;

/**
 * Sets the global output directory for this script run
 * Call this once at startup to create timestamped directory
 *
 * @param {string} dir - Output directory path
 */
export function setOutputDirectory(dir) {
	globalOutputDir = dir;
	logger.info(`Output directory set to: ${dir}`);
}

/**
 * Gets the current output directory
 *
 * @returns {string} Current output directory
 */
export function getOutputDirectory() {
	return globalOutputDir || "./captures";
}

/**
 * Sanitizes a URL to create a unique filename
 * Includes domain name and path segments to avoid collisions
 * Includes URL fragment (hash) for same-page sections
 *
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(url) {
	try {
		const urlObj = new URL(url);

		// Get domain name (without TLD) to distinguish between sites
		const domainParts = urlObj.hostname.split(".");
		// Use the last 2 parts for subdomain.domain or domain.tld patterns
		// For 'docs.example.com': use 'example-dev'
		// For 'example.org': use 'example-org'
		const domain =
			domainParts.length >= 2
				? `${domainParts[domainParts.length - 2]}-${domainParts[domainParts.length - 1]}`
				: urlObj.hostname;

		// Get the path, remove trailing slash, split by /
		const pathParts = urlObj.pathname
			.replace(/\/$/, "")
			.split("/")
			.filter((p) => p);

		// Build filename: domain + last 2-3 path parts
		let filename = domain;

		// Take up to the last 3 meaningful parts of the path
		const meaningfulParts = pathParts.slice(-3);

		for (const part of meaningfulParts) {
			// Remove file extensions like .html
			const cleanPart = part.replace(/\.html?$/i, "");
			if (cleanPart) {
				filename += `-${cleanPart}`;
			}
		}

		// Append hash/fragment if present (for same-page sections)
		if (urlObj.hash) {
			const hash = urlObj.hash.slice(1); // Remove the # symbol
			const readableHash = hash
				.replace(/[^a-zA-Z0-9]/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-|-$/g, "");
			if (readableHash) {
				filename += `-${readableHash}`;
			}
		}

		// Clean special chars but keep hyphens
		let cleaned = filename.replace(/[^a-zA-Z0-9-]/g, "-");

		// Remove consecutive hyphens
		cleaned = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "");

		// Limit length to avoid filesystem issues
		return cleaned.substring(0, 80) || "index";
	} catch {
		// Fallback for invalid URLs - use entire URL path
		return url
			.replace(/^https?:\/\//, "")
			.replace(/[^a-zA-Z0-9-]/g, "-")
			.replace(/-+/g, "-")
			.substring(0, 80);
	}
}

/**
 * Generates a filename from a URL
 * Adds .md extension and sanitizes the URL
 *
 * @param {string} url - URL to generate filename from
 * @returns {string} Generated filename
 */
export function generateFilename(url) {
	const sanitized = sanitizeFilename(url);
	return `${sanitized}.md`;
}

/**
 * Checks if a file exists
 *
 * @param {string} filepath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filepath) {
	try {
		await stat(filepath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Ensures a directory exists, creating it if necessary
 *
 * @param {string} dir - Directory path
 * @returns {Promise} Resolves when directory exists
 */
async function ensureDirectory(dir) {
	try {
		await mkdir(dir, { recursive: true });
		logger.debug(`Created directory: ${dir}`);
	} catch (error) {
		// Directory may already exist, which is fine
		if (error.code !== "EEXIST") {
			throw wrapError(error, ErrorType.VALIDATION, { dir });
		}
	}
}

/**
 * Writes markdown content to a file
 * Creates parent directories if they don't exist
 *
 * @param {string} filepath - Full path to output file
 * @param {string} content - Markdown content to write
 * @returns {Promise<boolean>} True if file was written, false if skipped
 * @throws {ScrapingError} If write fails
 */
async function writeToFile(filepath, content) {
	const startTime = Date.now();

	// Ensure parent directory exists
	const dir = dirname(filepath);
	await ensureDirectory(dir);

	// Write the file
	try {
		await writeFile(filepath, content, "utf8");
		const duration = Date.now() - startTime;
		logger.debug(
			`Wrote ${content.length} bytes to ${filepath} in ${duration}ms`,
		);
		return true;
	} catch (error) {
		throw wrapError(error, ErrorType.VALIDATION, {
			filepath,
			contentLength: content.length,
		});
	}
}

/**
 * Writes markdown content with options
 * Handles skipping existing files and validation
 *
 * @param {string} url - Source URL (for filename generation)
 * @param {string} markdown - Markdown content to write
 * @param {object} options - Write options
 * @param {string} options.outputDir - Output directory path
 * @param {boolean} options.skipExisting - Skip if file exists
 * @returns {Promise<object>} Write result { success, skipped, filepath }
 */
export async function writeMarkdown(url, markdown, options = {}) {
	const { outputDir = getOutputDirectory(), skipExisting = true } = options;

	const filename = generateFilename(url);
	const filepath = join(outputDir, filename);

	// Check if file exists (if skipExisting is enabled)
	if (skipExisting) {
		const exists = await fileExists(filepath);
		if (exists) {
			logger.debug(`Skipped existing file: ${filepath}`);
			return {
				success: false,
				skipped: true,
				filepath,
				reason: "File exists",
			};
		}
	}

	// Write the file
	await writeToFile(filepath, markdown);

	return {
		success: true,
		skipped: false,
		filepath,
		bytesWritten: markdown.length,
	};
}

/**
 * Writes multiple markdown files in batch
 * Efficiently processes multiple write operations
 *
 * @param {object[]} items - Array of { url, markdown } objects
 * @param {object} options - Write options
 * @returns {Promise<object>} Batch write results
 */
export async function writeBatch(items, options = {}) {
	logger.info(`Writing ${items.length} files`);

	const results = {
		written: 0,
		skipped: 0,
		failed: 0,
		errors: [],
	};

	for (const item of items) {
		try {
			const result = await writeMarkdown(item.url, item.markdown, options);

			if (result.skipped) {
				results.skipped++;
			} else {
				results.written++;
			}
		} catch (error) {
			results.failed++;
			results.errors.push({ url: item.url, error });
			logger.error(`Failed to write ${item.url}`, error);
		}
	}

	logger.info(
		`Batch write complete: ${results.written} written, ${results.skipped} skipped, ${results.failed} failed`,
	);

	return results;
}

/**
 * Creates a writer with default options
 * Factory function for creating configured writers
 *
 * @param {object} options - Default write options
 * @returns {Function} Writer function with default options
 */
export function createWriter(options = {}) {
	return (url, markdown, overrideOptions = {}) => {
		return writeMarkdown(url, markdown, { ...options, ...overrideOptions });
	};
}
