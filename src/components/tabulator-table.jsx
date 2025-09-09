import { useEffect, useRef } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_semanticui.min.css";
import { withBasePath } from "@/lib/withBasePath.js";

export default function TabulatorTable({
	data,
	columns,
	tableId = "tabulator-table",
	options = {},
	showDownloadButtons = true, //  to control download buttons
	downloadTitle = "data", //  for filename prefix
	rowClickConfig = null,
	updateMapOnFilter = false,
	mapIdField = "hitId",
}) {
	const tableRef = useRef(null);
	const tabulatorRef = useRef(null);

	const defaultOptions = {
		layout: "fitColumns",
		headerFilterLiveFilterDelay: 600,
		responsiveLayout: "collapse",
		rowHeader: {
			formatter: "responsiveCollapse",
			width: 30,
			minWidth: 30,
			hozAlign: "center",
			resizable: false,
			headerSort: false,
		},
		pagination: false,
		movableColumns: true,
		resizableRows: true,
		...options,
	};

	useEffect(() => {
		if (!data || data.length === 0 || !columns || columns.length === 0) {
			console.warn("Missing data or columns for Tabulator");
			return;
		}

		// Initialize Tabulator
		tabulatorRef.current = new Tabulator(tableRef.current, {
			data: data,
			columns: columns,
			...defaultOptions,
		});

		// Wait for table to be built before adding event listeners
		tabulatorRef.current.on("tableBuilt", function () {
			console.log("Table built successfully");

			// Add row click listener if configuration is provided
			if (rowClickConfig) {
				tabulatorRef.current.on("rowClick", function (e, row) {
					const rowData = row.getData();

					let url;
					if (typeof rowClickConfig.getUrl === "function") {
						url = rowClickConfig.getUrl(rowData);
					} else if (rowClickConfig.urlPattern && rowClickConfig.idField) {
						url = rowClickConfig.urlPattern.replace("{id}", rowData[rowClickConfig.idField]);
					}

					if (url) {
						const finalUrl = withBasePath(url);
						const target = rowClickConfig.target || "_self";
						window.open(finalUrl, target);
					}
				});
			}

			// Add map update functionality if enabled
			if (updateMapOnFilter) {
				// Update map when data is filtered - THIS IS THE ONLY FILTERING LOGIC WE NEED
				tabulatorRef.current.on("dataFiltered", function (filters, data) {
					// Extract raw data from each RowComponent (using getData() method)
					const filteredData = data.map((row) => row.getData());

					// Extract hit_ids from filtered data using the mapIdField
					const filteredIds = filteredData.map((row) => row[mapIdField]).filter((id) => id);

					// Update the map with the filtered hit_ids
					if (window.updateMapWithFilteredIds) {
						window.updateMapWithFilteredIds(filteredIds);
					} else {
						console.warn("Map update function not available");
					}
				});

				// Initial map update with all data - use getData() only
				setTimeout(() => {
					console.log("Initial map update");
					try {
						const initialData = tabulatorRef.current.getData();
						const initialIds = initialData.map((row) => row[mapIdField]).filter((id) => id);
						if (window.updateMapWithFilteredIds) {
							window.updateMapWithFilteredIds(initialIds);
						}
					} catch (error) {
						console.error("Error with initial map update:", error);
					}
				}, 100);
			}

			// Update counters
			const counter1 = document.getElementById("counter1");
			const counter2 = document.getElementById("counter2");

			if (counter1 && counter2) {
				const updateCounters = () => {
					try {
						const allData = tabulatorRef.current.getData();
						const visibleRows = tabulatorRef.current
							.getRows()
							.filter((row) => row.getElement().style.display !== "none");

						counter1.textContent = visibleRows.length;
						counter2.textContent = allData.length;
					} catch (error) {
						console.error("Error updating counters:", error);
					}
				};

				updateCounters();
				tabulatorRef.current.on("dataFiltered", updateCounters);
				tabulatorRef.current.on("headerFilterChanged", function () {
					setTimeout(updateCounters, 50);
				});
			}
		});

		// Cleanup
		return () => {
			if (tabulatorRef.current) {
				tabulatorRef.current.destroy();
				tabulatorRef.current = null;
			}
		};
	}, [data, columns, rowClickConfig, updateMapOnFilter, mapIdField]);

	// Download handlers
	const handleDownloadCSV = () => {
		if (tabulatorRef.current) {
			tabulatorRef.current.download("csv", `${downloadTitle}.csv`);
		}
	};

	const handleDownloadJSON = () => {
		if (tabulatorRef.current) {
			tabulatorRef.current.download("json", `${downloadTitle}.json`);
		}
	};

	const handleDownloadHTML = () => {
		if (tabulatorRef.current) {
			tabulatorRef.current.download("html", `${downloadTitle}.html`, { style: true });
		}
	};

	return (
		<div className="text-sm md:text-base w-full">
			{/* Download buttons */}
			{showDownloadButtons && (
				<div className="flex gap-2 mb-4 justify-end">
					<button
						onClick={handleDownloadCSV}
						className="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm"
					>
						Download CSV
					</button>
					<button
						onClick={handleDownloadJSON}
						className="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm"
					>
						Download JSON
					</button>
					<button
						onClick={handleDownloadHTML}
						className="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm"
					>
						Download HTML
					</button>
				</div>
			)}

			<div ref={tableRef} id={tableId} style={{ minHeight: "100px", width: "100%" }} />
		</div>
	);
}
