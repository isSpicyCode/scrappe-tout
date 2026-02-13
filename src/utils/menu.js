/**
 * Menu Module
 * Single Responsibility: Interactive terminal UI for folder selection
 */

import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

/**
 * Creates a readline interface for user input
 * @returns {Promise<object>} Readline interface
 */
async function createReadlineInterface() {
	const readline = (await import("node:readline")).createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return readline;
}

/**
 * Prompts user for a single character input
 * @param {string} question - Question to display
 * @returns {Promise<string>} User's answer
 */
async function promptChar(question) {
	const readline = await createReadlineInterface();

	return new Promise((resolve) => {
		readline.question(question, (answer) => {
			readline.close();
			resolve(answer.trim().toLowerCase());
		});
	});
}

/**
 * Prompts user for a text input
 * @param {string} question - Question to display
 * @returns {Promise<string>} User's answer
 */
async function promptText(question) {
	const readline = await createReadlineInterface();

	return new Promise((resolve) => {
		readline.question(question, (answer) => {
			readline.close();
			resolve(answer.trim());
		});
	});
}

/**
 * Lists existing folders in a directory
 * @param {string} baseDir - Base directory path
 * @returns {string[]} Array of folder names
 */
function listFolders(baseDir) {
	if (!existsSync(baseDir)) {
		return [];
	}

	try {
		return readdirSync(baseDir, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);
	} catch (error) {
		return [];
	}
}

/**
 * Displays the folder menu and returns the selected folder name
 * @param {string} baseDir - Base directory path
 * @param {string} defaultFolder - Default folder name
 * @returns {Promise<string>} Selected folder name
 */
export async function showFolderMenu(baseDir, defaultFolder) {
	const folders = listFolders(baseDir);

	console.log("");
	console.log("============================================================");
	console.log("  FOLDER MENU - Select an option");
	console.log("============================================================");

	if (folders.length > 0) {
		console.log("  Existing folders:");
		folders.forEach((folder, index) => {
			const marker = folder === defaultFolder ? " [default]" : "";
			console.log(`    ${index + 1}. ${folder}${marker}`);
		});
		console.log("");
	}

	console.log("  Options:");
	console.log(`    N - Create new folder (default: "${defaultFolder}")`);
	console.log("    D - Use default folder");
	console.log("    X - Delete existing folder");
	console.log("    Q - Quit");
	console.log("============================================================");

	const answer = await promptChar("Your choice: ");

	// Handle different user choices
	if (answer === "q" || answer === "Q") {
		console.log("Exiting...");
		process.exit(0);
	}

	if (answer === "d" || answer === "D") {
		return defaultFolder;
	}

	if (answer === "n" || answer === "N") {
		const customName = await promptText(
			`Enter folder name (Enter for "${defaultFolder}"): `,
		);
		return customName || defaultFolder;
	}

	if (answer === "x" || answer === "X") {
		if (folders.length === 0) {
			console.log("No folders to delete.");
			return await showFolderMenu(baseDir, defaultFolder);
		}

		console.log("");
		console.log("Select folder to delete:");
		folders.forEach((folder, index) => {
			console.log(`  ${index + 1}. ${folder}`);
		});
		console.log("  0. Cancel");

		const deleteChoice = await promptChar("Delete folder number: ");
		const folderIndex = Number.parseInt(deleteChoice, 10) - 1;

		if (folderIndex >= 0 && folderIndex < folders.length) {
			const folderToDelete = folders[folderIndex];
			const confirm = await promptChar(`Delete "${folderToDelete}"? (y/N): `);

			if (confirm === "y" || confirm === "Y") {
				const folderPath = join(baseDir, folderToDelete);
				rmSync(folderPath, { recursive: true, force: true });
				console.log(`Deleted "${folderToDelete}"`);
			}
		}

		// Show menu again
		return await showFolderMenu(baseDir, defaultFolder);
	}

	// Check if user entered a folder number
	const folderNumber = Number.parseInt(answer, 10);
	if (folderNumber > 0 && folderNumber <= folders.length) {
		return folders[folderNumber - 1];
	}

	// Invalid choice, show menu again
	console.log("Invalid choice. Please try again.");
	return await showFolderMenu(baseDir, defaultFolder);
}
