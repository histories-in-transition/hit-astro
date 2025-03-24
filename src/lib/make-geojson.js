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
	return {
		type: "FeatureCollection",
		features: worksData.ms_transmission.flatMap((tr) =>
			tr.orig_place.flatMap((orig_pl) =>
				orig_pl.place.map((place) => ({
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: [parseFloat(place.long), parseFloat(place.lat)],
					},
					properties: {
						title: place.value,
						description: `HS: ${tr.manuscript?.map((ms) => ms.value) || "N/A"}`,
					},
				})),
			),
		),
	};
}

// geoJson data for works.json
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
			// Origin Place Features
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
			})),
			// Origin Place Cod unitsFeatures
			...mssData.cod_units.flatMap((unit) =>
				unit.prov_place.flatMap((prov) =>
					prov.place.map((pl) => ({
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
						},
						properties: {
							title: pl.value,
							description: `Entstehungsort ${unit.value}`,
						},
					})),
				),
			),
		].filter((f) => f.geometry.coordinates.every((coord) => !isNaN(coord))), // Filter out invalid coordinates
	};
}
