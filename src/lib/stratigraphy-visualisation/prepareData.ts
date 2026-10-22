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

// Combines the dates of ALL hands of a role into one range.
function getDateRange(hands) {
	// each hand has date[], each date has dated[] -> take the first dated entry
	const dated = hands.flatMap((h) => (h.date ?? []).map((d) => d.dated?.[0])).filter(Boolean);

	const starts = dated
		.map((d) => toNumber(d.not_before))
		.filter((n): n is number => n !== undefined);
	const ends = dated.map((d) => toNumber(d.not_after)).filter((n): n is number => n !== undefined);
	const labels = [...new Set(dated.map((d) => d.value).filter(Boolean))];

	return {
		dateStart: starts.length ? Math.min(...starts) : undefined,
		dateEnd: ends.length ? Math.max(...ends) : undefined,
		dateLabel: labels.length ? labels.join("; ") : undefined,
	};
}

export function prepareDataForStrataGraph(strata): StratigraphyData {
	// 0. Roman folios (flyleaves) come BEFORE folio 1, so find out how many there are.
	const allLoci = strata.flatMap((st) =>
		(st.hand_roles ?? []).flatMap((hr) => [hr.locus, ...(hr.content ?? []).map((i) => i.locus)]),
	);
	const romanFolioCount = maxRomanFolio(allLoci);

	// 1. Collect each ms_item exactly once.
	const msItemsById = new Map<string, StratigraphyMsItem>();

	for (const st of strata) {
		for (const hr of st.hand_roles ?? []) {
			for (const msi of hr.content ?? []) {
				if (msItemsById.has(msi.hit_id)) continue;

				const segments = parseLocus(msi.locus, romanFolioCount);

				msItemsById.set(msi.hit_id, {
					hit_id: msi.hit_id,
					title_work: msi.title_work.map((t) => t.title),
					locus: msi.locus ?? "",
					leafStart: segments.length ? segments[0].start : undefined,
					leafEnd: segments.length ? Math.max(...segments.map((s) => s.end)) : undefined,
				});
			}
		}
	}

	// 2. Build the hand_roles (one entry per role, with all its hands combined).
	const handRoles: StratigraphyHandRole[] = strata.flatMap((st) =>
		(st.hand_roles ?? []).map((hr) => {
			const hands = hr.hands ?? [];
			const handLabels: string[] = hands.map((h) => h.label ?? "").filter(Boolean);

			const msItems = (hr.content ?? [])
				.map((i) => msItemsById.get(i.hit_id))
				.filter((i): i is StratigraphyMsItem => i !== undefined);

			// Preferred: the hand role's own locus ("1r-8r, 86rv").
			let segments = parseLocus(hr.locus, romanFolioCount);

			// Fallback: use the ranges of its ms_items.
			if (!segments.length) {
				segments = msItems
					.filter((i) => i.leafStart !== undefined && i.leafEnd !== undefined)
					.map((i) => ({ start: i.leafStart!, end: i.leafEnd! }))
					.sort((a, b) => a.start - b.start);
			}

			return {
				hit_id: hr.hit_id,
				stratum: st.number,

				hand: handLabels.map((l) => l.split("_")[1] ?? l).join(", "),
				handLabel: handLabels ?? [].join(", "),
				hands: handLabels, // new: the individual labels, if the graph needs them

				...getDateRange(hands),

				locus: hr.locus ?? "",
				segments,

				roles: hr.role ?? [],
				functions: hr.function ?? [],
				scribeTypes: hr.scribe_type ?? [],
				msItems: msItems.map((i) => ({
					hit_id: i.hit_id,
					title: i.title_work ?? "N/A",
					locus: i.locus,
				})),
			};
		}),
	);

	return { msitems: [...msItemsById.values()], handRoles, romanFolioCount };
}
