import { addPrevNextToMsItems, enrichPlaces } from "./utils.js";
import type { HitLibrary } from "@/types/zod/zod-types.js";
import type { Place, Library } from "@/types/index.js";

export function processLibraries(libraries: HitLibrary[], places: Place[]): Library[] {
	const processedLibraries = libraries.map((library) => transformLibrary(library, places));

	return addPrevNextToMsItems(processedLibraries);
}

function transformLibrary(library: HitLibrary, places: Place[]) {
	return {
		id: library.id,
		hit_id: library.hit_id,
		abbreviation: library.label ?? "Unknown Library",
		library_full: library.library_full ?? "Unknown Library",
		place: enrichPlaces(library.settlement, places),
		wikidata: library.wikidata ?? "",
		gnd_url: library.gnd_url ?? "",
	};
}
