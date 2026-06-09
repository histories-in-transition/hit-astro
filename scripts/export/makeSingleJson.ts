import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const outputDir = join(process.cwd(), "public", "download", "json");
mkdirSync(outputDir, { recursive: true });

function generateSingleJSON() {
	const manuscripts = JSON.parse(readFileSync("src/content/data/manuscripts.json", "utf-8"));

	for (const manuscript of manuscripts) {
		const filename = `${manuscript.hit_id}.json`;
		const filepath = join(outputDir, filename);
		writeFileSync(filepath, JSON.stringify(manuscript, null, 2), "utf8");
		console.log(`Generated: ${filename} ${filepath}`);
	}
	console.log("JSON generated");
}
generateSingleJSON();
