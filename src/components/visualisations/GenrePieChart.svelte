<script lang="ts">
  import { onMount } from "svelte";
  import * as echarts from "echarts";
  import type { Work } from "@/types/work";
  import {
    countSubGenres,
    buildDatasetSource,
    buildGenreColorMap,
    extractHistoriographyGenres
  } from "@/lib/helpers/visualisations";
  import works from "@/content/data/works.json";
import {withBasePath} from "@/lib/withBasePath"
  
  const allGenres = extractHistoriographyGenres(works);
const genreColorMap = buildGenreColorMap(allGenres);

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts | null = null;

  let selectedCentury: string | null = null;

  const places = extractOrigPlaces(works).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  
  let selectedPlace: string | null = 
    places.length ? places[0].hit_id : null;

  // select element dropdown data

  // reactive data
  let filteredWorks: Work[] = [];
  let genreData: { genre: string; count: number }[] = [];

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
    if (!xAxisInfo || !datasetSource?.length) return;

    const dim = xAxisInfo.value + 1;
    selectedCentury = datasetSource[0][dim];

    const pieData = datasetSource
      .slice(1)
      .map(row => ({
        name: row[0],
        value: row[dim],
        itemStyle: {
          color: genreColorMap.get(row[0])
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

    // Add click handler to link to search results for the genre
   chart.on("click", function (params: any) {
        if (!params.data) return;

        const place = places.find(p => p.hit_id === selectedPlace)?.label;
        const genre = params.data.name != 'Historiographie allgemein' ? params.data.name : '';
        const century = selectedCentury; 

        const searchParams = new URLSearchParams();

        // --- Refinement: Century ---
        if (century) {
          searchParams.append(
            "hit__msitems[refinementList][orig_date.date.century][0]",
            century
          );
        }

        // --- Refinement: Place ---
        if (place) {
          searchParams.append(
            "hit__msitems[refinementList][orig_place.place.value][0]",
            place
          );
        }

        // --- Hierarchical Genre ---
        searchParams.append(
          "hit__msitems[hierarchicalMenu][main_genre][0]",
          "Historiographie"
        );
      if(genre) {
        searchParams.append(
          "hit__msitems[hierarchicalMenu][main_genre][1]",
          genre
        )};

        window.location.href = withBasePath(`/search/?${searchParams.toString()}`);
});

  window.addEventListener("resize", () => chart?.resize());
});
  // ---------- reactive data updates ----------



$: console.log("genreData", genreData);

  // update filtered works when place changes
  $: filteredWorks =
    selectedPlace
      ? filterWorksByPlace(works, selectedPlace)
      : [];


 $: subGenreCounts =
  selectedPlace
    ? countSubGenres(works, selectedPlace)
    : new Map();

$: datasetSource =
  buildDatasetSource(subGenreCounts);

  
  // redraw chart when data + svg are ready
 // --- update chart ---
 $: if (chart && datasetSource.length ) {
  const lineSeries = buildLineSeries(datasetSource, genreColorMap);

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
   toolbox: {
            show: true,
            orient: "vertical",
            right: 30,
            top: 20,
            itemSize: 20,
            itemGap: 20,
            feature: {
            saveAsImage: {
                show: true,
                title: "Herunterladen als PNG",
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#fff",
            },
            },
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
    const histWorks = works.filter(w => w.genre.some(g => g.main_genre === "Historiographie"))
    for (const work of histWorks) {
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
function buildLineSeries(
  datasetSource: any[],
  genreColorMap: Map<string, string>
) {
  return datasetSource.slice(1).map(row => {
    const genreName = row[0];

    return {
      name: genreName,
      type: 'line',
      smooth: true,
      seriesLayoutBy: 'row',
      emphasis: { focus: 'series' },
      lineStyle: {
        color: genreColorMap.get(genreName)
      },
      itemStyle: {
        color: genreColorMap.get(genreName)
      }
    };
  });
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