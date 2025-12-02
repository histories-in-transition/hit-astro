// use marginal note for Section abbreviation, check if there is something to write (value)
// if so write the marginal note (label) with its value
// used in Manuscript.jsx for sections G: B: etc and in MsContents
export const mn = (label, value) =>
	value && value.toString().trim()
		? `\\begin{adjustwidth}{+20pt}{}\\noindent\\makebox[0pt][r]{${label}:\\quad}${value}\\end{adjustwidth}\n\n`
		: "";

export const safeJoin = (arr, sep = ", ") =>
	Array.isArray(arr) && arr.length > 0 ? arr.join(sep) : "";

export const superscriptify = (str = "") => str.replace(/\*\*(.*?)\*\*/g, "\\textsuperscript{$1}");

export const extractPreferredDate = (dates) => {
	if (!dates?.length) return "";
	return dates.find((d) => d.preferred_date)?.date?.[0]?.value ?? dates[0]?.date?.[0]?.value ?? "";
};

export const extractAllOriginDates = (dates) => {
	if (!dates?.length) return "";

	return dates
		.map((d) => {
			const date = d.date?.[0]?.value;
			if (!date) return "";
			const auth = d.authority
				?.map((a) => `nach ${a.author}${a.citation ? ` (${a.citation})` : ""}`)
				.join("; ");
			return `${date}${auth ? " " + auth : ""}`;
		})
		.filter(Boolean)
		.join("; ");
};

export function texEscape(str = "") {
	return str
		.replace(/([{}$%_#])/g, "\\$1") // escape special chars
		.replace(/~/g, "\\textasciitilde{}")
		.replace(/\^/g, "\\textasciicircum{}");
}
