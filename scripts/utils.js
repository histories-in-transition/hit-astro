export function addPrevNextToMsItems(msItems, idField = "hit_id", labelField = "view_label") {
	// Sort msItems by their keys or any specific field (if needed)
	const sortedMsItems = [...msItems].sort((a, b) => a[idField] - b[idField]);

	// Loop through the sorted array and add 'prev' and 'next' properties
	for (let i = 0; i < sortedMsItems.length; i++) {
		const prevIndex = (i - 1 + sortedMsItems.length) % sortedMsItems.length; // Wrap around to the last item
		const nextIndex = (i + 1) % sortedMsItems.length; // Wrap around to the first item

		// Get the previous and next items
		const prevItem = sortedMsItems[prevIndex];
		const nextItem = sortedMsItems[nextIndex];

		// Add 'prev' and 'next' properties to the current item
		sortedMsItems[i]["prev"] = {
			id: prevItem[idField],
			label: prevItem[labelField] || prevItem[idField], // Fallback to id if label is not available
		};
		sortedMsItems[i]["next"] = {
			id: nextItem[idField],
			label: nextItem[labelField] || nextItem[idField], // Fallback to id if label is not available
		};
	}

	return sortedMsItems;
}
// functions to enrich data

export function enrichPlaces(placeArray, places) {
	return placeArray.map((place) => {
		// Find matching place in places.json
		const place_geo = places.find((p) => p.id === place.id) || {};
		return {
			id: place.id,
			value: place.value,
			geonames_url: place_geo.geonames_url ?? "",
			hit_id: place_geo.hit_id ?? "",
			lat: place_geo.lat ?? "",
			long: place_geo.long ?? "",
		};
	});
}

export function enrichDates(dateArray, dates) {
	return dateArray.map((date) => {
		// Find matching date in dates.json
		const dateRange = dates.find((d) => d.id === date.id);

		if (!dateRange) {
			// Return default structure if no match is found
			return {
				id: date.id,
				value: date.value,
				range: "",
				not_before: "",
				not_after: "",
			};
		}

		const not_before = dateRange.not_before?.substring(0, 4) ?? "";
		const not_after = dateRange.not_after?.substring(0, 4) ?? "";

		return {
			id: date.id,
			value: date.value,
			range: `${not_before}-${not_after}`,
			not_before,
			not_after,
			century: [
				...new Set([getCentury(dateRange.not_before || ""), getCentury(dateRange.not_after || "")]),
			],
		};
	});
}

// Helper function to calculate the century of not_before not_after dates

function getCentury(year) {
	if (!year) return "N/A"; // Handle null or undefined dates

	const century = Math.ceil((parseInt(year) + 1) / 100);

	return `${century}. Jh.`;
}

export function enrichBibl(biblArray, bibliography) {
	return biblArray.map((bibl) => {
		// find matching bibl entreis in bibl_entries.json
		const bibl_entries = bibliography.find((bibl_entry) => bibl_entry.id === bibl.id);
		return {
			hit_id: bibl_entries.hit_id,
			citation: bibl_entries.citation ?? "",
			link: bibl_entries.link ?? "",
			author: bibl_entries.author ?? "",
			title: bibl_entries.title ?? "",
		};
	});
}

// Function to enrich works (relatedWorks or interpolations)
export function enrichWorks(itemWorks, works, people, genres) {
	return works
		.map((work) => {
			// Check if the msitem has any related works
			if (itemWorks.some((itemWork) => itemWork.id === work.id)) {
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

				const mainGenres = genres
					.filter((genre) => work.genre.some((g) => g.id === genre.id))
					.map((genre) => {
						return {
							label: `${genre.main_genre || "Varia"} > ${genre.sub_genre}`,
							subGenre: genre.sub_genre,
							mainGenre: genre.main_genre || "Varia",
						};
					});

				// Return the work with its related authors
				return {
					id: work.id,
					hit_id: work.hit_id,
					title: work.title,
					author: relatedAuthors,
					gnd_url: work.gnd_url,
					note: work.note ?? "",
					bibliography: work.bibliography,
					source_text: work.source_text,
					mainGenre: mainGenres.flatMap((genre) => genre.mainGenre),
					subGenre: mainGenres.filter((genre) => genre.subGenre).map((g) => g.label),
					note_source: work.note_source ?? "",
				};
			}
			return null; // Return null if no related works are found
		})
		.filter((work) => work !== null); // Remove null works
}
