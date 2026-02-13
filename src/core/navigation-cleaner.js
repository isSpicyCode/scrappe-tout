/**
 * Navigation Cleaner Module
 * Defines patterns for detecting navigation elements and removes them
 */

/**
 * Patterns to detect and remove navigation menus
 */
export const MENU_PATTERNS = [
	// Standalone "menu" header
	/^menu$/im,
	// Numbered navigation lists like "1. [Link]", "2. [Link]"
	/^\d+\.\s+\[.*?\]\(.*\)$/gm,
	// Footer navigation
	/^←\s+\[.*?\]\s+→$/gm,
];

/**
 * Keywords that indicate navigation/footer elements
 */
const NAVIGATION_KEYWORDS = [
	"skip to main content",
	"ok, got it",
	"learn more",
	"menuclose",
	"menu close",
	"uses cookies from google",
	"get started",
	"on this page",
	"copy link",
	"view source",
	"report issue",
	"more_vert",
	"[search]",
	"is live!",
];

/**
 * Section headers that indicate navigation menus
 */
const MENU_SECTION_HEADERS = [
	/^routine$/im,
	/^apps$/im,
	/^list$/im,
	/^more_vert$/im,
];

/**
 * Removes navigation menus while preserving breadcrumbs
 *
 * @param {string} markdown - Markdown content
 * @returns {string} Cleaned markdown
 */
export function removeNavigationMenus(markdown) {
	const lines = markdown.split("\n");
	const cleaned = [];
	let skipMode = 0; // 0 = normal, 1 = in menu list, 2 = in menu section

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmedLine = line.trim();

		// Skip lines with navigation keywords
		if (
			NAVIGATION_KEYWORDS.some((keyword) =>
				trimmedLine.toLowerCase().includes(keyword),
			)
		) {
			continue;
		}

		// Check for menu section headers (routine, apps, etc.)
		if (MENU_SECTION_HEADERS.some((pattern) => pattern.test(trimmedLine))) {
			skipMode = 2;
			continue;
		}

		// Detect start of list-based menu (starts with "-")
		if (trimmedLine.startsWith("-") && i + 1 < lines.length) {
			const nextLine = lines[i + 1].trim();
			if (nextLine.startsWith("-")) {
				const listContent = lines
					.slice(i, Math.min(i + 20))
					.join("\n")
					.toLowerCase();

				const isMenuList =
					(listContent.includes("logo") &&
						listContent.includes("navigate to")) ||
					(listContent.includes("install") && listContent.includes("files")) ||
					listContent.includes("user interface") ||
					listContent.includes("component catalog") ||
					(listContent.includes("palette") &&
						listContent.includes("view_module")) ||
					listContent.includes("#introduction") ||
					listContent.includes("#create-a-new");

				if (isMenuList) {
					skipMode = 1;
					continue;
				}
			}
		}

		// Skip list items when in menu mode
		if (skipMode === 1) {
			if (!trimmedLine.startsWith("-") && trimmedLine.length > 0) {
				skipMode = 0;
			} else {
				continue;
			}
		}

		// Skip everything in menu section mode
		if (skipMode === 2) {
			if (trimmedLine.length === 0 && i + 1 < lines.length) {
				const nextLine = lines[i + 1].trim();
				if (!nextLine.startsWith("-")) {
					skipMode = 0;
				}
			}
			continue;
		}

		// Skip standalone logo/image links
		if (trimmedLine.match(/^-\s*\[!\[.*?logo.*?\]\(.*?\)/)) {
			continue;
		}
		// Skip empty anchor links
		if (trimmedLine.match(/^\[#\]\(#.+\)$/)) {
			continue;
		}
		// Skip navigation icon links
		if (trimmedLine.match(/^\[vertical_align_top.*?\]\(#.+\)$/)) {
			continue;
		}

		// Skip numbered navigation lists
		if (trimmedLine.match(/^\d+\.\s+\[.*?\]\(.*\)(\s+chevron_right)?$/)) {
			continue;
		}

		cleaned.push(line);
	}

	const result = cleaned.join("\n").replace(/\n{3,}/g, "\n\n");
	return result.trim();
}
