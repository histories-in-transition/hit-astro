import { addPrevNextToMsItems, enrichPlaces, enrichBibl, enrichDates } from "../utils/utils.js";

/**
 * Process hands data by cleaning and standardizing the structure
 * @param {Array} hands - Raw hands data
 * @param {Object} deps - All dependencies in one object
 * @param {Array} deps.handsdated - Hands dating data
 * @param {Array} deps.handsplaced - Hands placement data
 * @param {Array} deps.handsrole - Hands role data
 * @param {Array} deps.msItemsPlus - Processed manuscript items data
 * @param {Array} deps.places - Places data
 * @param {Array} deps.bibliography - Bibliography data
 * @param {Array} deps.dates - Dates data
 * @returns {Array} Processed hands with prev/next navigation
 */
export function processHands(hands, deps) {
	if (!Array.isArray(hands)) {
		throw new Error("processHands expects an array of hands");
	}

	// Transform each hand
	const handsPlus = hands
		.filter((hand) => hand.label.length > 0) // skip hands with empty labels
		.map((hand) => transformHand(hand, deps));

	// Add navigation (prev/next)
	return addPrevNextToMsItems(handsPlus);
}

/**
 * Transform a single hand object
 * @param {Object} hand - Raw hand data
 * @param {Object} deps - All dependencies
 * @returns {Object} Transformed hand
 */
function transformHand(hand, deps) {
	const { handsdated, handsplaced, handsrole, msItemsPlus, places, bibliography, dates } = deps;

	// Get hand dating information
	const h_dated = getHandDating(hand, handsdated, bibliography, dates);

	// Get hand placement information
	const h_placed = getHandPlacement(hand, handsplaced, places, bibliography);

	// Get hand roles information
	const h_roles = getHandRoles(hand, handsrole, msItemsPlus);

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
		texts: [...new Set(hand.texts.map((text) => text.value))],
		author_entry: hand.author_entry.map((a) => a.value),
	};
}

/**
 * Get dating information for a hand
 * @param {Object} hand - Hand object
 * @param {Array} handsdated - Hands dating data
 * @param {Array} bibliography - Bibliography data
 * @param {Array} dates - Dates data
 * @returns {Array} Hand dating information
 */
function getHandDating(hand, handsdated, bibliography, dates) {
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

/**
 * Get placement information for a hand
 * @param {Object} hand - Hand object
 * @param {Array} handsplaced - Hands placement data
 * @param {Array} places - Places data
 * @param {Array} bibliography - Bibliography data
 * @returns {Array} Hand placement information
 */
function getHandPlacement(hand, handsplaced, places, bibliography) {
	return handsplaced
		.filter((hplaced) => hplaced.hand.some((h) => h.id === hand.id))
		.map((p_hand) => ({
			hit_id: p_hand.hit_id,
			authority: enrichBibl(p_hand.authority, bibliography),
			page: p_hand.page,
			place: enrichPlaces(p_hand.place, places),
		}));
}

/**
 * Get role information for a hand
 * @param {Object} hand - Hand object
 * @param {Array} handsrole - Hands role data
 * @param {Array} msItemsPlus - Processed manuscript items data
 * @returns {Array} Hand role information
 */
function getHandRoles(hand, handsrole, msItemsPlus) {
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
				locus_layout: hand_r.locus_layout.map((l) => l.value),
				all_in_one: hand_qualities,
			};
		});
}

/**
 * Get manuscript items related to a hand role
 * @param {Object} hand_r - Hand role object
 * @param {Array} msItemsPlus - Processed manuscript items data
 * @returns {Array} Related manuscript items
 */
function getMsItemsForHandRole(hand_r, msItemsPlus) {
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
 * @param {Object} hand_r - Hand role object
 * @returns {string} Hand qualities description
 */
function generateHandQualities(hand_r) {
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

/**
 * Enrich hands with scribe data (second pass)
 * @param {Array} hands - Hands from first processing pass
 * @param {Array} scribes - Processed scribes data
 * @returns {Array} Hands enriched with scribe data
 */
export function enrichHandsWithScribes(hands, scribes) {
	return hands.map((hand) => {
		// Find matching scribes for this hand
		const enrichedScribes = scribes.filter((scribe) => hand.scribe.some((s) => s.id === scribe.id));

		return {
			...hand,
			scribe: enrichedScribes, // Replace simple scribe refs with full scribe data
		};
	});
}
