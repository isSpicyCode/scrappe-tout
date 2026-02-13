/**
 * Configuration Service
 * Single Responsibility: Centralize and validate application configuration
 */

import { DEFAULT_CONFIG } from "../utils/constants.js";

/**
 * Validates a number is within acceptable range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum acceptable value
 * @param {number} max - Maximum acceptable value
 * @param {string} name - Parameter name for error messages
 * @throws {Error} If validation fails
 */
function validateRange(value, min, max, name) {
	if (typeof value !== "number" || value < min || value > max) {
		throw new Error(`${name} must be between ${min} and ${max}, got ${value}`);
	}
}

/**
 * Validates output directory path
 * @param {string} path - Path to validate
 * @throws {Error} If path is empty or invalid
 */
function validateOutputPath(path) {
	if (!path || typeof path !== "string" || path.trim().length === 0) {
		throw new Error("Output path must be a non-empty string");
	}
}

/**
 * Validates blocked resources patterns
 * @param {string[]} patterns - Array of patterns to validate
 * @throws {Error} If patterns is not an array
 */
function validateBlockedPatterns(patterns) {
	if (!Array.isArray(patterns)) {
		throw new Error("Blocked resources must be an array of patterns");
	}
}

/**
 * Creates a validated configuration object
 * Merges user config with defaults and validates all values
 *
 * @param {object} userConfig - User-provided configuration overrides
 * @returns {object} Validated configuration object
 * @throws {Error} If any configuration value is invalid
 */
export function createConfig(userConfig = {}) {
	const config = { ...DEFAULT_CONFIG, ...userConfig };

	// Validate timeout (1s to 60s)
	validateRange(config.timeout, 1000, 60000, "Timeout");

	// Validate retry counts
	validateRange(config.maxRetries, 0, 10, "Max retries");
	validateRange(config.baseDelay, 100, 60000, "Base delay");
	validateRange(config.maxDelay, 1000, 300000, "Max delay");

	// Validate paths
	validateOutputPath(config.outputDir);

	// Validate blocked resources if provided
	if (userConfig.blockedResources) {
		validateBlockedPatterns(config.blockedResources);
	}

	// Return validated config (freeze to prevent mutations)
	return Object.freeze(config);
}

/**
 * Gets the current configuration
 * Use this to access config throughout the application
 *
 * @param {object} userConfig - Optional user config overrides
 * @returns {object} Frozen configuration object
 */
export function getConfig(userConfig) {
	return createConfig(userConfig);
}

/**
 * Extracts browser-specific options from config
 *
 * @param {object} config - Full configuration object
 * @returns {object} Browser launch options
 */
export function getBrowserOptions(config) {
	return {
		headless: config.headless,
		args: config.browserArgs,
	};
}

/**
 * Extracts navigation options from config
 *
 * @param {object} config - Full configuration object
 * @returns {object} Page goto options
 */
export function getNavigationOptions(config) {
	return {
		waitUntil: config.waitUntil,
		timeout: config.timeout,
	};
}
