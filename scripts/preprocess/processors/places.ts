import { addPrevNextToMsItems } from "./utils.js";

/**
 * Process places data by cleaning and standardizing the structure
 */

type RawPlace = {
	id?: number;
	hit_id?: string;
	name?: string;
	geonames_url?: string;
	wikidata_url?: string;
	lat?: number | string;
	long?: number | string;
};

export function processPlaces(places: RawPlace[]) {
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
 */
function transformPlace(place: RawPlace) {
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
