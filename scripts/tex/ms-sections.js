import {
	mn,
	safeJoin,
	superscriptify,
	extractPreferredDate,
	extractAllOriginDates,
} from "./utils.js";
import { texEscape } from "./utils.js";

// make the Schlagzeile - heading line
export function Heading(ms) {
	const material = safeJoin(ms.material?.map(texEscape), ", ");
	const extent = texEscape(ms.extent ?? "");
	const size = `${texEscape(ms.height ?? "")}×${texEscape(ms.width ?? "")}`;

	const origPlace = safeJoin(
		ms.orig_place?.map((p) => texEscape(p.value)),
		", ",
	);
	const origDate = texEscape(extractPreferredDate(ms.orig_date));
	const title = texEscape(ms.title ?? "Titel TBD");
	const contentSummary = texEscape(ms.content_summary ?? "");

	return `
\\textbf{\\Large ${title}}

\\smallskip
${material}, ${extent} Bl. ${size} mm.${origPlace ? ` ${origPlace}` : ""}${origDate ? `, ${origDate}` : ""}

${contentSummary}

\\medskip
`;
}

export function texMaterial(ms) {
	const material = safeJoin(ms.material?.map(texEscape));
	const material_spec =
		ms.cod_units.length === 1 ? texEscape(ms.cod_units[0].material_spec ?? "") : "";
	const basic_structure =
		ms.cod_units.length === 1
			? safeJoin(ms.cod_units[0].basic_structure?.map(texEscape), ", ")
			: "";
	const quires = superscriptify(texEscape(ms.quire_structure));
	const foliation = texEscape(ms.foliation ?? "");

	if (!material && !quires && !foliation && !material_spec && !basic_structure) return "";

	return mn(
		"B",
		`${material} ${basic_structure ? `${basic_structure}.` : ""}${material_spec ? `${material_spec}` : ""} ${quires ? `Lagen: ${quires}` : ""}${foliation ? ` ${foliation}` : ""}`,
	);
}

export function texLayout(ms) {
	if (ms.cod_units.length > 1) return "";

	const tex = ms.cod_units
		.map((unit) => {
			const writtenSize =
				unit.written_height && unit.written_width
					? `Schriftspiegel ${texEscape(unit.written_height)}×${texEscape(unit.written_width)} mm.`
					: "";
			const columnsDesc =
				unit.columns?.length > 0 ? `Spalten: ${unit.columns.map(texEscape).join(", ")}.` : "";
			const lines = unit.lines_number ? `Zeilen: ${texEscape(unit.lines_number)}` : "";

			if (!writtenSize && !columnsDesc && !lines) return "";

			return mn("S", `${writtenSize} ${columnsDesc} ${lines} ${texEscape(unit.ruling ?? "")}`);
		})
		.join("\n");

	return tex;
}

export function texScripts(ms) {
	if (!ms.hands?.length) return "";

	const tex = ms.hands
		.map((h) => {
			const label = texEscape(h.label ? h.label.split("_")[1] : "N/A");
			const nr_daniel = h.nr_daniel ? ` (Nr. Daniel: ${texEscape(h.nr_daniel)})` : "";
			const note = h.note ? `: ${texEscape(h.note)}` : "";
			const description = h.description ? ` Beschreibung: ${texEscape(h.description)}` : "";
			const similarHands =
				h.similar_hands?.length > 0
					? ` Ähnliche Hände: ${h.similar_hands
							.map((sh) => texEscape(sh.value.replace("_", " ")))
							.join(", ")}.`
					: "";
			const scribe =
				h.scribe?.length > 0
					? ` Schreiber: ${h.scribe.map((s) => texEscape(s.name)).join(", ")}.`
					: "";
			const date =
				h.date?.length > 0
					? ` Datierung: ${h.date
							.map((dating) => {
								const date = dating.dated?.map((dat) => texEscape(dat.value)).join(", ");
								const authority = dating.authority?.[0]?.author
									? ` nach ${texEscape(dating.authority[0].author)}`
									: "";
								const page = dating.page ? `, S. ${texEscape(dating.page)}` : "";
								const citation = dating.authority?.[0]?.citation
									? ` (${texEscape(dating.authority[0].citation)}${page})`
									: "";
								return `${date}${authority}${citation}`;
							})
							.join(", ")}.`
					: "";
			const place =
				h.placed?.length > 0
					? ` Lokalisierung: ${h.placed
							.map((pl) => {
								const place = pl.place?.map((p) => texEscape(p.value)).join(", ");
								const authority = pl.authority?.[0]?.author
									? ` nach ${texEscape(pl.authority[0].author)}`
									: "";
								const page = pl.page ? `, S. ${texEscape(pl.page)}` : "";
								const citation = pl.authority?.[0]?.citation
									? ` (${texEscape(pl.authority[0].citation)}${page})`
									: "";
								return `${place}${authority}${citation}`;
							})
							.join(", ")}.`
					: "";

			return `\\textbf{${label}}${scribe}${date}${place}${description}${nr_daniel}${note}${similarHands}`;
		})
		.join("\\\\ ");

	return mn("H", tex);
}

export function texBinding(ms) {
	const desc = texEscape(ms.binding ?? "");
	const date = texEscape(ms.binding_date?.[0]?.value ?? "");
	const acc = texEscape(ms.acc_mat ?? "");

	if (!desc && !date && !acc) return "";

	return mn("E", `${desc}${date ? `, Datiert: ${date}` : ""}${acc ? ` ${acc}` : ""}`);
}

export function texHistory(ms) {
	const allDates = texEscape(extractAllOriginDates(ms.orig_date) ?? "");
	const places = safeJoin(
		ms.orig_place?.map((p) => texEscape(p.value)),
		", ",
	);
	const provenance = ms.provenance?.length
		? ms.provenance.map((p) => texEscape(p.library_full)).join(", ")
		: "";

	if (!allDates && !places && !provenance) return "";

	return mn(
		"G",
		`Entstehung: ${allDates} ${places}. ${provenance ? `Provenienz: ${provenance}` : ""}`,
	);
}

export function texBibliography(ms) {
	if (!ms.bibliography?.length) return "";

	const entries = ms.bibliography.map((b) => texEscape(b.text ?? b)).join(" \\\\ ");

	return mn("Lit.", entries) + "\n";
}
