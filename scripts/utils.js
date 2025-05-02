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
			citation: bibl_entries.citation ?? "",
			link: bibl_entries.link ?? "",
			author: bibl_entries.author ?? "",
			title: bibl_entries.title ?? "",
		};
	});
}
