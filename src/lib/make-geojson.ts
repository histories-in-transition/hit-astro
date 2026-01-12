import type { Manuscript, Place } from "@/types/index.ts";

interface GeoJSONFeature {
	type: "Feature";
	geometry: {
		type: "Point";
		coordinates: [number, number];
	};
	properties: Record<string, unknown>;
}

interface FeatureCollection {
	type: "FeatureCollection";
	features: GeoJSONFeature[];
}

import type { Hand } from "@/types";

export function processHandsData(handsData: Hand): FeatureCollection {
	const features: GeoJSONFeature[] = [];

	for (const placement of handsData.placed ?? []) {
		for (const pl of placement.place ?? []) {
			const feature = createPointFeature(pl, {
				title: pl.value,
				description: `Quelle: ${placement.authority?.[0]?.citation ?? "N/A"}`,
			});

			if (feature) features.push(feature);
		}
	}

	return {
		type: "FeatureCollection",
		features,
	};
}

import type { Work } from "@/types";
export function processWorkData(worksData: Work | Work[]): FeatureCollection {
	const works = Array.isArray(worksData) ? worksData : [worksData];
	const features: GeoJSONFeature[] = [];

	for (const work of works) {
		for (const tr of work.ms_transmission ?? []) {
			const uniquePlaces = new Set<number>();

			for (const orig of tr.orig_place ?? []) {
				for (const pl of orig.place ?? []) {
					if (uniquePlaces.has(pl.id)) continue;
					uniquePlaces.add(pl.id);

					const feature = createPointFeature(pl, {
						title: `HS: ${tr.manuscript?.[0]?.value ?? "N/A"}`,
						place: `Entstehungsort: ${pl.value ?? ""}`,
						locus: tr.locus,
						description: tr.version?.length
							? `Version: ${tr.version.map((v) => v.value).join(", ")}`
							: undefined,
						period: tr.orig_date?.[0]?.date?.[0]?.value,
						url: `/msitems/${tr.hit_id}`,
						hit_id: tr.hit_id,
						type: "origin",
					});

					if (feature) features.push(feature);
				}
			}
		}
	}

	return {
		type: "FeatureCollection",
		features,
	};
}

export function processWorksData(worksData: Work | Work[]): FeatureCollection {
	const works = Array.isArray(worksData) ? worksData : [worksData];
	const features: GeoJSONFeature[] = [];

	for (const work of works) {
		for (const tr of work.ms_transmission ?? []) {
			const uniqueOriginPlaces = new Set<number>();
			const uniqueProvenancePlaces = new Set<number>();

			/* -------- Origin places -------- */
			for (const orig of tr.orig_place ?? []) {
				for (const pl of orig.place ?? []) {
					if (uniqueOriginPlaces.has(pl.id)) continue;
					uniqueOriginPlaces.add(pl.id);

					const feature = createPointFeature(pl, {
						title: work.title ?? "N/A",
						place: `Entstehungsort: ${pl.value ?? ""}`,
						description: `HS: ${tr.manuscript?.[0]?.value ?? "N/A"}`,
						period: tr.orig_date?.[0]?.date?.[0]?.value,
						url: `/works/${work.hit_id}`,
						hit_id: work.hit_id,
						ms_hit_id: tr.hit_id,
						type: "origin",
					});

					if (feature) features.push(feature);
				}
			}

			/* -------- Provenance places -------- */
			for (const placement of tr.provenance ?? []) {
				for (const pl of placement.places ?? []) {
					if (uniqueProvenancePlaces.has(pl.id)) continue;
					uniqueProvenancePlaces.add(pl.id);

					const feature = createPointFeature(pl, {
						title: work.title ?? "N/A",
						place: `Provenienz: ${pl.value ?? "N/A"}`,
						description: `HS: ${tr.manuscript?.[0]?.value ?? "N/A"}`,
						url: `/works/${work.hit_id}`,
						hit_id: work.hit_id,
						type: "provenance",
					});

					if (feature) features.push(feature);
				}
			}
		}
	}

	return {
		type: "FeatureCollection",
		features,
	};
}

export function processMSData(input: Manuscript | Manuscript[]): FeatureCollection {
	const manuscripts = Array.isArray(input) ? input : [input];

	const features: GeoJSONFeature[] = manuscripts.flatMap((mssData) => {
		const result: GeoJSONFeature[] = [];

		const codUnits = mssData.cod_units ?? [];

		// Check if ANY cod_unit has provenance data
		const hasCodUnitProvenance = codUnits.some(
			(unit) => unit.prov_place && unit.prov_place.length > 0,
		);

		/* ----------------------------------
		 * Library place (always included)
		 * ---------------------------------- */
		const library = mssData.library?.[0];
		if (library?.place) {
			for (const pl of library.place) {
				const feature = createPointFeature(pl, {
					title: mssData.shelfmark,
					description: `Aktueller Standort: ${pl.value}, ${library.library_full ?? "N/A"}`,
					type: "currentLocation",
					url: `/places/${pl.hit_id}`,
					hit_id: mssData.hit_id,
					place_hit_id: pl.hit_id,
				});

				if (feature) result.push(feature);
			}
		}

		/* -------------------------------------------------
		 * Cod-unit provenance (preferred if present)
		 * ------------------------------------------------- */
		if (hasCodUnitProvenance) {
			for (const unit of codUnits) {
				for (const prov of unit.prov_place) {
					for (const pl of prov.places ?? []) {
						const feature = createPointFeature(pl, {
							title: codUnits.length > 1 ? unit.value : mssData.shelfmark,
							url: `/manuscripts/${mssData.hit_id}`,
							description: `${pl.value} ${
								prov.type === "orig" ? "~> Entstehungsort" : "~> Provenienz"
							}`,
							period: formatPeriod(prov),
							provenanceType: prov.type ?? "N/A",
							type: prov.type === "orig" ? "origin" : "provenance",
							hit_id: mssData.hit_id,
							place_hit_id: pl.hit_id,
						});

						if (feature) result.push(feature);
					}
				}
			}
		}

		/* -------------------------------------------------
		 * Fallback: manuscript-level places
		 *     ONLY if cod_units.prov_place is empty
		 * ------------------------------------------------- */
		if (!hasCodUnitProvenance) {
			// Origin place
			for (const pl of mssData.orig_place ?? []) {
				const feature = createPointFeature(pl, {
					title: mssData.shelfmark,
					description: `${pl.value} ~> Entstehungsort`,
					type: "origin",
					url: `/manuscripts/${mssData.hit_id}`,
					hit_id: mssData.hit_id,
					place_hit_id: pl.hit_id,
				});

				if (feature) result.push(feature);
			}

			// Provenance places
			for (const placement of mssData.provenance ?? []) {
				for (const pl of placement.place ?? []) {
					const feature = createPointFeature(pl, {
						title: mssData.shelfmark,
						description: `${pl.value} ~> Provenienz`,
						type: "provenance",
						url: `/manuscripts/${mssData.hit_id}`,
						hit_id: mssData.hit_id,
						place_hit_id: pl.hit_id,
					});

					if (feature) result.push(feature);
				}
			}
		}

		return result;
	});

	return {
		type: "FeatureCollection",
		features,
	};
}

