import { addPrevNextToMsItems } from "./utils.js";
import type { HitPlace } from "@/types/zod/zod-types.ts";
import type { Place } from "@/types/index.ts";

export function processPlaces(places: HitPlace[]): Place[] {
	const processedPlaces = places.map((place) => ({
		id: place.id,
		hit_id: place.hit_id,
		name: place.name ?? "Unknown Location",
		geonames_url: place.geonames_url ?? "",
		wikidata_url: place.wikidata_url ?? "",
		lat: place.lat ?? "",
		long: place.long ?? "",
	}));

	console.log("Processed places:", processedPlaces.length);

	// Add navigation (prev/next)
	return addPrevNextToMsItems(processedPlaces);
}
