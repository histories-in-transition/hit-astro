import { useEffect, useRef } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_semanticui.min.css";
import { withBasePath } from "@/lib/withBasePath.js";
import { dateAccessor, dateFormatter, dateRangeFilter } from "@/lib/tabulator-utils.js";

export default function TabulatorTable({
	data,
	columns,
	tableId = "tabulator-table",
	options = {},
	showDownloadButtons = true, //  to control download buttons
	downloadTitle = "data", //  for filename prefix
	rowClickConfig = null,
	updateMapOnFilter = false,
	mapIdField = "hit_id",
}) {
	const tableRef = useRef(null);
	const tabulatorRef = useRef(null);

	// Process columns to add functions on the client side
	// needed for date filtering function, getting lost otherwise
	const processedColumns = columns.map((column) => {
		if (column.field === "origDate" || column.field === "editDate") {
			return {
				...column,
				accessor: dateAccessor,
				formatter: dateFormatter,
				headerFilterFunc: dateRangeFilter,
			};
		}
		return column;
	});

	const defaultOptions = {
		layout: "fitColumns",
		headerFilterLiveFilterDelay: 600,
		responsiveLayout: "hide",
		paginationSize: 25,
		pagination: true,
		movableColumns: true,
		resizableRows: true,
		...options,
	};

	useEffect(() => {
		if (!data || data.length === 0 || !processedColumns || processedColumns.length === 0) {
			console.warn("Missing data or columns for Tabulator");
			return;
		}

		// Initialize Tabulator
		tabulatorRef.current = new Tabulator(tableRef.current, {
			data: data,
			columns: processedColumns,
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
			let mapUpdateTimeout = null;

			if (updateMapOnFilter) {
				tabulatorRef.current.on("dataFiltered", function (filters, data) {
					// Clear previous scheduled update
					if (mapUpdateTimeout) {
						clearTimeout(mapUpdateTimeout);
					}

					mapUpdateTimeout = setTimeout(() => {
						const filteredData = tabulatorRef.current.getData("active");

						const filteredIds = [
							...new Set(filteredData.flatMap((row) => extractMapIds(row, mapIdField))),
						];

						console.log("Final filtered IDs:", filteredIds);

						window.updateMapWithFilteredIds?.(filteredIds);
					}, 50);
				});

				// Initial load
				setTimeout(() => {
					try {
						const initialData = tabulatorRef.current.getData();
						const initialIds = [
							...new Set(initialData.flatMap((row) => extractMapIds(row, mapIdField))),
						];

						window.updateMapWithFilteredIds?.(initialIds);
					} catch (error) {
						console.error("Error with initial map update:", error);
					}
				}, 100);
			}

			let counter = 0;

			// Update counters
			const counter1 = document.getElementById("counter1");
			const counter2 = document.getElementById("counter2");

			if (counter1 && counter2) {
				const updateCounters = () => {
					const totalCount = tabulatorRef.current.getDataCount("all");
					const filteredCount = tabulatorRef.current.getDataCount("active");

					counter1.textContent = filteredCount;
					counter2.textContent = totalCount;
				};

				tabulatorRef.current.on("dataFiltered", updateCounters);
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
			<div className="grid gap-2 md:flex my-4 md:justify-between items-start md:items-center mb-2">
				<div className="text-brand-800 text-xl">
					Es werden <span id="counter1"></span> von <span id="counter2"></span> Einträgen angezeigt
				</div>
				{/* Download buttons */}
				<div className="flex gap-2 justify-end">
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
			</div>

			<div ref={tableRef} id={tableId} style={{ minHeight: "100px", width: "100%" }} />
		</div>
	);
}
// helper function to get id from tabulator with nested rows (like in works)
function extractMapIds(rowData, mapIdField) {
	const ids = [];

	if (rowData[mapIdField]) {
		ids.push(rowData[mapIdField]);
	}

	if (Array.isArray(rowData._children)) {
		rowData._children.forEach((child) => {
			ids.push(...extractMapIds(child, mapIdField));
		});
	}

	return ids;
}
