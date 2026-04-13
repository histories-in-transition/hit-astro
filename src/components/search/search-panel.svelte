<script lang="ts">
import FilterList from "@/components/search/filter.svelte";
import { filters } from "@/stores/hit_store.ts";
import { runSearch } from "@/lib/search/typsense-search.js";

let authors : Array<{name: string, count: number}> = [];
let works : Array<{name: string, count: number}> = [];

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
    })).sort((a,b) => b.count - a.count);
    
    works = getFacet("work.title").map(c => ({
        name: c.value,
        count: c.count
    })).sort((a,b) => b.count - a.count);

}


// whenever filters change (we get then from store, where the filter components write)
// start a new typsense query
$: updateSearch($filters);

  
</script>

<div class="search-panel space-y-4  ">

            <h2 class="text-lg font-bold">Filters</h2>
  
   <FilterList
    title="Authors"
    field="authors"
    items={authors}
  />

  <FilterList
    title="Works"
    field="works"
    items={works}
  />

</div>