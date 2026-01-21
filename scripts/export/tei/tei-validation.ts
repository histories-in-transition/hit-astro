/**
 * Downloads schema with all dependencies (only if not present)
 * @param {string} baseUrl - Base URL for schema
 * @param {string} schemaDir - Local directory to save schemas
 * @returns {Promise<boolean>} Success status
 */
async function downloadSchemaWithDependencies(baseUrl, schemaDir) {
	const dependencies = ["cataloguing.xsd", "dcr.xsd", "teix.xsd", "xml.xsd"];

	console.log("🔍 Checking TEI schemas...");

	// Check which schemas are missing
	const missingSchemas = [];
	let existingCount = 0;

	for (const dep of dependencies) {
		const depPath = join(schemaDir, dep);

		try {
			const content = readFileSync(depPath, "utf-8");

			// Basic validation - check if file is not empty and looks like XML
			if (content.length > 100 && content.includes("<?xml") && content.includes("schema")) {
				console.log(`✅ ${dep} already exists (${content.length} bytes)`);
				existingCount++;
			} else {
				console.log(`⚠️  ${dep} exists but appears corrupted - will re-download`);
				missingSchemas.push(dep);
			}
		} catch (error) {
			console.log(`❌ ${dep} missing`);
			missingSchemas.push(dep);
		}
	}

	if (missingSchemas.length === 0) {
		console.log(`✅ All ${dependencies.length} schemas are present - no downloads needed`);
		return true;
	}

	console.log(`📥 Downloading ${missingSchemas.length} missing schemas...`);

	let downloadedCount = 0;

	for (const dep of missingSchemas) {
		const depUrl = `${baseUrl}/${dep}`;
		const depPath = join(schemaDir, dep);

		try {
			console.log(`📥 Downloading ${dep}...`);
			const response = await fetch(depUrl);

			if (!response.ok) {
				console.log(`⚠️  Failed to download ${dep} (HTTP ${response.status})`);
				continue;
			}

			const schemaContent = await response.text();

			// Basic validation before saving
			if (schemaContent.length < 100 || !schemaContent.includes("<?xml")) {
				console.log(`⚠️  Downloaded ${dep} appears invalid - skipping`);
				continue;
			}

			writeFileSync(depPath, schemaContent);
			console.log(`✅ Downloaded ${dep} (${schemaContent.length} bytes)`);
			downloadedCount++;
		} catch (fetchError) {
			console.log(`⚠️  Failed to download ${dep}: ${fetchError.message}`);
		}
	}

	console.log(
		`📊 Schema summary: ${existingCount} existing, ${downloadedCount} downloaded, ${missingSchemas.length - downloadedCount} failed`,
	);

	// Return true if we have at least the main schema
	const mainSchemaPath = join(schemaDir, "cataloguing.xsd");
	try {
		const mainSchema = readFileSync(mainSchemaPath, "utf-8");
		return mainSchema.length > 100 && mainSchema.includes("<?xml");
	} catch (error) {
		console.log("❌ Main schema (cataloguing.xsd) not available");
		return false;
	}
}

/**
 * Checks if xmllint is available
 * @returns {boolean} - True if xmllint is available
 */
