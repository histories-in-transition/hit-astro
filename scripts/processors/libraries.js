import { addPrevNextToMsItems, enrichPlaces } from "../utils/utils.js";

/**
 * Process libraries data by cleaning and standardizing the structure
 * @param {Array} libraries - Raw libraries data
 * @param {Array} places - Places data for enrichment
 * @returns {Array} Processed libraries with prev/next navigation
 */
export function processLibraries(libraries, places) {
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
function transformLibrary(library, places) {
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
