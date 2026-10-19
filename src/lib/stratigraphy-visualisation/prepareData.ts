import type { Manuscript } from "@/types";
import type {
	StratigraphyData,
	StratigraphyHandRole,
	StratigraphyMsItem,
} from "@/types/stratigraphy";
import { maxRomanFolio, parseLocus } from "@/lib/stratigraphy-visualisation/helpers";

// Converts "0950", 950, "" or undefined into a number or undefined (never NaN).
function toNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
}

export function prepareDataForStrataGraph(manuscript: Manuscript): StratigraphyData {
	// 0. Roman folios (flyleaves) are placed BEFORE folio 1, so we first need to know
	//    how many of them the manuscript has. We look at every locus string once.
	const allLoci = manuscript.strata.flatMap((st) =>
		st.hand_roles.flatMap((hr) => [hr.locus, ...hr.ms_item.map((i) => i.locus)]),
	);
	const romanFolioCount = maxRomanFolio(allLoci);

	// 1. Collect each ms_item exactly once (the same ms_item can belong to
	//    several hand_roles). Its range comes from its own `locus` string.
	const msItemsById = new Map<string, StratigraphyMsItem>();

	for (const st of manuscript.strata) {
		for (const hr of st.hand_roles) {
			for (const msi of hr.ms_item) {
				if (msItemsById.has(msi.hit_id)) continue;

				const segments = parseLocus(msi.locus, romanFolioCount);
				const title = msi.title.join(", ");

				msItemsById.set(msi.hit_id, {
					hit_id: msi.hit_id,
					title: msi.author[0] ? `${msi.author[0]}: ${title}` : title,
					locus: msi.locus ?? "",
					leafStart: segments.length ? segments[0].start : undefined,
					leafEnd: segments.length ? Math.max(...segments.map((s) => s.end)) : undefined,
				});
			}
		}
	}

	// 2. Build the hand_roles.
	const handRoles: StratigraphyHandRole[] = manuscript.strata.flatMap((st) =>
		st.hand_roles.map((hr) => {
			const hand = hr.hand[0];
			const date = hand?.date?.[0];
			const handLabel = hand?.label ?? "";

			const msItems = hr.ms_item
				.map((i) => msItemsById.get(i.hit_id))
				.filter((i): i is StratigraphyMsItem => i !== undefined);

			// Preferred: the hand role's own locus ("1r-8r, 86rv").
			let segments = parseLocus(hr.locus, romanFolioCount);

			// Fallback: if it has no (readable) locus, use the ranges of its ms_items.
			if (!segments.length) {
				segments = msItems
					.filter((i) => i.leafStart !== undefined && i.leafEnd !== undefined)
					.map((i) => ({ start: i.leafStart!, end: i.leafEnd! }))
					.sort((a, b) => a.start - b.start);
			}

			return {
				hit_id: hr.hit_id,
				stratum: st.number,

				hand: handLabel.split("_")[1] ?? handLabel,
				handLabel,

				dateStart: toNumber(date?.not_before),
				dateEnd: toNumber(date?.not_after),
				dateLabel: date?.value,

				locus: hr.locus ?? "",
				segments,

				roles: hr.role ?? [],
				functions: hr.function ?? [],
				scribeTypes: hr.scribe_type ?? [],
				msItems: msItems.map((i) => ({ hit_id: i.hit_id, title: i.title, locus: i.locus })),
			};
		}),
	);

	return { msitems: [...msItemsById.values()], handRoles, romanFolioCount };
}
