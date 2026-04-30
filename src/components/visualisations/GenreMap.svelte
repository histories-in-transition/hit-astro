<script lang="ts">
  import { onMount } from "svelte";
  import * as echarts from "echarts";
  import europeGeoJSON from "@/maps/europe-geo.json";

  import chartData from "@/content/data/work-genre-data.json";
  import {withBasePath} from "@/lib/withBasePath"

  import {
    buildGenreColorMap, parseCentury
  } from "@/lib/helpers/visualisations";

  let chartEl: HTMLDivElement;
  let chart: echarts.ECharts;

const centuries = [
  ...new Set(chartData.map(d => d.century))
].sort((a, b) => parseCentury(a) - parseCentury(b));

let selectedCentury: string = centuries[0];

const placeMap = new Map<
  string,
  { name: string; lat: number; lng: number }
>();

chartData.forEach(d => {
  if (!placeMap.has(d.place)) {
    placeMap.set(d.place, {
      name: d.place,
      lat: d.lat,
      lng: d.lng
    });
  }
});

const allGenres = [
  ...new Set(chartData.map(d => d.genre))
].sort((a, b) => a.localeCompare(b));

const genreColorMap = buildGenreColorMap(allGenres);


  function updateChart(century: string) {
  const pieSeries = [];

  const filtered = chartData.filter(d => d.century === century);

  // group by place
  const grouped = new Map<string, typeof filtered>();

  filtered.forEach(d => {
    if (!grouped.has(d.place)) {
      grouped.set(d.place, []);
    }
    grouped.get(d.place)!.push(d);
  });

  for (const [place, items] of grouped.entries()) {
    const coords = placeMap.get(place);
    if (!coords) continue;

    const data = items.map(d => ({
      name: d.genre,
      value: d.count,
      itemStyle: {
        color: genreColorMap[d.genre]
      }
    }));

    const total = data.reduce((sum, d) => sum + d.value, 0);

    pieSeries.push({
      name: place,
      type: "pie",
      coordinateSystem: "geo",
      center: [coords.lng, coords.lat],
      radius: Math.max(10, Math.sqrt(total) * 3),
      data,
      label: { show: false }
    });
  }

  chart.setOption(
    {
      legend: {
        show: true,
        bottom: 20,
        left: "center",
        data: allGenres
      },

      toolbox: {
        show: true,
        orient: "vertical",
        right: 30,
        itemSize: 20,
        itemGap: 20,
        feature: {
          saveAsImage: {
            show: true,
            title: "Herunterladen als PNG",
            type: "png",
            pixelRatio: 2,
            backgroundColor: "#fff"
          }
        }
      },

      series: [
        {
          type: "map",
          map: "europe",
          geoIndex: 0
        },
        ...pieSeries
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
// function to add hyperlink from pie charts to search
    chart.on("click", function (params: any) {
      if (!params.data) return;

      const place = params.seriesName;
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
  class="border p-2 rounded bg-white border-gray-300">
    {#each centuries as c}
      <option value={c}>{c}</option>
    {/each}
  </select>

  <div bind:this={chartEl} class="w-full h-[700px] border border-neutral-300 rounded bg-blue-200/35"></div>
</div>
