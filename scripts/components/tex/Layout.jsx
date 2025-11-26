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
export default function Layout({ units }) {
	if (!units || units.length === 0) {
		return null;
	}

	return (
		<>
			{units.map((unit, index) => {
				const {
					material = unit.material & unit.material_spec
						? `${unit.material}: ${unit.material_spec}.`
						: unit.material
							? `${unit.material}.`
							: "",
					writtenSize = unit.written_height & unit.written_width
						? `${unit.written_height}×${unit.written_width}`
						: "",
					leafSize = unit.height & unit.width ? `${unit.height}×${unit.width} mm.` : "",
					columnsDesc = unit.columns.length > 0 && `Spalten: ${unit.columns.join(", ")}.`,
					lines = unit.lines && `Zeilen: ${unit.lines_number}.`,
					origin = unit.prov_place.length > 0 &&
						unit.prov_place
							.filter((prov) => prov.type === "orig")
							.map((prov) =>
								prov.places[0].value & prov.authority[0].author & prov.authority[0].citation
									? `${prov.places[0].value} nach ${prov.authority[0].author} (${prov.authority[0].citation})`
									: prov.places[0].value & prov.authority[0].author
										? `${prov.places[0].value} nach ${prov.authority[0].author}`
										: prov.places[0].value && prov.places[0],
							),
				} = unit;
				return (
					<>
						{`\\section{Kodikologische Einheit ${unit.number}`}
						{`\\leavevmode \\marginnote{B:} ${material} ${leafSize} ${unit.catchwords} ${unit.quiremarks}`}
						{`\\leavevmode \\marginnote{S:} Schriftspiegel ${writtenSize} ${columnsDesc} ${lines} ${unit.ruling && unit.ruling}`}
						{`\\leavevmode \\marginnote{A:} ${unit.decoration && unit.decoration} `}
						{`\\leavevmode \\marginnote{G:} ${origin} `}
					</>
				);
			})}
		</>
	);
}
