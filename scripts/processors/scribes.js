import { addPrevNextToMsItems } from "../utils.js";

/**
 * Process scribes data by cleaning and standardizing the structure
 * @param {Array} scribes - Raw scribes data
 * @param {Array} handsPlus - Processed hands data for enrichment
 * @returns {Array} Processed enriched scribes with prev/next navigation
 */
export function processScribes(scribes, handsPlus) {
	if (!Array.isArray(scribes)) {
		throw new Error("processScribes expects an array of scribes");
	}
	if (!Array.isArray(handsPlus)) {
		throw new Error("processScribes expects an array handsPlus for enrichment");
	}
	// Transform each scribe
	const scribesPlus = scribes
		.filter((scribe) => scribe && scribe.id) // Filter out invalid entries
		.map((scribe) => {
			const scribalHands = handsPlus.filter((hand) => hand.scribe.some((s) => s.id === scribe.id));
			const date = scribalHands.flatMap((hand) => hand.date);
			const place = scribalHands.flatMap((hand) => hand.placed);
			return {
				id: scribe.id,
				hit_id: scribe.hit_id,
				name: scribe.name ?? "N/A",
				description: scribe.description ?? "N/A",
				group: scribe.group,
				hands: scribalHands.map(({ scribe, author_entry, places, dated, ...rest }) => rest),
				date: date,
				places: place,
				author_entry: scribe.author_entry.map((a) => a.value) || [],
			};
		});
	return addPrevNextToMsItems(scribesPlus, "hit_id", "name");
}
