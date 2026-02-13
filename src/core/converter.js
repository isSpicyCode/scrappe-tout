/**
 * Converter Module
 * Single Responsibility: Convert HTML content to Markdown format
 */

import { htmlToMarkdown } from "mdream";
import { ErrorType, wrapError } from "../services/error.js";
import { executeWithRetry } from "../services/retry.js";
import { createLogger } from "./logger.js";
import { postProcessMarkdown } from "./postprocessor.js";

const logger = createLogger("converter");

/**
 * Conversion result structure
 */
export class ConversionResult {
	/**
	 * Creates a new conversion result
	 * @param {string} markdown - Converted markdown content
	 * @param {number} duration - Conversion duration in ms
	 * @param {number} inputSize - Input HTML size in bytes
	 * @param {number} outputSize - Output markdown size in bytes
	 */
	constructor(markdown, duration, inputSize, outputSize) {
		this.markdown = markdown;
		this.duration = duration;
		this.inputSize = inputSize;
		this.outputSize = outputSize;
		this.compressionRatio = outputSize / inputSize;
	}
}

/**
 * Converts HTML to Markdown using mdream
 * Implements retry for reliability
 *
 * @param {string} html - HTML content to convert
 * @param {object} options - Conversion options
 * @param {boolean} options.gfm - Use GitHub Flavored Markdown (default: true)
 * @param {string} options.headingStyle - Heading style 'atx' or 'setext' (default: 'atx')
 * @param {boolean} options.codeBlockLanguage - Include language in code blocks (default: true)
 * @returns {Promise<ConversionResult>} Conversion result with markdown and stats
 * @throws {ScrapingError} If conversion fails after all retries
 */
export async function convertToMarkdown(html, options = {}) {
	const {
		gfm = true,
		headingStyle = "atx",
		codeBlockLanguage = true,
	} = options;

	logger.debug(`Converting ${html.length} bytes of HTML to Markdown`);

	return executeWithRetry(
		async () => {
			const startTime = Date.now();

			try {
				// mdream htmlToMarkdown is synchronous but fast
				let markdown = htmlToMarkdown(html, {
					gfm,
					headingStyle,
					codeBlockLanguage,
				});

				// Post-process to clean menus and improve formatting
				markdown = postProcessMarkdown(markdown, {
					preserveBreadcrumbs: false,
					convertHtmlTags: true,
				});

				const duration = Date.now() - startTime;
				const inputSize = html.length;
				const outputSize = markdown.length;

				logger.debug(
					`Converted ${inputSize} bytes to ${outputSize} bytes in ${duration}ms`,
					{
						compressionRatio: (outputSize / inputSize).toFixed(2),
					},
				);

				return new ConversionResult(markdown, duration, inputSize, outputSize);
			} catch (error) {
				throw wrapError(error, ErrorType.PARSE, {
					inputSize: html.length,
					converter: "mdream",
				});
			}
		},
		{
			maxAttempts: 2, // Conversion failures are usually permanent
			baseDelay: 100,
			maxDelay: 500,
		},
	);
}

/**
 * Converts multiple HTML documents in batch
 * More efficient than individual conversions for large batches
 *
 * @param {object[]} items - Array of { html, url } objects
 * @param {object} options - Conversion options
 * @returns {Promise<ConversionResult[]>} Array of conversion results
 */
export async function convertBatch(items, options = {}) {
	logger.info(`Converting batch of ${items.length} items`);

	const results = [];
	const errors = [];

	for (const item of items) {
		try {
			const result = await convertToMarkdown(item.html, options);
			results.push({ ...result, url: item.url });
		} catch (error) {
			errors.push({ url: item.url, error });
			logger.error(`Failed to convert ${item.url}`, error);
		}
	}

	if (errors.length > 0) {
		logger.warn(
			`Batch conversion: ${results.length} successful, ${errors.length} failed`,
		);
	}

	return results;
}

/**
 * Strips HTML tags and returns plain text
 * Fallback for when Markdown conversion fails
 *
 * @param {string} html - HTML content
 * @returns {string} Plain text content
 */
export function stripHtml(html) {
	return html
		.replace(/<script[^>]*>.*?<\/script>/gi, "")
		.replace(/<style[^>]*>.*?<\/style>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Creates a converter with default options
 * Factory function for creating configured converters
 *
 * @param {object} options - Default conversion options
 * @returns {Function} Converter function with default options
 */
export function createConverter(options = {}) {
	return (html, overrideOptions = {}) => {
		return convertToMarkdown(html, { ...options, ...overrideOptions });
	};
}
