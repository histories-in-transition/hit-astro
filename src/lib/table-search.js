// Attach event listeners for search forms
document.querySelectorAll("form[data-search-form]").forEach((input, index) => {
	input.addEventListener("input", (event) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const searchValue = formData.get("q");
		filterTable(index, searchValue);
	});
});

// Filter the table by user's input
function filterTable() {
	const table = document.querySelector(".data-table");
	const rows = table.querySelectorAll("tbody tr");
	const inputs = document.querySelectorAll("[data-filter]");

	rows.forEach((row) => {
		let shouldShow = true;

		inputs.forEach((input) => {
			const filterType = input.dataset.filter;
			const value = input.value.trim().toLowerCase();

			if (filterType === "year") {
				// Handle date filtering with `data-bound`
				const bound = input.dataset.bound;
				const yearRangeCell = row.children[1]; // "Datierung" is the 2nd column
				const yearRanges = yearRangeCell.textContent
					.split(",") // for ranges if comma-separated
					.map((range) => range.split("-").map((year) => parseInt(year, 10)));

				const min = bound === "min" ? parseInt(value, 10) : null;
				const max = bound === "max" ? parseInt(value, 10) : null;

				if (min || max) {
					shouldShow = yearRanges.some(([start, end]) => {
						const matchesMin = min ? start <= min && end >= min : true;
						const matchesMax = max ? end >= max && start <= max : true;
						return matchesMin && matchesMax;
					});
				}
			} else {
				// Handle simple string filtering for other columns
				const value = input.value.trim().toLowerCase();
				const columnIndex = Array.from(input.closest("th").parentNode.children).indexOf(
					input.closest("th"),
				); // Get the column index

				if (value) {
					const cell = row.children[columnIndex];
					const cellValue = cell?.textContent.toLowerCase();

					if (!cellValue || !cellValue.includes(value)) {
						shouldShow = false;
					}
				}
			}
		});

		// Show or hide the row based on filters
		row.style.display = shouldShow ? "" : "none";
	});

	// Reapply row striping
	reapplyRowStriping(rows);
}

// Reapply row striping for visible rows
function reapplyRowStriping(rows) {
	let index = 0; // Keep track of visible row indices
	rows.forEach((row) => {
		if (row.style.display !== "none") {
			// Remove both odd and even classes first
			row.classList.remove("odd", "even");

			// Apply the correct class based on the index
			row.classList.add(index % 2 === 0 ? "odd" : "even");
			index++;
		}
	});
}

// Function for download CSV button on table

document.getElementById("download-table-btn").addEventListener("click", function () {
	// Function to convert table to CSV
	function tableToCSV() {
		const rows = document.querySelectorAll(".data-table tr");
		let csvContent = "";

		rows.forEach((row) => {
			const cols = row.querySelectorAll("td, th");
			let rowContent = Array.from(cols)
				.map((col) => col.innerText.replace(/,/g, "")) // Remove commas for CSV formatting
				.join(",");
			csvContent += rowContent + "\r\n"; // Add new line
		});

		return csvContent;
	}

	// Create a Blob with CSV content
	const csvContent = tableToCSV();
	const blob = new Blob([csvContent], { type: "text/csv" });
	const url = URL.createObjectURL(blob);

	// Create a temporary download link and trigger the download
	const a = document.createElement("a");
	// title of csv to match the id of the table
	const tableElement = document.querySelector("table.data-table");
	const title = tableElement ? tableElement.getAttribute("id") : "table";
	a.href = url;
	a.download = title + ".csv";
	a.click();

	// Cleanup
	URL.revokeObjectURL(url);
});
