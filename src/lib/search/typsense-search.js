import { filteredIds } from "@/stores/hit_store.ts";
import { createTypesenseClient } from "@/lib/search/create-typesense-client.js";

const client = createTypesenseClient();

let currentSearchToken = 0;

export async function runSearch(f) {
	const token = ++currentSearchToken;
	const main_search_field = "title";
	const secondary_search_field = "manuscript";
	const third_search_field = "authors";

	try {
		const filterParts = [
			f.authors.length ? `authors:=${f.authors.map((a) => `"${a}"`).join(" || ")}` : null,
			f.works.length ? `work.title:=[${f.works.map((w) => `"${w}"`).join(",")}]` : null,
			f.genres.length ? `main_genre:=[${f.genres.map((g) => `"${g}"`).join(",")}]` : null,
			f.centuries.length
				? `orig_date.date.century:=[${f.centuries.map((c) => `"${c}"`).join(",")}]`
				: null,
			f.places.length
				? `orig_place.place.value:=[${f.places.map((p) => `"${p}"`).join(",")}]`
				: null,
		].filter(Boolean);

		const filter_by = filterParts.length ? filterParts.join(" && ") : undefined;

		let page = 1;
		let allIds = [];
		let found = 0;
		let firstRes = null;
		// need a loop - Typsense return max 250 hits per query, need more queries
		do {
			const res = await client
				.collections("hit__msitems")
				.documents()
				.search({
					q: "*",
					query_by: `${main_search_field},${secondary_search_field}, ${third_search_field}`,
					filter_by,
					facet_by:
						"authors, work.title, main_genre, orig_date.date.century, orig_place.place.value",
					max_facet_values: 500,
					per_page: 250,
					page,
					include_fields: "hit_id",
				});

			// cancel stale searches
			if (token !== currentSearchToken) return null;

			if (page === 1) {
				found = res.found ?? 0;
				firstRes = res;
			}

			const hits = res.hits ?? [];

			allIds.push(...hits.map((h) => h.document.hit_id));

			page++;
		} while (allIds.length < found);

		// write the filtered ids in the store for the graph to update
		filteredIds.set(new Set(allIds));

		return firstRes;
	} catch (err) {
		console.error("Typesense search error:", err);
		return null;
	}
}
