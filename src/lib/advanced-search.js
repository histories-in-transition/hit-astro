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
		query_by: main_search_field,
	},
});

// create searchClient
const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
	searchClient,
	indexName: project_collection_name,
});

const refinementListAuthor = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Author",
	},
})(refinementList);

const refinementListWork = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Werk",
	},
})(refinementList);

const refinementListMS = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Handschrift",
	},
})(refinementList);

const refinementListRepo = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Bibliothek",
	},
})(refinementList);

const refinementListRepoPlace = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Aktuellen Standort",
	},
})(refinementList);

const refinementListOrigDate = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Entstehungszeit",
	},
})(refinementList);

const refinementListOrigPlace = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Entstehungsort",
	},
})(refinementList);

const refinementListProvenance = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Provenienz",
	},
})(refinementList);

const refinementListHandsFunktion = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Händefunktion",
	},
})(refinementList);

const refinementListHandsRole = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Schreiberaktivitäten",
	},
})(refinementList);

const refinementListHandsContextRole = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Schreiber Typ",
	},
})(refinementList);

const refinementListDecoration = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Decoration",
	},
})(refinementList);

// add widgets
search.addWidgets([
	searchBox({
		container: "#searchbox",
		autofocus: true,
		placeholder: "Suche nach einem Titel",
	}),

	hits({
		container: "#hits",
		templates: {
			empty: "No results for <q>{{ query }}</q>",

			item(hit, { html, components }) {
				const href = withBasePath(`/msitems/${hit.hit_id}`);

				return html`
					<article>
						<h3>
							<a href="${href}">${hit.view_label} </a>
						</h3>
						<p>
							${hit.work[0]?.author.length > 0
								? `${hit.work[0]?.author.map((a) => a.name).join(", ")}: `
								: ""}
							${hit.work[0]?.title || "Untitled"}
						</p>
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
]);

search.start();
