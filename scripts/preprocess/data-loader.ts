import { readFileSync } from "fs";
import { join } from "path";

// function to load JSON files from the raw content directory

const RAW_DATA_DIR = join(process.cwd(), "src", "content", "raw");

function loadJSON(filename: string): unknown[] {
	const filePath = join(RAW_DATA_DIR, filename);
	const raw = readFileSync(filePath, "utf8");

	return Object.values(JSON.parse(raw));
}

// Export all the data loading functions
export function loadAllData() {
	console.log("📁 Loading raw data files...");

	return {
		bibliography: loadJSON("bibliography.json"),
		cod_units: loadJSON("cod_units.json"),
		cod_unitsprov: loadJSON("cod_unit_placed.json"),
		dates: loadJSON("dates.json"),
		genres: loadJSON("genres.json"),
		hands: loadJSON("hands.json"),
		handsdated: loadJSON("hands_dated.json"),
		handsplaced: loadJSON("hands_placed.json"),
		handsrole: loadJSON("hands_role.json"),
		libraries: loadJSON("libraries_organisations.json"),
		manuscripts: loadJSON("manuscripts.json"),
		manuscripts_dated: loadJSON("manuscripts_dated.json"),
		msitems: loadJSON("ms_items.json"),
		people: loadJSON("people.json"),
		places: loadJSON("places.json"),
		scribes: loadJSON("scribes.json"),
		strataa: loadJSON("strata.json"),
		works: loadJSON("works.json"),
		strata_filiations: loadJSON("strata_filiations.json"),
		filiated_strata: loadJSON("filiated_strata.json"),
	};
}
