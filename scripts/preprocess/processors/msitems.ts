import {
	addPrevNextToMsItems,
	enrichPlaces,
	enrichWorks,
	enrichBibl,
	enrichDates,
} from "./utils.js";
import type {
	HitMsitem,
	HitManuscript,
	HitManuscriptDated,
	HitWorks,
	HitPeople,
	HitHand,
	HitHandRole,
	HitHandsDated,
	HitHandsPlaced,
	HitGenres,
	HitCodPlaced,
	HitBibliography,
	HitDates,
} from "@/types/zod/zod-types.js";
import type { Place, Library, MsItem } from "@/types/index.js";

type MsItemDeps = {
	manuscripts: HitManuscript[];
	manuscriptDated: HitManuscriptDated[];
	places: Place[];
	librariesPlus: Library[];
	works: HitWorks[];
	people: HitPeople[];
	genres: HitGenres[];
	hands: HitHand[];
	handsdated: HitHandsDated[];
	handsplaced: HitHandsPlaced[];
	handsrole: HitHandRole[];
	cod_unitsprov: HitCodPlaced[];
	bibliography: HitBibliography[];
	dates: HitDates[];
};

export function processMsItems(msItems: HitMsitem[], deps: MsItemDeps): MsItem[] {
	const msItemsPlus = msItems
		.filter((item) => item.manuscript.length > 0 && (item.title_work.length > 0 || item.title_note))
		.map((item) => transformMsItem(item, deps, msItems)); // Pass original msItems array

	return addPrevNextToMsItems(msItemsPlus);
}

