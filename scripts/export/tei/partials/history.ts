import type { Manuscript } from "@/types";
import { esc, lines } from "./helpers.ts";

type OrigDate = NonNullable<Manuscript["orig_date"]>[number];

/** All <origDate> elements of one dating, followed by <ref>s to its authorities. */
function renderOrigDate(oDate: OrigDate): string {
	const dates = oDate.date.map(
		(date) =>
			`<origDate notBefore="${esc(date.not_before)}" notAfter="${esc(date.not_after)}">${esc(date.value)}</origDate>`,
	);

	const authorityRefs = (oDate.authority ?? [])
		.map((auth) => {
			const label = auth.author ? `${auth.author}: ${auth.title}` : auth.title;
			return `<ref target="#${esc(auth.hit_id)}">${esc(label)}</ref>`;
		})
		.join(" ");

	return lines(...dates, authorityRefs);
}

export function makeHistory(ms: Manuscript): string {
	const origPlaces = (ms.orig_place ?? []).map(
		(place) => `<origPlace ref="#${esc(place.hit_id)}">${esc(place.value)}</origPlace>`,
	);

	const origDates = (ms.orig_date ?? []).map(renderOrigDate);

	const provenance = ms.provenance.map(
		(prov) =>
			`<orgName ref="#${esc(prov.hit_id)}">${esc(prov.library_full ? prov.library_full : prov.abbreviation)}</orgName>`,
	);

	return lines(
		`<history>`,
		ms.history ? `<summary>${esc(ms.history)}</summary>` : "",
		`<origin>`,
		...origPlaces,
		...origDates,
		`</origin>`,
		`<provenance>`,
		...provenance,
		`</provenance>`,
		`</history>`,
	);
}
