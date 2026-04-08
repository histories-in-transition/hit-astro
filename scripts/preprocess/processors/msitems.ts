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

	// Get provenance
	const provenance = getProvenance(item, cod_unitsprov, places, dates, bibliography);

	// Return the enriched msitem
	return {
		id: item.id,
		hit_id: item.hit_id,
		view_label: `${item.manuscript[0]?.value ?? "Unknown"}, fol. ${item.locus_grp}`,
		label: item.label[0]?.value ?? "",
		manuscript: item.manuscript.map(({ order, ...rest }) => rest),
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
		orig_date: getOrigDate(relatedHand, provenance),
		orig_place: getOrigPlace(relatedHand, provenance),
		provenance: getProvenanceData(provenance, relatedHand),
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
