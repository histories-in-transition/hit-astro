import React from "react";

/**
 * function to render the info on Beschreibstoff, Lagen, Extent etc
 * must check if there is only one object in cod_unit array
 * if so render all the indormation as belonging to the whole MS
 * if several cod. units, make .
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
