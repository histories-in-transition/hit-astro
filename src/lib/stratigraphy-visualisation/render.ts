import * as d3 from "d3";
import type { StratigraphyData, StratigraphyHandRole } from "@/types/stratigraphy";
import { getStratumColor } from "@/lib/utils";
import { leafLabel, type LeafSegment } from "@/lib/stratigraphy-visualisation/helpers";

// --------------------------------------------------
// Settings (change the look here, not in the code below)
// --------------------------------------------------

const ROW_HEIGHT = 26; // height of one hand-role bar
const ROW_GAP = 4; // vertical gap between bars inside one stratum
const STRATUM_PADDING = 10; // space above/below the bars inside a stratum
const BAND_GAP = 6; // space between two strata
const LABEL_COLOR = "#5a2102";

const margin = { top: 20, right: 20, bottom: 50, left: 110 };

// --------------------------------------------------
// Types
// --------------------------------------------------

type PlacedRole = StratigraphyHandRole & { row: number };

interface StratumBand {
	stratum: number | string;
	roles: PlacedRole[];
	y: number;
	height: number;
	dateStart?: number;
	dateEnd?: number;
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function escapeHtml(text: string): string {
	return String(text ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

const firstLeaf = (role: StratigraphyHandRole) => role.segments[0].start;

/**
 * Greedy packing: put each role into the first row where NONE of its segments
 * collides with something already in that row. A role with several segments
 * always stays in ONE row, so it reads as one thing.
 */
function packIntoRows(roles: StratigraphyHandRole[]): PlacedRole[] {
	const rows: LeafSegment[][] = []; // rows[i] = segments already used in row i
	const collide = (a: LeafSegment, b: LeafSegment) => a.start <= b.end && b.start <= a.end;

	return [...roles]
		.sort((a, b) => firstLeaf(a) - firstLeaf(b))
		.map((role) => {
			let row = rows.findIndex(
				(used) => !role.segments.some((seg) => used.some((u) => collide(seg, u))),
			);
			if (row === -1) {
				row = rows.length;
				rows.push([]);
			}
			rows[row].push(...role.segments);
			return { ...role, row };
		});
}

function formatDate(role: StratigraphyHandRole): string {
	const range =
		role.dateStart !== undefined && role.dateEnd !== undefined
			? `${role.dateStart}–${role.dateEnd}`
			: "";
	if (role.dateLabel && range) return `${role.dateLabel} (${range})`;
	return role.dateLabel ?? range;
}

function tooltipHtml(role: PlacedRole): string {
	const field = (label: string, values: string | string[]) => {
		const text = Array.isArray(values) ? values.join(", ") : values;
		return text ? `<div><span style="opacity:.7">${label}:</span> ${escapeHtml(text)}</div>` : "";
	};

	const items = role.msItems.length
		? `<div style="margin-top:4px"><span style="opacity:.7">Texteinheiten:</span>
			<ul style="margin:2px 0 0 16px;padding:0">
				${role.msItems
					.map(
						(i) => `<li>${escapeHtml(i.title)}${i.locus ? ` (${escapeHtml(i.locus)})` : ""}</li>`,
					)
					.join("")}
			</ul></div>`
		: "";

	return [
		`<div style="font-weight:600;margin-bottom:4px">${escapeHtml(role.handLabel || role.hand)}</div>`,
		field("Stratum", String(role.stratum)),
		field("Folios", role.locus),
		field("Datiert", formatDate(role)),
		field("Role", role.roles),
		field("Funktion", role.functions),
		field("Typ", role.scribeTypes),
		items,
	].join("");
}

// --------------------------------------------------
// Main render function
// --------------------------------------------------

export function renderManuscriptStratigraphy(container: HTMLElement, data: StratigraphyData) {
	const { msitems, handRoles, romanFolioCount } = data;

	// A role can only be drawn if we know where it is on the manuscript.
	const visibleRoles = handRoles.filter((r) => r.segments.length > 0);
	const hiddenCount = handRoles.length - visibleRoles.length;

	container.innerHTML = "";

	if (!visibleRoles.length) {
		container.innerHTML = "<p>Not enough folio data to display manuscript stratigraphy.</p>";
		return;
	}

	// ---- 1. Layout: one band per stratum, roles packed into rows -----------

	// "12" and 12 are numeric; "TBD", "" or anything else is not.
	// (Number("TBD") is NaN, and Number("") is 0, so we check both.)
	const isNumeric = (value: number | string) =>
		String(value).trim() !== "" && Number.isFinite(Number(value));

	// The FIRST stratum in this list is drawn at the TOP.
	// Order: non-numeric ones (TBD) first, then numbers from high to low.
	const strata = Array.from(new Set(visibleRoles.map((r) => r.stratum))).sort((a, b) => {
		const aNumeric = isNumeric(a);
		const bNumeric = isNumeric(b);

		if (aNumeric !== bNumeric) return aNumeric ? 1 : -1; // non-numeric goes first
		if (!aNumeric) return String(a).localeCompare(String(b)); // both TBD-like: alphabetical
		return d3.descending(Number(a), Number(b));
	});

	let cursor = 0;
	const bands: StratumBand[] = strata.map((stratum) => {
		const roles = packIntoRows(visibleRoles.filter((r) => r.stratum === stratum));
		const rowCount = (d3.max(roles, (r) => r.row) ?? 0) + 1;
		const height = rowCount * (ROW_HEIGHT + ROW_GAP) - ROW_GAP + 2 * STRATUM_PADDING;

		const band: StratumBand = {
			stratum,
			roles,
			y: cursor,
			height,
			dateStart: d3.min(roles, (r) => r.dateStart),
			dateEnd: d3.max(roles, (r) => r.dateEnd),
		};
		cursor += height + BAND_GAP;
		return band;
	});

	// ---- 2. Dimensions and scales ------------------------------------------

	const width = container.clientWidth || 900;
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = cursor - BAND_GAP;
	const height = innerHeight + margin.top + margin.bottom;

	const pagedItems = msitems.filter((i) => i.leafStart !== undefined && i.leafEnd !== undefined);

	const allSegments = visibleRoles.flatMap((r) => r.segments);
	const firstLeafOverall = Math.min(
		...allSegments.map((s) => s.start),
		...pagedItems.map((i) => i.leafStart!),
	);
	// "+ 1": a segment ending on 8r covers the whole side, so its right edge
	// belongs at the START of the next side.
	const lastLeafOverall =
		Math.max(...allSegments.map((s) => s.end), ...pagedItems.map((i) => i.leafEnd!)) + 1;

	const x = d3.scaleLinear().domain([firstLeafOverall, lastLeafOverall]).range([0, innerWidth]);

	// Ticks must be whole numbers because every number stands for one side.
	const tickValues = x
		.ticks(Math.min(20, lastLeafOverall - firstLeafOverall))
		.filter(Number.isInteger);

	// ---- 3. SVG skeleton ---------------------------------------------------

	container.style.position = "relative"; // needed to position the tooltip

	const svg = d3
		.select(container)
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", `0 0 ${width} ${height}`)
		.attr("class", "overflow-visible");

	const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	// ---- 4. Stratum bands (background + labels on the left) -----------------

	const bandGroups = chart
		.append("g")
		.attr("class", "strata-bands")
		.selectAll("g")
		.data(bands)
		.join("g")
		.attr("transform", (b) => `translate(0,${b.y})`);

	bandGroups
		.append("rect")
		.attr("width", innerWidth)
		.attr("height", (b) => b.height)
		.attr("fill", (b) => getStratumColor(b.stratum))
		.attr("opacity", 0.07);

	const bandLabels = bandGroups
		.append("text")
		.attr("x", -10)
		.attr("y", (b) => b.height / 2)
		.attr("text-anchor", "end")
		.attr("fill", LABEL_COLOR)
		.attr("font-size", "12px");

	bandLabels
		.append("tspan")
		.attr("x", -10)
		.attr("dy", "-0.1em")
		.attr("font-weight", 600)
		.text((b) => `Stratum ${b.stratum}`);

	bandLabels
		.append("tspan")
		.attr("x", -10)
		.attr("dy", "1.2em")
		.attr("font-size", "10px")
		.attr("opacity", 0.7)
		.text((b) =>
			b.dateStart !== undefined && b.dateEnd !== undefined ? `${b.dateStart}–${b.dateEnd}` : "TBD",
		);

	// ---- 5. Vertical grid + x axis (labels are folios like "12v") -----------

	chart
		.append("g")
		.attr("class", "grid")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.tickValues(tickValues)
				.tickSize(-innerHeight)
				.tickFormat(() => ""),
		)
		.call((g) => g.select(".domain").remove())
		.call((g) => g.selectAll("line").attr("stroke", "#0000001a"));

	chart
		.append("g")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.tickValues(tickValues)
				.tickFormat((d) => leafLabel(d.valueOf(), romanFolioCount)),
		);

	chart
		.append("text")
		.attr("x", innerWidth / 2)
		.attr("y", innerHeight + 42)
		.attr("text-anchor", "middle")
		.attr("fill", LABEL_COLOR)
		.text("Folio");

	// ---- 6. MS item borders (vertical lines only, no fill) ------------------

	const borders = new Set<number>();
	for (const item of pagedItems) {
		borders.add(item.leafStart!);
		borders.add(item.leafEnd! + 1);
	}

	chart
		.append("g")
		.attr("class", "msitem-borders")
		.selectAll("line")
		.data([...borders])
		.join("line")
		.attr("x1", (p) => x(p))
		.attr("x2", (p) => x(p))
		.attr("y1", 0)
		.attr("y2", innerHeight)
		.attr("stroke", "black")
		.attr("stroke-width", 1)
		.attr("opacity", 0.5);

	// ---- 7. Tooltip --------------------------------------------------------

	const tooltip = d3
		.select(container)
		.append("div")
		.attr("class", "strata-tooltip")
		.style("position", "absolute")
		.style("pointer-events", "none")
		.style("opacity", "0")
		.style("z-index", "10")
		.style("max-width", "320px")
		.style("padding", "8px 10px")
		.style("font-size", "12px")
		.style("line-height", "1.4")
		.style("color", LABEL_COLOR)
		.style("background", "white")
		.style("border", "1px solid #00000033")
		.style("border-radius", "4px")
		.style("box-shadow", "0 2px 8px #00000026");

	function moveTooltip(event: MouseEvent) {
		const [px, py] = d3.pointer(event, container);
		const node = tooltip.node() as HTMLDivElement;
		const offset = 14;
		const left =
			px + offset + node.offsetWidth > container.clientWidth
				? px - offset - node.offsetWidth
				: px + offset;
		tooltip.style("left", `${Math.max(0, left)}px`).style("top", `${py + offset}px`);
	}

	// ---- 8. Hand roles: one group per role, one rect per segment ------------

	const segmentWidth = (s: LeafSegment) => Math.max(4, x(s.end + 1) - x(s.start));

	const roleGroups = chart
		.append("g")
		.attr("class", "hand-roles")
		.selectAll("g")
		.data(
			bands.flatMap((band) => band.roles.map((role) => ({ role, band }))),
			(d) => (d as { role: PlacedRole }).role.hit_id,
		)
		.join("g")
		.attr(
			"transform",
			({ role, band }) =>
				`translate(0,${band.y + STRATUM_PADDING + role.row * (ROW_HEIGHT + ROW_GAP)})`,
		)
		.style("cursor", "help");

	roleGroups.each(function (this: SVGGElement, { role }: { role: PlacedRole }) {
		const g = d3.select(this);
		const color = getStratumColor(role.stratum);
		const segs = role.segments;

		// Thin dashed line joining the segments, so they read as ONE hand role.
		if (segs.length > 1) {
			g.append("line")
				.attr("x1", x(segs[0].end + 1))
				.attr("x2", x(segs[segs.length - 1].start))
				.attr("y1", ROW_HEIGHT / 2)
				.attr("y2", ROW_HEIGHT / 2)
				.attr("stroke", color)
				.attr("stroke-width", 1.5)
				.attr("stroke-dasharray", "3 3");
		}

		g.selectAll("rect")
			.data(segs)
			.join("rect")
			.attr("x", (s) => x(s.start))
			.attr("width", segmentWidth)
			.attr("height", ROW_HEIGHT)
			.attr("rx", 3)
			.attr("fill", color)
			.attr("fill-opacity", 0.75)
			.attr("stroke", color)
			.attr("stroke-width", 1.5);

		// One label, centered on the widest segment. The white outline ("halo")
		// keeps it readable on any color.
		const widest = d3.greatest(segs, (s) => s.end - s.start) ?? segs[0];
		g.append("text")
			.attr("x", x(widest.start) + segmentWidth(widest) / 2)
			.attr("y", ROW_HEIGHT / 2)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", "11px")
			.attr("fill", LABEL_COLOR)
			.attr("paint-order", "stroke")
			.attr("stroke", "white")
			.attr("stroke-width", 3)
			.attr("stroke-linejoin", "round")
			.style("pointer-events", "none")
			.text(role.hand);
	});

	roleGroups
		.on(
			"mouseenter",
			function (this: SVGGElement, event: MouseEvent, { role }: { role: PlacedRole }) {
				d3.select(this).selectAll("rect").attr("fill-opacity", 1).attr("stroke", "black");
				tooltip.html(tooltipHtml(role)).style("opacity", "1");
				moveTooltip(event);
			},
		)
		.on("mousemove", (event: MouseEvent) => moveTooltip(event))
		.on(
			"mouseleave",
			function (this: SVGGElement, _event: MouseEvent, { role }: { role: PlacedRole }) {
				d3.select(this)
					.selectAll("rect")
					.attr("fill-opacity", 0.75)
					.attr("stroke", getStratumColor(role.stratum));
				tooltip.style("opacity", "0");
			},
		);

	// ---- 9. Footnote for roles we could not place --------------------------

	if (hiddenCount > 0) {
		chart
			.append("text")
			.attr("x", 0)
			.attr("y", innerHeight + 42)
			.attr("fill", LABEL_COLOR)
			.attr("font-size", "10px")
			.attr("opacity", 0.7)
			.text(`${hiddenCount} hand role(s) without readable folio data are not shown`);
	}
}
