import type { Manuscript } from "@/types";
import { esc, lines } from "./helpers.ts";

// Types taken straight from your Manuscript type, so they always stay in sync
type Hand = Manuscript["hands"][number];
type HandRole = Hand["hand_roles"][number];

// Minimal shape of a bibliographic authority. Adjust if your type differs.
type Authority = { hit_id: string | number; citation?: string | null };

/** <note><bibl>...</bibl></note> pointing at the first authority, or "" if there is none. */
function renderAuthorityNote(
	authority: Authority[] | null | undefined,
	page: string | number | null | undefined,
): string {
	const auth = authority?.[0];
	if (!auth) return "";

	return lines(
		`<note>`,
		`<bibl><ref target="#${esc(auth.hit_id)}">${esc(auth.citation)}</ref>, S. ${esc(page || "N/A")}</bibl>`,
		`</note>`,
	);
}

function renderDating(dating: Hand["date"][number]): string {
	const dated = dating.dated?.[0];
	if (!dated) return "";

	return lines(
		`<date notBefore="${esc(dated.not_before)}" notAfter="${esc(dated.not_after)}">${esc(dated.value)}`,
		renderAuthorityNote(dating.authority, dating.page),
		`</date>`,
	);
}

function renderPlacement(placement: Hand["placed"][number]): string {
	const place = placement.place?.[0];
	if (!place) return "";

	return lines(
		`<placeName ref="#${esc(place.hit_id)}">${esc(place.value)}`,
		renderAuthorityNote(placement.authority, placement.page),
		`</placeName>`,
	);
}

/** <term type="...">value1, value2</term> */
function renderTerm(type: string, items: string[]): string {
	return `<term type="${type}">${esc(items.join(", "))}</term>`;
}

function renderRole(role: HandRole, handId: string | number): string {
	const passive = role.content.map((item) => `#${item.hit_id}`).join(" ");

	const msItems = role.content.map(
		(item) =>
			`<item><ref target="#${esc(item.hit_id)}">${esc(item.title_work[0]?.title)}</ref></item>`,
	);

	return lines(
		`<relation xml:id="${esc(role.hit_id)}" active="#${esc(handId)}" passive="${esc(passive)}">`,
		`<desc>`,
		`<list type="msitems">`,
		...msItems,
		`</list>`,
		`<locus>${esc(role.scope)}</locus>`,
		renderTerm("scribe_role", role.role),
		renderTerm("scribe_type", role.scribe_type),
		renderTerm("function", role.function),
		renderTerm("locus_layout", role.locus_layout),
		`</desc>`,
		`</relation>`,
	);
}

function renderHandNote(hand: Hand): string {
	const scribes = hand.scribe.map(
		(scribe) =>
			`<persName role="scribe" ref="${esc(scribe.hit_id)}">${esc(scribe.name)}</persName>`,
	);

	const similarHands = hand.similar_hands
		.map(
			(sim) =>
				`<ref type="similar_hand" target="#hit_hands__${esc(sim.id)}">${esc(sim.value)}</ref>`,
		)
		.join(" ");

	const listRelation =
		hand.hand_roles.length > 0
			? lines(
					`<listRelation>`,
					...hand.hand_roles.map((role) => renderRole(role, hand.hit_id)),
					`</listRelation>`,
				)
			: "";

	return lines(
		`<handNote xml:id="${esc(hand.hit_id)}">`,
		`<name>${esc(hand.label)}</name>`,
		...scribes,
		hand.nr_daniel ? `<ref type="daniel">${esc(hand.nr_daniel)}</ref>` : "",
		`<desc>${esc(hand.description)}</desc>`,
		hand.note ? `<note>${esc(hand.note)}</note>` : "",
		similarHands,
		...hand.date.map(renderDating),
		...hand.placed.map(renderPlacement),
		listRelation,
		`</handNote>`,
	);
}

export function makeHandDesc(ms: Manuscript): string {
	return lines(`<handDesc>`, ...ms.hands.map(renderHandNote), `</handDesc>`);
}
