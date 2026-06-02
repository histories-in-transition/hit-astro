import { addPrevNextToMsItems, enrichPlaces, enrichBibl, enrichDates } from "./utils.ts";

import { getCodUnitsForManuscript } from "./cod-units.js";
import { getStrataForManuscript, createTBDStratum } from "./strata.ts";
import type {
	HitManuscript,
	HitHand,
	HitManuscriptDated,
	HitHandsDated,
	HitHandsPlaced,
	HitHandRole,
	HitLibrary,
	HitBibliography,
	HitDates,
} from "@/types/zod/zod-types.ts";
import type { Manuscript, Place, Library, MsItem, Hand, Codunit, Stratum } from "@/types/index.ts";

type ManuscriptDeps = {
	manuscripts_dated: HitManuscriptDated[];
	processedCodUnits: Codunit[];
	processedStrata: Stratum[];
	libraries: HitLibrary[];
	librariesPlus: Library[];
	handsWithScribe: Hand[];
	msItemsPlus: MsItem[];
	places: Place[];
	dates: HitDates[];
	bibliography: HitBibliography[];
	handsrole: HitHandRole[];
	hands: HitHand[];
	handsdated: HitHandsDated[];
	handsplaced: HitHandsPlaced[];
};

export function processManuscripts(manuscripts: HitManuscript[], deps: ManuscriptDeps) {
	if (!Array.isArray(manuscripts)) {
		throw new Error("processManuscripts expects an array of manuscripts");
	}

	const manuscriptsPlus = manuscripts
		.filter((manuscript) => manuscript.shelfmark.length > 0)
		.map((manuscript) => transformManuscript(manuscript, deps));

	return addPrevNextToMsItems(manuscriptsPlus, "hit_id", "shelfmark");
}

function transformManuscript(manuscript: HitManuscript, deps: ManuscriptDeps): Manuscript {
	const {
		manuscripts_dated,
		processedCodUnits,
		processedStrata,
		libraries,
		librariesPlus,
		handsWithScribe,
		msItemsPlus,
		places,
		dates,
		bibliography,
		handsrole,
		hands,
		handsdated,
		handsplaced,
	} = deps;

	// Get cod units for this manuscript (already processed)
	const cod_units = getCodUnitsForManuscript(manuscript, processedCodUnits);

	// Get manuscript dating
	const ms_dating = getManuscriptDating(
		manuscript,
		manuscripts_dated,
		dates,
		bibliography,
		cod_units,
	);

	// Get strata for this manuscript (already processed)
	const manuscriptStrata = getStrataForManuscript(manuscript, processedStrata);

	// Create TBD stratum for uncharted roles if needed
	const tbdStratum = createTBDStratum(
		manuscript,
		handsrole,
		msItemsPlus,
		processedStrata,
		hands,
		handsdated,
		handsplaced,
		places,
		dates,
		bibliography,
	);

	// Combine strata
	const allStrata = tbdStratum ? [...manuscriptStrata, tbdStratum] : manuscriptStrata;

	// Get other manuscript data
	const library = getLibraryInfo(manuscript, libraries, places);
	const relevantHands = getRelevantHands(manuscript, handsWithScribe);
	const provenance = getProvenance(manuscript, librariesPlus);
	const content = getManuscriptContent(manuscript, msItemsPlus);

	const shelfmarkRaw = manuscript.shelfmark?.[0]?.value ?? "";
	const shelfmark = shelfmarkRaw.includes(",") ? shelfmarkRaw.split(",")[1].trim() : shelfmarkRaw;
	const place = library?.[0]?.place?.[0]?.value ?? "";
	const libAbbr = library?.[0]?.abbreviation ?? "";
	const view_label = shelfmark && place && libAbbr ? `MS ${place}, ${libAbbr}, ${shelfmark}` : "";
	return {
		id: manuscript.id,
		hit_id: manuscript.hit_id,
		view_label: view_label,
		shelfmark: shelfmark,
		library: library,
		title: manuscript.title ?? "",
		manuscripta_url: manuscript.manuscripta_url,
		handschriftenportal_url: manuscript.handschriftenportal_url,
		catalog_url: manuscript.catalog_url,
		digi_url: manuscript.digi_url,
		idno_former: manuscript.idno_former ?? "",
		quire_structure: manuscript.quire_structure,
		extent: manuscript.extent ?? "",
		foliation: manuscript.foliation ?? "",
		acc_mat: manuscript.acc_mat ?? "",
		binding: manuscript.binding ?? "",
		binding_date: enrichDates(manuscript.binding_date, dates),
		bibliography: enrichBibl(manuscript.bibliography, bibliography),
		height: manuscript.height ?? "",
		width: manuscript.width ?? "",
		material: [...new Set(cod_units.map((unit) => unit.material))],
		history: manuscript.history,
		orig_place: enrichPlaces(manuscript.orig_place, places),
		provenance: provenance,
		orig_date: ms_dating,
		content_summary: manuscript.content_summary ?? "",
		content: content,
		charakter: manuscript.charakter?.map((char) => char.value) ?? [],
		case_study: manuscript.case_study?.map((c) => c.value) ?? [],
		status: manuscript.status?.map((s) => s.value) ?? [],
		hands: relevantHands,
		cod_units: cod_units,
		strata: allStrata,
		author_entry: manuscript.author_entry?.map((a) => a.value) ?? [],
	};
}

