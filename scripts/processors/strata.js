import { addPrevNextToMsItems, enrichPlaces, enrichDates } from "../utils/utils.js";

/**
 * Process strata data by cleaning and standardizing the structure
 * @param {Array} strata - Raw strata data
 * @param {Object} deps - All dependencies
 * @param {Array} deps.handsrole - Hand roles data
 * @param {Array} deps.hands - Raw hands data
 * @param {Array} deps.handsdated - Hand dating data
 * @param {Array} deps.handsplaced - Hand placement data
 * @param {Array} deps.msItemsPlus - Processed manuscript items
 * @param {Array} deps.places - Places data
 * @param {Array} deps.dates - Dates data
 * @param {Array} deps.bibliography - Bibliography data
 * @param {Array} deps.strata_filiations - Strata filiations data
 * @returns {Array} Processed strata with prev/next navigation
 */
export function processStrata(strata, deps) {
	if (!Array.isArray(strata)) {
		throw new Error("processStrata expects an array of strata");
	}

	const {
		bibliography,
		dates,
		filiated_strata,
		handsrole,
		hands,
		handsdated,
		handsplaced,
		msItemsPlus,
		places,
		strata_filiations,
		strataa,
	} = deps;

	const processedStrata = strata
		.filter((strata) => strata.manuscript.length > 0)
		.map((stratum) =>
			transformStratum(
				stratum,
				handsrole,
				hands,
				handsdated,
				handsplaced,
				msItemsPlus,
				places,
				dates,
				bibliography,
				strata_filiations,
				strataa,
				filiated_strata,
			),
		);

	return addPrevNextToMsItems(processedStrata, "hit_id", "label");
}

/**
 * Transform a single stratum
 * @param {Object} stratum - Raw stratum data
 * @param {Array} handsrole - Hand roles data
 * @param {Array} hands - Raw hands data
 * @param {Array} handsdated - Hand dating data
 * @param {Array} handsplaced - Hand placement data
 * @param {Array} msItemsPlus - Processed manuscript items
 * @param {Array} places - Places data
 * @param {Array} dates - Dates data
 * @param {Array} bibliography - Bibliography data
 * @param {Array} strata_filiations
 * @returns {Object} Transformed stratum
 */
function transformStratum(
	stratum,
	handsrole,
	hands,
	handsdated,
	handsplaced,
	msItemsPlus,
	places,
	dates,
	bibliography,
	strata_filiations,
	strataa,
	filiated_strata,
) {
	// Get corresponding hand_roles data
	const h_roles = handsrole
		.filter((h_role) => stratum.hand_role.some((s_h_role) => s_h_role.id === h_role.id))
		.map((h_role) =>
			processHandRoleForStratum(
				h_role,
				hands,
				handsdated,
				handsplaced,
				msItemsPlus,
				places,
				dates,
				bibliography,
			),
		);

	// Get enriched manuscripts from the stratum
	const manuscript = getStratumManuscript(stratum, msItemsPlus);

	// Get all hands referenced by these hand_roles, with enrichment
	const enrichedHands = getStratumHands(
		h_roles,
		hands,
		handsdated,
		handsplaced,
		places,
		dates,
		bibliography,
	);

	// Get all ms_items referenced by these hand_roles
	const mssitems = getStratumMsItems(h_roles, msItemsPlus);

	// Get unique places and dates from enriched hands
	const stratumPlaces = getUniqueStratumPlaces(enrichedHands);
	const stratumDates = getUniqueStratumDates(enrichedHands);

	const stratum_filiations = getStratumFiliations(
		stratum,
		strata_filiations,
		filiated_strata,
		strataa,
	);

	return {
		id: stratum.id,
		hit_id: stratum.hit_id,
		number: stratum.number,
		manuscript: manuscript,
		label: stratum.label[0]?.value || "Unknown Stratum",
		character: stratum.character?.map((c) => c.value) ?? [],
		note: stratum.note ?? "",
		hand_roles: h_roles,
		msitems: mssitems,
		date: stratumDates,
		place: stratumPlaces,
		hands: enrichedHands,
		stratum_filiations: stratum_filiations,
	};
}
/**
 * function to enrich stratum with stratum_filiations
 *
 * @param {*} stratum
 * @param {*} strata_filiations
 * @param {*} filiated_strata
 * @param {*} strataa
 * @returns
 */
