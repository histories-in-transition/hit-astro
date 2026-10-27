import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Manuscript } from "@/types";
import { log } from "@acdh-oeaw/lib";
import format from "xml-formatter";

import { makeIndexPage } from "./indexXml.ts";
import { mainTei } from "./partials/tei.ts";
import { prepareSchema } from "./schemas.ts";
import { checkWellFormed, validateAgainstSchema, validateTeiStructure } from "./validate.ts";

interface Problem {
	filename: string;
	type: "generation" | "well-formedness" | "schema";
	errors: string[];
}

function getFilename(ms: Manuscript): string {
	return ms.hit_id ? `${ms.hit_id}.xml` : `manuscript_${ms.id}.xml`;
}

function formatXml(xml: string): string {
	return format(xml, {
		indentation: "  ",
		collapseContent: true,
		lineSeparator: "\n",
	});
}

async function makeTei() {
	log.info("Starting TEI generation...");

	// Schema validation needs xmllint and a download, so we only do it locally, not in CI
	const isCI = process.env.CI === "true";
	const shouldValidate = !isCI;

	const manuscripts = JSON.parse(
		readFileSync(join(process.cwd(), "src", "content", "data", "manuscripts.json"), "utf-8"),
	) as Manuscript[];
	log.info(`Found ${manuscripts.length} manuscripts`);

	const outputFolder = join(process.cwd(), "public", "download", "tei");
	mkdirSync(outputFolder, { recursive: true });

	const schemaPath = shouldValidate ? await prepareSchema(join(process.cwd(), "schemas")) : null;

	const problems: Problem[] = [];

	for (const ms of manuscripts) {
		const filename = getFilename(ms);
		const filePath = join(outputFolder, filename);

		try {
			const rawXml = mainTei(ms);

			// 1. Well-formedness: always checked, it is fast
			const wellFormed = checkWellFormed(rawXml);
			if (!wellFormed.success) {
				// Write the unformatted file anyway, so it can be inspected
				writeFileSync(filePath, rawXml, "utf-8");
				problems.push({ filename, type: "well-formedness", errors: wellFormed.errors });
				continue;
			}

			// 2. Pretty-print and write
			writeFileSync(filePath, formatXml(rawXml), "utf-8");

			// 3. Schema validation (local only)
			if (shouldValidate) {
				const result = schemaPath
					? validateAgainstSchema(filePath, schemaPath)
					: validateTeiStructure(rawXml);

				if (!result.success) {
					problems.push({ filename, type: "schema", errors: result.errors });
				}
			}
		} catch (error) {
			problems.push({
				filename,
				type: "generation",
				errors: [error instanceof Error ? error.message : String(error)],
			});
		}
	}

	writeFileSync(
		join(outputFolder, "index.html"),
		makeIndexPage(manuscripts.map((ms) => ({ filename: getFilename(ms), ms }))),
		"utf-8",
	);

	// ---------- summary ----------
	for (const { filename, type, errors } of problems) {
		const report = type === "schema" ? log.warn : log.error;
		report(`${filename} (${type}):\n  ${errors.join("\n  ")}`);
	}

	// Schema problems are warnings, everything else breaks the build
	const criticalCount = problems.filter((p) => p.type !== "schema").length;
	log.info(
		`Done: ${manuscripts.length} manuscripts, ${criticalCount} errors, ${problems.length - criticalCount} schema warnings`,
	);

	if (criticalCount > 0) process.exit(1);
}

makeTei().catch((error: unknown) => {
	log.error("Fatal error:", error instanceof Error ? error.message : error);
	process.exit(1);
});
