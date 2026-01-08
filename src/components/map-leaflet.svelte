<script>
	import { onMount, onDestroy } from "svelte";
	import L from "leaflet";
	import "leaflet.markercluster";
	import "leaflet.markercluster/dist/MarkerCluster.css";
	import "leaflet.markercluster/dist/MarkerCluster.Default.css";
	import "leaflet/dist/leaflet.css";

	import { withBasePath } from "@/lib/withBasePath";

	export let geoJsonData;
	export let className = "w-full h-64 md:h-96 border rounded z-10";
	export let initialView = [50, 10];
	export let initialZoom = 3;
	export let markerColor = "#B42222"; // kept for API compatibility

	let mapEl;
	let map;
	let originLayer;
	let provenanceLayer;

	// Icons
	const pinGreen = new URL("@/icons/map-pin-green.png", import.meta.url).toString();
	const pinRed = new URL("@/icons/map-pin-red.png", import.meta.url).toString();
	const pin = new URL("@/icons/map-pin.png", import.meta.url).toString();

	const originIcon = L.icon({
		iconUrl: pinRed,
		iconSize: [25, 25],
		iconAnchor: [12, 41],
		popupAnchor: [0, -41],
	});

	const provenanceIcon = L.icon({
		iconUrl: pinGreen,
		iconSize: [25, 25],
		iconAnchor: [12, 41],
		popupAnchor: [0, -41],
	});

	const customIcon = L.icon({
		iconUrl: pin,
		iconSize: [25, 25],
		iconAnchor: [12, 41],
		popupAnchor: [0, -41],
	});

	L.Marker.prototype.options.icon = customIcon;

	function updateMapMarkers(dataToShow) {
		if (!map || !originLayer || !provenanceLayer) return;

		originLayer.clearLayers();
		provenanceLayer.clearLayers();

		dataToShow?.features?.forEach((feature) => {
			const { geometry, properties } = feature;
			if (
				geometry?.type === "Point" &&
				geometry.coordinates?.length === 2 &&
				!isNaN(geometry.coordinates[0]) &&
				!isNaN(geometry.coordinates[1])
			) {
				const type = properties?.type || "origin";

				const marker = L.marker(
					[geometry.coordinates[1], geometry.coordinates[0]],
					{ icon: type === "origin" ? originIcon : provenanceIcon }
				);

				if (properties) {
					const url = withBasePath(properties.url || "");
					const popupContent = `
						<div class="map-popup">
							<h3>
								<a href="${url}" class="font-semibold text-base underline decoration-dotted underline-offset-2">
									${properties.title || ""}
									${properties.locus ? `(fols. ${properties.locus})` : ""}
								</a>
							</h3>
							<p>
								${properties.description ? `${properties.description}<br/>` : ""}
								${properties.place || ""}<br/>
								${properties.period || ""}
							</p>
						</div>
					`;
					marker.bindPopup(popupContent);
				}

				if (type === "origin") {
					originLayer.addLayer(marker);
				} else {
					provenanceLayer.addLayer(marker);
				}
			}
		});

		// Fit bounds
		const coords = dataToShow?.features
			?.filter((f) => f.geometry?.type === "Point")
			?.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);

		if (coords?.length) {
			try {
				map.fitBounds(L.latLngBounds(coords), {
					padding: [50, 50],
					maxZoom: 10,
				});
			} catch (e) {
				console.warn("Could not fit bounds:", e);
			}
		}
	}

	onMount(() => {
		map = L.map(mapEl).setView(initialView, initialZoom);

		L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
			attribution:
				'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19,
		}).addTo(map);

		originLayer = L.markerClusterGroup({
			spiderfyOnMaxZoom: true,
			showCoverageOnHover: false,
			zoomToBoundsOnClick: true,
			maxClusterRadius: 50,
			iconCreateFunction: (cluster) => {
				const count = cluster.getChildCount();
				return L.divIcon({
					html: `<div class="bg-brand-800 opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center">${count}</div>`,
					className: "custom-cluster-icon-origin",
					iconSize: [30, 30],
				});
			},
		});

		provenanceLayer = L.markerClusterGroup({
			spiderfyOnMaxZoom: true,
			showCoverageOnHover: false,
			zoomToBoundsOnClick: true,
			maxClusterRadius: 50,
			iconCreateFunction: (cluster) => {
				const count = cluster.getChildCount();
				return L.divIcon({
					html: `<div class="bg-accent-sage-900 opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center">${count}</div>`,
					className: "custom-cluster-icon-provenance",
					iconSize: [30, 30],
				});
			},
		});

		map.addLayer(originLayer);
		map.addLayer(provenanceLayer);

		// Layer control
		const hasOrigin = geoJsonData?.features?.some(f => f.properties?.type === "origin");
		const hasProv = geoJsonData?.features?.some(f => f.properties?.type === "provenance");

		if (hasOrigin && hasProv) {
			L.control.layers(
				{},
				{
					Entstehungsort: originLayer,
					Provenienz: provenanceLayer,
				},
				{ collapsed: false }
			).addTo(map);
		}

		updateMapMarkers(geoJsonData);

		// Expose global update hook (used by Tabulator)
		window.updateMapWithFilteredIds = (filteredIds) => {
			const filtered = {
				type: "FeatureCollection",
				features: geoJsonData.features.filter(
					f => filteredIds.includes(f.properties?.hit_id)
				),
			};
			updateMapMarkers(filtered);
		};
	});

	onDestroy(() => {
		delete window.updateMapWithFilteredIds;
		map?.remove();
		map = null;
	});
</script>

<div bind:this={mapEl} class={className} id="leaflet-map" ></div>
