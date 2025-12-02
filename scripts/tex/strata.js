export default function Strata(strata) {
	if (!strata || strata.length === 0) return "";

	const tex = strata.flatMap((stratum) => {
		const number = stratum.number ?? "N/A";
		const label = stratum.label ?? "N/A";
		const character = stratum.character?.length ? stratum.character.join(", ") : "";
		const notes = stratum.note ? stratum.note : "";
		const date = stratum.date?.length ? stratum.date.map((d) => d.value).join(", ") : "";
		const place = stratum.place?.length ? stratum.place.map((p) => p.value).join(", ") : "";

		const filiations = (stratum.stratum_filiations ?? [])
			.map((f) => {
				const val = f.filiated_strata[0].value;
				const locus = f.filiated_strata[0].locus ? ` (${f.filiated_strata[0].locus})` : "";
				const note = f.note ? `: ${f.note}` : "";
				const reason = f.reason ? ` (${f.reason})` : "";
				return `${val}${locus}${reason}${note}`;
			})
			.join("; ");

		const handroles = (stratum.hand_roles ?? [])
			.map((hr) => {
				const msitem = hr.ms_item
					?.map((mi) => {
						const author =
							mi.author?.length > 0 ? `${mi.author.join(", ")}: ${mi.title}` : mi.title;
						const locus = mi.locus ? ` (${mi.locus})` : "";
						return `${author}${locus}`;
					})
					.join(" \\\\ ");
				const hand = hr.hand.length > 0 ? hr.hand.map((h) => h.label.split("_")[1]).join(", ") : "";
				const role = (hr.role ?? []).join(", ");
				const scribe = (hr.scribe_type ?? []).join(", ");
				const func = (hr.function ?? []).join(", ");
				const locus = hr.locus ? hr.locus : "";
				const layout = (hr.layout ?? []).join(", ");

				return `${msitem} & ${hand ?? ""} & ${role} & ${scribe} & ${func} & ${locus} & ${layout} \\\\`;
			})
			.join("\n");

		const hasTable = stratum.hand_roles?.length > 0;

		const beginTable = hasTable
			? `\\begin{center}
			{\\footnotesize
\\begin{longtable}{|p{4.5cm}|p{2cm}|p{3cm}|p{3cm}|p{3cm}|p{2cm}|p{3cm}|}
\\caption{${label}.} \\\\

\\hline 
\\textbf{Werk} & 
\\textbf{Hand} & 
\\textbf{Rolle} & 
\\textbf{Schreiber-Typ} & 
\\textbf{Funktion} & 
\\textbf{Umfang} & 
\\textbf{Mise-en-page} \\\\
\\hline 
\\endfirsthead

\\hline
\\textbf{Werk} &
\\textbf{Hand} &
\\textbf{Rolle} &
\\textbf{Schreiber-Typ} &
\\textbf{Funktion} &
\\textbf{Umfang} &
\\textbf{Mise-en-page} \\\\
\\hline
\\endhead

\\hline {Fortsetzung auf der nächsten Seite} \\\\ \\hline
\\endfoot

\\hline
\\endlastfoot
`
			: "";

		const endTable = hasTable ? "\\end{longtable}\n}\n\\end{center}" : "";

		return `
\\begin{landscape}		
\\section{Stratum ${number}}

${date ? `\\textbf{Datiert:} ${date}. \\par` : ""} 
${place ? `\\textbf{Ort:} ${place}.\\par` : ""} 
${character ? `\\textbf{Charakter:} ${character}.\\par` : ""} 
${notes ? `\\textbf{Bemerkung:} ${notes}\\par` : ""} 
${filiations ? `\\textbf{Filiationen:} ${filiations} \\par` : ""}

${beginTable}
${handroles}
${endTable}
\\end{landscape}
`;
	});

	return tex.join("\n");
}
