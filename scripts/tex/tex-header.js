import MainMS from "./main-ms.js";

export default function TexHeader(manuscript) {
	const library = manuscript.library?.[0];
	const libraryCity = library?.place?.[0]?.value ?? "N/A";
	const libraryAbbr = library?.abbreviation ?? "N/A";
	const shelfmark = manuscript.shelfmark ?? "N/A";
	const editor = manuscript.author_entry?.length ? manuscript.author_entry.join(", ") : "N/A";

	return `
\\documentclass[12pt]{article}

% Fonts & Unicode
\\usepackage{fontspec}

% Multilingual
\\usepackage{polyglossia}
\\setdefaultlanguage{german}

% Layout
\\usepackage{geometry}
\\geometry{a4paper}
\\setlength{\\parskip}{0.5em}
\\setlength{\\parindent}{0pt}
\\usepackage[strict]{changepage}
\\usepackage{longtable}
\\usepackage{pdflscape}

% Page headers/footers
\\usepackage[markcase=noupper]{scrlayer-scrpage}
\\ohead{}
\\cfoot*{\\pagemark}

% Sectioning
\\setcounter{secnumdepth}{-1}

% Hyperlinks
\\usepackage{hyperref}

% Title
\\title{Beschreibung von ${libraryCity}, ${libraryAbbr}, ${shelfmark}}
\\author{${editor}}
\\date{2025}

\\begin{document}
\\maketitle

${MainMS(manuscript)}

\\end{document}
`;
}
