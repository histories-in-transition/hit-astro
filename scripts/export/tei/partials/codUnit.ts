import type { Manuscript, MsItem } from "@/types";
import { esc, lines } from "./helpers.ts";
import { renderMsItem } from "./msItem.ts";
import { getMaterialCode } from "./physDesc.ts";
type CodUnit = Manuscript["cod_units"][number];
type ProvPlace = CodUnit["prov_place"][number];

// ---------- history helpers ----------

/** <bibl><ref>Author. Title Page</ref></bibl>, or "" if there is no authority. */
function renderProvBibl(prov: ProvPlace): string {
	const auth = prov.authority?.[0];
	if (!auth) return "";

	return lines(
		`<bibl>`,
		`<ref>${esc(auth.author)}. ${esc(auth.title)} ${esc(prov.page)}</ref>`,
		`</bibl>`,
	);
}

function renderOrigin(prov: ProvPlace): string {
	const place = prov.places?.[0];
	const from = prov.from?.[0];

	return lines(
		`<origin>`,
		place ? `<origPlace ref="#${esc(place.hit_id)}">${esc(place.value)}</origPlace>` : "",
		from?.value
			? `<origDate notBefore="${esc(from.not_before)}" notAfter="${esc(from.not_after)}">${esc(from.value)}</origDate>`
			: "",
		renderProvBibl(prov),
		`</origin>`,
	);
}

function renderProvenance(prov: ProvPlace): string {
	const place = prov.places?.[0];
	const from = prov.from?.[0]?.value;
	const till = prov.till?.[0]?.value;

	return lines(
		`<provenance>`,
		place ? `<placeName ref="#${esc(place.hit_id)}">${esc(place.value)}</placeName>` : "",
		from ? `<date type="from">${esc(from)}</date>` : "",
		till ? `<date type="to">${esc(till)}</date>` : "",
		renderProvBibl(prov),
		`</provenance>`,
	);
}

function renderHistory(unit: CodUnit): string {
	if (unit.prov_place.length === 0) return "";

	return lines(
		`<history>`,
		...unit.prov_place.filter((p) => p.type === "orig").map(renderOrigin),
		...unit.prov_place.map(renderProvenance),
		`</history>`,
	);
}

// ---------- layout helper ----------

function renderLayoutDesc(unit: CodUnit): string {
	const writtenArea =
		unit.written_height && unit.written_width
			? lines(
					`<dimensions type="written" unit="mm">`,
					`<height>${esc(unit.written_height)}</height>`,
					`<width>${esc(unit.written_width)}</width>`,
					`</dimensions>`,
					`<p>Schriftspiegel: ${esc(unit.written_height)}×${esc(unit.written_width)} mm.</p>`,
				)
			: "";

	let columnsAndLines = "";
	if (unit.columns.length > 0 || unit.lines_number || unit.ruling) {
		const text = [
			unit.columns.length > 0 ? `Spalte: ${esc(unit.columns.join(", "))}` : "",
			unit.lines_number ? `zu ${esc(unit.lines_number)} Zeilen.` : ".",
			unit.ruling ? esc(unit.ruling) : "",
		]
			.filter(Boolean)
			.join(" ");
		columnsAndLines = `<p>${text}</p>`;
	}

	return lines(
		`<layoutDesc>`,
		`<layout>`,
		writtenArea,
		columnsAndLines,
		`</layout>`,
		`</layoutDesc>`,
	);
}

// ---------- main function ----------

export function makeMsPart(
	ms: Manuscript,
	unit: CodUnit,
	renderedItems: Set<MsItem["hit_id"]>,
): string {
	const materialCode = getMaterialCode(ms.material ?? []);

	// <msContents>: one <msItem> per content entry
	const msContents =
		unit.content.length > 0
			? lines(
					`<msContents>`,
					...unit.content.map((item, index) => renderMsItem(item, index, renderedItems)),
					`</msContents>`,
				)
			: "";

	// <support>: "Material. Spec" followed by the basic structure
	const supportText = [
		[unit.material, unit.material_spec].filter(Boolean).join(". "),
		unit.basic_structure?.join(", "),
	]
		.filter(Boolean)
		.join(" ");

	const support =
		unit.material || unit.material_spec
			? lines(`<support>`, `<material>${esc(supportText)}</material>`, `</support>`)
			: "";

	const dimensions =
		unit.heigth && unit.width
			? lines(
					`<dimensions type="leaf" unit="mm">`,
					`<height>${esc(unit.heigth)}</height>`,
					`<width>${esc(unit.width)}</width>`,
					`</dimensions>`,
				)
			: "";

	const collation = lines(
		unit.notes ? `<p>${esc(unit.notes)}</p>` : "",
		unit.catchwords ? `<catchwords>${esc(unit.catchwords)}</catchwords>` : "",
		unit.quiremarks ? `<signatures>${esc(unit.quiremarks)}</signatures>` : "",
	);

	const decoDesc = unit.decoration
		? lines(`<decoDesc>`, `<decoNote>${esc(unit.decoration)}</decoNote>`, `</decoDesc>`)
		: "";

	return lines(
		`<msPart>`,
		`<msIdentifier>`,
		`<idno>Kodikologische Einheit ${esc(unit.number)} (${esc(unit.locus)})</idno>`,
		`</msIdentifier>`,
		msContents,
		`<physDesc>`,
		`<objectDesc form="fascicle">`,
		`<supportDesc material="${materialCode}">`,
		support,
		`<extent>`,
		dimensions,
		`</extent>`,
		`<collation>`,
		collation,
		`</collation>`,
		`</supportDesc>`,
		renderLayoutDesc(unit),
		`</objectDesc>`,
		decoDesc,
		`</physDesc>`,
		renderHistory(unit),
		`</msPart>`,
	);
}
