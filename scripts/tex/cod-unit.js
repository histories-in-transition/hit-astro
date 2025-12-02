import MsContents from "./ms-contents.js";
import { mn } from "./utils.js";
/**
 * function to render the cod_unit array
 */

export default function Codunits(units) {
	const tex = units
		.map((unit) => {
			// Safe values
			const material = unit.material ?? "";
			const material_spec = unit.material_spec ?? "";

			const basic_structure = unit.basic_structure.join(", ");

			const writtenSize =
				unit.written_height && unit.written_width
					? `${unit.written_height}×${unit.written_width}`
					: "";

			const leafSize = unit.height && unit.width ? `${unit.height}×${unit.width} mm.` : "";

			const columnsDesc = unit.columns.length > 0 ? `Spalten: ${unit.columns.join(", ")}.` : "";

			const lines = unit.lines_number ? `Zeilen: ${unit.lines_number}.` : "";

			const origin = Array.isArray(unit.prov_place)
				? unit.prov_place
						.filter((p) => p.type === "orig")
						.map((p) => {
							const place = p.places?.[0]?.value ?? "";
							const author = p.authority?.[0]?.author ?? "";
							const citation = p.authority?.[0]?.citation ?? "";

							const from = p.from?.[0]?.value ?? "";
							const till = p.till?.[0]?.value ?? "";

							let date = "";
							if (from && till) date = ` (${from}–${till})`;
							else if (from) date = ` (ab ${from})`;
							else if (till) date = ` (bis ${till})`;

							if (!place) return null;

							if (author && citation) return `${place}${date} nach ${author} (${citation})`;
							if (author) return `${place}${date} nach ${author}`;
							return `${place}${date}`;
						})
						.filter(Boolean)
						.join("; ")
				: "";

			const provenance = Array.isArray(unit.prov_place)
				? unit.prov_place
						.filter((prov) => prov.type === "prov")
						.map((p) => {
							const place = p.places?.[0]?.value ?? "";
							const author = p.authority?.[0]?.author ?? "";
							const citation = p.authority?.[0]?.citation ?? "";

							const from = p.from?.[0]?.value ?? "";
							const till = p.till?.[0]?.value ?? "";

							let date = "";
							if (from && till) date = ` (${from}–${till})`;
							else if (from) date = ` (ab ${from})`;
							else if (till) date = ` (bis ${till})`;

							if (!place) return null;

							if (author && citation) return `${place}${date} nach ${author} (${citation})`;
							if (author) return `${place}${date} nach ${author}`;
							return `${place}${date}`;
						})
						.filter(Boolean)
						.join("; ")
				: "";

			const contentsTex = MsContents(unit.content ?? []);

			return `
\\section{Kodikologische Einheit ${unit.number || ""}}

${mn(
	"B",
	`${material} ${basic_structure ? `${basic_structure}.` : ""} ${
		material_spec || ""
	} ${leafSize} ${unit.catchwords ? `Reklamanten: ${unit.catchwords}` : ""} ${unit.quiremarks ? `Kustoden: ${unit.quiremarks}` : ""}`,
)}
${mn("S", `${writtenSize} ${columnsDesc} ${lines} ${unit.ruling ?? ""}`)}
${mn("A", unit.decoration ?? "")}
${mn(
	"G",
	`${origin ? `Entstehung: ${origin}` : ""}${provenance ? `\n\n Provenienz: ${provenance}` : ""}`,
)}
\\end{adjustwidth}

${contentsTex}
`;
		})
		.join("\n");

	return tex;
}
