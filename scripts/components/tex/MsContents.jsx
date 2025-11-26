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
	if (!items || items.length === 0) {
		return null;
	}

	return (
		<>
			{items.map((item, index) => {
				const {
					locus = item.locus ? item.locus : "",
					title = item.title ? item.title : item.title_note,
					language = item.language ? item.language : "",
					incipit = item.incipit ? item.incipit : "",
					explicit = item.explicit ? item.explicit : "",
					notes = item.notes ? item.notes : "",
				} = item;

				return (
					<div key={index}>
						{`\\leavevmode \\marginnote{${locus}} \\textsc{${title}} ${language && language}`}

						{incipit && <>{` Inc. \\textit{${incipit}}`}</>}

						{explicit && <>{` Expl. \\textit{${explicit}}`}</>}

						{notes && <>{` Bemerkung: ${notes}`}</>}

						{` \\\\[0.3\\baselineskip]\n`}
					</div>
				);
			})}
		</>
	);
}
