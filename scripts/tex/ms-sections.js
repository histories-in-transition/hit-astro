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

//function to render the hands information
// gets hand_roles array from strata
// if strata is TBD write in main ms
// otherwise to specific strata
export function texScript(roles) {
	if (!Array.isArray(roles) || roles.length === 0) return "";

	// Flatten all hands from all roles into one array of strings
	const allHands = roles.flatMap((role) => {
		if (!role.hand || role.hand.length === 0) return [];
		return role.hand.map((h) => {
			const label = h.label.split("_")[1];
			const dating = h.date?.map((d) => d.value).join(", ") || "";
			const place = h.place?.map((p) => p.value).join(", ") || "";
			return `${label}${dating ? ` ${dating}` : ""}${place ? `, ${place})` : ""}`;
		});
	});

	// Join everything into a single string, one "H"
	return allHands.length > 0 ? mn("H", allHands.join(". ")) : "";
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
