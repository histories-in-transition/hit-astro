import { addPrevNextToMsItems, enrichPlaces } from "./utils.js";

/**
 * Process libraries data by cleaning and standardizing the structure
 */

type RawLibrary = {
	id?: number;
	hit_id?: string;
	label?: string;
	library_full?: string;
	settlement?: string;
	wikidata?: string;
	gnd_url?: string;
};

type RawPlace = {
	id?: number;
	hit_id?: string;
};

export function processLibraries(libraries: RawLibrary[], places: RawPlace[]) {
	if (!Array.isArray(libraries)) {
		throw new Error("processLibraries expects an array of libraries");
	}
	if (!Array.isArray(places)) {
		throw new Error("processLibraries expects places array for enrichment");
	}
	// Transform each library
	const processedLibraries = libraries
		.filter((library) => library && library.id) // Filter out invalid entries
		.map((library) => transformLibrary(library, places));

	// Add navigation (prev/next) as in your original code
	return addPrevNextToMsItems(processedLibraries);
}

/**
 * Transform a single library object
 * @param {Object} library - Raw library data *
 * @param {Array} places - Places data for enrichment
 * @returns {Object} Transformed library
 */
function transformLibrary(library: RawLibrary, places: RawPlace[]) {
	return {
		id: library.id,
		hit_id: library.hit_id,
		abbreviation: library.label || "Unknown Library",
		library_full: library.library_full || "Unknown Library",
		place: enrichPlaces(library.settlement, places),
		wikidata: library.wikidata || "",
		gnd_url: library.gnd_url || "",
	};
}
