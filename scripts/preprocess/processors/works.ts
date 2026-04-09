import { addPrevNextToMsItems, enrichBibl } from "./utils.ts";
import type { MsItem } from "@/types/msitem.ts";
import type { HitBibliography, HitGenres, HitPeople, HitWorks } from "@/types/zod/zod-types.ts";

type WorkDeps = {
	people: HitPeople[];
	genres: HitGenres[];
	msItemsPlus: MsItem[];
	bibliography: HitBibliography[];
};

export function processWorks(works: HitWorks[], deps: WorkDeps) {
	if (!Array.isArray(works)) {
		throw new Error("processWorks expects an array of works");
	}

	const { people, genres, msItemsPlus, bibliography } = deps;

	const worksPlus = works.map((work) =>
		transformWork(work, people, genres, msItemsPlus, bibliography, works),
	);

	const worksWithTransmission = worksPlus.map((work) => ({
		...work,
		joined_transmission: getJoinedTransmission(work, worksPlus),
	}));

	return addPrevNextToMsItems(worksWithTransmission, "hit_id", "title");
}

function transformWork(
	work: HitWorks,
	people: HitPeople[],
	genres: HitGenres[],
	msItemsPlus: MsItem[],
	bibliography: HitBibliography[],
	allWorks: HitWorks[],
) {
	// Get related authors
	const relatedAuthors = getRelatedAuthors(work, people);

	// Get manuscript transmission data
	const relatedMsitems = getManuscriptTransmission(work, msItemsPlus);

	// Get related genres
	const relatedGenres = getRelatedGenres(work, genres);

	// Get related source texts
	const relatedSourceTexts = getRelatedSourceTexts(work, allWorks);

	return {
		id: work.id,
		hit_id: work.hit_id,
		title: work.title,
		gnd_url: work.gnd_url,
		note: work.note ?? "",
		author: relatedAuthors,
		bibliography: enrichBibl(work.bibliography, bibliography),
		source_text: relatedSourceTexts,
		note_source: work.note_source ?? "",
		genre: relatedGenres,
		ms_transmission: relatedMsitems,
	};
}

function getRelatedAuthors(work: HitWorks, people: HitPeople[]) {
	if (!work.author || !Array.isArray(work.author)) {
		return [];
	}

	return work.author
		.flatMap((wAuthor) => {
			// Find the corresponding author from the people list
			const author = people
				.filter((person) => person.id === wAuthor.id)
				.map((person) => ({
					id: person.id,
					hit_id: person.hit_id,
					name: person.name,
					gnd_url: person.gnd_url,
				}));

			return author.length > 0 ? author : null; // returns valid authors or null
		})
		.filter((author) => author !== null); // remove null authors
}

function getManuscriptTransmission(work: HitWorks, msItemsPlus: MsItem[]) {
	return msItemsPlus
		.filter((msi) => msi.title_work.some((w) => w.id === work.id))
		.map((msi) => transformMsItemForTransmission(msi));
}

function transformMsItemForTransmission(msi: MsItem) {
	// Get annotation data from hands that are not 'schreiber' (i.e. not the main scribe but annotators etc.)
	const annotationHands = msi.hands.filter(
		(h) => !h.jobs.some((j) => j.role.some((r) => r.value === "Schreiber")),
	);

	return {
		hit_id: msi.hit_id,
		manuscript: msi.manuscript,
		commented_msitem: msi.commented_msitem,
		locus: msi.locus,
		orig_date: msi.orig_date,
		orig_place: msi.orig_place,
		provenance: msi.provenance,
		decoration: msi.decoration,
		annotation_date: annotationHands.flatMap((hand) => hand.dating),
		annotation_place: annotationHands.flatMap((hand) => hand.place.flatMap((p) => p.place)),
		annotation_typ: [
			...new Set(
				annotationHands.flatMap((hand) => hand.jobs.flatMap((j) => j.role.map((r) => r.value))),
			),
		],
		form: msi.form,
		text_modification: msi.text_modification,
		version: msi.version,
	};
}

function getRelatedGenres(work: HitWorks, genres: HitGenres[]) {
	if (!work.genre || !Array.isArray(work.genre)) {
		return [];
	}

	return genres
		.filter((genre) => work.genre.some((g) => g.id === genre.id))
		.map((genre) => ({
			value: `${genre.main_genre || "Varia"} > ${genre.sub_genre}`,
			sub_genre: genre.sub_genre,
			main_genre: genre.main_genre || "Varia",
		}));
}

function getRelatedSourceTexts(work: HitWorks, allWorks: HitWorks[]) {
	if (!work.source_text || !Array.isArray(work.source_text)) {
		return [];
	}

	return allWorks
		.filter((w) => work.source_text.some((st) => st.id === w.id))
		.map((source_w) => ({
			title: source_w.title,
			author: source_w.author?.map((aut) => aut.value).join("; ") || "",
			hit_id: source_w.hit_id,
		}));
}

export function getJoinedTransmission(work, allWorks) {
	if (!work.ms_transmission || !Array.isArray(work.ms_transmission)) {
		return [];
	}

	const relatedWorks = new Map();

	work.ms_transmission.forEach((transmission) => {
		transmission.manuscript.forEach((ms) => {
			allWorks.forEach((w) => {
				// Check if this work is in the same manuscript
				const isInSameMs = w.ms_transmission?.some((t) =>
					t.manuscript?.some((m) => m.value === ms.value),
				);
				// Exclude the original work
				if (isInSameMs && w.id !== work.id) {
					relatedWorks.set(w.id, {
						id: w.id,
						hit_id: w.hit_id,
						title: w.title,
						author: w.author,
					});
				}
			});
		});
	});

	return Array.from(relatedWorks.values());
}
