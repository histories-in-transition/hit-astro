import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import msitemsjson from "../src/content/raw/ms_items.json" assert { type: "json" };
import handsjson from "../src/content/raw/hands.json" assert { type: "json" };
import handsdatedjson from "../src/content/raw/hands_dated.json" assert { type: "json" };
import handsplacedjson from "../src/content/raw/hands_placed.json" assert { type: "json" };
import worksjson from "../src/content/raw/works.json" assert { type: "json" };
import peoplejson from "../src/content/raw/people.json" assert { type: "json" };

// convert json to array:
const msitems = Object.values(msitemsjson);
const works = Object.values(worksjson);
const hands = Object.values(handsjson);
const handsdated = Object.values(handsdatedjson);
const people = Object.values(peoplejson);
const handsplaced = Object.values(handsplacedjson);

// set the output folder
const folderPath = join(process.cwd(), "src", "content", "processed");
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
					?.map((wAuthor) => {
						// Find the corresponding author from the people list
						const author = people.find((person) => person.id === wAuthor.id);

						// Remove unnecessary properties from the author object
						delete author.order;
						delete author["works"];
						delete author["work"];
						delete author["Created by"];
						delete author["Created on"];
						delete author["Last modified by"];
						delete author["Last modified"];

						return author;
					})
					.filter((author) => author !== undefined); // Filter out undefined authors

				// Remove unnecessary properties from the work object
				delete work.order;
				delete work["author"];
				delete work["Created by"];
				delete work["Created on"];
				delete work["Last modified by"];
				delete work["Last modified"];

				// Return the work with its related authors
				return {
					...work,
					author: relatedAuthors,
				};
			}
			return null;
		})
		.filter((work) => work !== null); // Remove null works

	// Add related hands
	const relatedHand = hands.filter((hand) => item.hand.some((h) => h.value === hand.value));

	// Add dating of hand and hence msitem
	const handdated = handsdated.filter((hDated) => item.hand.some((h) => h.value === hDated.value));

	// Return the enriched msitem
	return {
		label: item.label[0]?.value,
		manuscript: item.manuscript[0]?.value,
		incipit: item.incipit,
		explicit: item.explicit,
		title_work: relatedWorks, // Enriched with related authors
		relatedHand,
		handdated,
	};
});

// Save the merged json
writeFileSync(join(folderPath, "msitems.json"), JSON.stringify(msItemsPlus, null, 2), {
	encoding: "utf-8",
});

console.log("JSON files have been merged and cleaned successfully!");