function getStratumFiliations(stratum, strata_filiations, filiated_strata, strataa) {
	return Object.values(strata_filiations || {})
		.filter((filiation) => filiation.stratum.some((str) => str.id === stratum.id))
		.map((filiation) => {
			// External filiations
			const ext = filiation.filiated_stratum.map((fs) => {
				const externalStratum = Object.values(filiated_strata).find((s) => s.id === fs.id);
				return {
					hit_id: externalStratum.hit_id,
					value: externalStratum.label[0].value,
					note: externalStratum.note || "",
					locus: externalStratum.locus || "",
					internal: false,
					catalog_url: externalStratum.catalog_url || "",
				};
			});
			// Internal filiations
			const inter = filiation.stratum
				.filter((str) => str.id !== stratum.id)
				.map((str) => {
					const internalStratum = Object.values(strataa).find((s) => s.id === str.id);
					return {
						hit_id: internalStratum.hit_id,
						value: internalStratum.label[0].value || "Unknown Stratum",
						internal: true,
					};
				});
			return {
				hit_id: filiation.hit_id,
				reason: filiation.reason.value || "",
				filiated_strata: [...ext, ...inter],
				note: filiation.note || "",
			};
		});
}

/**
 * Process hand role for stratum context
 */
function processHandRoleForStratum(
	h_role,
	hands,
	handsdated,
	handsplaced,
	msItemsPlus,
	places,
	dates,
	bibliography,
) {
	const hand = hands
		.filter((hand) => h_role.hand.some((hand_r) => hand_r.id === hand.id))
		.map((hand) => {
			const dhand = handsdated
				.filter((hand_d) => hand_d.hand.some((h) => hand.id === h.id))
				.flatMap((dhand) => enrichDates(dhand.dated, dates));

			const placedHand = handsplaced
				.filter((hplaced) => hplaced.hand.some((h) => h.id === hand.id))
				.flatMap((p_hand) => enrichPlaces(p_hand.place, places));

			return {
				hit_id: hand.hit_id,
				label: hand.label[0]?.value || "Unknown Hand",
				date: dhand,
				place: placedHand,
			};
		});

	const mssitems = msItemsPlus
		.filter((mitem) => h_role.ms_item.some((item) => item.id === mitem.id))
		.map((item) => ({
			id: item.id,
			hit_id: item.hit_id,
			title: item.title_work.map((t) => t.title),
			author: item.title_work.flatMap((t) => t.author?.map((a) => a.name) || []),
			locus: item.locus,
		}));

	return {
		hit_id: h_role.hit_id,
		hand: hand,
		ms_item: mssitems,
		role: h_role.role?.map((r) => r.value) ?? [],
		locus: h_role.locus,
		scribe_type: h_role.scribe_type?.map((type) => type.value) ?? [],
		function: h_role.function?.map((func) => func.value) ?? [],
		locus_layout: h_role.locus_layout?.map((layout) => layout.value) ?? [],
	};
}

/**
 * Get manuscript information for stratum
 */
function getStratumManuscript(stratum, msItemsPlus) {
	// Get manuscript info from the stratum's manuscript references
	return (
		stratum.manuscript?.map((ms) => {
			// Find additional info from msItemsPlus if needed
			const relatedMsItems = msItemsPlus.filter((item) =>
				item.manuscript.some((manuscript) => manuscript.id === ms.id),
			);

			return {
				id: ms.id,
				hit_id: ms.hit_id,
				value: ms.value,
				// Add library info if available from msItems
				library: relatedMsItems[0]?.library || [],
				author_entry: relatedMsItems[0]?.author_entry || [],
				project: relatedMsItems[0]?.project || [],
			};
		}) || []
	);
}

/**
 * Get enriched hands for stratum
 */
function getStratumHands(h_roles, hands, handsdated, handsplaced, places, dates, bibliography) {
	const enrichedHands = h_roles.flatMap((h_role) => h_role.hand).filter(Boolean);

	// Remove duplicates by hit_id
	return Array.from(new Map(enrichedHands.map((h) => [h.hit_id, h])).values());
}

/**
 * Get ms items for stratum
 */
