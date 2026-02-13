/**
 * Logger Service
 * Single Responsibility: Provide structured logging with context and levels
 */

import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Log levels with corresponding severity
 */
export const LogLevel = {
	DEBUG: "debug",
	INFO: "info",
	WARN: "warn",
	ERROR: "error",
	SUCCESS: "success",
};

/**
 * Log level priority for filtering (higher = more important)
 */
const LevelPriority = {
	[LogLevel.DEBUG]: 0,
	[LogLevel.INFO]: 1,
	[LogLevel.WARN]: 2,
	[LogLevel.ERROR]: 3,
	[LogLevel.SUCCESS]: 4,
};

/**
 * Minimum level for file output
 * Only ERROR goes to file (minimal logging for bugs only)
 */
const FILE_MIN_LEVEL = LevelPriority[LogLevel.ERROR];

/**
 * Minimum level for console output
 * DEBUG and INFO go to file only, not console
 */
const CONSOLE_MIN_LEVEL = LevelPriority[LogLevel.WARN];

/**
 * ANSI color codes for terminal output
 */
const Colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",

	black: "\x1b[30m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
};

/**
 * Color mappings for log levels
 */
const LevelColors = {
	[LogLevel.DEBUG]: Colors.dim,
	[LogLevel.INFO]: Colors.blue,
	[LogLevel.WARN]: Colors.yellow,
	[LogLevel.ERROR]: Colors.red,
	[LogLevel.SUCCESS]: Colors.green,
};

/**
 * Global log file path - set once per script run
 */
let globalLogFile = null;
let globalLogName = null;

/**
 * Creates timestamped log directory and file
 * @param {string} runName - Name of the scraping run (folder name)
 * @returns {Promise<string>} Path to log file
 */
async function createLogFile(runName = "scrape") {
	if (globalLogFile) {
		return globalLogFile;
	}

	// Create logs directory
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const logsDir = join(__dirname, "../../logs");
	await mkdir(logsDir, { recursive: true });

	// Sanitize run name for filename
	const sanitizedName = runName
		.replace(/[^a-zA-Z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
	const logFileName = `${sanitizedName}-${timestamp}.log`;
	globalLogFile = join(logsDir, logFileName);
	globalLogName = sanitizedName;

	return globalLogFile;
}

/**
 * Initializes the log file at startup with run name
 * Call this once in main entry point
 * @param {string} runName - Name of the scraping run (folder name)
 */
export async function initLogFile(runName = "scrape") {
	await createLogFile(runName);
}

/**
 * Writes log entry to file
 * Only writes ERROR level (minimal logging for bugs only)
 * @param {object} entry - Log entry to write
 */
async function writeToFile(entry) {
	// Only write ERROR level to file
	if (LevelPriority[entry.level] < FILE_MIN_LEVEL) {
		return;
	}

	try {
		const logFile = await createLogFile();
		const logLine = `${JSON.stringify(entry)}\n`;
		await appendFile(logFile, logLine, "utf8");
	} catch (error) {
		// Silently fail to avoid infinite loop of logging errors
	}
}

/**
 * Logger class for structured logging
 */
class Logger {
	/**
	 * Creates a new logger instance
	 * @param {object} context - Default context for all log entries
	 */
	constructor(context = {}) {
		this.context = context;
	}

	/**
	 * Logs a debug message
	 * @param {string} message - Log message
	 * @param {object} data - Additional data to log
	 */
	debug(message, data = {}) {
		this.log(LogLevel.DEBUG, message, data);
	}

	/**
	 * Logs an info message
	 * @param {string} message - Log message
	 * @param {object} data - Additional data to log
	 */
	info(message, data = {}) {
		this.log(LogLevel.INFO, message, data);
	}

	/**
	 * Logs a warning message
	 * @param {string} message - Log message
	 * @param {object} data - Additional data to log
	 */
	warn(message, data = {}) {
		this.log(LogLevel.WARN, message, data);
	}

	/**
	 * Logs an error message
	 * @param {string} message - Log message
	 * @param {Error|object} error - Error object or additional data
	 */
	error(message, error = {}) {
		this.log(LogLevel.ERROR, message, error);
	}

	/**
	 * Logs a success message
	 * @param {string} message - Log message
	 * @param {object} data - Additional data to log
	 */
	success(message, data = {}) {
		this.log(LogLevel.SUCCESS, message, data);
	}

	/**
	 * Core logging method
	 * Creates structured log entry and outputs to file and optionally console
	 *
	 * @param {string} level - Log level
	 * @param {string} message - Log message
	 * @param {object} data - Additional data
	 */
	log(level, message, data = {}) {
		const entry = this.createLogEntry(level, message, data);

		// Write to file (all levels)
		writeToFile(entry);

		// Output JSON log for machine parsing (if enabled)
		this.outputJsonLog(entry);

		// Output formatted console log for humans (filtered by level)
		this.outputConsoleLog(entry);
	}

	/**
	 * Creates a structured log entry
	 *
	 * @param {string} level - Log level
	 * @param {string} message - Log message
	 * @param {object} data - Additional data
	 * @returns {object} Structured log entry
	 */
	createLogEntry(level, message, data) {
		return {
			level,
			message,
			timestamp: new Date().toISOString(),
			context: { ...this.context, ...data },
		};
	}

	/**
	 * Outputs log entry as JSON (for machine parsing)
	 * Only outputs if LOG_JSON environment variable is set
	 *
	 * @param {object} entry - Log entry
	 */
	outputJsonLog(entry) {
		if (process.env.LOG_JSON === "true") {
			console.log(JSON.stringify(entry));
		}
	}

	/**
	 * Outputs formatted log to console (for humans)
	 * Filters out DEBUG and INFO - only WARN/ERROR/SUCCESS shown
	 *
	 * @param {object} entry - Log entry
	 */
	outputConsoleLog(entry) {
		// Skip if JSON-only mode
		if (process.env.LOG_JSON === "true") {
			return;
		}

		// Filter: only show WARN and above in console
		const priority = LevelPriority[entry.level] ?? 0;
		if (priority < CONSOLE_MIN_LEVEL) {
			return;
		}

		const color = LevelColors[entry.level] || Colors.reset;
		const levelUpper = entry.level.toUpperCase().padEnd(7);

		console.log(`${color}[${levelUpper}]${Colors.reset} ${entry.message}`);
	}

	/**
	 * Creates a new logger with additional context
	 * Useful for adding context to a series of related logs
	 *
	 * @param {object} additionalContext - Context to add
	 * @returns {Logger} New logger instance with merged context
	 */
	withContext(additionalContext) {
		return new Logger({ ...this.context, ...additionalContext });
	}

	/**
	 * Creates a child logger for a specific component
	 *
	 * @param {string} component - Component name
	 * @returns {Logger} New logger instance for the component
	 */
	forComponent(component) {
		return new Logger({ ...this.context, component });
	}
}

/**
 * Default logger instance
 * Use this for general logging throughout the application
 */
export const logger = new Logger();

/**
 * Creates a logger for a specific component
 * Shortcut for logger.forComponent()
 *
 * @param {string} component - Component name
 * @returns {Logger} Logger instance for the component
 */
export function createLogger(component) {
	return logger.forComponent(component);
}

export default Logger;
