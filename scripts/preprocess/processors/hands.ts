import { addPrevNextToMsItems, enrichPlaces, enrichBibl, enrichDates } from "./utils.ts";
import type { Place, MsItem, Scribe } from "@/types/index.ts";
import type {
	HitHand,
	HitHandsDated,
	HitHandsPlaced,
	HitHandRole,
	HitBibliography,
	HitDates,
} from "@/types/zod/zod-types.ts";

type HandsDeps = {
	handsdated: HitHandsDated[];
	handsplaced: HitHandsPlaced[];
	handsrole: HitHandRole[];
	msItemsPlus: MsItem[];
	places: Place[];
	bibliography: HitBibliography[];
	dates: HitDates[];
};
export function processHands(hands: HitHand[], deps: HandsDeps) {
	if (!Array.isArray(hands)) {
		throw new Error("processHands expects an array of hands");
	}

	const handsPlus = hands
		.filter((hand) => hand.label.length > 0)
		.map((hand) => transformHand(hand, deps));

	return addPrevNextToMsItems(handsPlus);
}

function transformHand(hand: HitHand, deps: HandsDeps) {
	const { handsdated, handsplaced, handsrole, msItemsPlus, places, bibliography, dates } = deps;

	// Get hand dating information
	const h_dated = getHandDating(hand, handsdated, bibliography, dates);

	// Get hand placement information
	const h_placed = getHandPlacement(hand, handsplaced, places, bibliography);

	// Get hand roles information
	const h_roles = getHandRoles(hand, handsrole, msItemsPlus);

	// Get all texts (author: work title) which wrote this hand

	const texts = [
		...new Map(
			h_roles.flatMap((role) =>
				role.content.flatMap((cont) => cont.title_work.map((work) => [work.hit_id, work])),
			),
		).values(),
	];

	return {
		id: hand.id,
		hit_id: hand.hit_id,
		label: hand.label[0].value,
		view_label: hand.label[0].value,
		description: hand.description,
		similar_hands: hand.similar_hands.map(({ order, ...rest }) => rest),
		nr_daniel: hand.nr_daniel ?? "",
		manuscript: hand.manuscript.map(({ order, ...rest }) => rest),
		note: hand.note ?? "",
		roles: [...new Set(hand.role.flatMap((r) => r.value.map((v) => v.value)))],
		scribe: hand.scribe.map(({ order, ...rest }) => rest),
		group: hand.gruppe,
		date: h_dated,
		hand_roles: h_roles,
		placed: h_placed,
		texts: texts,
		author_entry: hand.author_entry.map((a) => a.value),
	};
}

/** Get dating information for a hand
 */
function getHandDating(
	hand: HitHand,
	handsdated: HitHandsDated[],
	bibliography: HitBibliography[],
	dates: HitDates[],
) {
	return handsdated
		.filter((dhand) => dhand.hand.some((h) => h.id === hand.id))
		.map((dathand) => ({
			hit_id: dathand.hit_id,
			authority: enrichBibl(dathand.authority, bibliography),
			page: dathand.page ?? "",
			dated: enrichDates(dathand.dated, dates),
			dating: dathand.new_dating,
			note: dathand.note ?? "",
		}));
}

/* placement information for a hand*/
function getHandPlacement(
	hand: HitHand,
	handsplaced: HitHandsPlaced[],
	places: Place[],
	bibliography: HitBibliography[],
) {
	return handsplaced
		.filter((hplaced) => hplaced.hand.some((h) => h.id === hand.id))
		.map((p_hand) => ({
			hit_id: p_hand.hit_id,
			authority: enrichBibl(p_hand.authority, bibliography),
			page: p_hand.page,
			place: enrichPlaces(p_hand.place, places),
		}));
}

/**  role information for a hand*/
function getHandRoles(hand: HitHand, handsrole: HitHandRole[], msItemsPlus: MsItem[]) {
	return handsrole
		.filter((hrol) => hrol.hand.some((h) => h.id === hand.id))
		.filter((hrol) => hrol.ms_item.length > 0) // Only include roles with manuscript items
		.map((hand_r) => {
			// Get related manuscript items
			const msitem = getMsItemsForHandRole(hand_r, msItemsPlus);

			// Generate hand qualities description
			const hand_qualities = generateHandQualities(hand_r);

			return {
				hit_id: hand_r.hit_id,
				content: msitem,
				scope: hand_r.locus ?? "",
				role: hand_r.role.map((r) => ({ value: r.value })),
				function: hand_r.function.map((f) => ({ value: f.value })),
				scribe_type: hand_r.scribe_type.map((sc) => ({ value: sc.value })),
				locus_layout: hand_r.locus_layout.map((l) => ({ value: l.value })),
				all_in_one: hand_qualities,
			};
		});
}

/** manuscript items related to a hand role*/
function getMsItemsForHandRole(hand_r: HitHandRole, msItemsPlus: MsItem[]) {
	return msItemsPlus
		.filter((m) => m.hands.some((han) => han.jobs.some((j) => j.hit_id === hand_r.hit_id)))
		.map((msit) => ({
			hit_id: msit.hit_id,
			title_work: msit.title_work.map((t) => ({
				hit_id: t.hit_id,
				title: t.title,
				author: t.author,
			})),
			locus: msit.locus,
		}));
}

/**
 * Generate a descriptive string for hand qualities
 */
function generateHandQualities(hand_r: HitHandRole): string {
	const roles = hand_r.role.map((r) => r.value);
	const scribeTypes = hand_r.scribe_type.map((s) => s.value);
	const functions = hand_r.function.map((f) => f.value);

	if (scribeTypes.length > 0 && functions.length > 0) {
		return `${roles} (${scribeTypes} — ${functions})`;
	} else if (scribeTypes.length > 0) {
		return `${roles} (${scribeTypes})`;
	} else {
		return roles.join(", ");
	}
}

// function for second pass of hands processing to enrich with enriched scribes

export function enrichHandsWithScribes(hands: ReturnType<typeof processHands>, scribes: Scribe[]) {
	return hands.map((hand) => {
		const enrichedScribes = scribes.filter((scribe) => hand.scribe.some((s) => s.id === scribe.id));

		return {
			...hand,
			scribe: enrichedScribes,
		};
	});
}
