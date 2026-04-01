import { readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";
import {
	HitManuscriptSchema,
	HitMsitemSchema,
	HitWorksSchema,
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
	HitStrataFiliationSchema,
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
	return {
		manuscripts: Object.values(
			loadJSON("manuscripts.json", z.record(z.string(), HitManuscriptSchema)),
		),
		msitems: Object.values(loadJSON("ms_items.json", z.record(z.string(), HitMsitemSchema))),
		places: Object.values(loadJSON("places.json", z.record(z.string(), HitPlaceSchema))),
		people: Object.values(loadJSON("people.json", z.record(z.string(), HitPeopleSchema))),
		scribes: Object.values(loadJSON("scribes.json", z.record(z.string(), HitScribeSchema))),
		strata: Object.values(loadJSON("strata.json", z.record(z.string(), HitStrataSchema))),
		strata_filiations: Object.values(
			loadJSON("strata_filiations.json", z.record(z.string(), HitStrataFiliationSchema)),
		),
		works: Object.values(loadJSON("works.json", z.record(z.string(), HitWorksSchema))),
		work_versions: Object.values(
			loadJSON("work_versions.json", z.record(z.string(), HitWorksVersionSchema)),
		),
		manuscript_dated: Object.values(
			loadJSON("manuscripts_dated.json", z.record(z.string(), HitManuscriptDatedSchema)),
		),
		libraries: Object.values(
			loadJSON("libraries_organisations.json", z.record(z.string(), HitLibrarySchema)),
		),
		hands: Object.values(loadJSON("hands.json", z.record(z.string(), HitHandSchema))),
		hands_role: Object.values(loadJSON("hands_role.json", z.record(z.string(), HitHandRoleSchema))),
		hands_placed: Object.values(
			loadJSON("hands_placed.json", z.record(z.string(), HitHandsPlacedSchema)),
		),
		hands_dated: Object.values(
			loadJSON("hands_dated.json", z.record(z.string(), HitHandsDatedSchema)),
		),
		genres: Object.values(loadJSON("genres.json", z.record(z.string(), HitGenresSchema))),
		filiated_strata: Object.values(
			loadJSON("filiated_strata.json", z.record(z.string(), HitFiliatedStrataSchema)),
		),
		dates: Object.values(loadJSON("dates.json", z.record(z.string(), HitDatesSchema))),
		cod_units: Object.values(loadJSON("cod_units.json", z.record(z.string(), HitCodunitsSchema))),
		bibliography: Object.values(
			loadJSON("bibliography.json", z.record(z.string(), HitBibliographySchema)),
		),
		cod_unit_placed: Object.values(
			loadJSON("cod_unit_placed.json", z.record(z.string(), HitCodPlacedSchema)),
		),
	};
}
loadAllData();