function checkXmllintAvailable() {
	try {
		execSync("xmllint --version", { stdio: "pipe" });
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Well-formedness validation
 * @param {string} xmlContent - XML content
 * @param {string} filename - Filename
 * @returns {object} Validation result
 */
function validateWellFormedness(xmlContent, filename) {
	const errors = [];

	const errorHandler = {
		warning: (msg) => errors.push(`Warning: ${msg}`),
		error: (msg) => errors.push(`Error: ${msg}`),
		fatalError: (msg) => errors.push(`Fatal Error: ${msg}`),
	};

	try {
		const parser = new DOMParser({ onError: errorHandler });
		parser.parseFromString(xmlContent, "application/xml");

		// Also use fast-xml-parser for additional validation
		const isValid = XMLValidator.validate(xmlContent);
		if (isValid !== true) {
			errors.push(`XML Parser: ${isValid.err?.msg || "Invalid XML"}`);
		}

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

/**
 * Schema validation using xmllint
 * @param {string} xmlFilePath - Path to XML file
 * @param {string} schemaPath - Path to XSD schema
 * @param {string} filename - Filename for error reporting
 * @returns {object} Validation result
 */
function validateAgainstSchema(xmlFilePath, schemaPath, filename) {
	try {
		// Use xmllint to validate against schema
		const command = `xmllint --noout --schema "${schemaPath}" "${xmlFilePath}"`;

		execSync(command, {
			stdio: "pipe",
			encoding: "utf8",
		});

		return {
			success: true,
			errors: [],
			filename: filename,
		};
	} catch (error) {
		// Parse xmllint error output
		const errorOutput = error.stderr || error.stdout || error.message;
		const errors = errorOutput
			.split("\n")
			.filter((line) => line.trim())
			.filter((line) => !line.includes("validates")) // Remove success messages
			.filter((line) => !line.includes("<?xml")) // Remove XML declarations in error output
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		return {
			success: false,
			errors: errors.length > 0 ? errors : ["Schema validation failed"],
			filename: filename,
		};
	}
}

/**
 * Basic TEI fallback validation (when xmllint not available)
 * @param {string} xmlContent - XML content
 * @param {string} filename - Filename
 * @returns {object} Validation result
 */
function validateTEIFallback(xmlContent, filename) {
	const errors = [];

	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(xmlContent, "application/xml");

		// Basic TEI structure checks
		if (!doc.documentElement || doc.documentElement.tagName !== "TEI") {
			errors.push("Root element must be <TEI>");
		}

		const requiredElements = ["teiHeader", "text", "fileDesc", "sourceDesc", "msDesc"];
		requiredElements.forEach((elementName) => {
			const elements = doc.getElementsByTagName(elementName);
			if (elements.length === 0) {
				errors.push(`Missing required element: ${elementName}`);
			}
		});

		return {
			success: errors.length === 0,
			errors: errors,
			filename: filename,
		};
	} catch (error) {
		return {
			success: false,
			errors: [`Exception during TEI validation: ${error.message}`],
			filename: filename,
		};
	}
}

// Main execution
async function main() {
	console.log("🏗️  Starting TEI generation...");

	const isCI = process.env.CI === "true";
	const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

	if (isCI) {
		console.log("🔧 Running in CI environment");
		if (isGitHubActions) {
			console.log("🐙 GitHub Actions detected");
		}
	}

	// Read the source JSON file
	console.log("📖 Reading manuscripts data...");
	const mss = JSON.parse(
		readFileSync(join(process.cwd(), "src", "content", "data", "manuscripts.json"), "utf-8"),
	);

	// Set the output folder
	const mssFolderPath = join(process.cwd(), "public", "tei", "manuscripts");
	mkdirSync(mssFolderPath, { recursive: true });

	// Eta views path
	const eta = new Eta({ views: join(process.cwd(), "tei-templates") });

	console.log(`🏭 Generating TEI for ${mss.length} manuscripts...\n`);

	let successCount = 0;
	let wellFormednessErrors = 0;
	let schemaErrors = 0;
	const validationResults = [];

	// check for schemata
	let hasXmllint = false;
	let hasValidSchema = false;
	const schemaDir = join(process.cwd(), "schemas");
	const schemaBaseUrl = "https://diglib.hab.de/rules/schema/mss/v1.0";
	const schemaPath = join(schemaDir, "cataloguing.xsd");
	if (!isCI) {
		hasXmllint = checkXmllintAvailable();
		mkdirSync(schemaDir, { recursive: true });
		if (hasXmllint) {
			hasValidSchema = await downloadSchemaWithDependencies(schemaBaseUrl, schemaDir);
			if (!hasValidSchema) {
				console.log("❌ Failed to obtain valid schema - skipping schema validation");
			}
		}
	}

	for (const [index, ms] of mss.entries()) {
		const filename = ms.hit_id ? `${ms.hit_id}.xml` : `manuscript_${ms.id}.xml`;

		try {
			// Render the template with manuscript data
			const xml = eta.render("./manuscript.eta", ms);

			// Write the XML file
			const xmlFilePath = join(mssFolderPath, filename);
			writeFileSync(xmlFilePath, xml);
			// Valicadation only if not in CI, no validation for gitHub Actions
			if (!isGitHubActions || !isCI) {
				// Only validate locally not in CI
				const hasXmllint = checkXmllintAvailable();
				let schemaValidation, wellFormedness;

				// Step 1: Well-formedness validation
				wellFormedness = validateWellFormedness(xml, filename);

				if (!wellFormedness.success) {
					console.log(`❌ [${index + 1}/${mss.length}] ${filename} - Well-formedness failed:`);
					wellFormedness.errors.forEach((error) => {
						console.log(`   ${error}`);
					});
					wellFormednessErrors++;
					validationResults.push({ ...wellFormedness, type: "well-formedness" });
					continue;
				}

				// Step 2: Schema validation (use result from above)
				if (hasXmllint && hasValidSchema) {
					schemaValidation = validateAgainstSchema(xmlFilePath, schemaPath, filename);
				} else {
					schemaValidation = validateTEIFallback(xml, filename);
				}

				if (!schemaValidation.success) {
					console.log(`⚠️  [${index + 1}/${mss.length}] ${filename} - Schema validation failed:`);
					schemaValidation.errors.forEach((error) => {
						console.log(`   ${error}`);
					});
					schemaErrors++;
					validationResults.push({ ...schemaValidation, type: "schema" });
				} else {
					console.log(`✅ [${index + 1}/${mss.length}] ${filename} - Generated and validated`);
				}
			} else {
				console.log(`✅ [${index + 1}/${mss.length}] ${filename} - Generated`);
			}

			successCount++;
		} catch (error) {
			console.log(`💥 [${index + 1}/${mss.length}] Error processing manuscript:`, error.message);
			wellFormednessErrors++;
			validationResults.push({
				filename: filename,
				success: false,
				errors: [error.message],
				type: "generation",
			});
		}
	}

	// Summary
	console.log("\n═══════════════════════════════════════");
	console.log("🏁 GENERATION SUMMARY");
	console.log("═══════════════════════════════════════");
	console.log(`📊 Total manuscripts: ${mss.length}`);
	console.log(`✅ Successfully generated: ${successCount}`);
	if (isCI) {
		console.log(`❌ Well-formedness errors: ${wellFormednessErrors}`);
		console.log(`⚠️  Schema validation errors: ${schemaErrors}`);
		if (validationResults.length > 0) {
			console.log("\n📋 Files with issues:");
			validationResults.forEach((result) => {
				console.log(`   • ${result.filename} (${result.type})`);
			});
		}
	}

	// Exit codes for CI
	if (isCI && wellFormednessErrors > 0) {
		console.log("\n💥 Critical errors found - failing build");
		process.exit(1);
	} else {
		console.log("\n🎉 All TEI files generated successfully!");
		if (isCI && schemaErrors > 0) {
			console.log("⚠️  Some schema validation warnings - check output above");
			console.log("🔧 Continuing build despite schema warnings in CI");
		}
	}
}

// Run the main function
main().catch((error) => {
	console.error("💥 Fatal error:", error.message);
	process.exit(1);
});
