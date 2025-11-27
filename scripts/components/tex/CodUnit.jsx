import React from "react";
import MsContents from "./MsContents.jsx";
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
export default function Codunits({ units }) {
	if (!units || units.length === 0) return null;

	// Build one TeX block for all units
	const tex = units
		.map((unit) => {
			// Prepare all values safely
			const material = unit.material;
			const material_spec = unit.material_spec;
			const basic_structure = unit.basic_structure.join(", ");

			const writtenSize =
				unit.written_height && unit.written_width
					? `${unit.written_height}×${unit.written_width}`
					: "";

			const leafSize = unit.height && unit.width ? `${unit.height}×${unit.width} mm.` : "";

			const columnsDesc = unit.columns?.length > 0 ? `Spalten: ${unit.columns.join(", ")}.` : "";

			const lines = unit.lines_number ? `Zeilen: ${unit.lines_number}.` : "";

			// Build origin safely
			const origin = unit.prov_place
				?.filter((p) => p.type === "orig")
				.map((p) => {
					const place = p.places?.[0]?.value ?? "";
					const author = p.authority?.[0]?.author ?? "";
					const citation = p.authority?.[0]?.citation ?? "";

					if (!place) return null;
					if (author && citation) return `${place} nach ${author} (${citation})`;
					if (author) return `${place} nach ${author}`;
					return place;
				})
				.filter(Boolean)
				.join("; "); // join array to single tex string
			// Generate TeX for unit contents
			const contentsTex = MsContents({ items: unit.content });
			// Return TeX for this unit
			return `
\\section{Kodikologische Einheit ${unit.number}} \n\n
${mn("B", `${material} ${basic_structure ? `${basic_structure}.` : ""}${material_spec ? `${material_spec}` : ""} ${leafSize} ${unit.catchwords ?? ""} ${unit.quiremarks ?? ""}`)}
${mn("S", `${writtenSize} ${columnsDesc} ${lines} ${unit.ruling ?? ""}`)}
${mn("A", unit.decoration)}
${mn("G", origin)}

${contentsTex}
`;
		})
		.join("\n"); // Combine all units into one tex document string

	// Render the complete TeX as text
	return tex;
}
// Helper to conditionally print a marginnote line
const mn = (label, value) =>
	value.trim() ? `\\leavevmode \\marginnote{${label}:} ${value.trim()}\n` : "";
