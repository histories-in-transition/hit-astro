import instantsearch from "instantsearch.js";
import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
import attachTypesenseServerErrorHandling from "./typsense-instant-utils.js";
import {
	searchBox,
	hits,
	stats,
	pagination,
	panel,
	refinementList,
	clearRefinements,
	currentRefinements,
	hierarchicalMenu,
} from "instantsearch.js/es/widgets";

import { simple } from "instantsearch.js/es/lib/stateMappings";
import { withBasePath } from "./withBasePath";
const project_collection_name = "hit__msitems";
const main_search_field = "title";
const secondary_search_field = "manuscript";
const third_search_field = "work.author.name";
const search_api_key = "m4HIiAYUUfemilHQ5LvSTC6hqEiNCjSX"; // custom search only key

const typesenseInstantsearchAdapter = new TypesenseInstantsearchAdapter({
	server: {
		apiKey: search_api_key,
		nodes: [
			{
				host: "typesense.acdh-dev.oeaw.ac.at",
				port: "443",
				protocol: "https",
			},
		],
	},
	additionalSearchParameters: {
		query_by: `${main_search_field},${secondary_search_field}, ${third_search_field}`,
	},
});

// create searchClient
const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
	searchClient,
	indexName: project_collection_name,
	routing: {
		stateMapping: simple(),
	},
});

attachTypesenseServerErrorHandling(
	searchClient,
	"Serverfehler: Die Suche ist derzeit nicht verfügbar.",
);

// Custom comparator function to sort century arrays for the refinement list 'Century of work'
const centuryComparator = (a, b) => {
	const extractCentury = (str) => {
		const value = str?.name || str; // Handle both direct strings and refinement objects
		const match = value.match(/(\d+)/);
		return match ? parseInt(match[1], 10) : 0;
	};

	return extractCentury(a) - extractCentury(b);
};

const refinementListAuthor = wrapInPanel("Autor");

const refinementListWork = wrapInPanel("Werk");

const refinementListMS = wrapInPanel("Handschrift");

const refinementListCentury = wrapInPanel("Entstehungs Jh");

const refinementListOrigPlace = wrapInPanel("Entstehungsort");

const refinementListProvenance = wrapInPanel("Provenienz");

const refinementListHandsFunktion = wrapInPanel("Händefunktion");

const refinementListHandsRole = wrapInPanel("Schreiberaktivitäten");

const refinementListHandsContextRole = wrapInPanel("Schreiber Typ");

const refinementListDecoration = wrapInPanel("Ausstatung");

const refinementListForm = wrapInPanel("Form");

const refinementListLanguage = wrapInPanel("Sprache");

const refinementListProject = wrapInPanel("Projekt");

const refinementListModifications = wrapInPanel("Textvariationen");

const refinementListInterpolations = wrapInPanel("Interpolations");

const hierarchicalMenuGenre = wrapHierarcicalMenuInPanel("Genre");

const refinementListTransmission = wrapInPanel("Überlieferungsgemeinschaft");

