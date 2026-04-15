<script lang="ts">
import { onMount } from "svelte";
import * as d3 from "d3";
import workgraph from "@/content/data/work-graph.json";
import { filteredIds, dataWorksGraph } from "@/stores/hit_store";
import { withBasePath } from "@/lib/withBasePath";
import type { GraphData } from "@/types/graph";

let container: HTMLDivElement;


onMount(() => {
    const graphData: GraphData = workgraph;

    $dataWorksGraph = graphData;

let activeFilterIds: Set<string> | null = null;
const nodeColor: string = "#953c04"
const highlightNodeColor : string = "#953c04"
const neighborNode : string = "orange"
const linkColor: string = "#953c049d"

// state for nodes when clicked to introduce a freeze state
let lockedNode = null;


//a new Map for storing degree for radius and neighbours highlighting functions etc.
//--- neighbor map ---

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
const neighborMap = new Map();

graphData.nodes.forEach(d => neighborMap.set(d.id, new Set()));

graphData.edges.forEach(l => {
  const sourceId = getSourceNodeHitId(l);
  const targetId = getTargetNodeHitId(l);

  if (!sourceId || !targetId) {
    console.warn("Link references missing node:", l);
    return;
  }

  neighborMap.get(sourceId).add(targetId);
  neighborMap.get(targetId).add(sourceId);
});

const nodeByMsItem = new Map<string, string>(); // msItem → node.id

graphData.nodes.forEach(node => {
  node.msItems?.forEach(msId => {
    nodeByMsItem.set(msId, node.id);
  });
});

// degree = number of unique neighbors
graphData.nodes.forEach(d => {
  d.degree = neighborMap.get(d.id).size;
});


// *****
const width = 1000;
const height = 1000;

const rScale = d3.scaleSqrt()
  .domain([0, d3.max(graphData.nodes, (d: GraphData["nodes"][number]) => d.degree) ?? 0])
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
  .style("border","1px solid #999")
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
const links = linksGroup.selectAll("line")
  .data(graphData.edges)
  .enter().append("line")
  .attr("stroke", linkColor)
  .attr("stroke-width",1);

// --- draw nodes ---
const nodes = nodesGroup.selectAll("circle")
  .data(graphData.nodes)
  .enter().append("circle")
  .attr("r", d => rScale(d.degree))
  .attr("fill", nodeColor)
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
//not using on click, cause of stupid chrome 
// nodes are moving? not the same pixel during click
// better use pointerdown, but with delay so that one can drag the graph without accidental clicks
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
  .force("collide", d3.forceCollide(d => rScale(d.degree) + 2))
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

// connect to store for filteredID

filteredIds.subscribe((ids: Set<string>) => {
  if (!ids || ids.size === 0 || ids.size === graphData.nodes.length) {
    activeFilterIds = null;
    //resetHighlight();
    return;
  }
  activeFilterIds = ids;
  console.log("Graph received ids:", ids);
  highlightNodesByIds(ids);
});


// --- helpers ---
//highlight on mouse over
function highlightNode(d: GraphData["nodes"][number]){
  const allRelatives = neighborMap.get(d.id) || new Set();
   nodes
    .attr("fill", n => {
      if (n.id === d.id) return highlightNodeColor;
      if (allRelatives.has(n.id)) return neighborNode;

      if (activeFilterIds) {
        return activeFilterIds.has(n.id) ? nodeColor : "#ccc";
      }

      return "#ccc";
    })
    .attr("opacity", n => {
      if (n.id === d.id || allRelatives.has(n.id)) return 1;
      if (activeFilterIds) return activeFilterIds.has(n.id) ? 1 : 0.15;
      return 0.2;
    })
    .attr("r", n =>
      n.id === d.id ? rScale(n.degree) * 1.5 : rScale(n.degree)
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
    .attr("fill", nodeColor)
    .attr("opacity",1)
    .attr("r", d => rScale(d.degree));

  links
    .attr("stroke", linkColor)
    .attr("stroke-opacity",1);
  if (activeFilterIds) {
    highlightNodesByIds(activeFilterIds);
  }
}

function highlightNodesByIds(ids: Set<string>) {
    const filteredNodes = graphData.nodes.filter(n => n.msItems?.some(item => ids.has(item)));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  nodes
    .attr("fill", d => d.msItems?.some(item => ids.has(item)) ? highlightNodeColor : nodeColor)
    .attr("opacity", d => d.msItems?.some(item => ids.has(item)) ? 1 : 0.15);
// highlight only links which have both source and target in the ids set
  links
    .attr("stroke", l =>
      filteredNodeIds.has(getTargetNodeHitId(l)) && filteredNodeIds.has(getSourceNodeHitId(l))
        ? linkColor
        : "#ccc"
    )
    .attr("stroke-opacity", l =>
      filteredNodeIds.has(getTargetNodeHitId(l)) && filteredNodeIds.has(getSourceNodeHitId(l))
        ? 0.5
        : 0.1
    );
}
// need to get the position based on node
function updateTooltipPosition() {
  if (!tooltipEl) return;

  const rect = tooltipEl.getBoundingClientRect();

  tooltip
    .style("left", rect.x + rect.width / 2 + 5 + "px")
    .style("top", rect.y + "px");
}
// show tooltip on hover, click, neighbours and links remain
function showNodeTooltip(d, el) {
  tooltip
    .style("visibility", "visible")
    .html(`<strong>${d.name ?? ""}</strong><br/>
           <span>Genre: ${d.genre}</span><br/>
           <span>Handschriften: ${d.value || 0}</span>`);

  tooltipEl = el;
  updateTooltipPosition();
  highlightNode(d);

//   const neighbors = neighborMap.get(d.id) || new Set();

//   labels
//     .attr("opacity", n => neighbors.has(n.id) ? 1 : 0)
//     .each(function(n){
//       if (neighbors.has(n.id)) this.parentNode.appendChild(this);
//     });
}

function showNodeDetails(d, el) {
  tooltip.style("visibility", "hidden");
  highlightNode(d);

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

</script>



  <div id="graph-container" bind:this={container}></div>
