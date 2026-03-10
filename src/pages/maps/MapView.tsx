import React, { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { getDeviceMarkerIcon } from "./utils";
import { Skeleton } from "antd";

const containerStyle = {
    width: "100%",
    height: "100%",
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: false,
    fullscreenControl: true,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#0b0e14" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#111827" }] },
        { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#374151" }] },
        { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2937" }] },
        { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4b5563" }] },
        { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
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
        libraries: ["drawing", "geometry", "places"] as any,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((m: google.maps.Map) => {
        setMap(m);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    if (!isLoaded) return <Skeleton.Button active style={{ width: "100%", height: "100%" }} />;

    const safeCenter = center && !isNaN(center.lat) && !isNaN(center.lng) ? center : { lat: 39.9, lng: 32.8 };

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={safeCenter}
            zoom={zoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
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
    );
};
