import { renderManuscriptMain } from "./builders/tei";
import type { Manuscript } from "@/types/manuscript";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const mssFolderPath = join(process.cwd(), "public", "tei", "manuscripts");
mkdirSync(mssFolderPath, { recursive: true });

// Read the source JSON file

const mss: Manuscript[] = JSON.parse(
	readFileSync(join(process.cwd(), "src", "content", "data", "manuscripts.json"), "utf-8"),
);
console.log(`Generating TEI for ${mss.length} manuscripts...`);

// Generate TEI for each manuscript

for (const [index, ms] of mss.entries()) {
	const filename = ms.hit_id ? `${ms.hit_id}.xml` : `manuscript_${ms.id}.xml`;

	const xml = renderManuscriptMain(ms);

	writeFileSync(join(mssFolderPath, filename), xml);

	// validation calling tei-validation.ts
}
