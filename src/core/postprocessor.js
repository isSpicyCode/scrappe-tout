/**
 * Post-processor Module
 * Single Responsibility: Clean and improve Markdown after conversion
 */

import { createLogger } from "./logger.js";
import { MENU_PATTERNS } from "./navigation-cleaner.js";
import { removeNavigationMenus } from "./navigation-cleaner.js";

const logger = createLogger("postprocessor");

/**
 * Detects and removes duplicate table of contents
 * TOC lines are like: "- [Overview](#overview)"
 */
function removeDuplicateTOC(markdown) {
	const lines = markdown.split("\n");
	const result = [];
	let inToc = false;
	let tocLines = [];
	let seenToc = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		// Detect TOC pattern: "- [Text](#anchor)" or "  - [Text](#anchor)"
		const isTocItem = /^[-\s]*-\s+\[.+?\]\(#.+\)/.test(trimmed);

		if (isTocItem) {
			if (!inToc) {
				// Start of TOC
				inToc = true;
				tocLines = [line];
			} else {
				// Continue TOC
				tocLines.push(line);
			}
			continue;
		}

		if (inToc) {
			// TOC ended
			inToc = false;

			// Only add TOC if we haven't seen one yet AND it's reasonably sized (< 30 lines)
			if (!seenToc && tocLines.length < 30 && tocLines.length > 2) {
				result.push(...tocLines);
				seenToc = true;
			}
			// If already seen TOC, skip it (removes duplicates)
			tocLines = [];
		}

		result.push(line);
	}

	return result.join("\n");
}

/**
 * Removes navigation header links like "[![Logo](...) Docs](/)"
 */
function removeHeaderNav(markdown) {
	const lines = markdown.split("\n");
	const result = [];

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip image links at the start (navigation logos)
		// Pattern: "[![files logo](/assets/...)files Docs](/)"
		if (/^\[!\[.*?logo.*?\]\(.*?\).*?\]\(\/\)/.test(trimmed)) {
			continue;
		}

		// Skip standalone logo images
		if (/^\[!\[.*?\]\(\/assets\/images\/branding\/.*?\)/.test(trimmed)) {
			continue;
		}

		result.push(line);
	}

	return result.join("\n");
}

/**
 * Converts HTML definition lists to Markdown
 * <dl><dt>term</dt><dd>description</dd></dl>
 * to:
 * **term**
 * : description
 *
 * @param {string} markdown - Markdown content with HTML tags
 * @returns {string} Markdown with converted definition lists
 */
function convertDefinitionLists(markdown) {
	let cleaned = markdown;

	// Handle multi-line <dd> content
	cleaned = cleaned.replace(
		/<dt>(.*?)<\/dt>\s*<dd>(.*?)<\/dd>/gis,
		(match, term, desc) => {
			return `**${term}**\n: ${desc.trim()}\n`;
		},
	);

	// Handle single-line cases
	cleaned = cleaned
		.replace(/<dt>(.*?)<\/dt>/gi, "**$1**\n")
		.replace(/<dd>(.*?)<\/dd>/gi, ": $1\n");

	// Remove remaining <dl> tags and clean up
	cleaned = cleaned.replace(/<\/?dl>/gi, "").replace(/\n:\s*\n/g, "\n");

	return cleaned;
}

/**
 * Removes remaining HTML tags from markdown
 * Handles common tags that converters miss
 *
 * @param {string} markdown - Markdown content
 * @returns {string} Markdown without HTML tags
 */
function stripRemainingHtml(markdown) {
	let cleaned = markdown;

	// Remove specific problematic tags (multi-line)
	const tagsToRemove = [
		"script",
		"style",
		"nav",
		"footer",
		"header",
		"aside",
		"navlink",
	];

	for (const tag of tagsToRemove) {
		const regex = new RegExp(`<${tag}[^>]*>.*?<\\/${tag}>`, "gis");
		cleaned = cleaned.replace(regex, "");
	}

	// Remove self-closing tags that clutter markdown
	const selfClosingTags = [
		"<img[^>]*>",
		"<br\\s*/?>",
		"<hr\\s*/?>",
		"<input[^>]*>",
		"<button[^>]*>.*?</button>",
	];

	for (const tag of selfClosingTags) {
		const regex = new RegExp(tag, "gis");
		cleaned = cleaned.replace(regex, "");
	}

	// Remove any remaining HTML tags (but keep allowed tags)
	cleaned = cleaned.replace(
		/<(?!\/?(?:code|pre|kbd|samp|strong|em|a|p|h[1-6]|ul|ol|li|blockquote|div|span)\b)[^>]+>/gi,
		"",
	);

	return cleaned;
}

/**
 * Cleans whitespace and formatting issues
 *
 * @param {string} markdown - Markdown content
 * @returns {string} Cleaned markdown
 */
function cleanWhitespace(markdown) {
	let cleaned = markdown;

	// Remove excessive blank lines (more than 2)
	cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

	// Trim trailing whitespace from each line
	cleaned = cleaned
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n");

	return cleaned;
}

/**
 * Post-processes Markdown content to improve quality
 * Removes menus, converts remaining HTML, normalizes formatting
 *
 * @param {string} markdown - Raw markdown from converter
 * @param {object} options - Processing options
 * @param {boolean} options.preserveBreadcrumbs - Keep breadcrumb navigation (default: false)
 * @param {boolean} options.convertHtmlTags - Convert remaining HTML tags (default: true)
 * @returns {string} Cleaned and improved markdown
 */
export function postProcessMarkdown(markdown, options = {}) {
	const { preserveBreadcrumbs = false, convertHtmlTags = true } = options;

	logger.debug("Post-processing markdown", {
		inputLength: markdown.length,
		options,
	});

	let processed = markdown;

	// Step 0: Remove header navigation (logos, nav links)
	processed = removeHeaderNav(processed);

	// Step 0.5: Remove duplicate table of contents
	processed = removeDuplicateTOC(processed);

	// Step 1: Convert HTML definition lists
	processed = convertDefinitionLists(processed);

	// Step 2: Strip remaining HTML tags
	if (convertHtmlTags) {
		processed = stripRemainingHtml(processed);
	}

	// Step 3: Remove navigation menus
	processed = removeNavigationMenus(processed);

	// Step 4: Clean whitespace
	processed = cleanWhitespace(processed);

	logger.debug("Post-processing complete", {
		outputLength: processed.length,
		reduction: `${((1 - processed.length / markdown.length) * 100).toFixed(1)}%`,
	});

	return processed;
}

/**
 * Creates a post-processor with default options
 * Factory function for creating configured post-processors
 *
 * @param {object} options - Default processing options
 * @returns {Function} Post-processor function with default options
 */
export function createPostProcessor(options = {}) {
	return (markdown, overrideOptions = {}) => {
		return postProcessMarkdown(markdown, { ...options, ...overrideOptions });
	};
}
