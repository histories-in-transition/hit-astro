import {
	addPrevNextToMsItems,
	enrichPlaces,
	enrichWorks,
	enrichBibl,
	enrichDates,
} from "../utils/utils.js";

/**
 * Process manuscript items - Version 2: Dependencies object
 * @param {Array} msItems - Raw manuscript items data
 * @param {Object} deps - All dependencies in one object
 * @returns {Array} Processed manuscript items
 */
export function processMsItems(msItems, deps) {
	if (!Array.isArray(msItems)) {
		throw new Error("processMsItems expects an array of manuscript items");
	}

	// Destructure what we need from dependencies
	const {
		manuscripts,
		places,
		librariesPlus,
		works,
		people,
		genres,
		hands,
		handsdated,
		handsplaced,
		handsrole,
		cod_unitsprov,
		bibliography,
		dates,
	} = deps;

	// Transform each manuscript item
	const msItemsPlus = msItems
		.filter((item) => item.manuscript.length > 0 && (item.title_work.length > 0 || item.title_note))
		.map((item) => transformMsItem(item, deps, msItems)); // Pass original msItems array

	return addPrevNextToMsItems(msItemsPlus);
}

/**
 * Transform a single manuscript item
 * @param {Object} item - Raw manuscript item
 * @param {Object} deps - All dependencies
 * @param {Array} originalMsItems - Original msItems array for commented items
 * @returns {Object} Transformed manuscript item
 */
function transformMsItem(item, deps, originalMsItems) {
	const {
		manuscripts,
		places,
		librariesPlus,
		works,
		people,
		genres,
		hands,
		handsdated,
		handsplaced,
		handsrole,
		cod_unitsprov,
		bibliography,
		dates,
	} = deps;

	// Get author_entry from manuscript
	const author_entry = getAuthorEntry(item, manuscripts);

	// Get library information
	const { library, library_place } = getLibraryInfo(item, manuscripts, librariesPlus);

	// Get project information
	const project = getProjectInfo(item, manuscripts);

	// Get related works and interpolations
	const relatedWorks = enrichWorks(item.title_work, works, people, genres);
	const interpolations = enrichWorks(item.interpolations, works, people, genres);

	// Get related hands (this is the complex part)
	const relatedHand = getRelatedHands(
		item,
		hands,
		handsdated,
		handsplaced,
		handsrole,
		places,
		bibliography,
		dates,
	);

	// Get provenance
	const provenance = getProvenance(item, cod_unitsprov, places, dates, bibliography);

	// Return the enriched msitem
	return {
		id: item.id,
		hit_id: item.hit_id,
		view_label: item.manuscript[0]?.value + ", fol. " + item.locus_grp,
		label: item.label[0]?.value,
		manuscript: item.manuscript.map(({ order, ...rest }) => rest),
		library: library,
		library_place: library_place,
		cod_unit: item.cod_unit.map(({ order, ...rest }) => rest),
		language: item.language.map(({ value }) => ({ value })),
		locus: item.locus_grp,
		incipit: item.incipit,
		explicit: item.explicit,
		rubric: item.rubric,
		final_rubric: item.final_rubric,
		title_work: relatedWorks.length > 0 ? relatedWorks : [{ title: item.title_note }],
		title_note: relatedWorks.length > 0 ? item.title_note : "",
		siglum: item.siglum,
		text_modification: item.text_modification.map((modification) => modification.value),
		interpolations: interpolations.length > 0 ? interpolations : [],
		bibl: item.bibl,
		commentedMsItem: getCommentedMsItems(item, originalMsItems), // Use original array
		hands: relatedHand,
		decoration: item.decoration.map(({ value }) => ({ value })),
		form: item.form.map(({ value }) => ({ value })),
		form_note: item.form_note ?? "",
		note: item.note ?? "",
		orig_date: getOrigDate(relatedHand, provenance),
		orig_place: getOrigPlace(relatedHand, provenance),
		provenance: getProvenanceData(provenance, relatedHand),
		author_entry: author_entry,
		project: project,
	};
}

// Helper functions to break down the complexity
function getAuthorEntry(item, manuscripts) {
	return manuscripts
		.filter((ms) => ms.id === item.manuscript[0]?.id)
		.flatMap((ms) => ms.author_entry.map((a) => a.value));
}

function getLibraryInfo(item, manuscripts, librariesPlus) {
	const library = manuscripts
		.filter((ms) => ms.id === item.manuscript[0]?.id)
		.flatMap((ms) => ms.library_full);

	const library_place = librariesPlus
		.filter((lib) => library.some((libr) => libr.id === lib.id))
		.flatMap((lib) => lib.place);

	return { library, library_place };
}

function getProjectInfo(item, manuscripts) {
	return manuscripts
		.filter((ms) => ms.id === item.manuscript[0]?.id)
		.flatMap((ms) => ms.case_study?.map((cs) => cs.value) || []);
}

