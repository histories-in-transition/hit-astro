import {
	mn,
	safeJoin,
	superscriptify,
	extractPreferredDate,
	extractAllOriginDates,
} from "./utils.js";

// make the Schlagzeile - heading line
export function Heading(ms) {
	const material = (ms.material || []).join(", ");
	const extent = ms.extent ?? "";
	const size = `${ms.height ?? ""}×${ms.width ?? ""}`;

	const origPlace = safeJoin(
		ms.orig_place?.map((p) => p.value),
		", ",
	);
	const origDate = extractPreferredDate(ms.orig_date);
	const title = ms.title ?? "Titel TBD";

	return `
\\textbf{\\Large ${title}}

\\smallskip
${material}, ${extent} Bl. ${size} mm.${origPlace ? ` ${origPlace}` : ""}${origDate ? `, ${origDate}` : ""}

${ms.content_summary || ""}

\\medskip
`;
}

export function texMaterial(ms) {
	const material = safeJoin(ms.material);
	const material_spec = ms.cod_units.length === 1 && ms.cod_units[0].material_spec;
	const basic_structure = ms.cod_units.length === 1 && ms.cod_units[0].basic_structure.join(", ");
	const quires = superscriptify(ms.quire_structure);
	const foliation = ms.foliation;

	if (!material && !quires && !foliation && !material_spec && !basic_structure) return "";

	return mn(
		"B",
		`${material} ${basic_structure ? `${basic_structure}.` : ""}${material_spec ? `${material_spec}` : ""} ${quires ? `Lagen: ${quires}` : ""}${foliation ? ` ${foliation}` : ""}`,
	);
}

export function texLayout(ms) {
	//check if more than one unit, then render layout in cod unit Component
	if (ms.cod_units.length > 1) return "";
	const tex = ms.cod_units.map((unit) => {
		const writtenSize =
			unit.written_height && unit.written_width
				? `Schriftspiegel ${unit.written_height}×${unit.written_width} mm.`
				: "";
		const columnsDesc = unit.columns?.length > 0 ? `Spalten: ${unit.columns.join(", ")}.` : "";

		const lines = unit.lines_number ? `Zeilen: ${unit.lines_number}.` : "";

		if (!writtenSize && !columnsDesc && !lines) return "";

		return mn("S", `${writtenSize} ${columnsDesc} ${lines} ${unit.ruling ?? ""}`);
	});
	return tex;
}

export function texScripts(ms) {
	if (ms.hands.length === 0) return "";
	const tex = ms.hands
		.map((h) => {
			const label = h.label ? h.label.split("_")[1] : "N/A";
			const nr_daniel = h.nr_daniel ? ` (Nr. Daniel: ${h.nr_daniel})` : "";
			const note = h.note ? `: ${h.note}` : "";
			const description = h.description ? ` Beschreibung: ${h.description}` : "";
			const similarHands =
				h.similar_hands?.length > 0
					? ` Ähnliche Hände: ${h.similar_hands.map((sh) => sh.value.replace("_", " ")).join(", ")}.`
					: "";
			const scribe =
				h.scribe.length > 0 ? ` Schreiber: ${h.scribe.map((s) => s.name).join(", ")}.` : "";
			const date =
				h.date?.length > 0
					? ` Datierung: ${h.date.map((dating) => {
							const date = dating.dated.map((dat) => dat.value).join(", ");
							const authority =
								dating.authority.length > 0 && dating.authority[0]?.author
									? ` nach ${dating.authority[0]?.author}`
									: "";
							const page = dating.page ? `, S. ${dating.page}` : "";
							const citation =
								dating.authority.length > 0 && dating.authority[0]?.citation
									? ` (${dating.authority[0]?.citation}${page})`
									: "";
							return `${date}${authority}${citation}`;
						})}.`
					: "";
			const place =
				h.placed?.length > 0
					? ` Lokalisierung: ${h.placed.map((pl) => {
							const place = pl.place.map((p) => p.value).join(", ");
							const authority =
								pl.authority.length > 0 && pl.authority[0]?.author
									? ` nach ${pl.authority[0]?.author}`
									: "";
							const page = pl.page ? `, S. ${pl.page}` : "";
							const citation =
								pl.authority.length > 0 && pl.authority[0]?.citation
									? ` (${pl.authority[0]?.citation}${page})`
									: "";
							return `${place}${authority}${citation}`;
						})}.`
					: "";
			return `\\textbf{${label}}${scribe}${date}${place}${description}${nr_daniel}${note}${similarHands}`;
		})
		.join("\\\\ ");
	return mn("H", tex);
}

export function texBinding(ms) {
	const desc = ms.binding ?? "";
	const date = ms.binding_date?.[0]?.value;
	const acc = ms.acc_mat;

	if (!desc && !date && !acc) return "";

	return mn("E", `${desc}${date ? `, Datiert: ${date}` : ""}${acc ? ` ${acc}` : ""}`);
}

export function texHistory(ms) {
	const allDates = extractAllOriginDates(ms.orig_date);
	const places = safeJoin(
		ms.orig_place?.map((p) => p.value),
		", ",
	);
	const provenance =
		ms.provenance.length > 0 && ms.provenance.map((p) => p.library_full).join(", ");

	let tex = "";

	if (allDates || places) {
		tex += mn(
			"G",
			`Entstehung: ${allDates} ${places}. ${provenance ? `Provenienz: ${provenance}` : ""}`,
		);
	}

	return tex;
}

export function texBibliography(ms) {
	if (!ms.bibliography?.length) return "";

	const entries = ms.bibliography.map((b) => b.text ?? b).join(" \\\\ ");

	return mn("Lit.", entries) + "\n";
}
