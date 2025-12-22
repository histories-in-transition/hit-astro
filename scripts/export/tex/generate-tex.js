import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import TexHeader from "./tex-header.js";

async function writeTexFile(filename, content) {
	const outputDir = join(process.cwd(), "public", "tex", "manuscripts");
	mkdirSync(outputDir, { recursive: true });

	const filepath = join(outputDir, filename);
	writeFileSync(filepath, content, "utf8");
	console.log(`✓ Generated: ${filename} ${filepath}`);
}

async function generateAllTex() {
	const manuscripts = JSON.parse(readFileSync("src/content/data/manuscripts.json", "utf-8"));

	for (const manuscript of manuscripts) {
		const tex = TexHeader(manuscript);
		await writeTexFile(`${manuscript.hit_id}.tex`, tex);
	}

	console.log("✨ Done");
}

generateAllTex();