function transformMsItem(item: HitMsitem, deps: MsItemDeps, originalMsItems: HitMsitem[]) {
	const {
		manuscripts,
		manuscriptDated,
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

	// Get related hands and enrich them with dating, placement, and roles
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

	// Get provenance from cod. units and enrich it with place and date information
	const provenance = getProvenance(item, cod_unitsprov, places, dates, bibliography);
	// the same for manuscript

	// Return the enriched msitem
	return {
		id: item.id,
		hit_id: item.hit_id,
		view_label: `${item.manuscript[0]?.value ?? "Unknown"}, fol. ${item.locus_grp}`,
		label: item.label[0]?.value ?? "",
		manuscript: item.manuscript.map((ms) => {
			return {
				id: ms.id,
				value: ms.value,
				//orig_place: getMsOrigPlace(item, manuscripts, places),
				//provenance: getMsProvenance(item, manuscripts, places),
				//orig_date: getMsDate(item, manuscriptDated, dates),
			};
		}),
		joined_transmission: getJoinedTransmission(item, originalMsItems, works, genres, people),
		library: library,
		library_place: library_place,
		cod_unit: item.cod_unit.map(({ order, ...rest }) => rest),
		language: item.language.map(({ value }) => ({ value })),
		locus: item.locus_grp,
		facs_url: item.facs_url,
		incipit: item.incipit,
		explicit: item.explicit,
		rubric: item.rubric,
		final_rubric: item.final_rubric,
		title_work: relatedWorks.length > 0 ? relatedWorks : [{ title: item.title_note }],
		title_note: relatedWorks.length > 0 ? item.title_note : "",
		version: item.version.map(({ value }) => ({ value })),
		siglum: item.siglum,
		text_modification: item.text_modification.map((modification) => modification.value),
		interpolations: interpolations.length > 0 ? interpolations : [],
		bibl: item.bibl,
		commented_msitem: getCommentedMsItems(item, originalMsItems), // Use original array
		hands: relatedHand,
		decoration: item.decoration.map(({ value }) => ({ value })),
		form: item.form.map(({ value }) => ({ value })),
		form_note: item.form_note ?? "",
		note: item.note ?? "",
		orig_date: getOrigDate(relatedHand, provenance, item, manuscriptDated, dates),
		orig_place: getOrigPlace(relatedHand, provenance, item, manuscripts, places),
		provenance: getProvenanceData(provenance, relatedHand, item, manuscripts, places),
		author_entry: author_entry,
		project: project,
	};
}

// Helper functions to break down the complexity
function getAuthorEntry(item: HitMsitem, manuscripts: HitManuscript[]) {
	return manuscripts
		.filter((ms) => ms.id === item.manuscript[0]?.id)
		.flatMap((ms) => ms.author_entry.map((a) => a.value));
}

function getLibraryInfo(item: HitMsitem, manuscripts: HitManuscript[], librariesPlus: Library[]) {
	const library = manuscripts
		.filter((ms) => ms.id === item.manuscript[0]?.id)
		.flatMap((ms) => ms.library_full);

	const library_place = librariesPlus
		.filter((lib) => library.some((libr) => libr.id === lib.id))
		.flatMap((lib) => lib.place);

	return { library, library_place };
}

function getProjectInfo(item: HitMsitem, manuscripts: HitManuscript[]) {
	return manuscripts
		.filter((ms) => ms.id === item.manuscript[0]?.id)
		.flatMap((ms) => ms.case_study?.map((cs) => cs.value) || []);
}

function getRelatedHands(
	item: HitMsitem,
	hands: HitHand[],
	handsdated: HitHandsDated[],
	handsplaced: HitHandsPlaced[],
	handsrole: HitHandRole[],
	places: Place[],
	bibliography: HitBibliography[],
	dates: HitDates[],
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

function getHandDating(
	hand: HitHand,
	handsdated: HitHandsDated[],
	bibliography: HitBibliography[],
	dates: HitDates[],
) {
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

function getHandPlacement(
	hand: HitHand,
	handsplaced: HitHandsPlaced[],
	places: Place[],
	bibliography: HitBibliography[],
) {
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

function getHandRoles(hand: HitHand, item: HitMsitem, handsrole: HitHandRole[]) {
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

function getProvenance(
	item: HitMsitem,
	cod_unitsprov: HitCodPlaced[],
	places: Place[],
	dates: HitDates[],
	bibliography: HitBibliography[],
) {
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

function getMsProvenance(item: HitMsitem, manuscripts: HitManuscript[], places: Place[]) {
	const manuscript = manuscripts.find((ms) => ms.id === item.manuscript[0]?.id);
	if (!manuscript) return [];

	return enrichPlaces(manuscript.provenance, places);
}

function getMsOrigPlace(item: HitMsitem, manuscripts: HitManuscript[], places: Place[]) {
	const manuscript = manuscripts.find((ms) => ms.id === item.manuscript[0]?.id);
	if (!manuscript) return [];

	return enrichPlaces(manuscript.orig_place, places);
}

function getMsDate(item: HitMsitem, manuscriptsDated: HitManuscriptDated[], dates: HitDates[]) {
	const manuscript = manuscriptsDated.find(
		(ms) => ms?.manuscript[0]?.id === item.manuscript[0]?.id,
	);
	if (!manuscript) return [];

	return enrichDates(manuscript.date, dates);
}

function getCommentedMsItems(item: HitMsitem, msItems: HitMsitem[]) {
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
function getJoinedTransmission(
	item: HitMsitem,
	msItems: HitMsitem[],
	works: HitWorks[],
	genres: HitGenres[],
	people: HitPeople[],
) {
	const itemManuscriptId =
		Array.isArray(item.manuscript) && item.manuscript.length > 0
			? item.manuscript[0].id
			: undefined;

	if (!itemManuscriptId) return [];

	return (
		msItems
			// get all msitems from the same manuscript as the current msitem
			.filter((msItem) => {
				const msItemManuscriptId =
					Array.isArray(msItem.manuscript) && msItem.manuscript.length > 0
						? msItem.manuscript[0].id
						: undefined;
				return msItemManuscriptId === itemManuscriptId;
			})
			.filter((msItem) => msItem.id !== item.id) // Exclude the current item
			.map((msItem) => {
				let id = msItem.id;
				let title = "";
				// check if there is a title_work else use title_note
				if (msItem.title_work.length > 0) {
					//use enrich function to get author
					const enrichedwork = enrichWorks(msItem.title_work, works, people, genres);
					id = enrichedwork[0].id;
					title =
						enrichedwork[0].author?.length > 0
							? `${enrichedwork[0].author[0].name}: ${enrichedwork[0].title}`
							: enrichedwork[0].title;
				} else {
					// No title_work, use title_note
					title = msItem.title_note || "";
				}
				return {
					id,
					title,
					hit_id: msItem.hit_id,
				};
			})
	);
}

function getOrigDate(relatedHand, provenance, item, manuscriptDated, dates) {
	const handDates = relatedHand
		.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value === "Schreiber")))
		.flatMap((hand) => hand.dating);

	if (handDates.length > 0) {
		return handDates;
	}

	const provDates = provenance
		.filter((prov) => prov.type === "orig")
		.map((prov) => ({
			hit_id: prov.hit_id,
			authority: prov.authority,
			page: prov.page,
			date: prov.from,
		}));

	if (provDates.length > 0) {
		return provDates;
	}
	const msDates = manuscriptDated
		.filter((msDated) => msDated.manuscript[0]?.id === item.manuscript[0]?.id)
		.flatMap((msDated) => ({
			hit_id: msDated.hit_id,
			date: enrichDates(msDated.date, dates),
		}));

	return msDates;
}
// three option to get data for orig place, check first related hand, then cod unit, and as fallback manuscript
function getOrigPlace(relatedHand, provenance, item, manuscripts, places) {
	// 1. From relatedHand
	const handPlaces = relatedHand
		.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value === "Schreiber")))
		.flatMap((hand) => hand.place);

	if (handPlaces.length > 0) {
		return handPlaces;
	}

	// 2. From provenance
	const provPlaces = provenance
		.filter((prov) => prov.type === "orig")
		.map((prov) => ({
			hit_id: prov.hit_id,
			place: prov.places,
			authority: prov.authority,
			page: prov.page,
		}));

	if (provPlaces.length > 0) {
		return provPlaces;
	}

	// 3. From manuscripts (fallback)
	const msPlaces = manuscripts
		.filter((ms) => ms.id === item.manuscript[0]?.id)
		.flatMap((ms) => ({
			hit_id: ms.hit_id,
			place: enrichPlaces(ms.orig_place, places),
		}));

	return msPlaces;
}

function getProvenanceData(provenance, relatedHand, item, manuscripts, places) {
	const relatedHandPlaces = relatedHand
		.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value !== "Schreiber")))
		.flatMap((hand) =>
			hand.place.map((pl) => ({
				hit_id: pl.hit_id,
				places: pl.place,
				from: hand.dating.flatMap((dating) => dating.date),
				till: [],
				authority: hand.dating.flatMap((d) => d.authority),
			})),
		);
	const provenancePlaces = provenance.filter((prov) => prov.type === "prov");
	if (provenancePlaces.length > 0 || relatedHandPlaces.length > 0) {
		return [...provenancePlaces, ...relatedHandPlaces];
	}
	const msProvenance = manuscripts
		.filter((ms) => ms.id === item.manuscript[0]?.id)
		.flatMap((ms) => ({
			hit_id: ms.hit_id,
			places: enrichPlaces(ms.provenance, places),
		}));
	return msProvenance;
}
