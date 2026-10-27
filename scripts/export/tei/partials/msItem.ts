import type { MsItem } from "@/types";

function esc(value: string | number | null | undefined): string {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/** Renders `<tag>value</tag>`, or an empty string if there is no value. */
function simpleEl(tag: string, value: string | null | undefined): string {
	return value ? `<${tag}>${esc(value)}</${tag}>` : "";
}

/** One locus, e.g. "12r" or "12r-15v". */
function renderLocus(loc: string): string {
	if (loc.includes("-")) {
		const [from, to] = loc.split("-").map((s) => s.trim());
		return `<locus from="${esc(from)}" to="${esc(to)}">${esc(loc)}</locus>`;
	}
	return `<locus from="${esc(loc)}">${esc(loc)}</locus>`;
}

/** Several loci separated by "|" get wrapped in a <locusGrp>. */
function renderLoci(locus: string): string {
	const loci = locus.split("|").map((l) => l.trim());

	if (loci.length > 1) {
		return `<locusGrp>\n${loci.map(renderLocus).join("\n")}\n</locusGrp>`;
	}
	return renderLocus(loci[0] ?? "");
}

export function renderMsItem(
	item: MsItem,
	index: number,
	renderedItems: Set<MsItem["hit_id"]> = new Set(),
): string {
	// The first time we see an item it gets an xml:id, later ones point to it with sameAs.
	// Note: this changes the Set that the caller passed in (on purpose, like the old code).
	const isFirstOccurrence = !renderedItems.has(item.hit_id);
	if (isFirstOccurrence) renderedItems.add(item.hit_id);

	const idAttr = isFirstOccurrence
		? `xml:id="${esc(item.hit_id)}"`
		: `sameAs="#${esc(item.hit_id)}"`;

	const work = item.title_work[0];
	const parts: string[] = [];

	if (item.locus) parts.push(renderLoci(item.locus));

	work?.author?.forEach((author) => {
		parts.push(`<author ref="#${esc(author.hit_id)}">${esc(author.name)}</author>`);
	});

	if (work) {
		parts.push(`<title ref="#${esc(work.hit_id)}">${esc(work.title)}</title>`);
	}

	if (item.version.length > 0) {
		parts.push(`<note type="version">${esc(item.version[0]?.value)}</note>`);
	}

	if (item.language.length > 0) {
		// Raw (not escaped), like `<%~` in the old template
		const languages = item.language.join(", ");
		parts.push(`<textLang mainLang="">${languages}</textLang>`);
	}

	if (item.title_note) {
		parts.push(`<note type="title">${esc(item.title_note)}</note>`);
	}

	parts.push(
		simpleEl("rubric", item.rubric),
		simpleEl("incipit", item.incipit),
		simpleEl("explicit", item.explicit),
		simpleEl("finalRubric", item.final_rubric),
	);

	if (item.decoration.length > 0) {
		const terms = item.decoration.map((deco) => `<term>${esc(deco.value)}</term>`).join("\n");
		parts.push(`<decoNote type="initial">\n${terms}\n</decoNote>`);
	}

	//   if (item.bibl && item.bibl.length > 0) {
	//     const entries = item.bibl
	//       .map((b) => `<bibl><abbr>${esc(b)}</abbr></bibl>`)
	//       .join("\n");
	//     parts.push(`<listBibl>\n${entries}\n</listBibl>`);
	//   }

	const forms = item.form ?? [];
	if (forms.length > 0 || item.form_note) {
		const inner = [
			...forms.map((f) => `<term>${esc(f.value)}</term>`),
			item.form_note ? `<p>${esc(item.form_note)}</p>` : "",
		]
			.filter(Boolean)
			.join("\n");
		parts.push(`<note type="form">\n${inner}\n</note>`);
	}

	parts.push(simpleEl("note", item.note));

	if (item.text_modification.length > 0) {
		// Raw (not escaped), like `<%~` in the old template
		parts.push(`<note type="text_modification">${item.text_modification.join(", ")}</note>`);
	}

	if (item.interpolations.length > 0) {
		// Raw (not escaped), like `<%~` in the old template
		const refs = item.interpolations
			.map((inter) => {
				const authors = inter.author.map((a) => a.name);
				const label = authors.length === 0 ? inter.title : `${authors.join(", ")}: ${inter.title}`;
				return `<ref target="#${inter.hit_id}">${label}</ref>`;
			})
			.join(" ");
		parts.push(`<note type="interpolations">${refs}</note>`);
	}

	return `<msItem ${idAttr} n="${index + 1}">\n${parts.filter(Boolean).join("\n")}\n</msItem>`;
}
