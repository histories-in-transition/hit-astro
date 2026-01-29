<script lang="ts">
  import { onMount } from "svelte";
  import * as echarts from "echarts";
  import type { Work } from "@/types/work";
  import works from "@/content/data/works.json";

  
  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  let selectedPlace: string | null = null;

  // select element dropdown data
  const places = extractOrigPlaces(works).sort((a, b) =>
    a.label.localeCompare(b.label)
  );

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

  // interest only in historiography sub-genres
function getHistoriographieSubGenres(work: Work): string[] {
  return (
    work.genre
      ?.filter(g => g.main_genre === "Historiographie")
      .map(g => g.sub_genre?.trim() || "Unspecified")
    ?? []
  );
}

function normalizeCentury(raw: string): number | null {
  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : null;
}


function getCenturiesFromTransmission(ms: any): number[] {
  const centuries = [];

  for (const od of ms.orig_date ?? []) {
    for (const d of od.date ?? []) {
      for (const c of d.century ?? []) {
        const norm = normalizeCentury(c);
        if (norm) centuries.push(norm);
      }
    }
  }

  return centuries;
}
// count sub-genres by century from ms_transmission data
function countSubGenres(works: Work[]) {
  const result = new Map<string, Map<number, number>>();
// filter for historiographie sub-genres
  for (const work of works) {
    const subGenres = getHistoriographieSubGenres(work);
    if (!subGenres.length) continue;
// get centuries from ms_transmission
    for (const ms of work.ms_transmission ?? []) {
      const centuries = getCenturiesFromTransmission(ms);
      if (!centuries.length) continue;

      for (const sg of subGenres) {
        if (!result.has(sg)) {
          result.set(sg, new Map());
        }
        const centuryMap = result.get(sg)!;

        for (const c of centuries) {
          centuryMap.set(c, (centuryMap.get(c) ?? 0) + 1);
        }
      }
    }
  }

  return result;
}

// centuries for the line chart
function collectCenturies(
  data: Map<string, Map<number, number>>
): number[] {
  const set = new Set<number>();

  for (const centuryMap of data.values()) {
    for (const c of centuryMap.keys()) {
      set.add(c);
    }
  }

  return [...set].sort((a, b) => a - b);
}


function buildDatasetSource(
  data: Map<string, Map<number, number>>
) {
  const centuries = collectCenturies(data);

  const header = ['sub_genre', ...centuries.map(c => `${c}th`)];
  const rows = [];

  for (const [subGenre, centuryMap] of data.entries()) {
    rows.push([
      subGenre,
      ...centuries.map(c => centuryMap.get(c) ?? 0)
    ]);
  }

  return [header, ...rows];
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