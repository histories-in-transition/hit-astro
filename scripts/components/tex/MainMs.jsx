import React from "react";

/**
 * Partial Component to render the info on the main manuscript level.
 *
 * Renders the manuscript-level information:
 * - Material, extent, binding
 * - Creation date/place
 * - Provenance
 * - Bibliography references
 */
export default function GeneralSection({ manuscript }) {
	const {
		origDate = manuscript.orig_date.length > 0
			? // Try to find preferred date
				(manuscript.orig_date.find((d) => d.preferred_date === true)?.date[0]?.value ??
				// If none, fall back to first entry's date
				manuscript.orig_date[0]?.date[0]?.value)
			: "",
		allOrigDates = manuscript.orig_date.length > 0
			? manuscript.orig_date
					.filter((d) => d.date[0]?.value)
					.map(
						(d) =>
							`${d.date[0]?.value} ${d.authority.length > 0 ? d.authority.map((aut) => `nach ${aut.author} (${aut.citation ? aut.citation : "N/A"})`) : ""}`,
					)
					.join(" | ")
			: "",
		origPlace = manuscript.orig_place.length > 0
			? manuscript.orig_place.map((pl) => pl.value).join(" | ")
			: "",
		material = manuscript.material.join(", "),
		extent = manuscript.extent || "",
		height = manuscript.height || "",
		width = manuscript.width || "",
		bindingDesc = manuscript.binding || "",
		bindingDate = manuscript.binding_date.length > 0 &&
			`Datiert: ${manuscript.binding_date[0]?.value}`,
		quireWithSuperscripts = manuscript.quire_structure.replace(
			/\*\*(.*?)\*\*/g,
			"\\textsuperscript{$1}",
		),
	} = manuscript;

	return (
		<>
			{`\\begin{adjustwidth}{-20pt}{}
\\textbf{Sammelbuch}

\\smallskip
${material}, ${extent} Bl. ${height}×${width} mm. ${origPlace && origPlace} ${origDate && `, ${origDate}`}

\\newline
${manuscript.content_summary || ""}
\\end{adjustwidth}

`}

			{/* Extent/Quire */}
			{manuscript.cod_units.length === 1 && (
				<>
					{`\\leavevmode \\marginnote{B:}`}
					{material}
					{manuscript.cod_units[0]?.basic_structure.length > 0 &&
						`: ${manuscript.cod_units[0]?.basic_structure.join(", ")}`}
					{manuscript.cod_units[0]?.material_spec && `: ${manuscript.cod_units[0]?.material_spec}`}
					{quireWithSuperscripts && `, Lagenstruktur: ${quireWithSuperscripts}.`}
					{manuscript.foliation && `${manuscript.foliation}`}
					{`\n\n`}
				</>
			)}
			{/* Binding */}
			{bindingDesc && (
				<>
					{`\\leavevmode \\marginnote{E:}`}
					{bindingDesc}
					{bindingDate && `, ${bindingDate}`}
					{manuscript.acc_mat && ` ${manuscript.acc_mat}`}
					{`\n\n`}
				</>
			)}
			{/* History */}
			{(manuscript.orig_date.length > 0 ||
				manuscript.orig_place.length > 0 ||
				manuscript.provenance.length > 0) && (
				<> {`\\leavevmode \\marginnote{G:}Entstehung: ${allOrigDates} ${origPlace}`}</>
			)}
			{manuscript.provenance.length > 0 && (
				<>
					{`\n\n Provenienz: `}
					{manuscript.provenance.map((prov) => prov.library_full).join(", ")}
					{manuscript.idno_former && `, ${manuscript.idno_former}`}
					{`\n\n`}
				</>
			)}
			{/* Bibliography */}
			{manuscript.bibliography?.length > 0 && (
				<>
					{`\\leavevmode \\marginnote{Lit.:}`}
					{manuscript.bibliography.map((item, idx) => (
						<span key={idx}>
							{item.text || item}
							{idx < manuscript.bibliography.length - 1 && " \\\\ "}
						</span>
					))}
					{`\n\n`}
				</>
			)}
		</>
	);
}
