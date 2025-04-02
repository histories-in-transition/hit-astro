import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import { withBasePath } from "@/lib/withBasePath";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
	iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
	iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
	shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

export default function LeafletMap({
	geoJsonData,
	className = "w-full h-64 md:h-96 border rounded z-10",
	initialView = [50, 10],
	initialZoom = 3,
	markerColor = "#B42222",
}) {
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markersRef = useRef(null);

	// Create a method that can be called from outside to update the map
	useEffect(() => {
		// Make the updateMap function available globally to be called in tabulator by table.on filter
		window.updateMapWithFilteredIds = (filteredIds) => {
			if (!geoJsonData || !geoJsonData.features) return;

			console.log(geoJsonData);
			// Filter the geoJsonData to only include features with matching hit_ids
			const filteredGeoJson = {
				type: "FeatureCollection",
				features: geoJsonData.features.filter(
					(feature) => feature.properties && filteredIds.includes(feature.properties.hit_id),
				),
			};

			updateMapMarkers(filteredGeoJson);
			console.log(filteredGeoJson);
		};

		return () => {
			// Clean up the global function when component unmounts
			delete window.updateMapWithFilteredIds;
		};
	}, [geoJsonData]);

	// Function to update markers on the map
	const updateMapMarkers = (dataToShow) => {
		const map = mapInstanceRef.current;
		if (!map) return;

		// Remove existing markers cluster group if it exists
		if (markersRef.current) {
			map.removeLayer(markersRef.current);
		}

		// Create new marker cluster group
		const markers = L.markerClusterGroup();
		markersRef.current = markers;

		// Add markers for filtered data
		dataToShow.features.forEach((feature) => {
			const { geometry, properties } = feature;

			if (
				geometry &&
				geometry.type === "Point" &&
				geometry.coordinates.length === 2 &&
				!isNaN(geometry.coordinates[0]) &&
				!isNaN(geometry.coordinates[1])
			) {
				const marker = L.marker([geometry.coordinates[1], geometry.coordinates[0]]);

				if (properties) {
					const url = withBasePath(properties.url || "");
					const popupContent = `
                        <div class="map-popup">
                            <h3><a href=${url} class="font-semibold text-base underline decoration-dotted underline-offset-2">${properties.title || ""}</a><br/>${properties.place || ""}</h3>
                            <p>${properties.description || "No additional information"}</p>
                            ${properties.period ? `<p class="text-sm italic">${properties.period}</p>` : ""}
                        </div>
                    `;
					marker.bindPopup(popupContent);
				}
				markers.addLayer(marker);
			}
		});

		// Add markers to map
		map.addLayer(markers);

		// Fit bounds if there are features
		if (dataToShow.features.length > 0) {
			try {
				const coordinates = dataToShow.features
					.filter((f) => f.geometry && f.geometry.type === "Point")
					.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);

				if (coordinates.length > 0) {
					const bounds = L.latLngBounds(coordinates);
					map.fitBounds(bounds, {
						padding: [50, 50],
						maxZoom: 10,
					});
				}
			} catch (error) {
				console.warn("Could not fit bounds:", error);
			}
		}
	};

	useEffect(() => {
		// Initialize map if it doesn't exist yet
		if (!mapInstanceRef.current && mapRef.current) {
			const map = L.map(mapRef.current).setView(initialView, initialZoom);

			// Add OpenStreetMap tiles
			L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
				attribution:
					'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				maxZoom: 19,
			}).addTo(map);

			// Store map instance for cleanup
			mapInstanceRef.current = map;
		}

		// Initial load of all data
		updateMapMarkers(geoJsonData);

		// Cleanup function
		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}

			if (markersRef.current) {
				markersRef.current = null;
			}
		};
	}, [geoJsonData, initialView, initialZoom, markerColor]);

	return <div ref={mapRef} className={className} id="leaflet-map"></div>;
}
