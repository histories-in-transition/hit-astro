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
