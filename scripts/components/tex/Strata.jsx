import React from "react";

export default function Strata(strata) {
	if (!strata || strata.length === 0) return "";

	const tex = strata.map((stratum, index) => {
		const number = stratum.number ?? "N/A";
		const label = stratum.label ?? "N/A";
		const character = stratum.character.length > 0 ? stratum.character.join(", ") : "";
		const notes = stratum.note ?? "";
		const date = stratum.date.length > 0 ? stratum.date.map((d) => d.value).join(", ") : "";
		const place = stratum.place.length > 0 ? stratum.place.map((p) => p.value).join(", ") : "";
		// const filiations =
		// 	stratum.stratum_filiations.length > 0
		// 		? stratum.stratum_filiations.map((f) => f.value).join(", ")
		// 		: "";

		return `
\\section{Stratum ${number}} \n
${date ? `Datiert: ${date}.\n` : ""}
${place ? `Ort: ${place}.\n` : ""}
${character ? `Charakter: ${character}.\n` : ""}
${notes ? `Bemerkung: ${notes}\n` : ""}
`;
	});
	return tex.join("\n");
}
