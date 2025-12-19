import MsContents from "./ms-contents.js";
import { mn } from "./utils.js";
import { texEscape } from "./utils.js";

/**
 * function to render the cod_unit array
 */
export default function Codunits(units) {
	const tex = units
		.map((unit) => {
			const material = texEscape(unit.material ?? "");
			const material_spec = texEscape(unit.material_spec ?? "");
			const basic_structure = unit.basic_structure?.map(texEscape).join(", ") ?? "";
			const writtenSize =
				unit.written_height && unit.written_width
					? `${texEscape(unit.written_height)}×${texEscape(unit.written_width)}`
					: "";
			const leafSize =
				unit.height && unit.width ? `${texEscape(unit.height)}×${texEscape(unit.width)} mm.` : "";
			const columnsDesc =
				unit.columns?.length > 0 ? `Spalten: ${unit.columns.map(texEscape).join(", ")}.` : "";
			const lines = unit.lines_number ? `Zeilen: ${texEscape(unit.lines_number)}.` : "";
			const catchwords = unit.catchwords ? texEscape(unit.catchwords) : "";
			const quiremarks = unit.quiremarks ? texEscape(unit.quiremarks) : "";
			const decoration = texEscape(unit.decoration ?? "");
			const ruling = texEscape(unit.ruling ?? "");

			// Helper to format dates/places
			const formatProv = (provArray, type) =>
				Array.isArray(provArray)
					? provArray
							.filter((p) => p.type === type)
							.map((p) => {
								const place = texEscape(p.places?.[0]?.value ?? "");
								if (!place) return null;

								const author = texEscape(p.authority?.[0]?.author ?? "");
								const citation = texEscape(p.authority?.[0]?.citation ?? "");
								const from = texEscape(p.from?.[0]?.value ?? "");
								const till = texEscape(p.till?.[0]?.value ?? "");

								let date = "";
								if (from && till) date = ` (${from}–${till})`;
								else if (from) date = ` (ab ${from})`;
								else if (till) date = ` (bis ${till})`;

								if (author && citation) return `${place}${date} nach ${author} (${citation})`;
								if (author) return `${place}${date} nach ${author}`;
								return `${place}${date}`;
							})
							.filter(Boolean)
							.join("; ")
					: "";

			const origin = formatProv(unit.prov_place, "orig");
			const provenance = formatProv(unit.prov_place, "prov");

			const contentsTex = MsContents(unit.content ?? []);

			return `
\\section{Kodikologische Einheit ${texEscape(unit.number ?? "")}}

${mn(
	"B",
	`${material} ${basic_structure ? `${basic_structure}.` : ""} ${
		material_spec || ""
	} ${leafSize} ${catchwords ? `Reklamanten: ${catchwords}` : ""} ${
		quiremarks ? `Kustoden: ${quiremarks}` : ""
	}`,
)}
${mn("S", `${writtenSize} ${columnsDesc} ${lines} ${ruling}`)}
${mn("A", decoration)}
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
