/**
 * Error Handling Service
 * Single Responsibility: Centralize error classification and custom error types
 */

import { ErrorType } from "../utils/constants.js";

// Re-export ErrorType for convenience
export { ErrorType };

/**
 * Custom error class for scraping operations
 * Provides structured error information with context
 */
export class ScrapingError extends Error {
	/**
	 * Creates a new ScrapingError
	 * @param {string} message - Human-readable error message
	 * @param {string} code - Error type code from ErrorType
	 * @param {object} context - Additional context about the error
	 * @param {Error} originalError - Original error that caused this one
	 */
	constructor(message, code, context = {}, originalError = null) {
		super(message);
		this.name = "ScrapingError";
		this.code = code;
		this.context = context;
		this.originalError = originalError;
		this.timestamp = new Date().toISOString();
	}

	/**
	 * Converts error to JSON for logging
	 * @returns {object} JSON representation of the error
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			context: this.context,
			timestamp: this.timestamp,
			stack: this.stack,
		};
	}
}

/**
 * Classifies an error into an ErrorType
 * Examines error properties to determine the appropriate classification
 *
 * @param {Error} error - Error to classify
 * @returns {string} ErrorType code
 */
export function classifyError(error) {
	// Check for timeout errors
	if (error.name === "TimeoutError") {
		return ErrorType.TIMEOUT;
	}

	// Check for network-related error codes
	if (error.code) {
		const code = error.code;
		if (
			["ETIMEDOUT", "ENOTFOUND", "ECONNRESET", "ECONNREFUSED"].includes(code)
		) {
			return ErrorType.NETWORK;
		}
	}

	// Check for HTTP status codes
	if (error.status) {
		if (error.status === 429) {
			return ErrorType.RATE_LIMIT;
		}
		if (error.status >= 500) {
			return ErrorType.NETWORK;
		}
	}

	// Check error message for rate limit indicators
	if (error.message) {
		const msg = error.message.toLowerCase();
		if (msg.includes("rate limit") || msg.includes("too many requests")) {
			return ErrorType.RATE_LIMIT;
		}
	}

	// Default to parse error for unknown errors
	return ErrorType.PARSE;
}

/**
 * Determines if an error is retryable
 * Some errors should not be retried (e.g., 404, CORS)
 *
 * @param {Error} error - Error to evaluate
 * @returns {boolean} True if error should be retried
 */
export function isRetryableError(error) {
	// Never retry if error is explicitly marked as non-retryable
	if (error.context?.nonRetryable) {
		return false;
	}

	// Check retryable error codes
	if (error.code) {
		const retryableCodes = [
			"ETIMEDOUT",
			"ENOTFOUND",
			"ECONNRESET",
			"ECONNREFUSED",
		];
		if (retryableCodes.includes(error.code)) {
			return true;
		}
	}

	// Check retryable HTTP status codes
	if (error.status) {
		const retryableStatus = [408, 429, 500, 502, 503, 504];
		return retryableStatus.includes(error.status);
	}

	// Check error type
	if (error.name === "TimeoutError") {
		return true;
	}

	// Non-retryable by default
	return false;
}

/**
 * Creates a formatted error object for logging
 *
 * @param {Error} error - Error to format
 * @param {object} context - Additional context
 * @returns {object} Formatted error object
 */
export function formatError(error, context = {}) {
	if (error instanceof ScrapingError) {
		return error.toJSON();
	}

	return {
		name: error.name || "Error",
		message: error.message,
		code: classifyError(error),
		context,
		timestamp: new Date().toISOString(),
		stack: error.stack,
	};
}

/**
 * Wraps an error in a ScrapingError if it isn't one already
 *
 * @param {Error} error - Error to wrap
 * @param {string} code - Error type code
 * @param {object} context - Additional context
 * @returns {ScrapingError} Wrapped or original error
 */
export function wrapError(error, code, context = {}) {
	if (error instanceof ScrapingError) {
		return error;
	}
	return new ScrapingError(error.message, code, context, error);
}