// Initialize a custom Algolia widget to allow users to filter results by a range of years
// filter input from and to to two different attributes in the schema (not possible with the default range input widget)
// init() required function when building a custom widget
// inside it 1. create the HTML structure
// 2. add event listeners to the form
// 3. use the helper to add the filter to the search, clear the old refinements
// 4. add real-time validation to the inputs
// 5. add getWidgetRenderState() to allow the currentRefinements widget to "see" this refinement
const customDateRangeWidget = (containerId) => {
	return {
		init({ helper, state, createURL }) {
			// Create the HTML structure for the date range widget with two inputs and apply button
			const container = document.querySelector(containerId);
			container.innerHTML = `
		  <div class="ais-Panel md:mb-4 md:rounded-lg border-b border-gray-300 bg-white overflow-hidden md:shadow-xs">
          <details class="group">
            <summary class="pl-4 pr-2 py-2 md:bg-brand-50 flex justify-between items-center md:border-b border-gray-200">
              <span class="text-brand-800 font-medium">Entstehungsdatum</span>
              <span class="w-auto h-auto bg-transparent flex items-center justify-start" aria-hidden="true">
                <svg class="transform text-brand-800 rotate-90 group-open:rotate-270" style="width: 1em; height: 1em;" viewBox="0 0 500 500">
                  <path d="M100 250l300-150v300z" fill="currentColor"></path>
                </svg>
              </span>
            </summary>
            <div class="ais-Panel-body px-4 py-2">
              <div class="mt-2">
                <form class="flex flex-col gap-2">
                  <div class="flex gap-2 items-center">
                    <input class="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-sm" type="number" id="date-from-year" min="70" max="1600" placeholder="Von" aria-label="Von Jahr">
                    <span class="text-gray-500" aria-hidden="true">-</span>
                    <input class="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-sm" type="number" id="date-to-year" min="70" max="1600" placeholder="Bis" aria-label="Bis Jahr">
                  </div>
                  <button type="submit" class="w-full py-1.5 text-sm bg-brand-600 text-white rounded-sm hover:bg-brand-700 transition">Suche</button>
                </form>
              </div>
            </div>
          </details>
        </div>
		`;

			const form = container.querySelector("form");
			const fromInput = container.querySelector("#date-from-year");
			const toInput = container.querySelector("#date-to-year");

			// add event listeners to the inputs
			form.addEventListener("submit", (e) => {
				e.preventDefault();

				// Clear old refinements
				helper.clearRefinements("terminus_post_quem");
				helper.clearRefinements("terminus_ante_quem");

				const from = parseInt(fromInput.value, 10);
				const to = parseInt(toInput.value, 10);
				// Validate: Ensure 'From year' < 'To year'
				if (from >= to) {
					toInput.setCustomValidity("The 'To year' must be greater than the 'From year'.");
					// Don't submit if validation fails
					return;
				} else {
					toInput.setCustomValidity(""); // Reset the error message if valid
				}

				// Proceed if both values are valid numbers;
				// helper.addNummericRefinemnt - standard Algolia method to add a numeric filter
				if (!isNaN(from)) {
					helper.addNumericRefinement("terminus_post_quem", ">=", from);
				}
				if (!isNaN(to)) {
					helper.addNumericRefinement("terminus_ante_quem", "<=", to);
				}

				// Perform the search after validation
				helper.search();
			});
			// Add real-time validation reset to allow resubmission after correcting the input
			fromInput.addEventListener("input", () => {
				toInput.setCustomValidity(""); // Reset error if the user changes 'From year'
				toInput.reportValidity(); // Show the validity message (if any)
			});

			toInput.addEventListener("input", () => {
				const from = parseInt(fromInput.value, 10);
				const to = parseInt(toInput.value, 10);

				// Re-check the condition if the 'To year' is still valid after the change
				if (from >= to) {
					toInput.setCustomValidity("Das „Bis-Jahr“ muss größer sein als das „Von-Jahr“.");
				} else {
					toInput.setCustomValidity(""); // Reset the error if condition is met
				}

				toInput.reportValidity(); // Show the validity message (if any)
			});
		},

		getWidgetRenderState({ helper }) {
			// Required so currentRefinements widget can "see" this refinement
			const refinements = [];

			const from = helper.getNumericRefinements("terminus_post_quem");
			if (from["≥"]) {
				refinements.push({
					attribute: "terminus_post_quem",
					type: "numeric",
					value: () => {
						helper.removeNumericRefinement("terminus_post_quem", ">=");
						helper.search();
					},
					label: `From ${from["≥"][0]}`,
				});
			}

			const to = helper.getNumericRefinements("terminus_ante_quem");
			if (to["≤"]) {
				refinements.push({
					attribute: "terminus_ante_quem",
					type: "numeric",
					value: () => {
						helper.removeNumericRefinement("terminus_ante_quem", "<=");
						helper.search();
					},
					label: `To ${to["≤"][0]}`,
				});
			}

			return {
				refinements,
			};
		},
		getWidgetUiState(uiState, { searchParameters }) {
			const from = searchParameters.getNumericRefinements("terminus_post_quem")?.[">="]?.[0];
			const to = searchParameters.getNumericRefinements("terminus_ante_quem")?.["<="]?.[0];

			if (from !== undefined || to !== undefined) {
				return {
					...uiState,
					dateRange: {
						from,
						to,
					},
				};
			}
			return uiState;
		},

		getWidgetSearchParameters(searchParameters, { uiState }) {
			const dateRange = uiState.dateRange || {};
			let params = searchParameters
				.clearRefinements("terminus_post_quem")
				.clearRefinements("terminus_ante_quem");
			if (dateRange.from !== undefined) {
				params = params.addNumericRefinement("terminus_post_quem", ">=", Number(dateRange.from));
			}
			if (dateRange.to !== undefined) {
				params = params.addNumericRefinement("terminus_ante_quem", "<=", Number(dateRange.to));
			}
			return params;
		},
	};
};

