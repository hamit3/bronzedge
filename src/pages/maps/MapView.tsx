import React, { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { getDeviceMarkerIcon } from "./utils";
import { MapLoadingSkeleton } from "./MapLoadingSkeleton";

const containerStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: "#1a2b3e",
};

const LIBRARIES: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"];

const MAP_OPTIONS: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: false,
    fullscreenControl: true,
    backgroundColor: "#1a2b3e", // Critical: prevents white flash while tiles load
    minZoom: 3, // Roughly one world view
    styles: [
        { elementType: "geometry", stylers: [{ color: "#1a2b3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a2b3e" }] },
        { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#374151" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3e50" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3d4e60" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#4b5563" }] },
        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#111827" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
    ],
};

interface Device {
    id: string;
    name: string;
    device_id: string;
    is_active: boolean;
}

interface MapViewProps {
    devices: Device[];
    deviceLocations: Record<string, { lat: number; lng: number } | null>;
    onMarkerClick: (device: Device) => void;
    center: { lat: number; lng: number };
    zoom: number;
    apiKey: string;
}

export const MapView: React.FC<MapViewProps> = ({
    devices,
    deviceLocations,
    onMarkerClick,
    center,
    zoom,
    apiKey,
}) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: apiKey,
        libraries: LIBRARIES,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((m: google.maps.Map) => {
        setMap(m);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const safeCenter = React.useMemo(() =>
        center && !isNaN(center.lat) && !isNaN(center.lng) ? center : { lat: 39.9, lng: 32.8 }
        , [center]);

    return (
        <div style={{ width: "100%", height: "100%", backgroundColor: "transparent", position: "relative" }}>
            {/* 
                Always render the skeleton initially. 
                When isLoaded is false, it's the only thing visible.
                When isLoaded is true, it remains in the background until GoogleMap fully renders.
            */}
            {!map && <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
                <MapLoadingSkeleton />
            </div>}

            {isLoaded && (
                <div style={{
                    width: "100%",
                    height: "100%",
                    opacity: map ? 1 : 0,
                    transition: "opacity 0.5s ease-in-out"
                }}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={safeCenter}
                        zoom={zoom}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={MAP_OPTIONS}
                    >
                        {devices.map((device) => {
                            const location = deviceLocations?.[device.id];
                            if (!location || isNaN(location.lat) || isNaN(location.lng)) return null;

                            return (
                                <Marker
                                    key={device.id}
                                    position={location}
                                    icon={getDeviceMarkerIcon(window.google, device.is_active)}
                                    onClick={() => onMarkerClick(device)}
                                    title={device.name}
                                />
                            );
                        })}
                    </GoogleMap>
                </div>
            )}
        </div>
    );
};
