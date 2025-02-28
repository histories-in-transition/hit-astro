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

const refinementListHand = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Schreiberhände",
	},
})(refinementList);

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

const refinementListHandsRole = panel({
	collapsed: ({ state }) => {
		return state.query.length === 0;
	},
	templates: {
		header: "Hände",
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
	/* 
	refinementListRepo({
		container: "#refinement-list-library",
		attribute: "library",
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
		attribute: "title_work.title",
		searchable: true,
		showMore: true,
		showMoreLimit: 50,
		limit: 10,
		searchablePlaceholder: "",
	}), */
	/* 
  refinementListHand({
    container: "#refinement-list-hands",
    attribute: "hand_dates",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "",
  }),

  refinementListHandsRole({
    container: "#refinement-list-hands-role",
    attribute: "hand_roles",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "",
  }),

  refinementListAuthor({
    container: "#refinement-list-decoration",
    attribute: "work.author",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "",
  }),
 */
	clearRefinements({
		container: "#clear-refinements",
	}),
]);

search.start();
