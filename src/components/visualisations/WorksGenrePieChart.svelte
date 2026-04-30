<script lang="ts">
import { onMount } from "svelte";
import * as echarts from "echarts";
import {
  buildGenreColorMap, parseCentury
} from "@/lib/helpers/visualisations";
import chartData from "@/content/data/work-genre-data.json";
import { withBasePath } from "@/lib/withBasePath";

const allGenres = [... new Set(chartData.map(d => d.genre))].sort((a, b) =>
  a.localeCompare(b)
);
const genreColorMap = buildGenreColorMap(allGenres);

let chartEl: HTMLDivElement;
let chart: echarts.ECharts | null = null;

const places = [... new Set(chartData.map(d => d.place).sort((a,b) =>
  a.localeCompare(b)
))];

let selectedPlace: string | null =
  places.length ? "Salzburg": null;

// ---------- DATA ----------


$: filtered =
  selectedPlace
    ? chartData.filter(d => d.place === selectedPlace)
    : [];

$: centuries = [
  ...new Set(filtered.map(d => d.century))
].sort((a, b) => parseCentury(a) - parseCentury(b));

$: genres = [
  ...new Set(filtered.map(d => d.genre))
].sort((a, b) => a.localeCompare(b));

$: colors = genres.map(g => genreColorMap[g]);
  
$: series = genres.map((genre, i) => ({
  name: genre,
  type: "line",
  smooth: true,
  data: centuries.map((century) => {
    const item = filtered.find(
      d => d.century === century && d.genre === genre
    );

    return {
      value: item ? item.count : 0,
      works: item ? item.works : [],
      century,
      genre
    };
  }),
  lineStyle: {
    color: colors[i]
  },
  itemStyle: {
    color: colors[i]
  }
}));
// ---------- CHART ----------

onMount(() => {
  chartEl = document.getElementById("piechart") as HTMLDivElement;
  chart = echarts.init(chartEl);

  // click = get genre + century directly
 chart.on("click", function (params: any) {
  const genre = params.seriesName;
  const century = params.name; // ← THIS is the key fix
  const place = selectedPlace;

  if (!genre || !century || !place) return;

  const searchParams = new URLSearchParams();

  searchParams.append(
    "hit__msitems[refinementList][orig_date.date.century][0]",
    century
  );

  searchParams.append(
    "hit__msitems[refinementList][orig_place.place.value][0]",
    place
  );

  searchParams.append(
    "hit__msitems[hierarchicalMenu][main_genre][0]",
    "Historiographie"
  );

  if (genre !== "Historiographie allgemein") {
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

$: if (chart && selectedPlace) {
  chart.setOption({
    title: {
      text: `Genre-Verteilung in ${selectedPlace}`,
      left: "center",
      top: 20
    },

    tooltip: {
      trigger: "axis",
      formatter: function (params: any) {
        if (!params.length) return "";

        const century = params[0].axisValue;

        let html = `<strong>${century}</strong><br/>`;

        params.forEach((p: any) => {
          const works = p.data.works || [];

          html += `
            <div style="margin-top:4px">
              <span style="color:${p.color}">●</span>
              <strong>${p.seriesName}</strong>: ${p.value}
          `;

          if (works.length) {
            html += `<br/><small>${works.join("<br/>")}</small>`;
          }

          html += `</div>`;
        });

        return html;
      }
    },

    legend: {
      bottom: 10
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

    xAxis: {
      type: "category",
      data: centuries
    },

    yAxis: {
      type: "value"
    },

    series
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
      <option value={p}>{p}</option>
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