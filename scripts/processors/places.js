import { addPrevNextToMsItems } from "../utils/utils.js";

/**
 * Process places data by cleaning and standardizing the structure
 * @param {Array} places - Raw places data
 * @returns {Array} Processed places with prev/next navigation
 */
export function processPlaces(places) {
	if (!Array.isArray(places)) {
		throw new Error("processPlaces expects an array of places");
	}

	// Transform each place
	const processedPlaces = places
		.filter((place) => place && place.id) // Filter out invalid entries
		.map(transformPlace);

	console.log("Processed places:", processedPlaces.length); // Debugging line

	// Add navigation (prev/next)
	return addPrevNextToMsItems(processedPlaces);
}

/**
 * Transform a single place object
 * @param {Object} place - Raw place data
 * @returns {Object} Transformed place
 */
function transformPlace(place) {
	return {
		id: place.id,
		hit_id: place.hit_id,
		name: place.name || "Unknown Location",
		geonames_url: place.geonames_url || "",
		wikidata_url: place.wikidata_url || "",
		lat: place.lat ?? "",
		long: place.long ?? "",
	};
}
