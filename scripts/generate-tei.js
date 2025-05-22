import { Eta } from "eta";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync, readFile } from "fs";

// Get project root (one level up from current file)
const projectRoot = new URL("..", import.meta.url).pathname;

// read the source json file
const mss = JSON.parse(
	readFileSync(join(projectRoot, "src", "content", "data", "manuscripts.json"), "utf-8"),
);
// set the output folder
const mssFolderPath = join(process.cwd(), "public", "tei", "manuscripts");
mkdirSync(mssFolderPath, { recursive: true });

// Eta views path
const eta = new Eta({ views: join(process.cwd(), "templates") });

mss.forEach((ms) => {
	// Render the template with manuscript data
	const xml = eta.render("./manuscript.eta", ms);

	const compact = xml
		.split("\n")
		.filter((line) => line.trim() !== "")
		.join("\n");
	// Use hit_id as unique identifier for the filename
	const filename = ms.hit_id ? `${ms.hit_id}.xml` : `manuscript_${ms.id}.xml`;
	const filePath = join(mssFolderPath, filename);
	// Write the XML file
	writeFileSync(join(mssFolderPath, filename), compact, "utf-8");
	console.log(`Generated TEI for ${ms.shelfmark}: (${filePath})`);
});
console.log(`All together ${mss.length} TEI files.`);
