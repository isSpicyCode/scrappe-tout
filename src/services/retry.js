/**
 * Retry Service
 * Single Responsibility: Execute operations with automatic retry and exponential backoff
 */

import { ErrorType, isRetryableError, wrapError } from "./error.js";

/**
 * Sleeps for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Resolves after sleep duration
 */
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates delay with exponential backoff and jitter
 * Prevents thundering herd problem when multiple operations retry simultaneously
 *
 * @param {number} attempt - Current attempt number (1-indexed)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Calculated delay in milliseconds
 */
function calculateDelay(attempt, baseDelay, maxDelay) {
	// Exponential backoff: baseDelay * 2^(attempt-1)
	const exponentialDelay = baseDelay * 2 ** (attempt - 1);

	// Add jitter: ±10% random variation to prevent synchronization
	const jitter = 1 + (Math.random() * 0.2 - 0.1);

	// Cap at maxDelay
	return Math.min(exponentialDelay * jitter, maxDelay);
}

/**
 * Executes an operation with automatic retry on failure
 * Implements exponential backoff with jitter for optimal retry behavior
 *
 * @param {Function} operation - Async function to execute
 * @param {object} options - Retry configuration options
 * @param {number} options.maxAttempts - Maximum number of attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise} Result of successful operation
 * @throws {Error} Last error if all attempts fail
 */
export async function executeWithRetry(operation, options = {}) {
	const {
		maxAttempts = 3,
		baseDelay = 1000,
		maxDelay = 30000,
		onRetry = null,
	} = options;

	let lastError;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			// Execute the operation
			const result = await operation(attempt);

			// Return result on success
			return result;
		} catch (error) {
			lastError = error;

			// Check if this was the last attempt
			if (attempt >= maxAttempts) {
				break;
			}

			// Check if error is retryable
			if (!isRetryableError(error)) {
				throw wrapError(error, ErrorType.NETWORK, {
					nonRetryable: true,
					attemptsMade: attempt,
				});
			}

			// Calculate delay for this retry
			const delay = calculateDelay(attempt, baseDelay, maxDelay);

			// Call onRetry callback if provided
			if (onRetry) {
				onRetry({
					attempt,
					nextAttempt: attempt + 1,
					maxAttempts,
					delay,
					error,
				});
			}

			// Sleep before retry
			await sleep(delay);
		}
	}

	// All attempts failed - throw the last error wrapped
	throw wrapError(lastError, ErrorType.NETWORK, {
		totalAttempts: maxAttempts,
		message: `Operation failed after ${maxAttempts} attempts`,
	});
}

/**
 * Creates a retry wrapper for a given operation
 * Useful when you need to call the same operation multiple times
 *
 * @param {Function} operation - Async function to wrap
 * @param {object} options - Retry configuration
 * @returns {Function} Wrapped function that will retry on failure
 */
export function createRetryWrapper(operation, options = {}) {
	return async (...args) => {
		return executeWithRetry(() => operation(...args), options);
	};
}

/**
 * Retry configuration presets for common scenarios
 */
export const RetryPresets = {
	// Fast retries for quick operations
	FAST: {
		maxAttempts: 2,
		baseDelay: 500,
		maxDelay: 2000,
	},

	// Standard retries for most operations
	STANDARD: {
		maxAttempts: 3,
		baseDelay: 1000,
		maxDelay: 10000,
	},

	// Aggressive retries for unreliable networks
	AGGRESSIVE: {
		maxAttempts: 5,
		baseDelay: 1000,
		maxDelay: 30000,
	},

	// Conservative retries for critical operations
	CONSERVATIVE: {
		maxAttempts: 3,
		baseDelay: 2000,
		maxDelay: 30000,
	},
};
