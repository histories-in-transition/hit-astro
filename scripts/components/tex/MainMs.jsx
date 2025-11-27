import React from "react";
import {
	Heading,
	texBinding,
	texHistory,
	texBibliography,
	texMaterial,
	texLayout,
} from "./MsSections.jsx";
import Codunits from "./CodUnit.jsx";
import MsContents from "./MsContents.jsx";

/**
 * This is the main Manuscript wrapper. It:
 * calls dependent components for binding, history, content etc from Manuscript component
 */

export default function MainMS({ manuscript }) {
	if (!manuscript) return null;

	let tex = "";

	tex += Heading(manuscript);
	tex += texMaterial(manuscript);
	tex += texLayout(manuscript);
	tex += texBinding(manuscript);
	tex += texHistory(manuscript);
	tex += texBibliography(manuscript);

	// checks if the ms has only one cod. units, if so write the content
	// else calls template component for Cod units
	if (manuscript.cod_units?.length === 1) {
		tex += MsContents({ items: manuscript.cod_units[0].content });
	} else if (manuscript.cod_units?.length > 1) {
		tex += Codunits({ units: manuscript.cod_units });
	}

	return tex;
}
