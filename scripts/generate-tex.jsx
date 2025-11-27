import React from "react";
import ReactDOMServer from "react-dom/server";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import TexHeader from "./components/tex/TexHeader.jsx";

// Get project root
const projectRoot = new URL("..", import.meta.url).pathname;

// Helper function to write .tex files
async function writeTexFile(filename, content) {
	// Set the output folder
	const outputDir = join(process.cwd(), "public", "tex", "manuscripts");
	mkdirSync(outputDir, { recursive: true });

	const filepath = join(outputDir, filename);
	writeFileSync(filepath, content, "utf8");
	console.log(`✓ Generated: ${filename} ${filepath}`);
}

// Main function to process all manuscripts
async function generateAllTex() {
	try {
		// Read the manuscripts JSON
		console.log("📖 Reading manuscripts data...");
		const manuscripts = JSON.parse(
			readFileSync(join(projectRoot, "src", "content", "data", "manuscripts.json"), "utf-8"),
		);

		console.log(`\n📚 Found ${manuscripts.length} manuscripts. Starting generation...\n`);

		// Loop through each manuscript
		for (const manuscript of manuscripts) {
			try {
				// Create a React component and convert to string
				const component = <TexHeader manuscript={manuscript} />;
				const texContent = ReactDOMServer.renderToStaticMarkup(component);

				// Generate filename using hit_id
				const filename = `${manuscript.hit_id}.tex`;

				// Write to file
				await writeTexFile(filename, texContent);
			} catch (error) {
				console.error(`✗ Error processing manuscript ${manuscript.id}:`, error.message);
			}
		}

		console.log("\n✨ Generation complete!");
	} catch (error) {
		console.error("Fatal error:", error);
		process.exit(1);
	}
}

// Run the script
generateAllTex();