// Utility to show/hide the notification
function showServerErrorNotification(message) {
	const el = document.getElementById("server-error-notification");
	if (el) {
		el.textContent = message || "Serverfehler: Die Suche ist derzeit nicht verfügbar.";
		el.classList = "block";
	}
}
function hideServerErrorNotification() {
	const el = document.getElementById("server-error-notification");
	if (el) el.classList = "hidden";
}

// Patch the search client to catch errors
const originalSearch = searchClient.search.bind(searchClient);
searchClient.search = function (requests) {
	return originalSearch(requests).catch((err) => {
		showServerErrorNotification(
			"Serverfehler: Die Suche ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.",
		);
		throw err; // rethrow so InstantSearch knows
	});
};

// Optionally, hide notification on successful search
search.on("render", () => {
	hideServerErrorNotification();
});

// add widgets
search.addWidgets([
	searchBox({
		container: "#searchbox",
		autofocus: true,
		placeholder: "Suche nach einem Werk oder einer Handschrift",
	}),
	customDateRangeWidget("#date-range-widget"),
	hits({
		container: "#hits",
		templates: {
			empty: "No results for <q>{{ query }}</q>",

			item(hit, { html, components }) {
				const href = withBasePath(`/msitems/${hit.hit_id}`);

				return html`
					<article class="w-full p-2 md:px-4 border-brand-300 border rounded-md">
						<a href="${href}"
							><h2
								class="text-lg underline underline-offset-2 font-semibold text-brand-800 wrap-break-word"
							>
								<span>(#${hit.id}) </span>
								${hit.work[0]?.author?.length
									? `${hit.work[0].author.map((a) => a.name).join(", ")}: `
									: ""}
								<span class="italic wrap-break-word">${hit.work[0]?.title || "Untitled"}</span>
							</h2></a
						>
						<div class="text-gray-700">
							<dl class="md:grid grid-cols-[1fr_5fr] p-2 break-inside-avoid-column">
								${hit.title_note !== ""
									? html`
											<dt class="font-semibold pr-2">Bemerkung:</dt>
											<dd class="pl-5">${hit.title_note}</dd>
										`
									: ""}
								<dt class="font-semibold pr-2">Handschrift:</dt>
								<dd class="pl-5">${hit.view_label}</dd>
								<dt class="font-semibold pr-2">Datierung:</dt>
								<dd class="pl-5">
									${[
										...new Set(hit.orig_date?.flatMap((od) => od.date?.map((d) => d.value)) || []),
									].join(" | ")}
								</dd>
								<dt class="font-semibold pr-2">Entstehungsort:</dt>
								<dd class="pl-5">
									${[
										...new Set(
											hit.orig_place?.flatMap((pl) => pl.place?.map((p) => p.value)) || [],
										),
									].join(" | ")}
								</dd>
								${hit.hands?.some((h) =>
									h.jobs?.some((j) => j.role?.some((r) => r.value !== "Schreiber")),
								)
									? html`
											<dt class="font-semibold pr-2">Bearbeitung:</dt>
											<dd class="pl-5">
												${[
													...new Set(
														hit.hands
															.filter((h) =>
																h.jobs?.some((j) => j.role?.some((r) => r.value !== "Schreiber")),
															)
															.flatMap(
																(h) => h.jobs?.flatMap((j) => j.role?.map((r) => r.value)) || [],
															),
													),
												].join(" | ")}
											</dd>
										`
									: ""}
								${hit.hands?.some((h) => h.jobs?.some((j) => j.function.length > 0))
									? html`
											<dt class="font-semibold pr-2">Händefunktion:</dt>
											<dd class="pl-5">
												${[
													...new Set(
														hit.hands.flatMap(
															(h) => h.jobs?.flatMap((j) => j.function?.map((f) => f.value)) || [],
														),
													),
												].join(" | ")}
											</dd>
										`
									: ""}
							</dl>
						</div>
					</article>
				`;
			},
		},
	}),

	pagination({
		container: "#pagination",
	}),

	stats({
		container: "#stats-container",
	}),

	refinementListMS({
		container: "#refinement-list-manuscripts",
		attribute: "manuscript.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "weniger" : "mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListWork({
		container: "#refinement-list-work",
		attribute: "work.title",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListCentury({
		container: "#refinement-list-century",
		attribute: "orig_date.date.century",
		searchable: true,
		sortBy: centuryComparator,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "e.g. 9th c.",
	}),

	refinementListOrigPlace({
		container: "#refinement-list-orig-place",
		attribute: "orig_place.place.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListProvenance({
		container: "#refinement-list-provenance",
		attribute: "provenance.places.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListHandsRole({
		container: "#refinement-list-hands-function",
		attribute: "hands.jobs.role.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),
	refinementListHandsContextRole({
		container: "#refinement-list-scribe-type",
		attribute: "hands.jobs.role_context.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListHandsFunktion({
		container: "#refinement-list-hands-role",
		attribute: "hands.jobs.function.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListAuthor({
		container: "#refinement-list-authors",
		attribute: "work.author.name",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListDecoration({
		container: "#refinement-list-decoration",
		attribute: "decoration.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListForm({
		container: "#refinement-list-form",
		attribute: "form.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListModifications({
		container: "#refinement-list-modifications",
		attribute: "modifications",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListInterpolations({
		container: "#refinement-list-interpolations",
		attribute: "interpolations.title",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListLanguage({
		container: "#refinement-list-language",
		attribute: "language.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListProject({
		container: "#refinement-list-project",
		attribute: "project",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListTransmission({
		container: "#refinement-list-transmission",
		attribute: "joined_transmission.title",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "",
	}),

	hierarchicalMenuGenre({
		container: "#refinement-list-genre",
		attributes: ["main_genre", "sub_genre"],
		separator: " > ",
		showMore: true,
		showMoreLimit: 50,
		templates: {
			showMoreText({ isShowingMore }) {
				return isShowingMore ? "Weniger" : "Mehr";
			},
		},
		limit: 10,
		searchablePlaceholder: "e.g. Historiographie",
	}),

	clearRefinements({
		container: "#clear-refinements",
	}),

	currentRefinements({
		container: "#current-refinements",
		transformItems(items) {
			const labelMap = new Map([
				["work.author.name", "Author"],
				["work.title", "Werk"],
				["manuscript.value", "Handschrift"],
				["orig_date.date.value", "Entstehungszeit"],
				["orig_date.date.century", "Entstehungszeit"],
				["orig_place.place.value", "Entstehungsort"],
				["provenance.value", "Provenienz"],
				["hands.jobs.function.value", "Händefunktion"],
				["hands.jobs.role.value", "Schreiberaktivitäten"],
				["hands.jobs.role_context.value", "Schreiber Typ"],
				["decoration.value", "Decoration"],
				["terminus_ante_quem", "Terminus ante quem"],
				["terminus_post_quem", "Termininus post quem"],
				["main_genre", "Genre"],
				["interpolations.title", "Interpolations"],
				["joined_transmission.title", "Überlieferungsgemeinschaft"],
				["modifications", "Textvariationen"],
				["language.value", "Sprache"],
			]);

			return items.map((item) => ({
				...item,
				label: labelMap.get(item.attribute) || item.label,
			}));
		},
	}),
]);

search.start();
// function to wrap refinements filter in a panel
function wrapInPanel(title) {
	return panel({
		collapsed: () => true, // Always collapsed by default

		templates: {
			header: () => `<span class="normal-case text-base font-normal">${title}</span>`,
		},
		cssClasses: {
			header: "cursor-pointer relative z-10",
			collapseButton: "absolute inset-0 z-20 flex flex-row-reverse",
			collapseIcon: "",
			root: "border-b",
		},
	})(refinementList);
}

function wrapHierarcicalMenuInPanel(title) {
	return panel({
		collapsed: () => true, // Always collapsed by default
		/* collapsed: ({ state }) => {
			return state.query.length === 0;
		}, // collapse if no query */
		templates: {
			header: () => `<span class="normal-case text-base font-normal">${title}</span>`,
		},
		cssClasses: {
			header: "cursor-pointer relative z-10",
			collapseButton: "absolute inset-0 z-20 flex flex-row-reverse",
			collapseIcon: "",
			root: "border-b",
		},
	})(hierarchicalMenu);
}

const showFilter = document.querySelector("#filter-button");
const filters = document.querySelector("#refinements-section");
if (showFilter) {
	showFilter.addEventListener("click", function () {
		filters?.classList.toggle("hidden");
	});
}

search.on("render", () => {
	// Select all collapse buttons generated by InstantSearch panels
	document.querySelectorAll(".ais-Panel-collapseButton").forEach((btn) => {
		btn.setAttribute("aria-label", "Panel ein-/ausklappen"); // or any label you prefer
	});
	document.querySelectorAll(".ais-Panel-collapseIcon").forEach((btn) => {
		btn.setAttribute("aria-hidden", "true"); // or any label you prefer
	});
});
