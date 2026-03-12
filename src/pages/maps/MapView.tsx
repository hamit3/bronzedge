import React, { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, MarkerClusterer } from "@react-google-maps/api";
import { getDeviceMarkerIcon } from "./utils";
import { MapLoadingSkeleton } from "./MapLoadingSkeleton";
import { COMMON_MAP_OPTIONS, MAP_LIBRARIES } from "../../utils/mapUtils";

const containerStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: "#f8f9fa",
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
        libraries: MAP_LIBRARIES,
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
                        options={COMMON_MAP_OPTIONS}
                    >
                        <MarkerClusterer>
                            {(clusterer) =>
                                <>
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
                                                clusterer={clusterer}
                                            />
                                        );
                                    })}
                                </>
                            }
                        </MarkerClusterer>
                    </GoogleMap>
                </div>
            )}
        </div>
    );
};

