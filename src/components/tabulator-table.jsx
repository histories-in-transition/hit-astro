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
}) {
	const tableRef = useRef(null);
	const tabulatorRef = useRef(null);

	const defaultOptions = {
		layout: "fitColumns",
		responsiveLayout: "collapse",
		pagination: false,
		paginationSize: 50,
		movableColumns: true,
		resizableRows: true,
		...options,
	};

	useEffect(() => {
		if (!data || data.length === 0) return;

		// Initialize Tabulator
		tabulatorRef.current = new Tabulator(tableRef.current, {
			data: data,
			columns: columns,
			...defaultOptions,
		});

		// Add row click listener if configuration is provided
		if (rowClickConfig && tabulatorRef.current) {
			tabulatorRef.current.on("rowClick", function (e, row) {
				const data = row.getData();
				// Build URL based on configuration
				let url;
				if (typeof rowClickConfig.getUrl === "function") {
					url = rowClickConfig.getUrl(data);
				} else if (rowClickConfig.urlPattern && rowClickConfig.idField) {
					// Simple pattern replacement: "/scribes/{id}" + data.hit_id
					url = rowClickConfig.urlPattern.replace("{id}", data[rowClickConfig.idField]);
				}

				if (url) {
					// Use withBasePath function here
					const finalUrl = withBasePath(url);
					const target = rowClickConfig.target || "_self";
					window.open(finalUrl, target);
				}
			});
		}

		// Update counters
		const counter1 = document.getElementById("counter1");
		const counter2 = document.getElementById("counter2");

		if (counter1 && counter2) {
			const updateCounters = () => {
				const displayedData = tabulatorRef.current.getDisplayData();
				counter1.textContent = displayedData.length;
				counter2.textContent = data.length;
			};

			updateCounters();
			tabulatorRef.current.on("dataFiltered", updateCounters);
		}

		// Cleanup
		return () => {
			if (tabulatorRef.current) {
				tabulatorRef.current.destroy();
			}
		};
	}, [data, columns]);

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