/**
 * Get manuscript dating information
 */
// joins data from two sets + deduplication with priority
// Keeps data from manuscripts_dated when there are duplicates
// Only adds cod_units data if it's truly unique
function getManuscriptDating(
	manuscript: HitManuscript,
	manuscripts_dated: HitManuscriptDated[],
	dates: HitDates[],
	bibliography: HitBibliography[],
	cod_units: Codunit[],
) {
	// 1. from table manuscripts_dated (higher priority)
	const datedArr = manuscripts_dated
		.filter((mDated) => mDated.manuscript.some((m) => m.id === manuscript.id))
		.map((mDated) => ({
			date: enrichDates(mDated.date, dates),
			authority: enrichBibl(mDated.authority, bibliography),
			page: mDated.page,
			preferred_date: mDated.preferred_date,
			priority: 1, // Higher priority
			source: "manuscripts_dated",
		}));

	// 2. from cod_units (lower priority)
	const provArr = cod_units
		.filter((c_unit) => c_unit.manuscript.some((m) => m.id === manuscript.id))
		.flatMap((c_unit) =>
			c_unit.prov_place
				.filter((prov) => prov.type === "orig")
				.map((prov) => ({
					date: prov.from,
					authority: prov.authority,
					page: prov.page,
					preferred_date: "",
					priority: 2, // Lower priority
					source: "cod_units",
				})),
		);

	// Create a comparison key for deduplication
	const createComparisonKey = (item) => {
		const dateKey = item.date?.id || JSON.stringify(item.date);
		const authorityKey = item.authority?.id || JSON.stringify(item.authority);
		return `${dateKey}-${authorityKey}-${item.page || "no-page"}`;
	};

	// Merge all items
	const combined = [...datedArr, ...provArr];

	// Group by comparison key and keep the one with highest priority (lowest number)
	const grouped = new Map();

	combined.forEach((item) => {
		const key = createComparisonKey(item);
		const existing = grouped.get(key);

		if (!existing || item.priority < existing.priority) {
			grouped.set(key, item);
		}
	});

	// Convert back to array and remove internal fields
	return Array.from(grouped.values()).map(({ priority, source, ...item }) => item);
}

/**
 * Get library information for manuscript
 */
function getLibraryInfo(manuscript: HitManuscript, libraries: HitLibrary[], places: Place[]) {
	return libraries
		.filter((lib) => manuscript.library.some((l) => l.id === lib.id))
		.map((library) => ({
			id: library.id,
			hit_id: library.hit_id,
			abbreviation: manuscript.library?.[0]?.value ?? "",
			library_full: manuscript.library_full?.[0]?.value ?? "",
			place: enrichPlaces(library.settlement, places),
			gnd_url: library.gnd_url || "",
			wikidata: library.wikidata || "",
		}));
}

/**
 * Get relevant hands for manuscript
 */
function getRelevantHands(manuscript: HitManuscript, handsWithScribe: Hand[]) {
	return handsWithScribe
		.filter((hand) => hand.manuscript[0]?.id === manuscript.id)
		.map((hand) => ({
			hit_id: hand.hit_id,
			label: hand.label,
			description: hand.description,
			similar_hands: hand.similar_hands,
			nr_daniel: hand.nr_daniel,
			note: hand.note,
			scribe: hand.scribe,
			group: hand.group,
			date: hand.date,
			hand_roles: hand.hand_roles,
			placed: hand.placed,
		}));
}

/**
 * Get provenance information
 */
function getProvenance(manuscript: HitManuscript, librariesPlus: Library[]) {
	return librariesPlus.filter((lib) => manuscript.provenance.some((prov) => prov.id === lib.id));
}

/**
 * Get manuscript content (msItems not in cod units)
 */
function getManuscriptContent(manuscript: HitManuscript, msItemsPlus: MsItem[]) {
	return msItemsPlus
		.filter(
			(item) =>
				item.manuscript.some((ms) => ms.id === manuscript.id) &&
				(item.cod_unit?.length === 0 || !item.cod_unit),
		)
		.map(cleanMsItemForManuscript);
}

/**
 * Clean ms item data for manuscript display
 */
function cleanMsItemForManuscript(item: MsItem) {
	const {
		manuscript,
		cod_unit,
		hands,
		view_label,
		library,
		library_place,
		author_entry,
		prev,
		next,
		...rest
	} = item;
	return rest;
}
