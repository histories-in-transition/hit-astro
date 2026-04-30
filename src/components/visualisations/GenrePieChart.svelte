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
import { withBasePath } from "@/lib/withBasePath";

const allGenres = extractHistoriographyGenres(works);
const genreColorMap = buildGenreColorMap(allGenres);

let chartEl: HTMLDivElement;
let chart: echarts.ECharts | null = null;

const places = extractOrigPlaces(works).sort((a, b) =>
  a.label.localeCompare(b.label)
);

let selectedPlace: string | null =
  places.length ? places[0].hit_id : null;

// ---------- DATA ----------

let datasetSource: any[] = [];

$: datasetSource =
  selectedPlace
    ? buildDatasetSource(countSubGenres(works, selectedPlace)) ?? []
    : [];

$: colors =
  datasetSource.length > 1
    ? datasetSource.slice(1).map(row =>
        genreColorMap.get(row[0]) ?? "#ccc"
      )
    : [];

// ---------- CHART ----------

onMount(() => {
  chartEl = document.getElementById("piechart") as HTMLDivElement;
  chart = echarts.init(chartEl);

  // click = get genre + century directly
  chart.on("click", function (params: any) {
    if (!params.seriesName || params.dataIndex == null) return;

    const genre = params.seriesName;
    const century = datasetSource[0][params.dataIndex + 1];
    const place = places.find(p => p.hit_id === selectedPlace)?.label;

    const searchParams = new URLSearchParams();

    if (century) {
      searchParams.append(
        "hit__msitems[refinementList][orig_date.date.century][0]",
        century
      );
    }

    if (place) {
      searchParams.append(
        "hit__msitems[refinementList][orig_place.place.value][0]",
        place
      );
    }

    searchParams.append(
      "hit__msitems[hierarchicalMenu][main_genre][0]",
      "Historiographie"
    );

    if (genre && genre !== "Historiographie allgemein") {
      searchParams.append(
        "hit__msitems[hierarchicalMenu][main_genre][1]",
        genre
      );
    }

    window.location.href = withBasePath(`/search/?${searchParams.toString()}`);
  });

  window.addEventListener("resize", () => chart?.resize());
});

// ---------- UPDATE ----------

$: if (chart && datasetSource.length > 1) {
  chart.setOption({
    title: {
      text: selectedPlace
        ? `Genre-Verteilung für ${places.find(p => p.hit_id === selectedPlace)?.label}`
        : "Bitte wählen Sie einen Ort aus",
      left: "center",
      top: 20
    },

    dataset: {
      source: datasetSource
    },

    legend: {},

    tooltip: {
      trigger: "axis"
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

    xAxis: { type: "category" },
    yAxis: {},

    series: datasetSource.slice(1).map((row, i) => ({
      name: row[0],
      type: "line",
      smooth: true,
      seriesLayoutBy: "row",
      lineStyle: {
        color: colors[i]
      },
      itemStyle: {
        color: colors[i]
      }
    }))
  });
}

// ---------- HELPERS ----------

function extractOrigPlaces(works: Work[]) {
  const places = new Map<string, string>();
  const histWorks = works.filter(w =>
    w.genre.some(g => g.main_genre === "Historiographie")
  );

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
    md:h-[500px]
    lg:h-[600px]
    border border-gray-300
    rounded
    bg-white
  "
></div>

</div>