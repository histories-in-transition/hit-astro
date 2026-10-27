import type { Manuscript } from "@/types";
import { esc, lines } from "./helpers.ts";
import { makeHandDesc } from "./handDesc.ts";

/** Maps the German material name to the TEI code. */
export function getMaterialCode(material: string[]): string {
	if (material.includes("Pergament")) return "perg";
	if (material.includes("Papier")) return "chart";
	if (material.includes("Mischung")) return "mixed";
	return "other";
}

export function makePhysDesc(ms: Manuscript): string {
	const material = ms.material ?? [];
	const materialCode = getMaterialCode(material);

	// Only exists when the manuscript has exactly ONE codicological unit.
	// This replaces all the `it.cod_units.length == 1 && it.cod_units[0]...` checks.
	const unit = ms.cod_units.length === 1 ? ms.cod_units[0] : undefined;
	const materialSpec = unit?.material_spec ?? "";

	// ---------- <extent> ----------
	const extent = lines(
		ms.extent ? `<measure type="leavesCount">${esc(ms.extent)} Bl.</measure>` : "",
		ms.height && ms.width
			? lines(
					`<dimensions type="leaf" unit="mm">`,
					`<height>${esc(ms.height)}</height>`,
					`<width>${esc(ms.width)}</width>`,
					`</dimensions>`,
				)
			: "",
	);

	// ---------- <foliation> ----------
	const foliation = ms.foliation ? `<foliation>${esc(ms.foliation)}</foliation>` : "";

	// ---------- <collation> ----------
	// "**x**" in the quire formula becomes <hi rend="sup">x</hi>.
	// We escape first, so only our own <hi> tags end up as markup.
	const quireFormula = ms.quire_structure
		? `Lagenformel: <formula>${esc(ms.quire_structure).replace(
				/\*\*(.*?)\*\*/g,
				'<hi rend="sup">$1</hi>',
			)}</formula>`
		: "";

	const collation = lines(
		quireFormula,
		unit?.notes ? `<p>${esc(unit.notes)}</p>` : "",
		unit && unit.basic_structure.length > 0 ? `<p>${esc(unit.basic_structure.join(", "))}</p>` : "",
		unit?.catchwords ? `<catchwords>${esc(unit.catchwords)}</catchwords>` : "",
		unit?.quiremarks ? `<signatures>${esc(unit.quiremarks)}</signatures>` : "",
	);

	// ---------- <layoutDesc> (only with exactly one unit) ----------
	let layoutDesc = "";
	if (unit) {
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

		layoutDesc = lines(
			`<layoutDesc>`,
			`<layout>`,
			writtenArea,
			columnsAndLines,
			`</layout>`,
			`</layoutDesc>`,
		);
	}

	// ---------- <handDesc> ----------
	const handDesc = ms.hands.length > 0 ? makeHandDesc(ms) : "";

	// ---------- <decoDesc> (only with exactly one unit) ----------
	const decoDesc = unit
		? lines(`<decoDesc>`, `<decoNote>${esc(unit.decoration)}</decoNote>`, `</decoDesc>`)
		: "";

	// ---------- <bindingDesc> ----------
	let bindingDesc = "";
	const bindingDate = ms.binding_date?.[0];
	if (bindingDate || ms.binding) {
		const attrs = [
			bindingDate?.not_before ? `notBefore="${esc(bindingDate.not_before)}"` : "",
			bindingDate?.not_after ? `notAfter="${esc(bindingDate.not_after)}"` : "",
		]
			.filter(Boolean)
			.join(" ");

		bindingDesc = lines(
			`<bindingDesc>`,
			`<binding${attrs ? ` ${attrs}` : ""}>`,
			ms.binding ? `<p>${esc(ms.binding)}</p>` : "",
			`</binding>`,
			`</bindingDesc>`,
		);
	}

	// ---------- <accMat> ----------
	const accMat = ms.acc_mat ? `<accMat>${esc(ms.acc_mat)}</accMat>` : "";

	// ---------- put everything together ----------
	return lines(
		`<physDesc>`,
		`<objectDesc form="codex">`,
		`<supportDesc material="${materialCode}">`,
		`<support>`,
		`<material>${esc(material.join(", "))}${materialSpec ? `. ${esc(materialSpec)}` : ""}</material>`,
		`</support>`,
		`<extent>`,
		extent,
		`</extent>`,
		foliation,
		`<collation>`,
		collation,
		`</collation>`,
		`</supportDesc>`,
		layoutDesc,
		`</objectDesc>`,
		handDesc,
		decoDesc,
		bindingDesc,
		accMat,
		`</physDesc>`,
	);
}
