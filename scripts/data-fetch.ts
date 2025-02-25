import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
	getHands,
	getHandsDated,
	getHandsPlaced,
	getHandsRole,
	getLibraries,
	getManuscripts,
	getMsItems,
	getStrata,
	getWorks,
	getScribes,
	getCodUnits,
	getBibliography,
	getFiliated_strata,
	getDates,
	getPlaces,
	getPeople,
	getstrataFiliations,
	getManuscriptsDated,
	getCodUnitPlaced,
	getGenres,
} from "./api-client.js";
import { get } from "http";

async function fetchAllData() {
	const folderPath = join(process.cwd(), "src", "content", "raw");
	mkdirSync(folderPath, { recursive: true });

	const data = await Promise.all([
		getHands(),
		getHandsDated(),
		getHandsPlaced(),
		getHandsRole(),
		getManuscripts(),
		getMsItems(),
		getStrata(),
		getWorks(),
		getScribes(),
		getCodUnits(),
		getBibliography(),
		getLibraries(),
		getFiliated_strata(),
		getDates(),
		getPlaces(),
		getstrataFiliations(),
		getManuscriptsDated(),
		getCodUnitPlaced(),
		getGenres(),
		getPeople(),
	]);
	data.forEach(({ fileName, data }) => {
		writeFileSync(join(folderPath, fileName), JSON.stringify(data, null, 2), {
			encoding: "utf-8",
		});
	});
}

fetchAllData()
	.then(() => {
		console.log(`All files have been fetched and stored`);
	})
	.catch((error) => {
		console.error("Error fetching data:", error);
	});
