import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { addPrevNextToMsItems } from "./utils.js";

import msitemsjson from "../src/content/raw/ms_items.json" assert { type: "json" };
import handsjson from "../src/content/raw/hands.json" assert { type: "json" };
import handsdatedjson from "../src/content/raw/hands_dated.json" assert { type: "json" };
import handsrolejson from "../src/content/raw/hands_role.json" assert { type: "json" };
import handsplacedjson from "../src/content/raw/hands_placed.json" assert { type: "json" };
import worksjson from "../src/content/raw/works.json" assert { type: "json" };
import peoplejson from "../src/content/raw/people.json" assert { type: "json" };

// convert json to array:
const msitems = Object.values(msitemsjson);
const works = Object.values(worksjson);
const hands = Object.values(handsjson);
const handsdated = Object.values(handsdatedjson);
const handsrole = Object.values(handsrolejson);
const people = Object.values(peoplejson);
const handsplaced = Object.values(handsplacedjson);

// set the output folder
const folderPath = join(process.cwd(), "src", "content", "data");
mkdirSync(folderPath, { recursive: true });

// merge data

const msItemsPlus = msitems.map((item) => {
	// Add info to related works
	const relatedWorks = works
		.map((work) => {
			// Check if the msitem has any related works
			if (item.title_work.some((title) => title.id === work.id)) {
				// Find authors related to the work
				const relatedAuthors = work.author
					?.flatMap((wAuthor) => {
						// Find the corresponding author from the people list
						const author = people
							.filter((person) => person.id === wAuthor.id)
							// Return the author with only the necessary properties
							.map((person) => {
								return {
									id: person.id,
									hit_id: person.hit_id,
									name: person.name,
									gnd_url: person.gnd_url,
								};
							});

						return author.length > 0 ? author : null; // returns valid authors or null
					})
					.filter((author) => author !== null); // remove null authors

				// Return the work with its related authors
				return {
					id: work.id,
					hit_id: work.hit_id,
					title: work.title,
					author: relatedAuthors,
					gnd_url: work.gnd_url,
					note: work.note,
					bibliography: work.bibliography,
					source_text: work.source_text,
					genre: work.genre.map((genre) => genre.value),
					note_source: work.note_source,
				};
			}
			return null; // Return null if no related works are found
		})
		.filter((work) => work !== null); // Remove null works

	// Add related hands
	const relatedHand = hands
		// Filter for matching hands
		.filter((hand) => item.hand.some((h) => h.value === hand.label[0]?.value))
		.map((hand) => {
			// use map to prune unnecessary fields from each hand object
			const prunedHand = {
				id: hand.id,
				label: hand.label[0]?.value,
				hit_id: hand.hit_id,
				description: hand.description,
				similar_hands: hand.similar_hands.map((sHand) => {
					return { value: sHand.value, id: sHand.id };
				}),
				nr_daniel: hand.nr_daniel,
				note: hand.note,
				dating: Array.from(new Set(hand.dating.flatMap((dating) => dating.value))),
				scribe: hand.scribe.map((scribe) => {
					return {
						id: scribe.id,
						value: scribe.value,
					};
				}),
				group: hand.gruppe,
			};
			// Add realted dating of each hand from hands_dated.json

			const hand_dated = handsdated
				.filter((hDated) => hDated.hand.some((h) => h.id === hand.id))
				// use map to remove unnecessary objects
				.map((hDated) => {
					return {
						id: hDated.id,
						hit_id: hDated.hit_id,
						authority: hDated.authority.map((aut) => {
							return {
								id: aut.id,
								value: aut.value,
							};
						}),
						page: hDated.page,
						date: Array.from(new Set(hDated.dated.flatMap((date) => date.value))),
					};
				});
			// Add related placement of each hand from hands_placed.json
			const hand_placed = handsplaced
				.filter((hPlaced) => hPlaced.hand.some((h) => h.id === hand.id))
				.map((hPlaced) => {
					return {
						id: hPlaced.id,
						hit_id: hPlaced.hit_id,
						place: hPlaced.place.map((place) => {
							return {
								id: place.id,
								value: place.value,
							};
						}),
						authority: hPlaced.authority.map((aut) => {
							return {
								id: aut.id,
								value: aut.value,
							};
						}),
						page: hPlaced.page,
					};
				});
			// Add related roles for each hand from hands_role.json
			const hand_roles = handsrole
				// filter for matching hands
				.filter((hRole) => hRole.hand.some((h) => h.id === hand.id))
				// filter for matching items
				.filter((hRole) => hRole.ms_item.some((m_item) => m_item.id === item.id))
				.map((hRole) => {
					return {
						id: hRole.id,
						hit_id: hRole.hit_id,
						role: hRole.role.map((role) => role.value),
						locus: hRole.locus,
						locus_layout: hRole.locus_layout.flatMap((layout) => layout.value),
						function: hRole.function.flatMap((func) => func.value),
						role_context: hRole.role_to_ms_context.flatMap((context) => context.value),
					};
				});
			return {
				...prunedHand,
				date: hand_dated,
				place: hand_placed,
				jobs: hand_roles,
			};
		});
	// Return the enriched msitem
	return {
		id: item.id,
		hit_id: item.hit_id,
		view_label: item.manuscript[0]?.value + ", fol. " + item.locus_grp,
		label: item.label[0]?.value,
		manuscript: item.manuscript.map((ms) => {
			return {
				id: ms.id,
				value: ms.value,
			};
		}),
		cod_unit: item.cod_unit.map((unit) => {
			return {
				id: unit.id,
				value: unit.value,
			};
		}),
		locus: item.locus_grp,
		incipit: item.incipit,
		explicit: item.explicit,
		rubric: item.rubric,
		final_rubric: item.final_rubric,
		title_work: relatedWorks, // Enriched with related authors
		title_note: item.title_note,
		siglum: item.siglum,
		bibl: item.bibl,
		role: item.role?.value,
		function: item.function_role.map((func) => func.value),
		commentedMsItem: item.commented_msitem.map((cItem) => {
			// Find the corresponding msitem for the commented item
			const relatedMsItem = msitems.find((ms) => ms.id === cItem.id);
			return {
				id: cItem.id,
				value: cItem.value,
				title: relatedMsItem?.title_work[0].value, // Add title if found
				hit_id: relatedMsItem?.hit_id, // Add hit_id if found
			};
		}),
		hands: relatedHand, // enriched with dating, placement and hand roles
		decoration: item.decoration.map((deco) => deco.value),
		note: item.note,
	};
});

const updatedMsItems = addPrevNextToMsItems(msItemsPlus);

// Save the merged json
writeFileSync(join(folderPath, "neu_ms_items.json"), JSON.stringify(updatedMsItems, null, 2), {
	encoding: "utf-8",
});

console.log("JSON files have been merged and cleaned successfully!");
