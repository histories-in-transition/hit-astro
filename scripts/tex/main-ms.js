import {
	Heading,
	texMaterial,
	texLayout,
	texBinding,
	texHistory,
	texBibliography,
	texScripts,
} from "./ms-sections.js";
import MsContents from "./ms-contents.js";
import Codunits from "./cod-unit.js";
import Strata from "./strata.js";
export default function MainMS(manuscript) {
	if (!manuscript) return "";

	let tex = "";
	tex += Heading(manuscript);
	tex += texMaterial(manuscript);
	tex += texLayout(manuscript);
	tex += texScripts(manuscript);
	tex += texBinding(manuscript);
	tex += texHistory(manuscript);
	tex += texBibliography(manuscript);

	if (manuscript.content?.length > 0) {
		tex += MsContents(manuscript.content);
	}

	if (manuscript.cod_units?.length === 1) {
		tex += MsContents(manuscript.cod_units[0].content);
	} else if (manuscript.cod_units?.length > 1) {
		tex += Codunits(manuscript.cod_units);
	}

	tex += Strata(manuscript.strata);

	return tex;
}
