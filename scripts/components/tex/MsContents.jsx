import React from "react";

/**
 * ContentsList
 *
 * Renders each item in the "Inhaltsverzeichnis" (msContents).
 * Each item typically has:
 * - Folio range (e.g., "1r-7r")
 * - Title (e.g., "Vita sanctae Euphrosinae")
 * - Language
 * - Incipit and Explicit (opening and closing lines)
 * - Notes/remarks
 *
 * This is the most detailed component - loops through content items.
 */
export default function MsContent({ items }) {
	if (!items || items.length === 0) return null;

	// Build full TeX output
	const tex = items
		.map((item, index) => {
			// Safe extraction with defaults
			const n = index + 1;
			const locus = item.locus ?? "";
			const aut_title =
				item.title_work[0]?.title && item.title_work[0]?.author?.length > 0
					? `${item.title_work[0]?.author?.map((aut) => aut.name).join(", ")}: ${item.title_work[0]?.title}`
					: `${item.title_work[0]?.title || item.title_note || "N/A"}`;
			const language = `(${item.language[0].value})` ?? "";
			const incipit = item.incipit ?? "";
			const explicit = item.explicit ?? "";
			const notes = item.notes ?? "";

			// Build each optional part
			const incipitTex = incipit ? ` Inc. \\textit{${incipit}}` : "";
			const explicitTex = explicit ? ` Expl. \\textit{${explicit}}` : "";
			const notesTex = notes ? ` Bemerkung: ${notes}` : "";

			// Final TeX block for this entry
			return `(${locus}) \\textsc{${aut_title}} ${language}
${incipitTex}${explicitTex}${notesTex}
`;
		})
		.join("\n");

	return tex;
}
