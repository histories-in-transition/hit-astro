import * as d3 from "d3";

export function createWorkGraph(container, graphData, { onNavigate, onLockChange } = {}) {
	let width = 0;
	let height = 0;

	let svg, canvas, nodes, links, labels, tooltip, simulation;
	let rScale;

	let lockedNode = null;
	let filteredIds = new Set();

	const linkColor = "#953c049d";

	// ---------- helpers ----------
	const getId = (v) => (typeof v === "object" ? v.id : v);

	function buildNeighborMap() {
		const map = new Map();

		graphData.nodes.forEach((n) => map.set(n.id, new Set()));

		const relevantEdges =
			filteredIds.size === 0
				? graphData.edges
				: graphData.edges.filter((e) => e.msitems?.some((ms) => filteredIds.has(ms)));

		relevantEdges.forEach((l) => {
			const s = getId(l.source);
			const t = getId(l.target);
			if (!s || !t) return;

			map.get(s)?.add(t);
			map.get(t)?.add(s);
		});

		return map;
	}

	let neighborMap = buildNeighborMap();

	// colors for genre legend and nodes

	const genres = Array.from(new Set(graphData.nodes.map((d) => d.genre))).sort((a, b) =>
		a.localeCompare(b),
	);

	const palette = [
		"#1f77b4",
		"#ff7f0e",
		"#2ca02c",
		"#d62728",
		"#9467bd",
		"#8c564b",
		"#e377c2",
		"#7f7f7f",
		"#bcbd22",
		"#17becf",
		"#393b79",
		"#637939",
		"#8c6d31",
		"#843c39",
		"#7b4173",
		"#3182bd",
		"#e6550d",
		"#31a354",
		"#756bb1",
		"#636363",
	];

	const genreColors = new Map(genres.map((g, i) => [g, palette[i % palette.length]]));

	// ---------- init ----------
	function init() {
		const root = d3.select(container);

		svg = root.append("svg");
		canvas = svg.append("g").attr("class", "canvas");

		const zoom = d3
			.zoom()
			.scaleExtent([0.1, 4])
			.on("zoom", (event) => {
				canvas.attr("transform", event.transform);
			});

		svg.call(zoom);

		tooltip = root
			.append("div")
			.style("position", "fixed")
			.style("visibility", "hidden")
			.style("background", "white")
			.style("border", "1px solid #7f3303")
			.style("padding", "4px 6px")
			.style("font-size", "12px");

		const linksGroup = canvas.append("g");
		const nodesGroup = canvas.append("g");
		const labelsGroup = canvas.append("g").style("pointer-events", "none");

		rScale = d3
			.scaleSqrt()
			.domain([0, d3.max(graphData.nodes, (d) => d.value) ?? 0])
			.range([4, 14]);

		// --- links ---
		links = linksGroup
			.selectAll("line")
			.data(graphData.edges)
			.enter()
			.append("line")
			.attr("stroke", linkColor)
			.attr("stroke-width", (d) => Math.sqrt(d.value));

		// --- nodes ---
		nodes = nodesGroup
			.selectAll("circle")
			.data(graphData.nodes)
			.enter()
			.append("circle")
			.attr("r", (d) => rScale(d.value))
			.attr("fill", (d) => genreColors.get(d.genre) || "#999");

		// --- labels ---
		labels = labelsGroup
			.selectAll("text")
			.data(graphData.nodes)
			.enter()
			.append("text")
			.text((d) => d.name ?? d.id)
			.attr("font-size", 12)
			.attr("opacity", 0)
			.attr("stroke", "white")
			.attr("stroke-width", 4)
			.attr("paint-order", "stroke");

		// ---------- interactions ----------

		// --- links ---
		links
			.on("pointerenter", (event, d) => {
				if (lockedNode) {
					const s = getId(d.source);
					const t = getId(d.target);

					const isConnected = s === lockedNode.id || t === lockedNode.id;

					if (!isConnected) return;
				}

				showLinkTooltip(d, event);
			})
			.on("pointerout", hideTooltip);

		// --- nodes ---
		nodes
			.on("pointerenter", (event, d) => {
				if (lockedNode) {
					const isSame = d.id === lockedNode.id;
					const isNeighbor = neighborMap.get(lockedNode.id)?.has(d.id);

					if (isSame) {
						showNodeTooltip(d, event);
						return;
					}

					if (isNeighbor) {
						showNeighborTooltip(d, event);
						return;
					}

					// not neighbor - no tooltip
					return;
				}

				// no locked node -> normal behavior
				showNodeTooltip(d, event);
			})
			.on("pointerout", () => {
				hideTooltip();

				if (lockedNode) {
					highlightNode(lockedNode);
					labels.attr("opacity", (n) => (n.id === lockedNode.id ? 1 : 0));
					return;
				}

				resetHighlight();
				labels.attr("opacity", 0);
			});

		// --- click logic ---
		let downTime = 0;

		nodes
			.on("pointerdown", (event) => {
				event.stopPropagation();
				downTime = Date.now();
			})
			.on("pointerup", (event, d) => {
				event.stopPropagation();

				if (Date.now() - downTime < 200) {
					if (!lockedNode) {
						lockedNode = d;
						showNodeDetails(d);
					} else if (lockedNode.id === d.id) {
						onNavigate?.(d);
					} else {
						lockedNode = d;
						showNodeDetails(d);
					}

					onLockChange?.(lockedNode);
				}
			});

		svg.on("pointerdown", () => {
			lockedNode = null;
			onLockChange?.(null);

			resetHighlight();
			hideTooltip();
			labels.attr("opacity", 0);
		});

		// ---------- simulation ----------
		simulation = d3
			.forceSimulation(graphData.nodes)
			.force(
				"link",
				d3
					.forceLink(graphData.edges)
					.id((d) => d.id)
					.distance(80)
					.strength(0.3),
			)
			.force("charge", d3.forceManyBody().strength(-8))
			.force(
				"collide",
				d3.forceCollide((d) => rScale(d.value) + 2),
			)
			.on("tick", ticked);
	}

	function ticked() {
		nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

		links
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		labels.attr("x", (d) => d.x + 5).attr("y", (d) => d.y - 5);
	}

	// ---------- highlighting ----------
	function highlightNode(d) {
		const neighbors = neighborMap.get(d.id) || new Set();

		nodes
			.attr("opacity", (n) => {
				if (n.id === d.id || neighbors.has(n.id)) return 1;
				if (filteredIds.size > 0) return filteredIds.has(n.id) ? 1 : 0.15;
				return 0.2;
			})
			.attr("r", (n) => (n.id === d.id ? rScale(n.value) * 1.5 : rScale(n.value)));

		links.attr("stroke-opacity", (l) => {
			const s = getId(l.source);
			const t = getId(l.target);
			return s === d.id || t === d.id ? 1 : 0.2;
		});
	}

	function resetHighlight() {
		nodes.attr("opacity", 1).attr("r", (d) => rScale(d.value));

		links.attr("stroke", linkColor).attr("stroke-opacity", 1);

		if (filteredIds.size > 0) {
			highlightFiltered();
		}
	}

	function highlightFiltered() {
		const ids = new Set();

		graphData.nodes.forEach((n) => {
			if (n.msItems?.some((ms) => filteredIds.has(ms))) {
				ids.add(n.id);
			}
		});

		nodes.attr("opacity", (d) => (ids.has(d.id) ? 1 : 0.15));

		links.attr("stroke-opacity", (l) =>
			ids.has(getId(l.source)) && ids.has(getId(l.target)) ? 0.5 : 0.1,
		);
	}

	// ---------- tooltips ----------
	function showNodeTooltip(d, event) {
		tooltip.style("visibility", "visible").html(`<strong>${d.name ?? ""}</strong><br/>${d.genre}`);

		tooltip.style("left", event.clientX + 10 + "px").style("top", event.clientY + "px");

		highlightNode(d);
	}

	function showNeighborTooltip(d, event) {
		tooltip.style("visibility", "visible").html(`<strong>${d.name ?? ""}</strong><br/>${d.genre}`);

		tooltip.style("left", event.clientX + 10 + "px").style("top", event.clientY + "px");
	}

	function showLinkTooltip(l, event) {
		tooltip.style("visibility", "visible").html(`<strong>${l.value} Manuscripts:</strong> </br> 
					${l.mss?.map((ms) => ms.shelfmark).join(" | ") || "N/A"}
			`);

		tooltip.style("left", event.clientX + 10 + "px").style("top", event.clientY + "px");
	}

	function hideTooltip() {
		tooltip.style("visibility", "hidden");
	}

	function showNodeDetails(d) {
		hideTooltip();
		highlightNode(d);

		labels
			.attr("opacity", (n) => (n.id === d.id ? 1 : 0))
			.each(function (n) {
				if (n.id === d.id) {
					this.parentNode.appendChild(this);
				}
			});
	}

	// ---------- API ----------
	function updateSize(w, h) {
		width = w;
		height = h;

		svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);

		const cx = width / 2;
		const cy = height / 2;
		const radius = Math.min(width, height) * 0.4;

		simulation
			.force("center", d3.forceCenter(cx, cy))
			.force("boundary", forceInsideCircle(radius, cx, cy))
			.alpha(0.3)
			.restart();
	}

	function setFilter(ids) {
		filteredIds = ids || new Set();
		neighborMap = buildNeighborMap();
		resetHighlight();
	}

	function setLockedNode(node) {
		lockedNode = node;
		if (node) showNodeDetails(node);
		else resetHighlight();
	}

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
					// 👉 damp velocity to stop drifting
					node.vx *= 0.5;
					node.vy *= 0.5;
				}
			}
		}
		force.initialize = (_nodes) => (nodes = _nodes);
		return force;
	}

	init();

	return {
		updateSize,
		setFilter,
		setLockedNode,
		getGenres: () => genres,
		getGenreColors: () => genreColors,
	};
}
