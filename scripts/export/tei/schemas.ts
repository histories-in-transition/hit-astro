import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { log } from "@acdh-oeaw/lib";

const SCHEMA_BASE_URL = "https://diglib.hab.de/rules/schema/mss/v1.0";
const SCHEMA_FILES = ["cataloguing.xsd", "dcr.xsd", "teix.xsd", "xml.xsd"];
const MAIN_SCHEMA = "cataloguing.xsd";

function isXmllintAvailable(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

/** Basic sanity check so we never keep an empty or broken download. */
function looksLikeSchema(content: string): boolean {
	return content.length > 100 && content.includes("<?xml");
}

function isPresent(path: string): boolean {
	return existsSync(path) && looksLikeSchema(readFileSync(path, "utf-8"));
}

async function download(file: string, schemaDir: string): Promise<void> {
	const response = await fetch(`${SCHEMA_BASE_URL}/${file}`);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	const content = await response.text();
	if (!looksLikeSchema(content)) throw new Error("file does not look like a schema");

	writeFileSync(join(schemaDir, file), content, "utf-8");
}

/**
 * Makes sure all schema files are available locally (downloads only the missing ones).
 * Returns the path to the main schema, or null if schema validation is not possible.
 */
export async function prepareSchema(schemaDir: string): Promise<string | null> {
	if (!isXmllintAvailable()) {
		log.warn("xmllint not found - falling back to basic TEI checks.");
		return null;
	}

	mkdirSync(schemaDir, { recursive: true });

	const missing = SCHEMA_FILES.filter((file) => !isPresent(join(schemaDir, file)));

	await Promise.all(
		missing.map(async (file) => {
			try {
				await download(file, schemaDir);
				log.info(`Downloaded ${file}`);
			} catch (error) {
				log.warn(`Could not download ${file}:`, error instanceof Error ? error.message : error);
			}
		}),
	);

	// xmllint needs ALL files, because the main schema imports the others
	if (!SCHEMA_FILES.every((file) => isPresent(join(schemaDir, file)))) {
		log.warn("Schema files incomplete - falling back to basic TEI checks.");
		return null;
	}

	return join(schemaDir, MAIN_SCHEMA);
}
