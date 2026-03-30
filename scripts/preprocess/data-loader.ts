import { readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";
import {
	HitManuscriptSchema,
	HitMsitemSchema,
	HitPeopleSchema,
	HitPlaceSchema,
	HitScribeSchema,
	HitStrataSchema,
	HitWorksVersionSchema,
	HitManuscriptDatedSchema,
	HitLibrarySchema,
	HitHandSchema,
	HitHandRoleSchema,
	HitHandsPlacedSchema,
	HitHandsDatedSchema,
	HitGenresSchema,
	HitFiliatedStrataSchema,
	HitCodunitsSchema,
	HitDatesSchema,
	HitBibliographySchema,
	HitCodPlacedSchema,
} from "@/types/zod/zod-types";

// function to load JSON files from the raw content directory

const RAW_DATA_DIR = join(process.cwd(), "src", "content", "raw");

function loadJSON<T>(filename: string, schema: z.ZodType<T>): T {
	const filePath = join(RAW_DATA_DIR, filename);
	const raw = readFileSync(filePath, "utf8");

	const parsed = JSON.parse(raw);

	//validate against schema
	return schema.parse(parsed);
}

// Export all the data loading functions
export function loadAllData() {
	console.log("Loading raw data files and zod validation...");
	const manuscriptsRecord = loadJSON("manuscripts.json", z.record(z.string(), HitManuscriptSchema));
	const msitemsRecord = loadJSON("ms_items.json", z.record(z.string(), HitMsitemSchema));
	const people = loadJSON("people.json", z.record(z.string(), HitPeopleSchema));
	const places = loadJSON("places.json", z.record(z.string(), HitPlaceSchema));
	const manuscripts = Object.values(manuscriptsRecord);
	const scribes = loadJSON("scribes.json", z.record(z.string(), HitScribeSchema));
	const strata = loadJSON("strata.json", z.record(z.string(), HitStrataSchema));
	const work_versions = loadJSON("work_versions.json", z.record(z.string(), HitWorksVersionSchema));
	const manuscript_dated = loadJSON(
		"manuscripts_dated.json",
		z.record(z.string(), HitManuscriptDatedSchema),
	);
	const libraries = loadJSON(
		"libraries_organisations.json",
		z.record(z.string(), HitLibrarySchema),
	);
	const hands = loadJSON("hands.json", z.record(z.string(), HitHandSchema));
	const handsrole = loadJSON("hands_role.json", z.record(z.string(), HitHandRoleSchema));
	const hands_placed = loadJSON("hands_placed.json", z.record(z.string(), HitHandsPlacedSchema));
	const hands_dated = loadJSON("hands_dated.json", z.record(z.string(), HitHandsDatedSchema));
	const genres = loadJSON("genres.json", z.record(z.string(), HitGenresSchema));
	const filiated_strata = loadJSON(
		"filiated_strata.json",
		z.record(z.string(), HitFiliatedStrataSchema),
	);
	const dates = loadJSON("dates.json", z.record(z.string(), HitDatesSchema));
	const cod_units = loadJSON("cod_units.json", z.record(z.string(), HitCodunitsSchema));
	const bibliography = loadJSON("bibliography.json", z.record(z.string(), HitBibliographySchema));
	const cod_unit_placed = loadJSON(
		"cod_unit_placed.json",
		z.record(z.string(), HitCodPlacedSchema),
	);

	return {
		manuscripts: manuscripts,
		msitems: msitemsRecord,
		people: people,
		places: places,
		scribes: scribes,
		strata: strata,
		work_versions: work_versions,
		manuscript_dated: manuscript_dated,
		libraries_organisations: libraries,
		hands: hands,
		hands_role: handsrole,
		hands_placed: hands_placed,
		hands_dated: hands_dated,
		genres: genres,
		filiated_strata: filiated_strata,
		dates: dates,
		cod_units: cod_units,
		bibliography: bibliography,
		cod_unit_placed: cod_unit_placed,
	};
}
loadAllData();
