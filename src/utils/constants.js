/**
 * Constants shared across the application
 * Single Responsibility: Define constant values used throughout the codebase
 */

/**
 * Default resource patterns to block during scraping
 * These patterns match images, fonts, analytics, tracking scripts, and ads
 * Blocking them significantly improves scraping speed (~30% gain)
 */
export const DEFAULT_BLOCKED_PATTERNS = [
	"**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ico}",
	"**/analytics/**",
	"**/tracking/**",
	"**/ads/**",
	"**/ad-server/**",
	"**/doubleclick.net/**",
	"**/google-analytics/**",
	"**/googletagmanager/**",
	"**/facebook.net/**",
	"**/fbcdn.net/**",
];

/**
 * Default configuration values
 * These can be overridden by user-provided config
 */
export const DEFAULT_CONFIG = {
	// Playwright options - optimized for speed
	timeout: 8000,
	waitUntil: "domcontentloaded",
	headless: true,

	// Retry strategy
	maxRetries: 3,
	baseDelay: 1000,
	maxDelay: 30000,

	// Output
	outputDir: "./captures",
	skipExisting: true,

	// Browser launch args for stability
	browserArgs: [
		"--no-sandbox",
		"--disable-setuid-sandbox",
		"--disable-dev-shm-usage",
		"--disable-gpu",
	],
};

/**
 * Error type enumeration
 * Used for classifying and handling different error scenarios
 */
export const ErrorType = {
	NETWORK: "NETWORK_ERROR",
	TIMEOUT: "TIMEOUT_ERROR",
	PARSE: "PARSE_ERROR",
	VALIDATION: "VALIDATION_ERROR",
	RATE_LIMIT: "RATE_LIMIT_ERROR",
	FILE_EXISTS: "FILE_EXISTS_ERROR",
};

/**
 * HTTP status codes that are retryable
 * These indicate temporary failures that may succeed on retry
 */
export const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Error codes that indicate network issues
 * These are typically retryable
 */
export const RETRYABLE_ERROR_CODES = [
	"ETIMEDOUT",
	"ENOTFOUND",
	"ECONNRESET",
	"ECONNREFUSED",
];

/**
 * Progress bar characters
 */
export const PROGRESS_BAR = {
	filled: "█",
	empty: " ",
	length: 30,
};

/**
 * Help text for CLI
 * Shown when user runs with --help flag
 */
export const HELP_TEXT = `
Scrappe-Tout - Ultra-Fast Web Scraper

USAGE:
  npm start [options]

OPTIONS:
  -n, --name <name>           Folder name (non-interactive mode only)
  -d, --output-dir <path>     Parent folder path (default: captures)
  -o, --overwrite             Overwrite existing files (disables skip-existing)
  -c, --continue              Skip existing files (default behavior)
  -h, --help                  Show this help message

HYBRID MODES:
  Interactive terminal (bash, zsh, ghostty, etc.)
    → TUI menu to choose/create/delete folders

  Non-interactive (Claude Code, CI, pipelines)
    → Uses --name or automatic timestamp

EXAMPLES:
  # Interactive terminal - TUI menu appears
  npm start

  # Claude Code / non-interactive - custom name
  npm start --name my-files-docs

  # With custom parent folder
  npm start --name api-docs --output-dir scrap-output

NOTES:
  - Files are saved as Markdown (.md)
  - Each URL creates a file with a short, readable name
  - Automatic detection of interactive/non-interactive mode

PERFORMANCE:
  - Average: ~1-2 seconds per URL
  - ~10-20x faster than single-file scripts
`;
