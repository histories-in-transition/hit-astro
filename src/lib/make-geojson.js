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
	// Check if used on detail view page for single work (props object not array) or for works table page
	// If the input is not an array, wrap it in an array
	const works = Array.isArray(worksData) ? worksData : [worksData];

	// Create array to store all features
	const features = [];

	works.forEach((workData) => {
		workData.ms_transmission.forEach((tr) => {
			// For each transmission, create a new Set of unique places
			const uniquePlaces = new Set();
			const uniqueProvenances = new Set();
			// Process each origin place
			tr.orig_place?.forEach((orig_pl) => {
				orig_pl.place?.forEach((pl) => {
					if (!uniquePlaces.has(pl.id)) {
						uniquePlaces.add(pl.id);
						// Check if coordinates are valid
						const long = parseFloat(pl.long);
						const lat = parseFloat(pl.lat);

						if (!isNaN(long) && !isNaN(lat)) {
							// Create new feature and push to features array
							features.push({
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [long, lat],
								},
								properties: {
									title: workData.title || "N/A",
									place: `Entstehungsort: ${pl.value || ""}`,
									description: `HS: ${tr.manuscript[0]?.value || "N/A"}`,
									period: tr.orig_date[0]?.date[0]?.value,
									url: `/works/${workData.hit_id}`,
									hit_id: workData.hit_id,
									ms_hit_id: tr.hit_id,
									type: "origin",
								},
							});
						}
					}
				});
			});
			tr.provenance.length > 0 &&
				tr.provenance.forEach((pl) => {
					if (!uniqueProvenances.has(pl.id)) {
						uniqueProvenances.add(pl.id);
						// Check if coordinates are valid
						const long = parseFloat(pl.long);
						const lat = parseFloat(pl.lat);

						if (!isNaN(long) && !isNaN(lat)) {
							// Create new feature and push to features array
							features.push({
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [long, lat],
								},
								properties: {
									title: workData.title || "N/A",
									place: `Provenienz: ${pl.value || "N/A"}`,
									description: `HS: ${tr.manuscript[0]?.value || "N/A"}`,
									url: `/works/${workData.hit_id}`,
									hit_id: workData.hit_id,
									type: "provenance",
								},
							});
						}
					}
				});
		});

		// Process each provenance entry
	});

	// Return the GeoJSON object with all collected features
	return {
		type: "FeatureCollection",
		features: features,
	};
}
// geoJson for single work detail page
export function processWorkData(worksData) {
	// Check if used on detail view page for single work (props object not array) or for works table page
	// If the input is not an array, wrap it in an array
	const works = Array.isArray(worksData) ? worksData : [worksData];

	// Create array to store all features
	const features = [];

	works.forEach((workData) => {
		workData.ms_transmission.forEach((tr) => {
			// For each transmission, create a new Set of unique places
			const uniquePlaces = new Set();
			const uniqueProvenances = new Set();
			// Process each origin place
			tr.orig_place?.forEach((orig_pl) => {
				orig_pl.place?.forEach((pl) => {
					if (!uniquePlaces.has(pl.id)) {
						uniquePlaces.add(pl.id);
						// Check if coordinates are valid
						const long = parseFloat(pl.long);
						const lat = parseFloat(pl.lat);

						if (!isNaN(long) && !isNaN(lat)) {
							// Create new feature and push to features array
							features.push({
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [long, lat],
								},
								properties: {
									title: `HS: ${tr.manuscript[0]?.value || "N/A"}`,
									place: `Entstehungsort: ${pl.value || ""}`,
									locus: tr.locus,
									description:
										tr.version.length > 0 &&
										`Version: ${tr.version.map((v) => v.value).join(", ")}`,
									period: tr.orig_date[0]?.date[0]?.value,
									url: `/msitems/${tr.hit_id}`,
									hit_id: tr.hit_id,
									type: "origin",
								},
							});
						}
					}
				});
			});
			/* tr.provenance.length > 0 &&
				tr.provenance.forEach((pl) => {
					if (!uniqueProvenances.has(pl.id)) {
						uniqueProvenances.add(pl.id);
						// Check if coordinates are valid
						const long = parseFloat(pl.long);
						const lat = parseFloat(pl.lat);

						if (!isNaN(long) && !isNaN(lat)) {
							// Create new feature and push to features array
							features.push({
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [long, lat],
								},
								properties: {
									title: workData.title || "N/A",
									place: `Provenienz: ${pl.value || "N/A"}`,
									description: `HS: ${tr.manuscript[0]?.value || "N/A"}`,
									url: `/works/${workData.hit_id}`,
									hit_id: workData.hit_id,
									ms_hit_id: tr.hit_id,
									type: "provenance",
								},
							});
						}
					}
				}); */
		});

		// Process each provenance entry
	});

	// Return the GeoJSON object with all collected features
	return {
		type: "FeatureCollection",
		features: features,
	};
}

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
							type: "provenance",
							url: `/places/${pl.hit_id}`,
						},
					})),
				) || []),
				// Origin Place Cod Units Features
				...(mssData.cod_units?.flatMap((unit) =>
					unit.prov_place.flatMap((prov) =>
						prov.places
							.filter((pl) => pl.lat && pl.long) // Filter out invalid coordinates
							.map((pl) => ({
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
								},
								properties: {
									title: pl.value,

									url: `/places/${pl.hit_id}`,
									description: `${mssData.cod_units.length > 1 ? unit.value : ""} 
                                             ${prov.type === "orig" ? "~> Entstehungsort" : "~> Provenienz"}`,
									period: formatPeriod(prov), // Calls a helper function for cleaner logic
									provenanceType: prov.type || "N/A", // Handles undefined types
									type: `${prov.type === "orig" ? "origin" : "provenance"}`,
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
