export function escapeXml(value?: string | null): string {
	if (!value) return "";
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function el(
	name: string,
	content: string,
	attrs: Record<string, string | undefined> = {},
): string {
	const attrString = Object.entries(attrs)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
		.join("");

	return `<${name}${attrString}>${content}</${name}>`;
}

export function when(condition: boolean, content: string): string {
	return condition ? content : "";
}

export function whenStr(value: string | null | undefined, content: string): string {
	return value ? content : "";
}

export function join(items: string[], sep = "\n"): string {
	return items.filter(Boolean).join(sep);
}

export function buildLocus(locus?: string): string {
	if (!locus) return "";

	const loci = locus.split("|").map((l) => l.trim());

	const renderSingle = (loc: string): string => {
		if (loc.includes("-")) {
			const [from, to] = loc.split("-").map((s) => s.trim());
			return el("locus", escapeXml(loc), { from, to });
		}
		return el("locus", escapeXml(loc), { from: loc });
	};

	if (loci.length > 1) {
		return el("locusGrp", join(loci.map(renderSingle)));
	}

	return renderSingle(loci[0]);
}
