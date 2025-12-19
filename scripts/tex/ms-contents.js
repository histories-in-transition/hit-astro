import { texEscape } from "./utils.js";

export default function MsContents(items) {
	if (!Array.isArray(items)) return "";

	const tex = items
		.map((item, index) => {
			const locus = texEscape(item.locus ?? "");

			const aut_title =
				item.title_work?.[0]?.title && item.title_work?.[0]?.author?.length > 0
					? `${item.title_work[0].author.map((a) => texEscape(a.name)).join(", ")}: ${texEscape(
							item.title_work[0].title,
						)}`
					: texEscape(item.title_work?.[0]?.title ?? item.title_note ?? "N/A");

			const language = item.language?.[0]?.value ? `(${texEscape(item.language[0].value)})` : "";

			const incipitTex = item.incipit ? ` Inc. \\textit{${texEscape(item.incipit)}}` : "";
			const explicitTex = item.explicit ? ` Expl. \\textit{${texEscape(item.explicit)}}` : "";
			const notesTex = item.notes ? ` Bemerkung: ${texEscape(item.notes)}` : "";

			return `\\begin{small}(${locus}) \\textsc{${aut_title}} ${language}${incipitTex}${explicitTex}${notesTex} \\end{small}`;
		})
		.join("\n\n");

	return tex;
}