function getRelatedHands(
	item,
	hands,
	handsdated,
	handsplaced,
	handsrole,
	places,
	bibliography,
	dates,
) {
	const handLabelsSet = new Set(item.hand.map((h) => h.value));

	return hands
		.filter(
			(hand) => hand.label.length > 0 && item.hand.some((h) => h.value === hand.label[0]?.value),
		)
		.filter((hand) => handLabelsSet.has(hand.label[0]?.value))
		.map((hand) => {
			// Create pruned hand
			const prunedHand = {
				id: hand.id,
				label: hand.label[0]?.value,
				hit_id: hand.hit_id,
				description: hand.description,
				similar_hands: hand.similar_hands.map(({ order, ...rest }) => rest),
				nr_daniel: hand.nr_daniel ?? "",
				note: hand.note ?? "",
				scribe: hand.scribe.map(({ order, ...rest }) => rest),
				group: hand.gruppe,
			};

			// Add hand dating
			const hand_dated = getHandDating(hand, handsdated, bibliography, dates);

			// Add hand placement
			const hand_placed = getHandPlacement(hand, handsplaced, places, bibliography);

			// Add hand roles
			const hand_roles = getHandRoles(hand, item, handsrole);

			return {
				...prunedHand,
				dating: hand_dated,
				place: hand_placed,
				jobs: hand_roles,
			};
		});
}

function getHandDating(hand, handsdated, bibliography, dates) {
	return handsdated
		.filter((hDated) => hDated.hand.some((h) => h.id === hand.id))
		.map((hDated) => ({
			id: hDated.id,
			hit_id: hDated.hit_id,
			authority: enrichBibl(hDated.authority, bibliography),
			page: hDated.page,
			date: enrichDates(hDated.dated, dates),
		}));
}

function getHandPlacement(hand, handsplaced, places, bibliography) {
	return handsplaced
		.filter((hPlaced) => hPlaced.hand.some((h) => h.id === hand.id))
		.map((hPlaced) => ({
			id: hPlaced.id,
			hit_id: hPlaced.hit_id,
			place: enrichPlaces(hPlaced.place, places),
			authority: enrichBibl(hPlaced.authority, bibliography),
			page: hPlaced.page,
		}));
}

function getHandRoles(hand, item, handsrole) {
	return handsrole
		.filter((hRole) => hRole.hand.some((h) => h.id === hand.id))
		.filter((hRole) => hRole.ms_item.some((m_item) => m_item.id === item.id))
		.map((hRole) => ({
			id: hRole.id,
			hit_id: hRole.hit_id,
			role: hRole.role.map(({ value }) => ({ value })),
			locus: hRole.locus,
			locus_layout: hRole.locus_layout.map(({ value }) => ({ value })),
			scribe_type: hRole.scribe_type.map(({ value }) => ({ value })),
			function: hRole.function.map(({ value }) => ({ value })),
			role_context: hRole.scribe_type.map(({ value }) => ({ value })),
		}));
}

function getProvenance(item, cod_unitsprov, places, dates, bibliography) {
	return cod_unitsprov
		.filter((unit_pr) => unit_pr.cod_unit.length > 0)
		.filter((unit_pr) => item.cod_unit.some((c) => c.id === unit_pr.cod_unit[0].id))
		.flatMap((unit_pr) => ({
			hit_id: unit_pr.hit_id,
			type: unit_pr.type.value,
			places: enrichPlaces(unit_pr.place, places),
			from: enrichDates(unit_pr.from, dates),
			till: enrichDates(unit_pr.till, dates),
			uncertain_from: unit_pr.uncertain_from,
			uncertain_till: unit_pr.uncertain_till,
			authority: enrichBibl(unit_pr.authority, bibliography),
			page: unit_pr.page ?? "",
		}));
}

function getCommentedMsItems(item, msItems) {
	// Add safety check for commented_msitem
	if (!item.commented_msitem || !Array.isArray(item.commented_msitem)) {
		return [];
	}

	return item.commented_msitem.map((cItem) => {
		const relatedMsItem = msItems.find((ms) => ms.id === cItem.id);
		return {
			id: cItem.id,
			value: cItem.value,
			title: relatedMsItem?.title_work?.[0]?.value,
			hit_id: relatedMsItem?.hit_id,
		};
	});
}

function getOrigDate(relatedHand, provenance) {
	return [
		...relatedHand
			.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value === "Schreiber")))
			.flatMap((hand) => hand.dating),
		...provenance
			.filter((prov) => prov.type === "orig")
			.map((prov) => ({
				hit_id: prov.hit_id,
				date: prov.from,
				authority: prov.authority,
				page: prov.page,
			})),
	];
}

function getOrigPlace(relatedHand, provenance) {
	return [
		...relatedHand
			.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value === "Schreiber")))
			.flatMap((hand) => hand.place),
		...provenance
			.filter((prov) => prov.type === "orig")
			.map((prov) => ({
				hit_id: prov.hit_id,
				place: prov.places,
				authority: prov.authority,
				page: prov.page,
			})),
	];
}

function getProvenanceData(provenance, relatedHand) {
	return [
		...provenance.filter((prov) => prov.type === "prov"),
		...relatedHand
			.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value !== "Schreiber")))
			.flatMap((hand) =>
				hand.place.map((pl) => ({
					hit_id: pl.hit_id,
					places: pl.place,
					from: hand.dating.flatMap((dating) => dating.date),
					till: [],
					authority: hand.dating.flatMap((d) => d.authority),
				})),
			),
	];
}
