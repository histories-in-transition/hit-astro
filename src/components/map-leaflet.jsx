import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function LeafletMap({ geoJsonData }) {
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);

	useEffect(() => {
		// Initialize map if it doesn't exist yet
		if (!mapInstanceRef.current) {
			// Create map instance
			const map = L.map(mapRef.current).setView([50, 10], 3);

			// Add OpenStreetMap tiles
			L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
				attribution:
					'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</a>',
				maxZoom: 19,
			}).addTo(map);

			// Store map instance for cleanup
			mapInstanceRef.current = map;
		}

		const map = mapInstanceRef.current;

		// Clear any existing markers on map update
		map.eachLayer((layer) => {
			if (layer instanceof L.Marker) {
				map.removeLayer(layer);
			}
		});

		// Ensure geoJsonData is valid
		if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
			console.warn("No valid GeoJSON data provided.");
			return; // Avoid errors when data is empty
		}

		// Create a GeoJSON layer
		const geoJsonLayer = L.geoJSON(geoJsonData, {
			pointToLayer: (feature, latlng) => {
				return L.circleMarker(latlng, {
					radius: 6,
					fillColor: "#B42222",
					color: "#000",
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8,
				});
			},
			onEachFeature: (feature, layer) => {
				const { title, description } = feature.properties;
				layer.bindPopup(`<h3>${title}</h3><p>${description}</p>`);
			},
		}).addTo(map);

		// Create a bounds object if we have features
		if (geoJsonData.features.length > 0) {
			// Check if the GeoJSON layer has valid bounds
			const bounds = geoJsonLayer.getBounds();
			if (bounds.isValid()) {
				map.fitBounds(bounds, {
					padding: [50, 50],
					maxZoom: 10,
				});
			} else {
				console.warn("GeoJSON layer has no valid bounds.");
			}
		}

		// Cleanup function
		return () => {
			// Only remove the map when component unmounts completely
			if (mapInstanceRef.current && !mapRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, [geoJsonData]); // Re-run effect when data changes

	return <div id="map" ref={mapRef} className="w-full h-64 md:h-96 border rounded z-10"></div>;
}
