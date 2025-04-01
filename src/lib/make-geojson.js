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
export function processWorkData(worksData) {
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

// geoJson data for works.json
export function processWorksData(worksData) {
	// Check if used on detail view page for single work (props object not array) or for works table page
	// If the input is not an array, wrap it in an array
	const works = Array.isArray(worksData) ? worksData : [worksData];
	// Create a map to track unique places
	const workPlaces = new Map(); // Use a Map with `place.id` as key
	works.forEach((workData) => {
		// Ensure `ms_transmission` is not empty
		workData.ms_transmission.length > 0 &&
			workData.ms_transmission?.forEach((tr) => {
				tr.orig_place?.forEach((orig_pl) => {
					orig_pl.place?.forEach((pl) => {
						// Check if coordinates are valid
						const long = parseFloat(pl.long);
						const lat = parseFloat(pl.lat);
						if (!isNaN(long) && !isNaN(lat) && pl.id) {
							// Use pl.id (unique identifier) as the map key
							if (!workPlaces.has(pl.id)) {
								workPlaces.set(pl.id, {
									type: "Feature",
									geometry: {
										type: "Point",
										coordinates: [long, lat],
									},
									properties: {
										title: workData.title || "",
										place: pl.value || "",
										description: [],
										url: `/works/${workData.hit_id}`,
										hit_id: workData.hit_id,
									},
								});
							}
							// Add manuscript values to the description
							const feature = workPlaces.get(pl.id);
							tr.manuscript?.forEach((ms) => {
								// make sure the ms.value is unique and shown only once
								if (ms.value && !feature.properties.description.includes(ms.value)) {
									feature.properties.description.push(ms.value);
								}
							});
						}
					});
				});
			});
	});

	// Convert the description array to a string for each feature
	workPlaces.forEach((feature) => {
		feature.properties.description = feature.properties.description.join(", ");
	});

	// Return the GeoJSON object
	return {
		type: "FeatureCollection",
		features: Array.from(workPlaces.values()),
	};
}

// geoJson data for single work
export function processWorkData(worksData) {
	// Check if used on detail view page for single work (props object not array) or for works table page
	// If the input is not an array, wrap it in an array
	const works = Array.isArray(worksData) ? worksData : [worksData];
	// Create a map to track unique places
	const workPlaces = new Map(); // Use a Map with `place.id` as key
	works.forEach((workData) => {
		workData.ms_transmission.length > 0 &&
			worksData.ms_transmission?.flatMap((tr) => {
				tr.orig_place.flatMap((orig_pl) => {
					orig_pl.place.map((pl) => {
						// Use pl.id (unique identifier) as the map key
						if (!workPlaces.has(pl.id)) {
							workPlaces.set(pl.id, {
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
								},
								properties: {
									title: pl.value,
									description: [],
									url: `/places/${pl.hit_id}`,
									hit_id: workData.hit_id,
								},
							});
						}
						// Add manuscript values to the description
						const feature = workPlaces.get(pl.id);
						tr.manuscript?.forEach((ms) => {
							// make ssure the ms.value is unique and shown only once
							if (!feature.properties.description.includes(ms.value)) {
								feature.properties.description.push(ms.value);
							}
						});
					});
				});
			});
	});

	// Convert the description array to a string for each feature
	workPlaces.forEach((feature) => {
		feature.properties.description = feature.properties.description.join(", ");
	});

	// Return the GeoJSON object
	return {
		type: "FeatureCollection",
		features: Array.from(workPlaces.values()),
	};
}

/* return Array.from(workPlaces.values()).map((pl) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
				},
				properties: {
					title: workData.title || "",
					place: pl.value || "",
					description:
						workData.ms_transmission.length > 0
							? `<ul>${workData.ms_transmission
									.filter((tr) =>
										tr.manuscript?.some((ms) =>
											ms.orig_place?.some((orig) => orig.place?.some((p) => p.id === pl.id)),
										),
									)
									.map((tr) => `<li>${tr.manuscript[0].value}</li>`)}</ul>`
							: "N/A",
					url: `/works/${workData.hit_id}`,
					hit_id: workData.hit_id,
				},
			}));
		}),
	};
} */

// geoJson data for scribes.json
export function processScribesData(input) {
	const scribesData = Array.isArray(input) ? input : [input];

	return {
		type: "FeatureCollection",
		features: scribesData.flatMap((scribeData) => {
			const scribePlaces = new Map(); // Use a Map with `place.id` as key

			scribeData.places.forEach((placement) => {
				placement?.place?.forEach((pl) => {
					if (!scribePlaces.has(pl.id)) {
						scribePlaces.set(pl.id, pl);
					}
				});
			});

			return Array.from(scribePlaces.values()).map((pl) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
				},
				properties: {
					title: scribeData.name || "",
					place: pl.value || "",
					description:
						scribeData.hands?.length > 0
							? `<ul>${scribeData.hands.map((hand) => `<li>${hand.label}</li>`).join("")}</ul>`
							: "N/A",
					url: `/scribes/${scribeData.hit_id}`,
					hit_id: scribeData.hit_id,
				},
			}));
		}),
	};
}

// geoJson data for manuscripts.json

export function processMSData(input) {
	// Check if used on detail view page for single ms (data not an array) or for mss table page
	// If the input is not an array, wrap it in an array
	const manuscripts = Array.isArray(input) ? input : [input];

	return {
		type: "FeatureCollection",
		features: manuscripts
			.flatMap((mssData) => [
				// Library Place Features
				...(mssData.library_place?.flatMap((placement) =>
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
				) || []),
				// Origin Place Cod Units Features
				...(mssData.cod_units?.flatMap((unit) =>
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
									description: `${mssData.cod_units.length > 1 ? unit.value : ""} 
                                             ${prov.type === "orig" ? "~> Entstehungsort" : "~> Provenienz"}`,
									period: formatPeriod(prov), // Calls a helper function for cleaner logic
									provenanceType: prov.type || "N/A", // Handles undefined types
								},
							})),
					),
				) || []),
			])
			.filter((f) => f.geometry.coordinates.every((coord) => !isNaN(coord))), // Filter out invalid coordinates
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
