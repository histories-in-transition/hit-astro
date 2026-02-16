<script lang="ts">
  import { onMount } from "svelte";
  import * as echarts from "echarts";
  import type { Work } from "@/types/work";
  import {
    countSubGenres,
    buildDatasetSource,
  } from "@/lib/helpers/visualisations";
  import works from "@/content/data/works.json";

  
  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  const places = extractOrigPlaces(works).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  
  let selectedPlace: string | null = 
    places.length ? places[0].hit_id : null;

  // select element dropdown data

  // reactive data
  let filteredWorks: Work[] = [];
  let genreData: { genre: string; count: number }[] = [];
  let colorMap: Map<string, string> = new Map();

  // run once, after DOM is ready
 onMount(() => {
  chartEl = document.getElementById("piechart") as HTMLDivElement;
  chart = echarts.init(chartEl);

  chart.on('updateAxisPointer', (event: {
  axesInfo?: Array<{
    value: number
  }>
}) => {
    const xAxisInfo = event.axesInfo[0];
    if (!xAxisInfo || !colorMap || !datasetSource?.length) return;

    const dim = xAxisInfo.value + 1;

    const pieData = datasetSource
      .slice(1)
      .map(row => ({
        name: row[0],
        value: row[dim],
        itemStyle: {
          color: colorMap.get(row[0])
        }
      }))
      .filter(d => d.value > 0);

    chart!.setOption({
      series: {
        id: 'pie',
        data: pieData
      }
    });
  });

  window.addEventListener("resize", () => chart?.resize());
});
  // ---------- reactive data updates ----------

  // build color map when dataset source changes
  $: colorMap =
    buildColorMap(datasetSource); 

$: console.log("genreData", genreData);

  // update filtered works when place changes
  $: filteredWorks =
    selectedPlace
      ? filterWorksByPlace(works, selectedPlace)
      : [];


 $: subGenreCounts =
  countSubGenres(filteredWorks);

$: datasetSource =
  buildDatasetSource(subGenreCounts);



  
  // redraw chart when data + svg are ready
 // --- update chart ---
 $: if (chart && datasetSource.length && colorMap.size) {
  const lineSeries = buildLineSeries(datasetSource, colorMap);

chart.setOption({
  title: {
    text: selectedPlace
      ? `Genre-Verteilung für ${places.find(p => p.hit_id === selectedPlace)?.label}`
      : 'Bitte wählen Sie einen Ort aus',
    left: 'center',
    top: 20,
    textStyle: {
      fontSize: 18,
      color: '#333'
  }},
  legend: {},
  tooltip: {
    trigger: 'axis',
    showContent: false
  },
  dataset: { source: datasetSource },
  xAxis: { type: 'category' },
  yAxis: {},
  grid: { top: '55%' },
  series: [
    ...lineSeries,
    {
      id: 'pie',
      type: 'pie',
      radius: '30%',
      center: ['50%', '25%'],
      emphasis: { focus: 'self' },
      label: {
        formatter: '{b}: {@[1]} ({d}%)'
      },
    }
  ]
});

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



// for each sub-genre one line row, choosing the right color
function buildLineSeries(datasetSource: any[], colorMap: Map<string, string>) {
  return datasetSource.slice(1).map(row => ({
    type: 'line',
    smooth: true,
    seriesLayoutBy: 'row',
    emphasis: { focus: 'series' },
    lineStyle: {
      color: colorMap.get(row[0])
    },
    itemStyle: {
      color: colorMap.get(row[0])
    }
  }));
}


// control colors of carts
const palette = [
  '#2563eb', // blue-600
  '#b6d634', // green
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#7c3aed', // violet-600
  '#0d9488', // teal-600
  '#9333ea'  // purple-600
];

function buildColorMap(datasetSource: any[]) {
  const map = new Map<string, string>();

  datasetSource.slice(1).forEach((row, i) => {
    map.set(row[0], palette[i % palette.length]);
  });

  return map;
}


  
</script>
<div class="flex flex-col gap-2 items-start">
  <label for="place-select" class="sr-only">
    Filtern nach Entstehungsort
  </label>
  <select bind:value={selectedPlace} id="place-select"
  class="border border-gray-300 rounded p-2 bg-white">
    <option value={null} selected>--Wälen Sie einen Ort--</option>
    {#each places as p}
      <option value={p.hit_id}>{p.label}</option>
    {/each}
  </select>
  <div
  id="piechart"
  class="
    w-full
    h-80
    sm:h-[420px]
    md:h-[600px]
    lg:h-[800px]
    border border-gray-300
    rounded
    bg-white
  "
></div>

</div>