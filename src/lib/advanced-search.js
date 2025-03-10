import instantsearch from "instantsearch.js";
import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
import {
	searchBox,
	hits,
	stats,
	pagination,
	panel,
	refinementList,
	clearRefinements,
	currentRefinements,
} from "instantsearch.js/es/widgets";
import { withBasePath } from "./withBasePath";
const project_collection_name = "hit__msitems";
const main_search_field = "title";
const secondary_search_field = "manuscript";
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
		query_by: `${main_search_field},${secondary_search_field}`,
	},
});

// create searchClient
const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
	searchClient,
	indexName: project_collection_name,
});

const refinementListAuthor = wrapInPanel("Autor");

const refinementListWork = wrapInPanel("Werk");

const refinementListMS = wrapInPanel("Handschrift");

const refinementListRepo = wrapInPanel("Bibliothek");

const refinementListRepoPlace = wrapInPanel("Aktuellen Standort");

const refinementListOrigDate = wrapInPanel("Entstehungszeit");

const refinementListOrigPlace = wrapInPanel("Entstehungsort");

const refinementListProvenance = wrapInPanel("Provenienz");

const refinementListHandsFunktion = wrapInPanel("Händefunktion");

const refinementListHandsRole = wrapInPanel("Schreiberaktivitäten");

const refinementListHandsContextRole = wrapInPanel("Schreiber Typ");

const refinementListDecoration = wrapInPanel("Ausstatung");

// add widgets
search.addWidgets([
	searchBox({
		container: "#searchbox",
		autofocus: true,
		placeholder: "Suche nach einem Titel oder einer Handschrift",
	}),

	hits({
		container: "#hits",
		templates: {
			empty: "No results for <q>{{ query }}</q>",

			item(hit, { html, components }) {
				const href = withBasePath(`/msitems/${hit.hit_id}`);

				return html`
					<a href="${href}">
						<article class="py-2 px-4 border-brand-300 border rounded-md">
							<h2 class="text-lg underline underline-offset-2 font-semibold text-brand-800">
								<span>(#${hit.id}) </span>
								${hit.work[0]?.author?.length
									? `${hit.work[0].author.map((a) => a.name).join(", ")}: `
									: ""}
								<span class="italic">${hit.work[0]?.title || "Untitled"}</span>
							</h2>
							<div class="columns-2 gap-8 text-gray-700">
								<dl class="grid grid-cols-[1fr_5fr] p-2 break-inside-avoid-column">
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
											...new Set(
												hit.orig_date?.flatMap((od) => od.date?.map((d) => d.value)) || [],
											),
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
																(h) =>
																	h.jobs?.flatMap((j) => j.function?.map((f) => f.value)) || [],
															),
														),
													].join(" | ")}
												</dd>
											`
										: ""}
								</dl>
							</div>
						</article>
					</a>
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

	refinementListRepo({
		container: "#refinement-list-library",
		attribute: "library.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListRepoPlace({
		container: "#refinement-list-library-place",
		attribute: "library_place.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),
	refinementListMS({
		container: "#refinement-list-manuscripts",
		attribute: "manuscript.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListWork({
		container: "#refinement-list-work",
		attribute: "work.title",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListOrigDate({
		container: "#refinement-list-orig-date",
		attribute: "orig_date.date.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListOrigPlace({
		container: "#refinement-list-orig-place",
		attribute: "orig_place.place.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListProvenance({
		container: "#refinement-list-provenance",
		attribute: "provenance.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListHandsRole({
		container: "#refinement-list-hands-function",
		attribute: "hands.jobs.role.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),
	refinementListHandsContextRole({
		container: "#refinement-list-scribe-type",
		attribute: "hands.jobs.role_context.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListHandsFunktion({
		container: "#refinement-list-hands-role",
		attribute: "hands.jobs.function.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListAuthor({
		container: "#refinement-list-authors",
		attribute: "work.author.name",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	refinementListDecoration({
		container: "#refinement-list-decoration",
		attribute: "decoration.value",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}),

	clearRefinements({
		container: "#clear-refinements",
	}),

	currentRefinements({
		container: "#current-refinements",
		transformItems(items) {
			return items.map((item) => ({
				...item,
				label:
					item.attribute === "work.author.name"
						? "Author"
						: item.attribute === "work.title"
							? "Werk"
							: item.attribute === "manuscript.value"
								? "Handschrift"
								: item.attribute === "library.value"
									? "Bibliothek"
									: item.attribute === "library_place.value"
										? "Aktuellen Standort"
										: item.attribute === "orig_date.date.value"
											? "Entstehungszeit"
											: item.attribute === "orig_place.place.value"
												? "Entstehungsort"
												: item.attribute === "provenance.value"
													? "Provenienz"
													: item.attribute === "hands.jobs.function.value"
														? "Händefunktion"
														: item.attribute === "hands.jobs.role.value"
															? "Schreiberaktivitäten"
															: item.attribute === "hands.jobs.role_context.value"
																? "Schreiber Typ"
																: item.attribute === "decoration.value"
																	? "Decoration"
																	: item.label,
			}));
		},
	}),
]);

search.start();
// function to wrap refinements filter in a panel
function wrapInPanel(title) {
	return panel({
		collapsed: ({ state }) => {
			return state.query.length === 0;
		},
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
