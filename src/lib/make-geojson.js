import { codeFrame } from "node_modules/astro/dist/core/errors";

// script to process hands.json to GeoJSON
export function processHandsData(handsData) {
	return {
		type: "FeatureCollection",
		features: handsData.placed.flatMap((placement) =>
			placement.place.map((pl) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
				},
				properties: {
					title: pl.value,
					description: `Quelle: ${placement.authority[0]?.citation || "N/A"}`,
				},
			})),
		),
	};
}

// geoJson data for works.json
export function processWorksData(worksData) {
	// Create a map to track unique places
	const uniquePlaces = new Map();

	// Iterate through ms_transmission to collect unique places
	worksData.ms_transmission.forEach((tr) => {
		tr.orig_place.forEach((orig_pl) => {
			orig_pl.place.forEach((place) => {
				// Use place.id (or another unique identifier) as the map key
				if (!uniquePlaces.has(place.id)) {
					uniquePlaces.set(place.id, {
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [parseFloat(place.long), parseFloat(place.lat)],
						},
						properties: {
							title: place.value,
							description: `HS: ${tr.manuscript?.map((ms) => ms.value).join(", ") || "N/A"}`,
						},
					});
				}
			});
		});
	});

	return {
		type: "FeatureCollection",
		features: Array.from(uniquePlaces.values()), // Extract unique features
	};
}

// geoJson data for scribes.json
export function processScribesData(scribesData) {
	return {
		type: "FeatureCollection",
		features: scribesData.places.flatMap((placement) =>
			placement.place.flatMap((pl) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
				},
				properties: {
					title: pl.value,
					description: `Quelle: ${placement.authority.map((aut) => aut.citation) || "N/A"}`,
				},
			})),
		),
	};
}

// geoJson data for manuscripts.json
export function processMSSData(mssData) {
	return {
		type: "FeatureCollection",
		features: [
			// Library Place Features
			...mssData.library_place.flatMap((placement) =>
				placement.place.map((pl) => ({
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
					},
					properties: {
						title: pl.value,
						description: `Aktueller Standort`,
					},
				})),
			),
			/* 	// Origin Place Features
			...mssData.orig_place.flatMap((pl) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
				},
				properties: {
					title: pl.value,
					description: `Entstehungsort`,
				},
			})), */
			// Origin Place Cod unitsFeatures
			...mssData.cod_units.flatMap((unit) =>
				unit.prov_place.flatMap((prov) =>
					prov.place
						.filter((pl) => pl.lat && pl.long) // Filter out invalid coordinates
						.map((pl) => ({
							type: "Feature",
							geometry: {
								type: "Point",
								coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
							},
							properties: {
								title: pl.value,
								description: `${mssData.cod_units.length > 1 ? `Kod. Einheit ${unit.number}` : ""} 
                             				${prov.type === "orig" ? "~> Entstehungsort" : "~> Provenienz"}`,
								period: formatPeriod(prov), // Calls a helper function for cleaner logic
								provenanceType: prov.type || "N/A", // Handles undefined types
							},
						})),
				),
			),
		].filter((f) => f.geometry.coordinates.every((coord) => !isNaN(coord))), // Filter out invalid coordinates
	};
}
// helpers function
function formatPeriod(prov) {
	const fromDate = prov.from?.[0]?.value || "N/A";
	const tillDate = prov.till?.[0]?.value || "N/A";

	const fromUncertain = prov.uncertain_from ? " (?)" : "";
	const tillUncertain = prov.uncertain_till ? " (?)" : "";

	if (fromDate === "N/A" && tillDate === "N/A") {
		return "Zeitraum unbekannt";
	}

	return `Von: ${fromDate}${fromUncertain} bis ${tillDate}${tillUncertain}`;
}
