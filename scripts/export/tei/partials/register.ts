import type { Manuscript } from "@/types";
import { esc, lines } from "./helpers.ts";
import type { Place, Library, TitleWork, Author } from "@/types/index.ts";

interface Bibl {
	hit_id: string;
	author?: string | null;
	title: string;
	link?: string | null;
}

/**
 * Walks through the whole object (including nested arrays and objects) and collects
 * every object whose `hit_id` starts with `prefix`, keyed by its hit_id.
 */
function collectByHitId<T>(
	obj: unknown,
	prefix: string,
	map: Map<string, T> = new Map(),
): Map<string, T> {
	if (Array.isArray(obj)) {
		obj.forEach((item) => collectByHitId(item, prefix, map));
	} else if (obj !== null && typeof obj === "object") {
		const record = obj as Record<string, unknown>;
		const id = record.hit_id;
		if (typeof id === "string" && id.startsWith(prefix)) {
			map.set(id, obj as T);
		}
		Object.values(record).forEach((value) => collectByHitId(value, prefix, map));
	}
	return map;
}

/** <ptr type="..." target="..."/>, or "" if there is no target. */
function ptr(type: string, target: string | null | undefined): string {
	return target ? `<ptr type="${type}" target="${esc(target)}"/>` : "";
}

/** Wraps items in an opening and closing tag, or returns "" if there are no items. */
function wrap(openTag: string, closeTag: string, items: string[]): string {
	return items.length > 0 ? lines(openTag, ...items, closeTag) : "";
}

function renderPerson(id: string, person: Author): string {
	return lines(
		`<person xml:id="${esc(id)}">`,
		`<persName>${esc(person.name)}`,
		ptr("gnd", person.gnd_url),
		`</persName>`,
		`</person>`,
	);
}

function renderPlace(id: string, place: Place): string {
	const hasCoordinates = place.lat != null && place.long != null;

	return lines(
		`<place xml:id="${esc(id)}">`,
		`<placeName>${esc(place.value)}`,
		ptr("geonames", place.geonames_url),
		`</placeName>`,
		hasCoordinates
			? lines(`<location>`, `<geo>${esc(place.lat)} ${esc(place.long)}</geo>`, `</location>`)
			: "",
		`</place>`,
	);
}

function renderOrg(id: string, org: Library): string {
	const place = org.place?.[0];

	return lines(
		`<org xml:id="${esc(id)}">`,
		`<orgName>${esc(org.library_full)}`,
		ptr("wikidata", org.wikidata),
		ptr("gnd", org.gnd_url),
		`</orgName>`,
		place ? `<placeName ref="#${esc(place.hit_id)}">${esc(place.value)}</placeName>` : "",
		`</org>`,
	);
}

function renderWork(id: string, work: TitleWork): string {
	const authors = (work.author ?? []).map(
		(author) => `<author ref="#${esc(author.hit_id)}">${esc(author.name)}</author>`,
	);

	let sourceTextNote = "";
	if (work.source_text && work.source_text.length > 0) {
		const refs = work.source_text
			.map((s) => `<ref target="#${esc(s.hit_id)}">${esc(s.title)}</ref>`)
			.join(", ");
		const noteSource = work.note_source ? ` ${esc(work.note_source)}` : "";
		sourceTextNote = `<note type="source_text">${refs}${noteSource}</note>`;
	}

	const mainGenre = (work.mainGenre ?? []).join(", ");
	const subGenre = (work.subGenre ?? []).join(", ");
	const genreNote =
		mainGenre || subGenre
			? `<note type="genre">${esc([mainGenre, subGenre].filter(Boolean).join(" ; "))}</note>`
			: "";

	return lines(
		`<bibl xml:id="${esc(id)}">`,
		`<title>${esc(work.title)}</title>`,
		...authors,
		ptr("gnd", work.gnd_url),
		work.note ? `<note>${esc(work.note)}</note>` : "",
		sourceTextNote,
		genreNote,
		`</bibl>`,
	);
}

function renderBibl(id: string, bibl: Bibl): string {
	return lines(
		`<bibl xml:id="${esc(id)}">`,
		`<author>${esc(bibl.author)}</author>`,
		`<title>${esc(bibl.title)}</title>`,
		ptr("zotero", bibl.link),
		`</bibl>`,
	);
}

export function makeRegister(ms: Manuscript): string {
	const scribes = collectByHitId<Author>(ms, "hit_scribe__");
	const authors = collectByHitId<Author>(ms, "hit_people__");
	const places = collectByHitId<Place>(ms, "hit_place__");
	const orgs = collectByHitId<Library>(ms, "hit_org__");
	const works = collectByHitId<TitleWork>(ms, "hit_works__");
	const bibls = collectByHitId<Bibl>(ms, "hit_bibl__");

	return lines(
		wrap(
			`<listPerson type="scribes">`,
			`</listPerson>`,
			Array.from(scribes, ([id, p]) => renderPerson(id, p)),
		),
		wrap(
			`<listPerson type="authors">`,
			`</listPerson>`,
			Array.from(authors, ([id, p]) => renderPerson(id, p)),
		),
		wrap(
			`<listPlace>`,
			`</listPlace>`,
			Array.from(places, ([id, p]) => renderPlace(id, p)),
		),
		wrap(
			`<listOrg>`,
			`</listOrg>`,
			Array.from(orgs, ([id, o]) => renderOrg(id, o)),
		),
		wrap(
			`<listBibl type="works">`,
			`</listBibl>`,
			Array.from(works, ([id, w]) => renderWork(id, w)),
		),
		wrap(
			`<listBibl type="bibliography">`,
			`</listBibl>`,
			Array.from(bibls, ([id, b]) => renderBibl(id, b)),
		),
	);
}
