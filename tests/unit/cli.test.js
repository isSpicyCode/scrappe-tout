/**
 * CLI Parser Tests
 * Tests the parseArgs and showHelp functions from cli.js
 */

import { strict } from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArgs, showHelp } from "../../src/utils/cli.js";

describe("CLI Parser", () => {
	describe("parseArgs", () => {
		it("should return default values when no arguments provided", () => {
			const args = parseArgs([]);

			strict.strictEqual(args.outputDir, null);
			strict.strictEqual(args.overwrite, false);
			strict.strictEqual(args.continue, true);
			strict.strictEqual(args.showHelp, false);
		});

		it("should parse --help flag", () => {
			const args = parseArgs(["--help"]);

			strict.strictEqual(args.showHelp, true);
			strict.strictEqual(args.overwrite, false);
			strict.strictEqual(args.continue, true);
		});

		it("should parse -h flag", () => {
			const args = parseArgs(["-h"]);

			strict.strictEqual(args.showHelp, true);
		});

		it("should parse --overwrite flag", () => {
			const args = parseArgs(["--overwrite"]);

			strict.strictEqual(args.overwrite, true);
			strict.strictEqual(args.continue, false);
		});

		it("should parse -o flag", () => {
			const args = parseArgs(["-o"]);

			strict.strictEqual(args.overwrite, true);
			strict.strictEqual(args.continue, false);
		});

		it("should parse --continue flag", () => {
			const args = parseArgs(["--continue"]);

			strict.strictEqual(args.continue, true);
			strict.strictEqual(args.overwrite, false);
		});

		it("should parse -c flag", () => {
			const args = parseArgs(["-c"]);

			strict.strictEqual(args.continue, true);
			strict.strictEqual(args.overwrite, false);
		});

		it("should parse --output-dir with value", () => {
			const args = parseArgs(["--output-dir", "test-folder"]);

			strict.strictEqual(args.outputDir, "test-folder");
			strict.strictEqual(args.overwrite, false);
			strict.strictEqual(args.continue, true);
		});

		it("should parse -d with value", () => {
			const args = parseArgs(["-d", "my-docs"]);

			strict.strictEqual(args.outputDir, "my-docs");
			strict.strictEqual(args.overwrite, false);
			strict.strictEqual(args.continue, true);
		});

		it("should parse multiple arguments", () => {
			const args = parseArgs(["--output-dir", "my-files", "--overwrite"]);

			strict.strictEqual(args.outputDir, "my-files");
			strict.strictEqual(args.overwrite, true);
			strict.strictEqual(args.continue, false);
		});

		it("should handle --output-dir without value gracefully", () => {
			const args = parseArgs(["--output-dir"]);

			strict.strictEqual(args.outputDir, null);
			strict.strictEqual(args.overwrite, false);
			strict.strictEqual(args.continue, true);
		});

		it("should parse --continue and --output-dir together", () => {
			const args = parseArgs(["--continue", "--output-dir", "docs"]);

			strict.strictEqual(args.outputDir, "docs");
			strict.strictEqual(args.continue, true);
			strict.strictEqual(args.overwrite, false);
		});

		it("should parse --overwrite and --output-dir together", () => {
			const args = parseArgs(["--overwrite", "--output-dir", "output"]);

			strict.strictEqual(args.outputDir, "output");
			strict.strictEqual(args.overwrite, true);
			strict.strictEqual(args.continue, false);
		});

		it("should handle unknown arguments gracefully", () => {
			const args = parseArgs(["--unknown", "another-unknown"]);

			strict.strictEqual(args.outputDir, null);
			strict.strictEqual(args.overwrite, false);
			strict.strictEqual(args.continue, true);
		});

		it("should handle mixed short and long flags", () => {
			const args = parseArgs(["-h", "-d", "test", "--overwrite", "-c"]);

			strict.strictEqual(args.showHelp, true);
			strict.strictEqual(args.outputDir, "test");
			// Last flag wins: -c sets continue=true, overwrite=false
			strict.strictEqual(args.overwrite, false);
			strict.strictEqual(args.continue, true);
		});
	});

	describe("showHelp", () => {
		it("should display help message", () => {
			// Capture console.log output
			const logs = [];
			const originalLog = console.log;

			console.log = (...args) => logs.push(args.join(" "));

			showHelp();

			// Restore console.log
			console.log = originalLog;

			// Verify help was logged (showHelp doesn't call process.exit)
			strict.ok(logs.length > 0);
			strict.ok(logs.some((log) => log.includes("Scrappe-Tout")));
		});
	});
});