import type { MsItem } from "@/types";

export function processMsItemsData(msItemsData: MsItem | MsItem[]): FeatureCollection {
	const msItems = Array.isArray(msItemsData) ? msItemsData : [msItemsData];

	const features: GeoJSONFeature[] = [];

	for (const msItem of msItems) {
		const uniqueOriginPlaces = new Set<number>();
		const uniqueProvenancePlaces = new Set<number>();

		/* -------------------------
		 * Origin places
		 * ------------------------- */
		for (const placement of msItem.orig_place ?? []) {
			for (const pl of placement.place ?? []) {
				if (uniqueOriginPlaces.has(pl.id)) continue;
				uniqueOriginPlaces.add(pl.id);

				const feature = createPointFeature(pl, {
					title: msItem.title_work?.[0]?.title ?? "N/A",
					place: `Entstehungsort: ${pl.value ?? ""}`,
					period: msItem.orig_date?.[0]?.date?.[0]?.value,
					description: `HS: ${msItem.view_label ?? "N/A"}`,
					url: `/works/${msItem.title_work?.[0]?.hit_id}`,
					hit_id: msItem.hit_id,
					type: "origin",
				});

				if (feature) features.push(feature);
			}
		}

		/* -------------------------
		 * Provenance places
		 * ------------------------- */
		for (const placement of msItem.provenance ?? []) {
			for (const pl of placement.places ?? []) {
				if (uniqueProvenancePlaces.has(pl.id)) continue;
				uniqueProvenancePlaces.add(pl.id);

				const feature = createPointFeature(pl, {
					title: msItem.title_work?.[0]?.title ?? "N/A",
					place: `Provenienz: ${pl.value ?? ""}`,
					period: formatPeriod(placement),
					description: `HS: ${msItem.view_label ?? "N/A"}`,
					url: `/works/${msItem.title_work?.[0]?.hit_id}`,
					hit_id: msItem.hit_id,
					type: "provenance",
				});

				if (feature) features.push(feature);
			}
		}
	}

	return {
		type: "FeatureCollection",
		features,
	};
}

import type { Scribe } from "@/types";

export function processScribesData(input: Scribe | Scribe[]): FeatureCollection {
	const scribes = Array.isArray(input) ? input : [input];
	const features: GeoJSONFeature[] = [];

	for (const scribe of scribes) {
		const uniquePlaces = new Map<number, any>();

		for (const placement of scribe.places ?? []) {
			for (const pl of placement.place ?? []) {
				if (!uniquePlaces.has(pl.id)) {
					uniquePlaces.set(pl.id, pl);
				}
			}
		}

		for (const pl of uniquePlaces.values()) {
			const feature = createPointFeature(pl, {
				title: scribe.name ?? "",
				place: pl.value ?? "",
				description: scribe.hands?.length
					? `<ul>${scribe.hands.map((hand) => `<li>${hand.label}</li>`).join("")}</ul>`
					: "N/A",
				url: `/scribes/${scribe.hit_id}`,
				hit_id: scribe.hit_id,
			});

			if (feature) features.push(feature);
		}
	}

	return {
		type: "FeatureCollection",
		features,
	};
}

function createPointFeature(
	pl: { lat?: string | null; long?: string | null },
	properties: GeoJSONFeature["properties"],
): GeoJSONFeature | null {
	if (!pl.lat || !pl.long) return null;

	const lat = Number(pl.lat);
	const lon = Number(pl.long);

	if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

	return {
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [lon, lat],
		},
		properties,
	};
}

// helpers function
function formatPeriod(prov) {
	const fromDate = prov.from?.[0]?.value || "";
	const tillDate = prov.till?.[0]?.value || "";

	const fromUncertain = prov.uncertain_from ? " (?)" : "";
	const tillUncertain = prov.uncertain_till ? " (?)" : "";

	if (fromDate === "N/A" && tillDate === "N/A") {
		return "Zeitraum unbekannt";
	}

	return `${fromDate ? `Von ${fromDate}` : ""} ${fromUncertain} ${tillDate ? `bis ${tillDate}` : ""} ${tillUncertain}`;
}
