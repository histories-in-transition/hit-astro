import { Eta } from "eta";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { DOMParser } from "@xmldom/xmldom";

// Get project root (one level up from current file)
const projectRoot = new URL("..", import.meta.url).pathname;

// function to validate XML content
/**
 * Validates XML content for well-formedness
 * @param {string} xmlContent - XML content to validate
 * @param {string} filename - Filename for error reporting
 * @returns {object} Validation result
 */
function validateXML(xmlContent, filename) {
	const errors = [];

	const errorHandler = {
		warning: (msg) => errors.push(`Warning: ${msg}`),
		error: (msg) => errors.push(`Error: ${msg}`),
		fatalError: (msg) => errors.push(`Fatal Error: ${msg}`),
	};

	try {
		const parser = new DOMParser({ onError: errorHandler });
		parser.parseFromString(xmlContent, "application/xml");

		return {
			success: errors.length === 0,
			errors: errors,
			filename: filename,
		};
	} catch (error) {
		return {
			success: false,
			errors: [`Exception: ${error.message}`],
			filename: filename,
		};
	}
}

// read the source json file
const mss = JSON.parse(
	readFileSync(join(projectRoot, "src", "content", "data", "manuscripts.json"), "utf-8"),
);
// set the output folder
const mssFolderPath = join(process.cwd(), "public", "tei", "manuscripts");
mkdirSync(mssFolderPath, { recursive: true });

// Eta views path
const eta = new Eta({ views: join(process.cwd(), "tei-templates") });

console.log(`Generating TEI for ${mss.length} manuscripts...\n`);

let successCount = 0;
let errorCount = 0;
const validationErrors = [];

mss.forEach((ms, index) => {
	try {
		// Render the template with manuscript data
		const xml = eta.render("./manuscript.eta", ms);

		// Use hit_id as unique identifier for the filename
		const filename = ms.hit_id ? `${ms.hit_id}.xml` : `manuscript_${ms.id}.xml`;

		// Validate the generated XML before writing
		const validation = validateXML(xml, filename);

		if (validation.success) {
			// Write the XML file only if it's valid
			writeFileSync(join(mssFolderPath, filename), xml);
			successCount++;
		} else {
			console.log(`❌ [${index + 1}/${mss.length}] ${filename} - Validation failed:`);
			validation.errors.forEach((error) => {
				console.log(`   ${error}`);
			});
			validationErrors.push(validation);
			errorCount++;
		}
	} catch (error) {
		console.log(`💥 [${index + 1}/${mss.length}] Error processing manuscript:`, error.message);
		errorCount++;
	}
});

// Summary log
console.log(`✅ Successfully generated: ${successCount}`);
console.log(`❌ Failed generation/validation: ${errorCount}`);
