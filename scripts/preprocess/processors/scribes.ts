import { addPrevNextToMsItems } from "./utils.js";
import type { HitScribe } from "@/types/zod/zod-types.ts";

type HandBase = {
	id: number;
	hit_id: string;
	scribe: { id: number }[];
	date: unknown[];
	placed: unknown[];
	author_entry: unknown[];
};

export function processScribes(scribes: HitScribe[], handsPlus: HandBase[]) {
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
				hands: scribalHands.map(({ scribe, author_entry, ...rest }) => rest),
				date: date,
				places: place,
				author_entry: scribe.author_entry.map((a) => a.value) || [],
			};
		});
	return addPrevNextToMsItems(scribesPlus, "hit_id", "name");
}
