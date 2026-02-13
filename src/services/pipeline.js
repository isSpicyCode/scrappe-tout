/**
 * Pipeline Service
 * Single Responsibility: Orchestrate URL processing through scrape/convert/write stages
 */

import { convertToMarkdown } from "../core/converter.js";
import { createLogger } from "../core/logger.js";
import { scrapeUrl } from "../core/scraper.js";
import { writeMarkdown } from "../core/writer.js";
import { showProgress } from "../utils/display.js";
import { formatError } from "./error.js";

const logger = createLogger("pipeline");

/**
 * Processes a single URL through the full pipeline
 * Scrape -> Convert -> Write
 *
 * @param {string} url - URL to process
 * @param {number} index - Current index (for progress display)
 * @param {number} total - Total URLs (for progress display)
 * @param {object} config - Application configuration
 * @returns {Promise<object>} Processing result
 */
export async function processUrl(url, index, total, config) {
	const urlStartTime = Date.now();
	try {
		// 0% - Début du traitement
		showProgress(index + 1, total, url, 0, 0, false);

		// 33% - Scrape terminé
		const scraped = await scrapeUrl(url, config);
		showProgress(index + 1, total, url, 33, Date.now() - urlStartTime, false);

		// 66% - Convert terminé
		const converted = await convertToMarkdown(scraped.html);
		showProgress(index + 1, total, url, 66, Date.now() - urlStartTime, false);

		// 100% - Write terminé
		const written = await writeMarkdown(url, converted.markdown);
		const totalDuration = Date.now() - urlStartTime;
		showProgress(index + 1, total, url, 100, totalDuration, true);

		return {
			success: true,
			url,
			scraped: { duration: scraped.duration },
			converted: {
				duration: converted.duration,
				ratio: converted.compressionRatio,
			},
			written,
			totalDuration,
		};
	} catch (error) {
		const duration = Date.now() - urlStartTime;
		showProgress(index + 1, total, url, 0, duration, true);

		return {
			success: false,
			url,
			error: formatError(error, { url, duration }),
		};
	}
}

/**
 * Processes all URLs through the pipeline
 * @param {string[]} urls - URLs to process
 * @param {object} config - Application configuration
 * @returns {Promise<object[]>} Processing results
 */
export async function processAllUrls(urls, config) {
	console.log(`Found ${urls.length} URLs to process`);
	console.log("Target: 1-2s per URL with Playwright");
	console.log("");

	const results = [];
	for (let i = 0; i < urls.length; i++) {
		const result = await processUrl(urls[i], i, urls.length, config);
		results.push(result);
	}

	return results;
}
