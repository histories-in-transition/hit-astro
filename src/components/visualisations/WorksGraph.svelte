<script lang="ts">
import { onMount } from "svelte";
import { filteredIds, lockedIds } from "@/stores/hit_store";
import workgraph from "@/content/data/work-graph.json";
import { createWorkGraph } from "@/lib/createWorkGraph";
import { withBasePath } from "@/lib/withBasePath";

let container;
let width = 0;
let height = 0;
let graph;
let genres = [];
let genreColors;

onMount(() => {
  graph = createWorkGraph(container, workgraph, {
    onNavigate: (node) => {
      window.location.href = withBasePath(`/works/${node.id}`);
    },
    onLockChange: (node) => {
      lockedIds.set(node?.msItems ? new Set(node.msItems) : new Set());
    }
  });

  genres = graph.getGenres();
  genreColors = graph.getGenreColors();
});

$: if (graph && width && height) {
  graph.updateSize(width, height);
}

$: if (graph) {
  graph.setFilter($filteredIds);
}
</script>

<div class="w-full">
<h1 class="text-2xl font-bold">Netzwerkdiagramm aller Werke</h1>
<details open class="border rounded-md p-3 grid gap-2 bg-white mt-2">
 <summary class="font-semibold text-xl text-brand-800 cursor-pointer">
  Legende
		</summary>
  <div class="flex flex-wrap gap-2 px-3">
    {#each genres as genre}
      <div class="flex items-center gap-1">
        <span
          class="w-3 h-3 inline-block"
          style="background:{genreColors.get(genre)}"
        ></span>
        <span class="text-sm">{genre}</span>
      </div>
    {/each}
  </div>
</details>
  <div
  bind:this={container}
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="w-full h-[70vh] min-w-0"
></div>
</div>