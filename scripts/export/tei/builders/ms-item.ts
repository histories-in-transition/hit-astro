// builders/ms-item.ts
import { el, when, whenStr, join, escapeXml, buildLocus } from "../utils";
import type { MsItem } from "@/types/msitem";

export interface BuildMsItemArgs {
	item: MsItem;
	index: number;
	renderedItems: Set<string>;
}

export function buildMsItem({ item, index, renderedItems }: BuildMsItemArgs): string {
	const isFirstOccurrence = !renderedItems.has(item.hit_id);

	if (isFirstOccurrence) {
		renderedItems.add(item.hit_id);
	}

	return el(
		"msItem",
		join([
			// locus / locusGrp
			buildLocus(item.locus),

			// authors
			when(
				item.title_work?.[0]?.author?.length > 0,
				join(
					item.title_work[0].author.map((author) =>
						el("author", escapeXml(author.name), { ref: `#${author.hit_id}` }),
					),
				),
			),

			// title
			when(
				item.title_work?.length > 0,
				el("title", escapeXml(item.title_work[0].title), { ref: `#${item.title_work[0].hit_id}` }),
			),

			// version
			when(
				item.version?.length > 0,
				el("note", escapeXml(item.version[0].value), { type: "version" }),
			),

			// language
			when(
				item.language?.length > 0,
				el("textLang", escapeXml(item.language.map((l) => l.value).join(", ")), { mainLang: "" }),
			),

			// title note
			when(Boolean(item.title_note), el("note", escapeXml(item.title_note), { type: "title" })),

			// rubric / incipit / explicit / finalRubric
			whenStr(item.rubric, el("rubric", escapeXml(item.rubric))),
			whenStr(item.incipit, el("incipit", escapeXml(item.incipit))),
			whenStr(item.explicit, el("explicit", escapeXml(item.explicit))),
			whenStr(item.final_rubric, el("finalRubric", escapeXml(item.final_rubric))),

			// decoration
			when(
				item.decoration?.length > 0,
				el("decoNote", join(item.decoration.map((d) => el("term", escapeXml(d.value)))), {
					type: "initial",
				}),
			),

			// bibliography
			when(
				item.bibl?.length > 0,
				el("listBibl", join(item.bibl.map((b) => el("bibl", el("abbr", escapeXml(b.citation)))))),
			),

			// form
			when(
				item.form?.length > 0 || Boolean(item.form_note),
				el(
					"note",
					join([
						...(item.form ?? []).map((f) => el("term", escapeXml(f.value))),
						whenStr(item.form_note, el("p", escapeXml(item.form_note))),
					]),
					{ type: "form" },
				),
			),

			// generic note
			whenStr(item.note, el("note", escapeXml(item.note))),

			// text modification
			when(
				item.text_modification?.length > 0,
				el("note", escapeXml(item.text_modification.join(", ")), { type: "text_modification" }),
			),

			// interpolations
			when(
				item.interpolations?.length > 0,
				el(
					"note",
					join(
						item.interpolations.map((inter) => {
							const authors = inter.author.map((a) => a.name);
							const label =
								authors.length === 0 ? inter.title : `${authors.join(", ")}: ${inter.title}`;

							return `<ref target="#${inter.hit_id}">${escapeXml(label)}</ref>`;
						}),
						" ",
					),
					{ type: "interpolations" },
				),
			),
		]),
		{
			...(isFirstOccurrence ? { "xml:id": item.hit_id } : { sameAs: `#${item.hit_id}` }),
			n: String(index + 1),
		},
	);
}
