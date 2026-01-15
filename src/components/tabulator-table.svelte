<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { TabulatorFull as Tabulator } from "tabulator-tables";
	import "tabulator-tables/dist/css/tabulator_semanticui.min.css";
	import type { Options as TabulatorOptions, ColumnDefinition } from "tabulator-tables";


	import { withBasePath } from "@/lib/withBasePath";
	import { dateAccessor, dateFormatter, dateRangeFilter } from "@/lib/tabulator-utils.js";

	 export let data: any[] = [];
  	export let columns: ColumnDefinition[] = [];
	export let tableId = "tabulator-table";
	export let options: Partial<TabulatorOptions> = {};

	export let showDownloadButtons = true;
	export let downloadTitle = "data";
	export let rowClickConfig:
  | {
      urlPattern?: string;
      idField?: string;
      target?: string;
      getUrl?: (rowData: any) => string;
    }
  | null = null;

	export let updateMapOnFilter = false;
	export let mapIdField = "hit_id";

	let tableEl: HTMLDivElement;
	let tabulator: Tabulator | null = null;
	let processedColumns: ColumnDefinition[] = [];


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

	const defaultOptions: Partial<TabulatorOptions> = {
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
					counter1.textContent = String(tabulator!.getDataCount("active"));
					counter2.textContent = String(tabulator!.getDataCount("all"));
					};


				tabulator.on("dataFiltered", updateCounters);
				updateCounters();
			}

			// Map updates

			if (updateMapOnFilter) {
				let timeout;
				let lastFilterSignature = null;


				tabulator.on("dataFiltered", (filters) => {
				// tabulator fires update also on expanding dataTree children rows
				// need to check if the filters really changes the state, update map only then
				const signature = JSON.stringify(filters || []);

				// Ignore dataTree expand/collapse
				if (signature === lastFilterSignature) {
					return;
				}

				lastFilterSignature = signature;

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
	<div class="grid md:flex my-4 md:justify-between items-start md:items-center mb-2">
		<div class="text-brand-800">
			Es werden <span id="counter1"></span> von <span id="counter2"></span> Einträgen angezeigt
		</div>

		{#if showDownloadButtons}
			<div class="flex gap-2 justify-end">
				<button on:click={() => download("csv", "csv")}
					aria-label="Als CSV herunterladen"
					class="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-500 hover:text-brand-950 font-semibold text-md">
					CSV
				</button>
				<button on:click={() => download("json", "json")}
					aria-label="Als JSON herunterladen"
					class="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-500 hover:text-brand-950 font-semibold text-md">
					JSON
				</button>
				<button on:click={() => download("html", "html", { style: true })}
					aria-label="Als HTML herunterladen"
					class="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-500 hover:text-brand-950 font-semibold text-md">
					HTML
				</button>
			</div>
		{/if}
	</div>
	
	<!-- MAP SLOT -->
	 <slot name="map" />
  <!-- TABULATOR ROOT -->
  <div bind:this={tableEl} id={tableId} class="w-full min-w-24"></div>
</div>
