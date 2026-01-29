<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import type { Work } from "@/types/work";
  import works from "@/content/data/works.json";

  let svg: SVGSVGElement;
  let selectedPlace: string | null = null;

  // dropdown data
  const places = extractOrigPlaces(works).sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  // reactive data
  let filteredWorks: Work[] = [];
  let genreData: { genre: string; count: number }[] = [];

  // run once, after DOM is ready
  onMount(() => {
    console.log("onMount: svg =", svg);
  });

$: console.log("genreData", genreData);

  // update filtered works when place changes
  $: filteredWorks =
    selectedPlace
      ? filterWorksByPlace(works, selectedPlace)
      : [];

  // update genre counts when filtered works change
  $: genreData = countGenres(filteredWorks);

  // redraw chart when data + svg are ready
  $: if (svg && genreData.length) {
    drawPie(svg, genreData);
  }

  function drawPie(
    svgEl: SVGSVGElement,
    data: { genre: string; count: number }[]
  ) {
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    // clear previous chart
    d3.select(svgEl).selectAll("*").remove();

    const g = d3
      .select(svgEl)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie<{ genre: string; count: number }>()
      .value(d => d.count)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<{ genre: string; count: number }>>()
      .innerRadius(0)
      .outerRadius(radius - 10);

    const color = d3
      .scaleOrdinal<string>()
      .domain(data.map(d => d.genre))
      .range(d3.schemeTableau10);

    const arcs = g
      .selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.genre))
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    arcs.append("title").text(
      d => `${d.data.genre}: ${d.data.count}`
    );
  }

  // ---------- helpers ----------

  function extractOrigPlaces(works: Work[]) {
    const places = new Map<string, string>();

    for (const work of works) {
      for (const ms of work.ms_transmission ?? []) {
        for (const op of ms.orig_place ?? []) {
          for (const p of op.place ?? []) {
            places.set(p.hit_id, p.value);
          }
        }
      }
    }

    return Array.from(places, ([hit_id, label]) => ({
      hit_id,
      label
    }));
  }

  function workHasOrigPlace(work: Work, placeHitId: string) {
    return work.ms_transmission?.some(ms =>
      ms.orig_place?.some(op =>
        op.place?.some(p => p.hit_id === placeHitId)
      )
    );
  }

  function filterWorksByPlace(works: Work[], placeHitId: string) {
    return works.filter(w => workHasOrigPlace(w, placeHitId));
  }

  function countGenres(works: Work[]) {
    const counts = new Map<string, number>();

    for (const work of works) {
      for (const g of work.genre ?? []) {
        const key = g.main_genre ?? "Unspecified";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return Array.from(counts, ([genre, count]) => ({
      genre,
      count
    }));
  }
</script>
<label for="place-select">
  Filter by place of origin:
</label>
<select bind:value={selectedPlace} id="place-select"
class="border border-gray-300 rounded p-2 m-2 bg-white">
  <option value={null} selected>--Please choose an option--</option>
  {#each places as p}
    <option value={p.hit_id}>{p.label}</option>
  {/each}
</select>

<svg bind:this={svg} width="400" height="400" class="border border-gray-300 rounded m-2 bg-white"></svg>
