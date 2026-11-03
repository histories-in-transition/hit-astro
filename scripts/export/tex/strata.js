import { texEscape } from "./utils.js";

export default function Strata(strata, manuscript) {
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

		// Join an array with ", " and escape it for LaTeX. Returns "—" if missing or empty.
		const joinOrDash = (arr) => (arr?.length ? texEscape(arr.join(", ")) : "—");

		//stratum has only the hand_roles hit_id, full data only in manuscript.hands
		//Step 1: build a lookup of all roles from hands, keyed by hit_id.
		// Each role gets a `hands` array with every hand that has this role.
		const rolesById = new Map();

		for (const h of manuscript.hands ?? []) {
			for (const hr of h.hand_roles ?? []) {
				// first time we see this role: store a copy with an empty hands array
				if (!rolesById.has(hr.hit_id)) {
					rolesById.set(hr.hit_id, { ...hr, hands: [] });
				}
				// every time: add the current hand to the role
				rolesById.get(hr.hit_id).hands.push({
					hit_id: h.hit_id,
					label: h.label,
					date: h.date,
				});
			}
		}

		// Step 2: the stratum only has IDs, use the lookup above
		const stratumRoles = (stratum.hand_roles ?? []).map((id) => rolesById.get(id)).filter(Boolean); // drop IDs that were not found

		// Step 3: build the table rows
		const handroles = stratumRoles
			.map((hr) => {
				const msitem = (hr.content ?? [])
					.map((mi) => {
						const title = (mi.title_work ?? []).map((w) => texEscape(w.title)).join("; ");
						const itemLocus = mi.locus ? ` (${texEscape(mi.locus)})` : "";
						return `${title}${itemLocus}`;
					})
					.join(" \\\\ ");

				const hand = (hr.hands ?? [])
					.map((h) => {
						const num = texEscape(h.label.split("_")[1]);

						return num;
					})
					.join(", ");

				const role = joinOrDash(hr.role);
				const scribe = joinOrDash(hr.scribe_type);
				const func = joinOrDash(hr.function);
				const layout = joinOrDash(hr.locus_layout);
				const locus = hr.locus ? texEscape(hr.locus) : "—";

				return `${msitem} & ${hand} & ${role} & ${scribe} & ${func} & ${locus} & ${layout} \\\\`;
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
