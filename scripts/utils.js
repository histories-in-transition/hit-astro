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
