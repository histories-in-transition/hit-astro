export function makeSuperScript(text) {
	if (!text) return text;
	// Regex to find text between *asterisks*
	const regex = /\*\*(.*?)\*\*/g;
	// Replace the matched text with <sup> tags
	return text.replace(regex, "<sup>$1</sup>");
}