function getStratumMsItems(h_roles, msItemsPlus) {
	const msitems = h_roles
		.flatMap((h_role) => h_role.ms_item)
		.filter(Boolean)
		.map((item) => {
			// ... your existing enrichment logic ...
			const fullItem = msItemsPlus.find((msi) => msi.id === item.id);
			const authorNames =
				fullItem?.title_work.flatMap((t) =>
					t.author ? t.author.map((a) => a.name).filter(Boolean) : [],
				) || [];
			const titles = fullItem?.title_work.map((t) => t.title).join("; ") || "";
			const w_aut = authorNames.length > 0 ? `${authorNames.join("; ")}: ${titles}` : titles;

			return {
				id: item.id,
				hit_id: item.hit_id,
				work:
					fullItem?.title_work.map((t) => ({
						title: t.title,
						hit_id: t.hit_id,
					})) || [],
				author: fullItem?.title_work.flatMap((t) => t.author || []) || [],
				w_aut: w_aut,
				locus: item.locus,
				orig_date: fullItem?.orig_date || [],
				orig_place: fullItem?.orig_place || [],
				provenance: fullItem?.provenance || [],
				hands:
					fullItem?.hands.filter((hand) =>
						hand.jobs.some((job) => h_roles.some((h_role) => h_role.hit_id === job.hit_id)),
					) || [],
				text_modification: fullItem?.text_modification || [],
				interpolations: fullItem?.interpolations || [],
				form: fullItem?.form || [],
				language: fullItem.language || [],
			};
		});

	// Deduplicate by id
	return Array.from(new Map(msitems.map((item) => [item.id, item])).values());
}

/**
 * Get unique places from stratum hands
 */
function getUniqueStratumPlaces(enrichedHands) {
	return [
		...new Map(
			enrichedHands.flatMap((hand) => hand.place || []).map((obj) => [`${obj?.id}`, obj]),
		).values(),
	];
}

/**
 * Get unique dates from stratum hands
 */
function getUniqueStratumDates(enrichedHands) {
	return [
		...new Map(
			enrichedHands.flatMap((hand) => hand.date || []).map((obj) => [`${obj?.id}`, obj]),
		).values(),
	];
}

// ===== UTILITY FUNCTIONS FOR MANUSCRIPT PROCESSOR =====

/**
 * Get cod units for a specific manuscript from processed cod units
 * @param {Object} manuscript - Manuscript object
 * @param {Array} processedCodUnits - Already processed cod units
 * @returns {Array} Cod units belonging to this manuscript
 */
export function getCodUnitsForManuscript(manuscript, processedCodUnits) {
	return processedCodUnits.filter((unit) => unit.manuscript.some((ms) => ms.id === manuscript.id));
}

/**
 * Get strata for a specific manuscript from processed strata
 * @param {Object} manuscript - Manuscript object
 * @param {Array} processedStrata - Already processed strata
 * @returns {Array} Strata belonging to this manuscript
 */
export function getStrataForManuscript(manuscript, processedStrata) {
	return processedStrata.filter((stratum) =>
		stratum.manuscript.some((ms) => ms.id === manuscript.id),
	);
}

/**
 * Create TBD stratum for uncharted hand roles
 * @param {Object} manuscript - Manuscript object
 * @param {Array} handsrole - Hand roles data
 * @param {Array} msItemsPlus - Processed manuscript items
 * @param {Array} processedStrata - Already processed strata
 * @param {Array} hands - Raw hands data
 * @param {Array} handsdated - Hand dating data
 * @param {Array} handsplaced - Hand placement data
 * @param {Array} places - Places data
 * @param {Array} dates - Dates data
 * @param {Array} bibliography - Bibliography data
 * @returns {Object|null} TBD stratum or null if no uncharted roles
 */
export function createTBDStratum(
	manuscript,
	handsrole,
	msItemsPlus,
	processedStrata,
	hands,
	handsdated,
	handsplaced,
	places,
	dates,
	bibliography,
) {
	const uncharted_roles = handsrole
		.filter((h_role) =>
			msItemsPlus.some(
				(item) =>
					item.manuscript.some((ms) => ms.id === manuscript.id) &&
					item.hands.some((hand) => hand.jobs.some((j) => j.id === h_role.id)),
			),
		)
		.filter(
			(h_role) =>
				!processedStrata.some((stratum) =>
					stratum.hand_roles.some((hr) => hr.hit_id === h_role.hit_id),
				),
		)
		.map((h_role) =>
			processHandRoleForStratum(
				h_role,
				hands,
				handsdated,
				handsplaced,
				msItemsPlus,
				places,
				dates,
				bibliography,
			),
		);

	if (uncharted_roles.length === 0) {
		return null;
	}

	return {
		id: "TBD",
		hit_id: `TBD_${manuscript.id}`,
		number: "TBD",
		label: "undefined stratum",
		character: ["TBD"],
		hand_roles: uncharted_roles,
		note: "These hand-roles are not yet assigned to a stratum",
		manuscript: [
			{
				id: manuscript.id,
				hit_id: manuscript.hit_id,
				value: manuscript.shelfmark?.[0]?.value || "Unknown Manuscript",
			},
		],
		msitems: [],
		date: [],
		place: [],
		hands: [],
	};
}
