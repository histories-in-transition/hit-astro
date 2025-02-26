import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import { request } from "@acdh-oeaw/lib";
// fetch baserow dumps from github and store them in the raw folder
// this script is meant to be run only once by build to fetch the initial data
// subsequent preprocessing of the data is done with the preprocess-data.js script
const baseUrl =
	"https://raw.githubusercontent.com/histories-in-transition/hit-baserow-dump/refs/heads/main/json_dumps/";

const folderPath = join(process.cwd(), "src", "content", "raw");
mkdirSync(folderPath, { recursive: true });

const fileNames = [
	"hands.json",
	"hands_dated.json",
	"hands_placed.json",
	"hands_role.json",
	"manuscripts.json",
	"manuscripts_dated.json",
	"ms_items.json",
	"strata.json",
	"strata_filiations.json",
	"filiated_strata.json",
	"works.json",
	"scribes.json",
	"cod_units.json",
	"cod_unit_placed.json",
	"bibliography.json",
	"libraries_organisations.json",
	"dates.json",
	"places.json",
	"genres.json",
	"people.json",
];

async function fetchData(fileName) {
	try {
		const data = await request(new URL(fileName, baseUrl), { responseType: "json" });
		writeFileSync(join(folderPath, fileName), JSON.stringify(data, null, 2), "utf-8");
		console.log(`✅ Saved: ${fileName}`);
	} catch (error) {
		console.error(`❌ Error fetching ${fileName}:`, error);
	}
}

async function fetchAllData() {
	await Promise.all(fileNames.map(fetchData));
	console.log(`All files have been fetched and stored`);
}

fetchAllData();
