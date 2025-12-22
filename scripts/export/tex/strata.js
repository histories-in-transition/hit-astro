import { texEscape } from "./utils.js";

export default function Strata(strata) {
	if (!strata || strata.length === 0) return "";

	const tex = strata.flatMap((stratum) => {
		const number = texEscape(stratum.number ?? "N/A");
		const label = texEscape(stratum.label ?? "N/A");

		const character = stratum.character?.length ? texEscape(stratum.character.join(", ")) : "";

		const notes = stratum.note ? texEscape(stratum.note) : "";

		const date = stratum.date?.length ? texEscape(stratum.date.map((d) => d.value).join(", ")) : "";

		const place = stratum.place?.length
			? texEscape(stratum.place.map((p) => p.value).join(", "))
			: "";

		const filiations = (stratum.stratum_filiations ?? [])
			.map((f) => {
				const fs = f.filiated_strata[0] ?? {};
				const val = texEscape(fs.value ?? "");
				const locus = fs.locus ? ` (${texEscape(fs.locus)})` : "";
				const reason = f.reason ? ` (${texEscape(f.reason)})` : "";
				const note = f.note ? `: ${texEscape(f.note)}` : "";
				return `${val}${locus}${reason}${note}`;
			})
			.join("; ");

		// Data for hand roles table
		const handroles = (stratum.hand_roles ?? [])
			.map((hr) => {
				const msitem = hr.ms_item
					?.map((mi) => {
						const author =
							mi.author?.length > 0
								? `${texEscape(mi.author.join(", "))}: ${texEscape(mi.title)}`
								: texEscape(mi.title);
						const locus = mi.locus ? ` (${texEscape(mi.locus)})` : "";
						return `${author}${locus}`;
					})
					.join(" \\\\ ");

				const hand = hr.hand?.length
					? texEscape(hr.hand.map((h) => h.label.split("_")[1]).join(", "))
					: "";

				const role = texEscape((hr.role ?? []).join(", "));
				const scribe = texEscape((hr.scribe_type ?? []).join(", "));
				const func = texEscape((hr.function ?? []).join(", "));
				const locus = hr.locus ? texEscape(hr.locus) : "";
				const layout = texEscape((hr.layout ?? []).join(", "));

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
