import type { Manuscript } from "@/types";
import { esc, lines } from "./helpers.ts";

type Stratum = Manuscript["strata"][number];
type Filiation = NonNullable<Stratum["stratum_filiations"]>[number];
type FiliatedStratum = Filiation["filiated_strata"][number];

/** One entry of a filiation's "strata" list. */
function renderFiliatedStratum(filiated: FiliatedStratum): string {
	return lines(
		`<item>`,
		esc(filiated.value),
		filiated.locus ? `<note>(fols. ${esc(filiated.locus)})</note>` : "",
		filiated.note ? `<note>${esc(filiated.note)}</note>` : "",
		filiated.catalog_url ? `<ptr target="${esc(filiated.catalog_url)}"/>` : "",
		`</item>`,
	);
}

function renderFiliation(filiation: Filiation): string {
	return lines(
		`<item>`,
		filiation.reason ? `<desc>${esc(filiation.reason)}</desc>` : "",
		filiation.note ? `<note>${esc(filiation.note)}</note>` : "",
		`<list type="strata">`,
		...filiation.filiated_strata.map(renderFiliatedStratum),
		`</list>`,
		`</item>`,
	);
}

function renderStratum(stratum: Stratum): string {
	const handRoles = stratum.hand_roles?.length
		? lines(
				`<list type="hand_roles">`,
				...stratum.hand_roles.map((role) =>
					lines(`<item>`, `<ref target="#${esc(role)}"></ref>`, `</item>`),
				),
				`</list>`,
			)
		: "";

	const filiations = stratum.stratum_filiations?.length
		? lines(
				`<list type="filiations">`,
				...stratum.stratum_filiations.map(renderFiliation),
				`</list>`,
			)
		: "";

	return lines(
		`<item xml:id="${esc(stratum.hit_id)}" n="${esc(stratum.number)}">`,
		`<label>${esc(stratum.label)}</label>`,
		`<note type="character">${esc(stratum.character.join(", "))}</note>`,
		`<desc>${esc(stratum.note)}</desc>`,
		handRoles,
		filiations,
		`</item>`,
	);
}

/** Returns one <item> per stratum (the caller wraps them in a <list>). */
export function makeStrata(ms: Manuscript): string {
	return lines(...ms.strata.map(renderStratum));
}
