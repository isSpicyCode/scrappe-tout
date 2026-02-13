/**
 * Scraper Module
 * Single Responsibility: Navigation and HTML extraction using Playwright
 */

import { chromium } from "playwright";
import { ErrorType, wrapError } from "../services/error.js";
import { executeWithRetry } from "../services/retry.js";
import { DEFAULT_BLOCKED_PATTERNS } from "../utils/constants.js";
import { createLogger } from "./logger.js";

const logger = createLogger("scraper");

/**
 * Sets up resource blocking for a browser context
 * Blocks images, fonts, analytics, tracking, and ads to improve speed
 *
 * @param {BrowserContext} context - Playwright browser context
 * @param {string[]} patterns - Resource patterns to block
 * @returns {Promise} Resolves when blocking is configured
 */
async function setupResourceBlocking(
	context,
	patterns = DEFAULT_BLOCKED_PATTERNS,
) {
	for (const pattern of patterns) {
		await context.route(pattern, (route) => route.abort());
	}
	logger.debug(`Blocked ${patterns.length} resource patterns`);
}

/**
 * Navigates to a URL and extracts HTML content
 * Implements retry logic for robustness
 *
 * @param {Page} page - Playwright page instance
 * @param {string} url - URL to navigate to
 * @param {object} options - Navigation options
 * @param {number} options.timeout - Navigation timeout in ms
 * @param {string} options.waitUntil - Wait condition
 * @returns {Promise<string>} HTML content of the page
 */
async function navigateAndExtract(page, url, options = {}) {
	const { timeout, waitUntil } = options;

	const startTime = Date.now();

	await page.goto(url, {
		waitUntil: waitUntil || "domcontentloaded",
		timeout: timeout || 8000,
	});

	// Wait a brief moment for dynamic content to load
	// This is a balance between speed and completeness
	await page.waitForTimeout(100);

	const html = await page.content();
	const duration = Date.now() - startTime;

	logger.debug(`Extracted ${html.length} bytes in ${duration}ms`, { url });

	return html;
}

/**
 * Scrapes a single URL and returns the HTML content
 * Uses exponential backoff retry for network resilience
 *
 * @param {string} url - URL to scrape
 * @param {object} options - Scraping options
 * @param {number} options.timeout - Navigation timeout in ms
 * @param {string} options.waitUntil - Wait condition for page load
 * @param {string[]} options.blockedResources - Resource patterns to block
 * @returns {Promise<object>} Scraped data { html, url, title, duration }
 * @throws {ScrapingError} If scraping fails after all retries
 */
export async function scrapeUrl(url, options = {}) {
	const {
		timeout = 8000,
		waitUntil = "domcontentloaded",
		blockedResources = DEFAULT_BLOCKED_PATTERNS,
	} = options;

	logger.debug(`Starting scrape for ${url}`);

	return executeWithRetry(
		async () => {
			const browser = await chromium.launch({
				headless: true,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
				],
			});

			try {
				const context = await browser.newContext({
					userAgent: "Scrappe-Tout/1.0 (+https://github.com/scrappe-tout)",
				});

				// Set up resource blocking before navigation
				await setupResourceBlocking(context, blockedResources);

				const page = await context.newPage();

				const startTime = Date.now();

				try {
					const html = await navigateAndExtract(page, url, {
						timeout,
						waitUntil,
					});
					const title = await page.title();
					const duration = Date.now() - startTime;

					return { html, url, title, duration };
				} finally {
					await page.close();
					await context.close();
				}
			} finally {
				await browser.close();
			}
		},
		{
			maxAttempts: 3,
			baseDelay: 1000,
			maxDelay: 10000,
			onRetry: ({ attempt, nextAttempt, maxAttempts, delay, error }) => {
				logger.warn(
					`Retry ${nextAttempt}/${maxAttempts} for ${url} after ${delay}ms`,
					{
						attempt,
						error: error.message,
					},
				);
			},
		},
	);
}

/**
 * Scrapes multiple URLs concurrently
 * Useful for processing batches of URLs efficiently
 *
 * @param {string[]} urls - Array of URLs to scrape
 * @param {object} options - Scraping options
 * @param {number} options.concurrency - Maximum concurrent scrapes
 * @returns {Promise<object[]>} Array of scraped data objects
 */
export async function scrapeUrls(urls, options = {}) {
	const { concurrency = 3 } = options;

	logger.info(`Scraping ${urls.length} URLs with concurrency ${concurrency}`);

	const results = [];
	const errors = [];

	// Process URLs in batches
	for (let i = 0; i < urls.length; i += concurrency) {
		const batch = urls.slice(i, i + concurrency);
		const batchPromises = batch.map((url) =>
			scrapeUrl(url, options)
				.then((result) => ({ result, url }))
				.catch((error) => ({ error, url })),
		);

		const batchResults = await Promise.all(batchPromises);

		for (const { result, error, url } of batchResults) {
			if (error) {
				errors.push({ url, error });
				logger.error(`Failed to scrape ${url}`, error);
			} else {
				results.push(result);
				logger.success(`Scraped ${url} in ${result.duration}ms`);
			}
		}
	}

	logger.info(
		`Completed: ${results.length} successful, ${errors.length} failed`,
	);

	return results;
}

/**
 * Creates a Playwright scraper instance with custom options
 * Factory function for creating configured scrapers
 *
 * @param {object} options - Default options for this scraper
 * @returns {Function} Scraper function with default options applied
 */
export function createScraper(options = {}) {
	return (url, overrideOptions = {}) => {
		return scrapeUrl(url, { ...options, ...overrideOptions });
	};
}
