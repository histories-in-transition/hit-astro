<script lang="ts">
import FilterList from "@/components/search/filter.svelte";
import { filters } from "@/stores/hit_store.ts";
import { runSearch } from "@/lib/search/typsense-search.js";

let authors : Array<{name: string, count: number}> = [];
let works : Array<{name: string, count: number}> = [];
let genres : Array<{name: string, count: number}> = [];
let centuries : Array<{name: string, count: number}> = [];
let places : Array<{name: string, count: number}> = [];

let searchToken = 0;
// async function to start typsense query
async function updateSearch(currentFilters: any) {

  const token = ++searchToken;  // to avoid queries overlapping

  const res = await runSearch(currentFilters);
    console.log(res)
  // ignore stale responses
  if (token !== searchToken || !res) return; // if this is not the most recent query, abort

  const facets = res.facet_counts ?? []; // take the facets list and counts from typsense
  const getFacet = (name: string) =>
  facets.find(f => f.field_name === name)?.counts ?? [];
  //prepare the data for filter list from the typsense response on facets
  authors = getFacet("authors").map(c => ({
      name: c.value,
      count: c.count
    })).sort((a,b) => a.name.localeCompare(b.name));
    
  works = getFacet("work.title").map(c => ({
        name: c.value,
        count: c.count
    })).sort((a,b) => a.name.localeCompare(b.name));
genres = getFacet("main_genre").map(c => ({
        name: c.value,
        count: c.count
    })).sort((a,b) => a.name.localeCompare(b.name));
    
  centuries = getFacet("orig_date.date.century").map(c => ({
        name: c.value,
        count: c.count
    })).sort((a,b) => {
      const extractCentury = (str) => {
        const value = str?.name || str; // Handle both direct strings and refinement objects
        const match = value.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return extractCentury(a.name) - extractCentury(b.name);
    });
  places = getFacet("orig_place.place.value").map(c => ({
        name: c.value,
        count: c.count
    })).sort((a,b) => a.name.localeCompare(b.name));
}


// whenever filters change (we get then from store, where the filter components write)
// start a new typsense query
$: updateSearch($filters);

  
</script>

<div class="search-panel space-y-4  ">

            <h2 class="text-lg font-bold">Filters</h2>
  
   <FilterList
    title="Autoren"
    field="authors"
    items={authors}
  />

  <FilterList
    title="Werke"
    field="works"
    items={works}
  />

  <FilterList
    title="Genres"
    field="genres"
    items={genres}
  />

  <FilterList
    title="Jahrhunderte"
    field="centuries"
    items={centuries}
  />

  <FilterList
    title="Entstehungsort"
    field="places"
    items={places}
  />

</div>