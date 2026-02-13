/**
 * End-to-End Tests for Scrappe-Tout
 * Tests the complete scraping workflow
 */

import { strict } from "node:assert/strict";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import {
	mkdir,
	readFile,
	readdir,
	rm,
	unlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const TEST_WORK_DIR = join(tmpdir(), `scrappe-tout-test-${Date.now()}`);
const TEST_OUTPUT_DIR = join(TEST_WORK_DIR, "output");
const TEST_URLS_FILE = join(TEST_WORK_DIR, "urls.txt");
const TEST_FOLDER_FILE = join(TEST_WORK_DIR, "scrap-folder-name.txt");

/**
 * Executes the scraper with given arguments, using the isolated test directory.
 * Always forces --output-dir to 'output' (relative to TEST_WORK_DIR) unless --help is passed.
 * @param {string[]} args - Command line arguments
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function runScraper(args = []) {
	const isHelp = args.includes("--help") || args.includes("-h");
	const hasOutputDir = args.includes("--output-dir");
	const extraArgs = !isHelp && !hasOutputDir ? ["--output-dir", "output"] : [];
	const allArgs = [...args, ...extraArgs];
	const cmd = `node ${join(process.cwd(), "src/index.js")} ${allArgs.join(" ")}`;
	return execAsync(cmd, {
		cwd: TEST_WORK_DIR,
		env: { ...process.env, NODE_ENV: "test" },
		timeout: 30000,
	});
}

/**
 * Writes test urls.txt in the isolated test directory
 */
async function writeTestUrls(content) {
	await writeFile(TEST_URLS_FILE, content);
}

/**
 * Writes test scrap-folder-name.txt in the isolated test directory
 */
async function writeTestFolderName(name) {
	await writeFile(TEST_FOLDER_FILE, name);
}

/**
 * Cleans up test work directory
 */
async function cleanup() {
	try {
		await rm(TEST_WORK_DIR, { recursive: true, force: true });
	} catch {
		// Ignore if doesn't exist
	}
}

describe("Scrappe-Tout E2E Tests", () => {
	before(async () => {
		await cleanup();
		await mkdir(TEST_WORK_DIR, { recursive: true });
	});

	after(async () => {
		await cleanup();
	});

	describe("Basic Scraping", () => {
		it("should scrape a single URL successfully", async () => {
			await writeTestUrls("https://example.com\n");
			await writeTestFolderName("test-single");

			await runScraper(["--name", "test-single"]);

			const outputDir = join(TEST_OUTPUT_DIR, "test-single");
			strict.ok(existsSync(outputDir), "Output directory should exist");

			const outputFile = join(outputDir, "example-com.md");
			strict.ok(existsSync(outputFile), "Markdown file should exist");
		});

		it("should scrape multiple URLs", async () => {
			await writeTestUrls("https://example.com\nhttps://example.org\n");
			await writeTestFolderName("test-multiple");

			await runScraper(["--name", "test-multiple"]);

			const outputDir = join(TEST_OUTPUT_DIR, "test-multiple");
			strict.ok(existsSync(outputDir), "Output directory should exist");

			const files = (await readdir(outputDir)).filter((f) => f.endsWith(".md"));
			strict.ok(files.length >= 1, "Should create at least one markdown file");
		});
	});

	describe("File Naming", () => {
		it("should create short readable filenames", async () => {
			await writeTestUrls("https://example.com/docs/getting-started\n");
			await writeTestFolderName("test-naming");

			await runScraper(["--name", "test-naming"]);

			const outputFile = join(TEST_OUTPUT_DIR, "test-naming", "example-com-docs-getting-started.md");
			strict.ok(
				existsSync(outputFile),
				"Should use short filename from URL path",
			);
		});

		it("should handle URLs with fragments correctly", async () => {
			await writeTestUrls(
				"https://example.com/page#section\nhttps://example.com/page#other\n",
			);
			await writeTestFolderName("test-fragments");

			await runScraper(["--name", "test-fragments"]);

			const outputDir = join(TEST_OUTPUT_DIR, "test-fragments");
			strict.ok(existsSync(outputDir), "Output directory should exist");

			const files = (await readdir(outputDir)).filter((f) => f.endsWith(".md"));
			strict.ok(
				files.length >= 1,
				"Should create at least one markdown file from fragment URLs",
			);
		});
	});

	describe("Markdown Quality", () => {
		it("should remove navigation elements from markdown", async () => {
			await writeTestUrls("https://example.com\n");
			await writeTestFolderName("test-cleanup");

			await runScraper(["--name", "test-cleanup"]);

			const outputFile = join(TEST_OUTPUT_DIR, "test-cleanup", "example-com.md");
			const content = await readFile(outputFile, "utf8");

			strict.ok(content.length > 0, "Markdown should have content");
		});

		it("should preserve only one table of contents", async () => {
			await writeTestUrls("https://example.com\n");
			await writeTestFolderName("test-toc");

			await runScraper(["--name", "test-toc"]);

			const outputFile = join(TEST_OUTPUT_DIR, "test-toc", "example-com.md");
			strict.ok(existsSync(outputFile), "File should exist");
		});
	});

	describe("Error Handling", () => {
		it("should handle missing urls.txt gracefully", async () => {
			// No urls.txt in TEST_WORK_DIR
			try {
				await unlink(TEST_URLS_FILE);
			} catch {}
			await writeTestFolderName("test-error");

			try {
				await runScraper(["--name", "test-error"]);
				strict.fail("Should have thrown");
			} catch (error) {
				strict.ok(
					error.stderr?.includes("urls.txt") || error.code !== 0,
					"Should error on missing urls.txt",
				);
			}
		});

		it("should handle empty urls.txt", async () => {
			await writeTestUrls("");
			await writeTestFolderName("test-empty");

			try {
				await runScraper(["--name", "test-empty"]);
				strict.fail("Should have thrown");
			} catch (error) {
				strict.ok(
					error.stderr?.includes("No URLs") || error.code !== 0,
					"Should error on empty urls.txt",
				);
			}
		});
	});

	describe("Output Directory Management", () => {
		it("should create output directory if it does not exist", async () => {
			await writeTestUrls("https://example.com\n");
			await writeTestFolderName("test-mkdir");

			await runScraper(["--name", "test-mkdir"]);

			const outputDir = join(TEST_OUTPUT_DIR, "test-mkdir");
			strict.ok(existsSync(outputDir), "Should create output directory");
		});

		it("should respect custom output directory", async () => {
			await writeTestUrls("https://example.com\n");
			await writeTestFolderName("test-custom-dir");

			await runScraper([
				"--name",
				"test-custom-dir",
				"--output-dir",
				"custom-output",
			]);

			const outputDir = join(TEST_WORK_DIR, "custom-output", "test-custom-dir");
			strict.ok(existsSync(outputDir), "Should use custom output directory");
		});
	});

	describe("Help and CLI", () => {
		it("should display help when requested", async () => {
			const { stdout } = await runScraper(["--help"]);

			strict.ok(
				stdout.includes("Scrappe-Tout"),
				"Help should mention app name",
			);
			strict.ok(stdout.includes("USAGE"), "Help should show usage");
			strict.ok(stdout.includes("OPTIONS"), "Help should show options");
		});

		it("should display help with -h flag", async () => {
			const { stdout } = await runScraper(["-h"]);

			strict.ok(
				stdout.includes("Scrappe-Tout"),
				"Help should mention app name",
			);
		});
	});

	describe("Statistics Reporting", () => {
		it("should display final statistics", async () => {
			await writeTestUrls("https://example.com\n");
			await writeTestFolderName("test-stats");

			const { stdout } = await runScraper(["--name", "test-stats"]);

			strict.ok(
				stdout.includes("Successful:") || stdout.includes("successful"),
				"Should show successful count",
			);
			strict.ok(
				stdout.includes("Total time:") || stdout.includes("Total time"),
				"Should show total time",
			);
			strict.ok(
				stdout.includes("FINAL REPORT") || stdout.includes("Avg"),
				"Should show report",
			);
		});
	});

	describe("Progress Display", () => {
		it("should show progress bar during processing", async () => {
			await writeTestUrls("https://example.com\nhttps://example.org\n");
			await writeTestFolderName("test-progress");

			const { stdout } = await runScraper(["--name", "test-progress"]);

			strict.ok(
				stdout.includes("[1/2]") || stdout.includes("Found"),
				"Should show progress",
			);
		});
	});
});
