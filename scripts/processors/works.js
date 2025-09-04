import { version } from "os";
import { addPrevNextToMsItems, enrichBibl } from "../utils/utils.js";

/**
 * Process works data by cleaning and standardizing the structure
 * @param {Array} works - Raw works data
 * @param {Object} deps - All dependencies
 * @param {Array} deps.people - People data for author enrichment
 * @param {Array} deps.genres - Genres data for genre enrichment
 * @param {Array} deps.msItemsPlus - Processed manuscript items for transmission data
 * @param {Array} deps.bibliography - Bibliography data for enrichment
 * @returns {Array} Processed works with prev/next navigation
 */
export function processWorks(works, deps) {
	if (!Array.isArray(works)) {
		throw new Error("processWorks expects an array of works");
	}

	const { people, genres, msItemsPlus, bibliography } = deps;

	const worksPlus = works.map((work) =>
		transformWork(work, people, genres, msItemsPlus, bibliography, works),
	);

	return addPrevNextToMsItems(worksPlus, "hit_id", "title");
}

/**
 * Transform a single work object
 * @param {Object} work - Raw work data
 * @param {Array} people - People data
 * @param {Array} genres - Genres data
 * @param {Array} msItemsPlus - Processed manuscript items
 * @param {Array} bibliography - Bibliography data
 * @param {Array} allWorks - All works data (for source text references)
 * @returns {Object} Transformed work
 */
function transformWork(work, people, genres, msItemsPlus, bibliography, allWorks) {
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

/**
 * Get related authors for a work
 * @param {Object} work - Work object
 * @param {Array} people - People data
 * @returns {Array} Related authors with enriched data
 */
function getRelatedAuthors(work, people) {
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

/**
 * Get manuscript transmission data for a work
 * @param {Object} work - Work object
 * @param {Array} msItemsPlus - Processed manuscript items
 * @returns {Array} Manuscript transmission data
 */
function getManuscriptTransmission(work, msItemsPlus) {
	return msItemsPlus
		.filter((msi) => msi.title_work.some((w) => w.id === work.id))
		.map((msi) => transformMsItemForTransmission(msi));
}

/**
 * Transform manuscript item for transmission data
 * @param {Object} msi - Manuscript item
 * @returns {Object} Transformed manuscript item for transmission
 */
function transformMsItemForTransmission(msi) {
	// Get annotation data from hands that are not scribes
	const annotationHands = msi.hands.filter(
		(h) => !h.jobs.some((j) => j.role.some((r) => r.value === "Schreiber")),
	);

	return {
		hit_id: msi.hit_id,
		manuscript: msi.manuscript,
		role: msi.role,
		function: msi.function,
		commented_msitem: msi.commentedMsItem,
		locus: msi.locus,
		orig_date: msi.orig_date,
		orig_place: msi.orig_place,
		provenance: msi.provenance,
		decoration: msi.decoration,
		annotation_date: annotationHands.flatMap((hand) => hand.dating),
		annotation_place: annotationHands.flatMap((hand) => hand.place),
		annotation_typ: [
			...new Set(
				annotationHands.flatMap((hand) => hand.jobs.flatMap((j) => j.role.map((r) => r.value))),
			),
		],
		text_modification: msi.text_modification,
		version: msi.version,
	};
}

/**
 * Get related genres for a work
 * @param {Object} work - Work object
 * @param {Array} genres - Genres data
 * @returns {Array} Related genres with enriched data
 */
function getRelatedGenres(work, genres) {
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

/**
 * Get related source texts for a work
 * @param {Object} work - Work object
 * @param {Array} allWorks - All works data
 * @returns {Array} Related source texts
 */
function getRelatedSourceTexts(work, allWorks) {
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

// Optional: Utility functions for other processors that might need work data

/**
 * Get works by author
 * @param {string} authorId - Author ID
 * @param {Array} processedWorks - Processed works data
 * @returns {Array} Works by the specified author
 */
export function getWorksByAuthor(authorId, processedWorks) {
	return processedWorks.filter((work) => work.author.some((author) => author.id === authorId));
}

/**
 * Get works by genre
 * @param {string} genreId - Genre ID
 * @param {Array} processedWorks - Processed works data
 * @returns {Array} Works in the specified genre
 */
export function getWorksByGenre(genreId, processedWorks) {
	return processedWorks.filter((work) => work.genre.some((genre) => genre.id === genreId));
}

/**
 * Get manuscript transmission summary for a work
 * @param {string} workId - Work ID
 * @param {Array} processedWorks - Processed works data
 * @returns {Object} Transmission summary
 */
export function getTransmissionSummary(workId, processedWorks) {
	const work = processedWorks.find((w) => w.id === workId);
	if (!work) return null;

	const transmission = work.ms_transmission;

	return {
		total_manuscripts: transmission.length,
		unique_libraries: [...new Set(transmission.flatMap((t) => t.manuscript.map((m) => m.value)))]
			.length,
		date_range: getDateRange(transmission),
		decoration_types: [...new Set(transmission.flatMap((t) => t.decoration.map((d) => d.value)))],
		annotation_types: [...new Set(transmission.flatMap((t) => t.annotation_typ))],
	};
}

/**
 * Helper function to get date range from transmission data
 * @param {Array} transmission - Transmission data
 * @returns {Object} Date range
 */
function getDateRange(transmission) {
	const dates = transmission.flatMap((t) => t.orig_date.map((d) => d.date));
	if (dates.length === 0) return { earliest: null, latest: null };

	// This is a simplified version - you'd need proper date parsing logic
	return {
		earliest: dates[0], // Would need proper date comparison
		latest: dates[dates.length - 1],
	};
}
