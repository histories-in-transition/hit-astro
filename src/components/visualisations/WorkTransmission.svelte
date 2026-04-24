<script lang="ts">
import { onMount } from "svelte";
import * as d3 from "d3";
import workgraph from "@/content/data/work-graph.json";
import { filteredIds, dataWorksGraph } from "@/stores/hit_store";
import { withBasePath } from "@/lib/withBasePath";
import type { GraphData } from "@/types/graph";
import {derived} from "svelte/store";

let container: HTMLDivElement;
let mounted = false;
 const graphData: GraphData = workgraph;

    $dataWorksGraph = graphData;

let nodes;
let links;
let lockedNode = null;
let rScale;
const linkColor: string = "#953c049d"
// reactive block to update the graph whenever the filter changes
$: if (nodes && links && neighborMap) {
  if (lockedNode) {
    highlightNode(lockedNode);
  } else if ($filteredIds && $filteredIds.size > 0) {
    highlightNodesByIds($filteredIds);
  } else {
    resetHighlight();
  }
}    

//highlight on mouse over and on first click 
function highlightNode(d: GraphData["nodes"][number]){
 const allRelatives = neighborMap.get(d.id) || new Set();
   nodes   
    .attr("opacity", n => {
      if (n.id === d.id || allRelatives.has(n.id)) return 1;
      if ($filteredIds) return $filteredIds.has(n.id) ? 1 : 0.15;
      return 0.2;
    })
    .attr("r", n =>
      n.id === d.id ? rScale(n.value) * 1.5 : rScale(n.value)
    );
 links
  .attr("stroke", l => {
    const s = getSourceNodeHitId(l);
    const t = getTargetNodeHitId(l);

    return (s === d.id || t === d.id)
      ? linkColor
      : "#ccc";
  })
  .attr("stroke-opacity", l => {
    const s = getSourceNodeHitId(l);
    const t = getTargetNodeHitId(l);

    return (s === d.id || t === d.id)
      ? 1
      : 0.2;
  });
}
function resetHighlight(){ 
  nodes
    .attr("opacity",1)
    .attr("r", d => rScale(d.value));

  links
    .attr("stroke", linkColor)
    .attr("stroke-opacity",1);
  if ($filteredIds) {
    highlightNodesByIds($filteredIds);
  }
}

function highlightNodesByIds(ids: Set<string>) {
  let filteredNodeIds: Set<string>;
// case where a node is locked /clicked on - show only its filtered neighbors
  if (lockedNode) {
    const neighbors = neighborMap.get(lockedNode.id) ?? new Set();

    // include the locked node itself
    filteredNodeIds = new Set([lockedNode.id, ...neighbors]);
  } else {
    const filteredNodes = graphData.nodes.filter(n =>
      n.msItems?.some(item => ids.has(item))
    );

    filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  }

  // --- nodes ---
  nodes.attr("opacity", d =>
    filteredNodeIds.has(d.id) ? 1 : 0.15
  );

  // --- links ---
  links
    .attr("stroke", l => {
      const s = getSourceNodeHitId(l);
      const t = getTargetNodeHitId(l);

      return filteredNodeIds.has(s) && filteredNodeIds.has(t)
        ? linkColor
        : "#ccc";
    })
    .attr("stroke-opacity", l => {
      const s = getSourceNodeHitId(l);
      const t = getTargetNodeHitId(l);

      return filteredNodeIds.has(s) && filteredNodeIds.has(t)
        ? 0.5
        : 0.1;
    });
}
// reactive map to get neighbors which are filtered 
const neighborMapStore = derived(
  [filteredIds],
  ([$filteredIds]) => {
    const map = new Map<string, Set<string>>();

    // init all nodes
    graphData.nodes.forEach((n) => {
      map.set(n.id, new Set());
    });

    // if no filter → include all edges
    const relevantEdges = !$filteredIds || $filteredIds.size === 0
      ? graphData.edges
      : graphData.edges.filter(edge =>
          edge.msitems.some(ms => $filteredIds.has(ms))
        );

    // build neighbors
    relevantEdges.forEach((l) => {
      const sourceId = getSourceNodeHitId(l);
      const targetId = getTargetNodeHitId(l);

      if (!sourceId || !targetId) return;

      map.get(sourceId)?.add(targetId);
      map.get(targetId)?.add(sourceId);
    });

    return map;
  }
);


function getSourceNodeHitId(l: { source: { id: string } | string }) {
  return typeof l.source === "object"
    ? l.source.id
    : l.source;
}

function getTargetNodeHitId(l: { target: { id: string } | string }) {
  return typeof l.target === "object"
    ? l.target.id
    : l.target;
}


