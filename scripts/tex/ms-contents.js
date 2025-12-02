export default function MsContents(items) {
	if (!Array.isArray(items)) return "";

	const tex = items
		.map((item, index) => {
			const n = index + 1;
			const locus = item.locus ?? "";

			const aut_title =
				item.title_work?.[0]?.title && item.title_work?.[0]?.author?.length > 0
					? `${item.title_work[0].author.map((a) => a.name).join(", ")}: ${item.title_work[0].title}`
					: `${item.title_work?.[0]?.title || item.title_note || "N/A"}`;

			const language = item.language?.[0]?.value ? `(${item.language[0].value})` : "";

			const incipitTex = item.incipit ? ` Inc. \\textit{${item.incipit}}` : "";
			const explicitTex = item.explicit ? ` Expl. \\textit{${item.explicit}}` : "";
			const notesTex = item.notes ? ` Bemerkung: ${item.notes}` : "";

			return `\\begin{small}(${locus}) \\textsc{${aut_title}} ${language}
${incipitTex}${explicitTex}${notesTex} \\end{small}`;
		})
		.join("\n\n");

	return tex;
}
