import React, { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { getDeviceMarkerIcon } from "./utils";
import { MapLoadingSkeleton } from "./MapLoadingSkeleton";

const containerStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
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
    backgroundColor: "#071527ff", // Critical: prevents white flash while tiles load
    styles: [
        { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
        { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#30363d" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c9d1d9" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#161b22" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#21262d" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#30363d" }] },
        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#050a14" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#30363d" }] },
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
