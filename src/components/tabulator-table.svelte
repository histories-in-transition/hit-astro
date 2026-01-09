<script>
	import { onMount, onDestroy } from "svelte";
	import { TabulatorFull as Tabulator } from "tabulator-tables";
	import "tabulator-tables/dist/css/tabulator_semanticui.min.css";

	import { withBasePath } from "@/lib/withBasePath";
	import { dateAccessor, dateFormatter, dateRangeFilter } from "@/lib/tabulator-utils.js";

	export let data = [];
	export let columns = [];
	export let tableId = "tabulator-table";
	export let options = {};
	export let showDownloadButtons = true;
	export let downloadTitle = "data";
	export let rowClickConfig = null;
	export let updateMapOnFilter = false;
	export let mapIdField = "hit_id";

	let tableEl;
	let tabulator;

	// preprocess columns (reactive)
	$: processedColumns = columns.map((column) => {
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
	};

	function extractMapIds(rowData, field) {
		const ids = [];

		if (rowData[field]) {
			ids.push(rowData[field]);
		}

		if (Array.isArray(rowData._children)) {
			rowData._children.forEach((child) => {
				ids.push(...extractMapIds(child, field));
			});
		}

		return ids;
	}

	onMount(() => {
		if (!data.length || !processedColumns.length) {
			console.warn("Missing data or columns for Tabulator");
			return;
		}

		tabulator = new Tabulator(tableEl, {
			data,
			columns: processedColumns,
			...defaultOptions,
			...options,
		});

		tabulator.on("tableBuilt", () => {
			// Row click navigation
			if (rowClickConfig) {
				tabulator.on("rowClick", (e, row) => {
					const rowData = row.getData();
					let url;

					if (typeof rowClickConfig.getUrl === "function") {
						url = rowClickConfig.getUrl(rowData);
					} else if (rowClickConfig.urlPattern && rowClickConfig.idField) {
						url = rowClickConfig.urlPattern.replace(
							"{id}",
							rowData[rowClickConfig.idField]
						);
					}

					if (url) {
						window.open(withBasePath(url), rowClickConfig.target || "_self");
					}
				});
			}

			// Counters
			const counter1 = document.getElementById("counter1");
			const counter2 = document.getElementById("counter2");

			if (counter1 && counter2) {
				const updateCounters = () => {
					counter1.textContent = tabulator.getDataCount("active");
					counter2.textContent = tabulator.getDataCount("all");
				};

				tabulator.on("dataFiltered", updateCounters);
				updateCounters();
			}

			// Map updates
			if (updateMapOnFilter) {
				let timeout;

				tabulator.on("dataFiltered", () => {
					clearTimeout(timeout);
					timeout = setTimeout(() => {
						const rows = tabulator.getData("active");
						const ids = [...new Set(rows.flatMap(r => extractMapIds(r, mapIdField)))];
						window.updateMapWithFilteredIds?.(ids);
					}, 50);
				});
			}
		});
	});

	onDestroy(() => {
		tabulator?.destroy();
		tabulator = null;
	});

	function download(type, ext, opts = {}) {
		tabulator?.download(type, `${downloadTitle}.${ext}`, opts);
	}
</script>

<div class="text-sm md:text-base w-full">
	<div class="grid gap-2 md:flex my-4 md:justify-between items-start md:items-center mb-2">
		<div class="text-brand-800 text-xl">
			Es werden <span id="counter1"></span> von <span id="counter2"></span> Einträgen angezeigt
		</div>

		{#if showDownloadButtons}
			<div class="flex gap-2 justify-end">
				<button on:click={() => download("csv", "csv")}
					class="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm">
					Download CSV
				</button>
				<button on:click={() => download("json", "json")}
					class="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm">
					Download JSON
				</button>
				<button on:click={() => download("html", "html", { style: true })}
					class="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm">
					Download HTML
				</button>
			</div>
		{/if}
	</div>

	<div bind:this={tableEl} id={tableId} style="min-height:100px; width:100%;" ></div>
</div>
