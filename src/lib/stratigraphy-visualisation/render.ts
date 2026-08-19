import * as d3 from "d3";
import type { StratigraphyData } from "@/types/stratigraphy";
import { getStratumColor } from "@/lib/utils";
export function renderManuscriptStratigraphy(container: HTMLElement, data: StratigraphyData) {
	const { msitems, handRoles } = data;

	const currentColor = "#f8c161c4";
	const labelColor = "#5a2102";
	const strata = Array.from(new Set(handRoles.map((d) => d.stratum))).sort((a, b) =>
		String(a).localeCompare(String(b)),
	);

	//const stratumColors = new Map(strata.map((stratum, i) => [stratum, palette[i % palette.length]]));

	const visibleHandRoles = handRoles.filter(
		(d) =>
			d.pageStart !== undefined &&
			d.pageEnd !== undefined &&
			d.dateStart !== undefined &&
			d.dateEnd !== undefined,
	);

	const handRolesWithLabelLine = [];

	const lanes = [];

	for (const role of visibleHandRoles) {
		let assignedLane = -1;

		for (let i = 0; i < lanes.length; i++) {
			const overlaps = lanes[i].some(
				(other) =>
					role.pageStart! < other.pageEnd! &&
					role.pageEnd! > other.pageStart! &&
					role.dateStart! < other.dateEnd! &&
					role.dateEnd! > other.dateStart!,
			);

			if (!overlaps) {
				assignedLane = i;
				break;
			}
		}

		if (assignedLane === -1) {
			assignedLane = lanes.length;
			lanes.push([]);
		}

		lanes[assignedLane].push(role);

		handRolesWithLabelLine.push({
			...role,
			labelLine: assignedLane,
		});
	}

	// --------------------------------------------------
	// Dimensions
	// --------------------------------------------------

	const width = container.clientWidth || 900;
	const height = 700;

	const margin = {
		top: 30,
		right: 30,
		bottom: 50,
		left: 70,
	};

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	// --------------------------------------------------
	// Get overall page and date ranges
	// --------------------------------------------------

	const pageValues = msitems
		.flatMap((msi) => [msi.pageStart, msi.pageEnd])
		.filter((page): page is number => page !== undefined);

	const handPageValues = handRoles
		.flatMap((hr) => [hr.pageStart, hr.pageEnd])
		.filter((page): page is number => page !== undefined);

	const allPages = [...pageValues, ...handPageValues];

	const dateValues = handRoles
		.flatMap((hr) => [hr.dateStart, hr.dateEnd])
		.filter((date): date is number => date !== undefined);

	if (!allPages.length || !dateValues.length) {
		container.innerHTML = "<p>Not enough data to display manuscript stratigraphy.</p>";
		return;
	}

	const firstPage = Math.min(...allPages);
	const lastPage = Math.max(...allPages);

	const earliestDate = Math.min(...dateValues);
	const latestDate = Math.max(...dateValues);

	// --------------------------------------------------
	// Scales
	// --------------------------------------------------

	const x = d3.scaleLinear().domain([firstPage, lastPage]).range([0, innerWidth]);

	const y = d3.scaleLinear().domain([earliestDate, latestDate]).range([innerHeight, 0]);

	// --------------------------------------------------
	// SVG
	// --------------------------------------------------

	container.innerHTML = "";

	const svg = d3
		.select(container)
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", `0 0 ${width} ${height}`)
		.attr("class", "overflow-visible");

	const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	// --------------------------------------------------
	// Grid / axes
	// --------------------------------------------------

	const xAxis = d3
		.axisBottom(x)
		.ticks(Math.min(20, lastPage - firstPage + 1))
		.tickFormat(d3.format("d"));

	const yAxis = d3.axisLeft(y).ticks(10).tickFormat(d3.format("d"));

	chart.append("g").attr("transform", `translate(0,${innerHeight})`).call(xAxis);

	chart.append("g").call(yAxis);

	// horizontal grid lines
	chart
		.append("g")
		.attr("class", "grid")
		.call(
			d3
				.axisLeft(y)
				.ticks(10)
				.tickSize(-innerWidth)
				.tickFormat(() => ""),
		);

	// vertical grid lines
	chart
		.append("g")
		.attr("class", "grid")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.ticks(Math.min(20, lastPage - firstPage + 1))
				.tickSize(-innerHeight)
				.tickFormat(() => ""),
		);

	// --------------------------------------------------
	// Axis labels
	// --------------------------------------------------

	chart
		.append("text")
		.attr("x", innerWidth / 2)
		.attr("y", innerHeight + 42)
		.attr("text-anchor", "middle")
		.attr("fill", labelColor)
		.text("Manuscript page");

	chart
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", -innerHeight / 2)
		.attr("y", -50)
		.attr("text-anchor", "middle")
		.attr("fill", labelColor)
		.text("Date");

	// --------------------------------------------------
	// MS ITEMS
	// --------------------------------------------------
	//
	// These are the physical/textual layers.
	// They extend across their page range.
	//
	// At this stage we draw them as vertical bands.
	// --------------------------------------------------

	chart
		.append("g")
		.attr("class", "msitems")
		.selectAll("rect")
		.data(msitems.filter((d) => d.pageStart !== undefined && d.pageEnd !== undefined))
		.join("rect")
		.attr("x", (d) => x(d.pageStart!))
		.attr("y", 0)
		.attr("width", (d) => Math.max(1, x(d.pageEnd!) - x(d.pageStart!)))
		.attr("height", innerHeight)
		.attr("fill", currentColor)
		.attr("opacity", 0.15)
		.attr("stroke", "black")
		.attr("stroke-width", 1);

	// --------------------------------------------------
	// HAND ROLES
	// --------------------------------------------------
	//
	// These are the dated activities.
	//
	// X = page range
	// Y = date range
	// --------------------------------------------------

	chart
		.append("g")
		.attr("class", "hand-roles")
		.selectAll("rect")
		.data(
			handRoles.filter(
				(d) =>
					d.pageStart !== undefined &&
					d.pageEnd !== undefined &&
					d.dateStart !== undefined &&
					d.dateEnd !== undefined,
			),
		)
		.join("rect")
		.attr("x", (d) => x(d.pageStart!))
		.attr("y", (d) => y(d.dateEnd!))
		.attr("width", (d) => Math.max(2, x(d.pageEnd!) - x(d.pageStart!)))
		.attr("height", (d) => Math.max(2, y(d.dateStart!) - y(d.dateEnd!)))
		.attr("fill", (d) => getStratumColor(d.stratum))
		.attr("opacity", 0.35)
		.attr("stroke", (d) => getStratumColor(d.stratum))
		.attr("stroke-width", 1.5);

	// --------------------------------------------------
	// Hand-role IDs for now
	// --------------------------------------------------
	const labelLineHeight = 14;
	chart
		.append("g")
		.attr("class", "hand-role-labels")
		.selectAll("text")
		.data(handRolesWithLabelLine)
		.join("text")
		.attr("x", (d) => (x(d.pageStart!) + x(d.pageEnd!)) / 2)
		.attr("y", (d) => (y(d.dateStart!) + y(d.dateEnd!)) / 2 + d.labelLine * labelLineHeight)
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "middle")
		.attr("fill", "#5a2102")
		.attr("font-size", "11px")
		.text((d) => d.hand);
}
