import type { Manuscript } from "@/types";
import { renderMsItem } from "./msItem.ts";
import { makePhysDesc } from "./physDesc.ts";
import { makeHistory } from "./history.ts";
import { makeMsPart } from "./codUnit.ts";

export function makeMsDesc(ms: Manuscript): string {
	const material = ms.material ?? "";

	const extent = ms.extent ? `, ${ms.extent} Bl.` : "";

	const size = ms.height && ms.width ? ` ${ms.height}×${ms.width} mm.` : "";

	const place = ms.orig_place?.length ? ` ${ms.orig_place.map((p) => p.value).join(", ")}` : "";

	const date = ms.orig_date?.length
		? ` ${ms.orig_date.map((o) => o.date.map((d) => d.value).join(", ")).join("; ")}`
		: "";

	const caption = `${material}${extent}${size}${place}${date}`;

	//content for one cod unit
	const renderedItems = new Set<string>();

	let content = "";
	if (ms.cod_units.length === 1 && ms.cod_units[0].content) {
		content = ms.cod_units[0].content
			.map((item, index) => renderMsItem(item, index, renderedItems))
			.join("\n");
	}

	return `
        <msDesc xml:id="${ms.hit_id}" xml:lang="deu">
            <msIdentifier>
                <settlement>${ms.library[0]?.place[0]?.value ?? ""}</settlement>
                <repository>${ms.library[0]?.library_full ?? ""}</repository>
                <idno>${ms.shelfmark}</idno>
            </msIdentifier>
            <head>
                <title>${ms.title}</title>
                <note type="caption">${caption}</note>
            </head>
            <msContent>
                <summary>${ms.content_summary}</summary>
                <textLang mainLang="lat"/>
                ${content}
            </msContent>
            ${makePhysDesc(ms)}
            ${makeHistory(ms)}
            ${ms.cod_units.map((unit) => makeMsPart(ms, unit, renderedItems))}
        </msDesc>
  `;
}
