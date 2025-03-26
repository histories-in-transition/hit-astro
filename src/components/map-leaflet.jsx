import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";

export default function LeafletMap({
	geoJsonData,
	className = "w-full h-64 md:h-96 border rounded z-10",
	initialView = [50, 10],
	initialZoom = 3,
	markerColor = "#B42222",
}) {
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);

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

		const map = mapInstanceRef.current;
		if (!map) return;

		// Clear any existing markers on map update
		map.eachLayer((layer) => {
			if (layer instanceof L.Marker || layer instanceof L.LayerGroup) {
				map.removeLayer(layer);
			}
		});

		// Validate GeoJSON data
		if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
			console.warn("No valid GeoJSON data provided.");
			return;
		}

		// Create marker cluster group
		const markers = L.markerClusterGroup();

		// Add markers
		geoJsonData.features.forEach((feature) => {
			const { geometry, properties } = feature;

			// Ensure it's a point feature with valid coordinates
			if (
				geometry &&
				geometry.type === "Point" &&
				geometry.coordinates.length === 2 &&
				!isNaN(geometry.coordinates[0]) &&
				!isNaN(geometry.coordinates[1])
			) {
				const marker = L.marker([geometry.coordinates[1], geometry.coordinates[0]]); // Default Leaflet marker

				// Add popup if properties exist
				if (properties) {
					const popupContent = `
            <div class="map-popup">
              <h3 class="font-semibold text-base">${properties.title || "Unnamed Location"}</h3>
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
		if (geoJsonData.features.length > 0) {
			try {
				const coordinates = geoJsonData.features
					.filter((f) => f.geometry.type === "Point")
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

		// Cleanup function
		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, [geoJsonData, initialView, initialZoom, markerColor]);

	return <div ref={mapRef} className={className}></div>;
}