// by processing the data we selected only the main_genre and the sub_genre of historiographie
// now assign fix colors to the genres

$: genres = Array.from(new Set(workgraph.nodes.map(d => d.genre)))
.sort((a, b) => a.localeCompare(b));
const palette = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  "#393b79", "#637939", "#8c6d31", "#843c39", "#7b4173",
  "#3182bd", "#e6550d", "#31a354", "#756bb1", "#636363"
];

$: genreColors = new Map(
  genres.map((genre, i) => [
    genre,
    palette[i % palette.length]
  ])
);

$: if (mounted) {
  const params = new URLSearchParams();

  if (lockedNode) {
    params.set("node", lockedNode.id);
  }

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, "", newUrl);
}

//--- neighbor map ---
$: neighborMap = $neighborMapStore;

const nodeByMsItem = new Map<string, string>(); // msItem → node.id

graphData.nodes.forEach(node => {
  node.msItems?.forEach(msId => {
    nodeByMsItem.set(msId, node.id);
  });
});

// degree = number of unique neighbors
$: {graphData.nodes.forEach(d => {
  d.degree = neighborMap.get(d.id).size;
});
}

$: if (nodes) {
  updateUrlParams();
}

onMount(() => {  

 const params = new URLSearchParams(window.location.search);
  const nodeParam = params.get("node");

  if (nodeParam) {
    const node = graphData.nodes.find(n => n.id === nodeParam);
    if (node) {
      lockedNode = node;
    }}
    mounted = true;

// *****
const width = 1000;
const height = 1000;

rScale = d3.scaleSqrt()
  .domain([0, d3.max(graphData.nodes, (d: GraphData["nodes"][number]) => d.value) ?? 0])
  .range([4, 14]);

// start drawing

const root = d3.select(container); 
const svg = root.append("svg")
    .attr("width", width)
    .attr("height", height);
// --- tooltip ---
const tooltip = root.append("div")
  .style("position","fixed")
  .style("background","white")
  .style("border","1px solid #7f3303")
  .style("border-radius","0.3rem")
  .style("padding","4px 6px")
  .style("font-size","12px")
  .style("pointer-events","none")
  .style("visibility","hidden");



const canvas = svg.append("g").attr("class","canvas").attr("transform","translate(40,0)");
const linksGroup = canvas.append("g").attr("class","links");
const nodesGroup = canvas.append("g").attr("class","nodes");
const labelsGroup = canvas.append("g").attr("class","labels")
  .style("pointer-events","none"); // <- important


// --- draw links ---
 links = linksGroup.selectAll("line")
  .data(graphData.edges)
  .enter().append("line")
  .attr("stroke", linkColor)
  .attr("stroke-width", d => Math.sqrt(d.value));

// --- draw nodes ---
 nodes = nodesGroup.selectAll("circle")
  .data(graphData.nodes)
  .enter().append("circle")
  .attr("r", d => rScale(d.value))
  .attr("fill", d => genreColors.get(d.genre) || "#999")
  .attr("cx", () => Math.random() * width)
  .attr("cy", () => Math.random() * height);


// --- draw labels ---
const labels = labelsGroup.selectAll("text")
  .data(graphData.nodes)
  .enter()
  .append("text")
  .text(d => d.name ?? d.id)
  .attr("font-size", 12)
  .attr("fill", "black")
  .attr("pointer-events", "none")
  .attr("opacity", 0)
  .attr("paint-order", "stroke")
  .attr("stroke", "white")
  .attr("stroke-width", 4)
  .attr("stroke-linejoin", "round");

  

// --- hover ---

let tooltipEl;

links
  .on("pointerenter", function(this: SVGLineElement, event, d) {   
    showLinkTooltip(d, this);
  })
  .on("pointerout", function() {
    tooltip.style("visibility", "hidden");
  });

nodes
  .on("pointerenter", function(this: SVGCircleElement, event, d) {
    if (lockedNode && d.id !== lockedNode.id) {
        showNeighborTooltip(d, this); // allow hover on neighbors even when a node is locked
        return;
        }
    showNodeTooltip(d, this);
  })
 .on("pointerout", function(this: SVGCircleElement, event, d) {

  tooltip.style("visibility", "hidden");

  if (lockedNode) {
    // restore locked state
    highlightNode(lockedNode);

    labels
      .attr("opacity", n => n.id === lockedNode.id ? 1 : 0);

    return;
  }

  resetHighlight();
  labels.attr("opacity", 0);
});

// use delay so that one can drag the graph without accidental clicks
let downTime = 0;

nodes
  .on("pointerdown", function(this: SVGCircleElement, event) {
  event.stopPropagation();
  downTime = Date.now();
})
  .on("pointerup", function(this: SVGCircleElement, event, d) {
  event.stopPropagation();

  if (Date.now() - downTime < 200) {
    if (!lockedNode) {
      // first click → lock
      lockedNode = d;
      showNodeDetails(d, this);

    } else if (lockedNode.id === d.id) {
      // second click on SAME node → open detail page of the work
      window.location.href = withBasePath(`/works/${d.id}`);

    } else {
      // clicked a DIFFERENT node → switch lock
      lockedNode = d;
      showNodeDetails(d, this);
    }
  }
});

svg.on("pointerdown", () => {
  lockedNode = null;   //  unlock

  resetHighlight();
  tooltip.style("visibility", "hidden");
  labels.attr("opacity", 0);
});

const radius = Math.min(width, height) * 0.4;


// --- force simulation ---
const simulation = d3.forceSimulation(graphData.nodes)
  .force("link", d3.forceLink(graphData.edges)
    .id(d => d.id)
    .distance(80)
    .strength(0.3)
  )
  .force("charge", d3.forceManyBody().strength(-8))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collide", d3.forceCollide(d => rScale(d.value) + 2))
  .force("boundary", forceInsideCircle(radius, width / 2, height / 2))
  .on("tick", ticked);

  function ticked() {
  nodes
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  links
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  labels
    .attr("x", d => d.x + 5)
    .attr("y", d => d.y - 5);
}



// --- zoom 
const zoom = d3.zoom()
  .scaleExtent([0.1, 4])
  .on("zoom", (event) => {
    canvas.attr("transform", event.transform);
  });
svg.call(zoom as any);



// --- helpers ---

// need to get the position based on node
function updateTooltipPosition() {
  if (!tooltipEl) return;

  const rect = tooltipEl.getBoundingClientRect();

  tooltip
    .style("left", rect.x + rect.width / 2 + 5 + "px")
    .style("top", rect.y + "px");
}
// show tooltip on hover, neighbours and links remain
function showNodeTooltip(d, el) {
  tooltip
    .style("visibility", "visible")
    .html(`<strong>${d.name ?? ""}</strong><br/>
           <span>Genre: ${d.genre}</span><br/>
           <span>Überlieferung: ${d.value || 0}</span>`);

  tooltipEl = el;
  updateTooltipPosition();
  highlightNode(d);
}
// on a click on the same node show label of the one node and highligh neighbours
function showNodeDetails(d, el) {
  tooltip.style("visibility", "hidden");
  highlightNode(d);


  // show ONLY main node label
  labels
    .attr("opacity", n => n.id === d.id ? 1 : 0)
    .each(function(this: SVGTextElement, n){
      if (n.id === d.id) {
        this.parentNode.appendChild(this);
      }
    });

}

function showNeighborTooltip(d, el) {
  tooltip
    .style("visibility", "visible")
    .html(`<strong>${d.name ?? ""}</strong><br/>
           <span>Genre: ${d.genre}</span><br/>
           <span>Handschriften: ${d.value || 0}</span>`);

  tooltipEl = el;
  updateTooltipPosition();

}

function showLinkTooltip(d, el) {
  tooltip
    .style("visibility", "visible")
    .html(`<strong>${d.value} Manuscripts</strong><br/>
           <span>${d.mss.map(ms => ms.shelfmark).join(" | ")}</span>`);

  tooltipEl = el;
  updateTooltipPosition();

}

//custon force to keep nodes in a circle
function forceInsideCircle(radius, cx, cy) {
  let nodes;

  function force() {
    for (const node of nodes) {
      const dx = node.x - cx;
      const dy = node.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        const angle = Math.atan2(dy, dx);
        node.x = cx + radius * Math.cos(angle);
        node.y = cy + radius * Math.sin(angle);
      }
    }
  }

  force.initialize = function(_nodes) {
    nodes = _nodes;
  };

  return force;
}



});

function updateUrlParams() {
  const params = new URLSearchParams();

  

  if (lockedNode) {
    params.set("node", lockedNode.id);
  }

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

</script>



  <div class="border border-gray-300 rounded-sm p-4 bg-white shadow-md w-[1100px] mx-2.5">
    <h1 class="text-2xl">Netzwerk aller Werken</h1>
    <div class="flex flex-wrap gap-3 mt-4 w-[980px] px-2.5">
    {#each genres as genre}
      <div class="flex items-center gap-2">
        <span
          class="w-3 h-3 inline-block"
          style="background:{genreColors.get(genre)}"
        ></span>
        <span class="text-sm">{genre}</span>
      </div>
    {/each}
    </div>
      <div id="graph-container" bind:this={container}></div>
  </div>
