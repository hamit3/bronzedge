import React, { useState, useMemo, useEffect } from "react";
import { useList } from "@refinedev/core";
import { useOrganization } from "../../contexts/organization";
import { MapView } from "./MapView";
import { DeviceInfoCard } from "./DeviceInfoCard";
import { MapFilters } from "./MapFilters";
import { Grid } from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";

const { useBreakpoint } = Grid;

export const MapsPage: React.FC = () => {
    const { activeOrgId } = useOrganization();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [lastSeenFilter, setLastSeenFilter] = useState<string>("any");
    const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [mapCenter, setMapCenter] = useState({ lat: 39.9, lng: 32.8 }); // Turkey default
    const [mapZoom, setMapZoom] = useState(6);

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    // 1. Fetch Devices for organization
    const { query: devicesQuery } = useList({
        resource: "devices",
        filters: [
            { field: "organization_id", operator: "eq", value: activeOrgId },
        ] as any,
        pagination: { pageSize: 200 },
        queryOptions: { enabled: !!activeOrgId },
    });

    const allDevices = (devicesQuery.data?.data || []) as any[];

    // 2. Fetch GNSS Readings
    // IMPORTANT: Based on ShowcasePage, gnss_readings uses the nRF 'device_id' string, NOT the UUID.
    const nrfDeviceIds = useMemo(() => allDevices.map(d => d.device_id).filter(Boolean), [allDevices]);
    const uuidDeviceIds = useMemo(() => allDevices.map(d => d.id).filter(Boolean), [allDevices]);

    const { query: gnssQuery } = useList({
        resource: "gnss_readings",
        filters: [
            { field: "device_id", operator: "in", value: nrfDeviceIds.length > 0 ? nrfDeviceIds : ["none"] },
            ...(timeRange ? [
                { field: "ts", operator: "gte", value: timeRange[0].toISOString() },
                { field: "ts", operator: "lte", value: timeRange[1].toISOString() },
            ] : []),
        ] as any,
        sorters: [{ field: "ts", order: "desc" }],
        pagination: { pageSize: 1000 },
        queryOptions: { enabled: nrfDeviceIds.length > 0 },
    });

    // 3. Fetch Recent Messages (Used UUID 'device_id' earlier to avoid UUID error)
    const { query: messagesQuery } = useList({
        resource: "device_messages",
        filters: [
            { field: "device_id", operator: "in", value: uuidDeviceIds.length > 0 ? uuidDeviceIds : ["none"] },
            ...(timeRange ? [
                { field: "received_at", operator: "gte", value: timeRange[0].toISOString() },
                { field: "received_at", operator: "lte", value: timeRange[1].toISOString() },
            ] : []),
        ] as any,
        sorters: [{ field: "received_at", order: "desc" }],
        pagination: { pageSize: 500 },
        queryOptions: { enabled: uuidDeviceIds.length > 0 },
    });

    // Group locations by device
    const deviceLocations = useMemo(() => {
        const locs: Record<string, { lat: number; lng: number; received_at: string } | null> = {};

        // A. Process gnss_readings (uses nRF ID 'device_id' in its records)
        const gnssData = gnssQuery.data?.data || [];
        gnssData.forEach((item: any) => {
            // Find the device matching this nRF ID to get its UUID
            const device = allDevices.find(d => d.device_id === item.device_id);
            if (device && !locs[device.id]) {
                locs[device.id] = {
                    lat: Number(item.lat),
                    lng: Number(item.lng),
                    received_at: item.ts,
                };
            }
        });

        // B. Process device_messages (already uses UUID in its records)
        const messages = messagesQuery.data?.data || [];
        messages.forEach((msg: any) => {
            if (!locs[msg.device_id]) {
                const lat = msg.latitude ?? msg.lat;
                const lng = msg.longitude ?? msg.lng;

                if (lat !== null && lng !== null && lat !== undefined && lng !== undefined) {
                    locs[msg.device_id] = {
                        lat: Number(lat),
                        lng: Number(lng),
                        received_at: msg.received_at,
                    };
                }
            }
        });

        return locs;
    }, [gnssQuery.data, messagesQuery.data, allDevices]);

    // Update map center to first available location if no device is selected
    useEffect(() => {
        if (!selectedDevice) {
            const firstLoc = Object.values(deviceLocations).find(l => !!l);
            if (firstLoc) {
                setMapCenter({ lat: firstLoc.lat, lng: firstLoc.lng });
                setMapZoom(10);
            }
        }
    }, [deviceLocations, selectedDevice === null]);

    // Messages for the selected device specifically
    const { query: selectedMessagesQuery } = useList({
        resource: "device_messages",
        filters: [
            { field: "device_id", operator: "eq", value: selectedDevice?.id },
        ] as any,
        sorters: [{ field: "received_at", order: "desc" }],
        pagination: { pageSize: 20 },
        queryOptions: { enabled: !!selectedDevice },
    });

    const recentMessages = (selectedMessagesQuery.data?.data || []) as any[];

    const lastLocation = useMemo(() => {
        if (!selectedDevice) return null;
        return deviceLocations[selectedDevice.id];
    }, [selectedDevice, deviceLocations]);

    const infoCardMessage = useMemo(() => {
        if (!lastLocation) return null;
        return {
            latitude: lastLocation.lat,
            longitude: lastLocation.lng,
            received_at: lastLocation.received_at,
            id: 'loc-ref',
            payload: {},
            accuracy: null
        };
    }, [lastLocation]);

    // 4. Filter devices for markers
    const filteredDevices = useMemo(() => {
        return allDevices.filter(d => {
            const matchesSearch = !searchText ||
                d.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                d.device_id?.toLowerCase().includes(searchText.toLowerCase());

            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" && d.is_active) ||
                (statusFilter === "inactive" && !d.is_active);

            let matchesLastSeen = true;
            if (lastSeenFilter !== "any") {
                const threshold = dayjs().subtract(
                    lastSeenFilter === "1h" ? 1 :
                        lastSeenFilter === "6h" ? 6 :
                            lastSeenFilter === "24h" ? 24 :
                                lastSeenFilter === "7d" ? 168 : 0,
                    "hour"
                );
                matchesLastSeen = dayjs(d.last_seen).isAfter(threshold);
            }

            return matchesSearch && matchesStatus && matchesLastSeen;
        });
    }, [allDevices, searchText, statusFilter, lastSeenFilter]);

    return (
        <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", background: "#0b0e14", overflow: "hidden" }}>

            <div style={{
                padding: "12px 20px",
                background: "#141414",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                zIndex: 10,
                display: "flex",
                justifyContent: "center"
            }}>
                <MapFilters
                    searchText={searchText}
                    setSearchText={setSearchText}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    lastSeenFilter={lastSeenFilter}
                    setLastSeenFilter={setLastSeenFilter}
                    timeRange={timeRange}
                    setTimeRange={setTimeRange}
                />
            </div>

            <div style={{ flex: 1, position: "relative" }}>
                <MapView
                    devices={filteredDevices}
                    deviceLocations={deviceLocations as any}
                    onMarkerClick={(device) => setSelectedDevice(device)}
                    center={mapCenter}
                    zoom={mapZoom}
                    apiKey={GOOGLE_MAPS_API_KEY}
                />

                {selectedDevice && (
                    <div style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}>
                        <DeviceInfoCard
                            device={selectedDevice}
                            lastMessage={infoCardMessage as any}
                            recentMessages={recentMessages}
                            onClose={() => setSelectedDevice(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
