import React from "react";
import GeneralSection from "./MainMs.jsx";
// import CodicUnit from "./CodicUnit.jsx";

/**
 * ManuscriptTemplate
 *
 * This is the main wrapper. It:
 * 1. Outputs the LaTeX preamble (documentclass, packages, etc.)
 * 2. Sets title/author info
 * 3. Renders the general manuscript info
 * 4. Renders each codicological unit
 *
 * In React, we return a string instead of JSX to the DOM.
 * We use fragments and regular strings to build LaTeX.
 */
export default function ManuscriptTemplate({ manuscript }) {
	// Get the library info (if it exists)
	const library = manuscript.library?.[0];
	const libraryCity = library?.place[0]?.value || "N/A";
	const libraryAbbr = library?.abbreviation || "N/A";
	const shelfmark = manuscript.shelfmark || "N/A";
	const editor = manuscript.author_entry.length > 0 ? manuscript.author_entry.join(", ") : "N/A";

	const units = manuscript.cod_units || [];

	return (
		<>
			{`\\documentclass{article}
\\usepackage[ngerman]{babel}
\\usepackage[utf8x]{inputenc}
\\setlength\\parindent{0pt}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{
  a4paper,
  textwidth=150mm,
  left=40mm,
  top=40mm,
}
\\usepackage{marginnote}
\\usepackage[strict]{changepage}
\\setlength{\\parskip}{0.5em}
\\usepackage[markcase=noupper]{scrlayer-scrpage}
\\ohead{}
\\cfoot*{\\pagemark}
\\reversemarginpar
\\setcounter{secnumdepth}{-1}

\\title{Beschreibung von ${libraryCity}, ${libraryAbbr}, ${shelfmark}}
\\author{${editor}}
\\date{2025}

\\begin{document}
\\maketitle

`}
			<GeneralSection manuscript={manuscript} />

			{/* {units.length > 0 ? (
				units.map((unit, index) => <CodicUnit key={index} unit={unit} unitNumber={index + 1} />)
			) : (
				<div>{`\\textit{No codicological units found}`}</div>
			)} */}

			{`\\end{document}
`}
		</>
	);
}
