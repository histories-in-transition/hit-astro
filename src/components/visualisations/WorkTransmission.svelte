<script lang="ts">
import { onMount } from "svelte";
import * as echarts from "echarts";
import workgraph from "@/content/data/work-graph.json";
import { filteredIds } from "@/stores/hit_store";
import { withBasePath } from "@/lib/withBasePath";

let container: HTMLDivElement;
let chart: echarts.ECharts | null = null;

// Filter graph
$: graphData = (() => {
  if (!$filteredIds || $filteredIds.size === 0) {
    return workgraph;
  }

  const nodes = workgraph.nodes.filter(node =>
    node.msItems?.some(item => $filteredIds.has(item)));

// filter also the edges based on the already filtered nodes
  const nodeIds = new Set(nodes.map(n => n.id));

  const edges = workgraph.edges.filter(edge =>
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return { nodes, edges };
})();

//  ECharts option
function buildOption(graph) {
    // collect categories/genres from filtered nodes
    const genreSet = new Set();
    graph.nodes.forEach(n => {
        const genre = n.genre;
        genreSet.add(genre);
    })
    const genreList = Array.from(genreSet).sort();

    const categoryMap = new Map();
    genreList.forEach((g, i) => {
    categoryMap.set(g, i);
  });
    
    const nodes = graph.nodes.map(n => {
        const genre = n.genre || "Unknown";

        return {
        ...n,
        category: categoryMap.get(genre),
        symbolSize: Math.max(8, Math.sqrt(n.value) * 8),
        };
    });

    //palette for 20 genres

    const palette = [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
        "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
        "#393b79", "#637939", "#8c6d31", "#843c39", "#7b4173",
        "#3182bd", "#e6550d", "#31a354", "#756bb1", "#636363"
        ];

    const categories = genreList.map((name, i) => ({
        name,
        itemStyle: {
            color: palette[i % palette.length]
        }
    }));
  return {
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        if (params.dataType === "node") {
          return `  <b>${params.data.name}</b><br>` + 
                 `Genre: ${params.data.genre}<br>` +
                 `Manuscripts: ${params.data.value}`;
        }
        if (params.dataType === "edge") {
          return `Manuscripts: ${params.data.value}:<br>` + 
                 params.data.mss.map(ms => `- ${ms.shelfmark} (${ms.date}, ${ms.place})`).join("<br>");
        }
      }
    },
    legend: {
            data: categories.map(c => c.name),
            orient: "vertical",   
            left: "left",
            },
    animation: false,
    series: [
      {
        type: "graph",
        layout: "force",
        data: nodes,        
        links: graph.edges.map(e => ({
            ...e,
            lineStyle: {
                width: Math.max(1, e.value * 2),
                curveness: 0.1,
                color: "rgba(138, 138, 138, 0.4)"
            },
            edgeSymbolSize: 0
        })),
        categories: categories,
        roam: true,
        draggable: false,
        focusNodeAdjacency: true, 
        legendHoverLink: false,
        force: {
            initLayout: "circular", 
            repulsion: 120,
            edgeLength: [50, 200],
            layoutAnimation: false,
            iterations: 150,
            gravity: 0.1,
            friction: 0.6
            },  

        lineStyle: {
          opacity: 0.6,          
        },      
        label: {
            show: false,
            color: "#000",
            backgroundColor: "transparent",
            borderWidth: 0
        },

        emphasis: {
            focus: "adjacency",
            label: {
                show: true,
                color: "#000",                 
                textBorderColor: "#f5eeeb",
                textBorderWidth: 2  
            },
            lineStyle: {
                width: 2,
                color: "rgba(138, 138, 138, 0.8)"
            }
        }
      }
    ]
  };
}

// Init chart
onMount(() => {
  chart = echarts.init(container);
  // function for onclick on node
  chart.on("click", (params) => {
    if (params.dataType === "node") {
      const node = params.data as { id: string };
      window.location.href = withBasePath(`/works/${node.id}`);
    }
  });

});

//  Reactive update
$: if (chart && graphData) {
  chart.setOption(buildOption(graphData));
}


</script>

<div bind:this={container} style="width:100%; height:1000px;"></div>