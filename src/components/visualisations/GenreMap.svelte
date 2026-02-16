<script lang="ts">
  import { onMount } from "svelte";
  import * as echarts from "echarts";
  import europeGeoJSON from "@/maps/europe-geo.json";

  import works from "@/content/data/works.json";

  import {
    aggregateWorks
  } from "@/lib/helpers/visualisations";

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts;

const aggregated = aggregateWorks(works);
const placeData = aggregated.places;


  // collect all centuries available for the select dropdown, sorted
  const centuries: number[] = Array.from(
    new Set(
      Array.from(placeData.values())
        .flatMap(p => Array.from(p.centuries.keys()))
    )
  ).sort((a, b) => a - b) as number[];

  let selectedCentury: number = centuries[0];

  // color map global for all genres
  const palette = [
    '#2563eb',
    '#b6d634',
    '#d97706',
    '#dc2626',
    '#7c3aed',
    '#0d9488',
    '#9333ea'
  ];

  function buildColorMapForCentury(century: number) {
  const genres = new Set<string>();

  for (const place of placeData.values()) {
    const g = place.centuries.get(century);
    if (g) {
      for (const name of g.keys()) {
        genres.add(name);
      }
    }
  }

  const genreList = Array.from(genres);

  const map = new Map<string, string>();
  genreList.forEach((g, i) => {
    map.set(g, palette[i % palette.length]);
  });

  return { colorMap: map, genreList };
}


  function updateChart(century: number) {
    const { colorMap, genreList } =
  buildColorMapForCentury(selectedCentury);


    const pieSeries = [];

    for (const place of placeData.values()) {
      const genreMap = place.centuries.get(century);
      if (!genreMap) continue;

      const data = Array.from(genreMap.entries()).map(
        ([name, value]) => ({
          name,
          value,
          itemStyle: {
            color: colorMap.get(name)
          }
        })
      );

      const total = data.reduce((sum, d) => sum + d.value, 0);

     pieSeries.push({
      name: place.name,   // good practice
      type: "pie",
      coordinateSystem: "geo",
      center: [place.lng, place.lat],
      radius: Math.max(10, Math.sqrt(total) * 3),
      data,
      label: {
        show: false, // labels are for the pie slices i.e. genres not the place, so we hide them
        },
      legend: {}
    });
    }
    chart.setOption({      
      legend: {
        show: true,
        bottom: 20,
        left: "center",
        data: genreList
      },
      series: [
        {
          type: "map",
          map: "europe",
          geoIndex: 0
        },
        ...pieSeries,
      ]
    },
  { replaceMerge: ["series", "legend"] }

 
  );
  }

  onMount(() => {
    chart = echarts.init(chartEl);

    echarts.registerMap("europe", europeGeoJSON as any);

    chart.setOption({
      tooltip: { trigger: "item" },
      geo: {
        map: "europe",
        roam: true,
        itemStyle: {
          areaColor: "#f3f4f6",
          borderColor: "#999",
        }
      },
        
        label: {
          show: true,
          formatter: "{b}",
        }
    });

    updateChart(selectedCentury);

    window.addEventListener("resize", () => chart.resize());
  });

  $: if (chart) {
    updateChart(selectedCentury);
  }
</script>

<div class="flex flex-col gap-4 items-start">
  <label for="century-select" class="sr-only">
    Filtern nach Jahrhundert
  </label>
  <select id="century-select" bind:value={selectedCentury}
  on:change={(e) => selectedCentury = Number(e.currentTarget.value)}
  class="border p-2 rounded bg-white border-gray-300">
    {#each centuries as c}
      <option value={c}>{c}th century</option>
    {/each}
  </select>

  <div bind:this={chartEl} class="w-full h-[700px]"></div>
</div>
