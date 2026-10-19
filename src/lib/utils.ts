export function makeSuperScript(text: string): string {
	if (!text) return text;
	// Regex to find text between *asterisks*
	const regex = /\*\*(.*?)\*\*/g;
	// Replace the matched text with <sup> tags
	return text.replace(regex, "<sup>$1</sup>");
}

export const parseLocus = (locus) =>
	locus.split("-").map((part) => {
		const match = part.match(/^(\d+)([rv]?)$/);
		if (!match) return [Infinity, "z"];
		return [parseInt(match[1], 10), match[2] || ""];
	});

export const sortByLocus = (a, b) => {
	const [startA, endA = startA] = parseLocus(a.locus);
	const [startB, endB = startB] = parseLocus(b.locus);

	return (
		startA[0] - startB[0] ||
		startA[1].localeCompare(startB[1]) ||
		endA[0] - endB[0] ||
		endA[1].localeCompare(endB[1])
	);
};

export const palette = [
	"#1f77b4",
	"#ff7f0e",
	"#2ca02c",
	"#d62728",
	"#9467bd",
	"#c7523a",
	"#e377c2",
	"#7f7f7f",
	"#bcbd22",
	"#17becf",
	"#393b79",
	"#637939",
	"#8c6d31",
	"#843c39",
	"#7b4173",
	"#3182bd",
	"#e6550d",
	"#31a354",
	"#756bb1",
	"#636363",
];
export function getStratumColor(stratum: string | number) {
	return palette[Number(stratum) % palette.length];
}
