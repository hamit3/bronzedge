import React from "react";
import {
    List,
    Badge,
    Typography,
    Skeleton,
    ConfigProvider,
    theme,
} from "antd";
import { formatRelativeTime } from "./utils";

const { Text, Title } = Typography;

interface Device {
    id: string;
    name: string;
    device_id: string;
    is_active: boolean;
    last_seen: string;
    organization_id: string;
}

interface DeviceListPanelProps {
    devices: Device[];
    loading: boolean;
    selectedDeviceId?: string;
    onSelectDevice: (device: Device) => void;
    deviceLocations: Record<string, { lat: number; lng: number } | null>;
}

export const DeviceListPanel: React.FC<DeviceListPanelProps> = ({
    devices,
    loading,
    selectedDeviceId,
    onSelectDevice,
    deviceLocations,
}) => {
    return (
        <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "#141414",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "4px 0 16px rgba(0,0,0,0.4)",
                    zIndex: 1,
                }}
            >
                <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    <Title level={5} style={{ margin: 0, color: '#fff' }}>Devices</Title>
                    <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                        {devices.length} nodes in organization
                    </Text>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "12px" }} className="device-scroll-container">
                    {loading ? (
                        <div style={{ padding: '0 8px' }}>
                            <Skeleton active paragraph={{ rows: 12 }} />
                        </div>
                    ) : (
                        <List
                            dataSource={devices}
                            renderItem={(device) => {
                                const hasLocation = !!deviceLocations[device.id];
                                const isSelected = selectedDeviceId === device.id;

                                return (
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            cursor: "pointer",
                                            borderRadius: "8px",
                                            marginBottom: "8px",
                                            background: isSelected ? "rgba(248,134,1,0.12)" : "rgba(255,255,255,0.03)",
                                            border: isSelected ? "1px solid rgba(248,134,1,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onClick={() => onSelectDevice(device)}
                                        className="device-item-card"
                                    >
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '3px',
                                                background: '#f88601'
                                            }} />
                                        )}

                                        <div style={{ width: "100%" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: '4px' }}>
                                                <Text strong style={{ fontSize: "14px", color: isSelected ? '#f88601' : '#fff' }}>
                                                    {device.name || "Unnamed Device"}
                                                </Text>
                                                <Badge
                                                    status={device.is_active ? "success" : "default"}
                                                    text={
                                                        <span style={{ fontSize: '11px', color: device.is_active ? '#52c41a' : 'rgba(255,255,255,0.35)' }}>
                                                            {device.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    }
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <Text style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontFamily: 'monospace' }}>
                                                    {device.device_id}
                                                </Text>

                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginTop: "4px" }}>
                                                    <Text style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>
                                                        {formatRelativeTime(device.last_seen)}
                                                    </Text>
                                                    {!hasLocation ? (
                                                        <Badge
                                                            count="NO GPS"
                                                            style={{
                                                                backgroundColor: "transparent",
                                                                color: "#ff4d4f",
                                                                fontSize: "9px",
                                                                border: '1px solid #ff4d4f',
                                                                boxShadow: 'none',
                                                                minWidth: 'auto',
                                                                height: '18px',
                                                                lineHeight: '16px',
                                                                padding: '0 4px'
                                                            }}
                                                        />
                                                    ) : (
                                                        <Badge
                                                            count="TRACKED"
                                                            style={{
                                                                backgroundColor: "transparent",
                                                                color: "#52c41a",
                                                                fontSize: "9px",
                                                                border: '1px solid #52c41a',
                                                                boxShadow: 'none',
                                                                minWidth: 'auto',
                                                                height: '18px',
                                                                lineHeight: '16px',
                                                                padding: '0 4px'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    )}
                </div>

                <style>{`
                    .device-scroll-container::-webkit-scrollbar {
                        width: 4px;
                    }
                    .device-scroll-container::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .device-scroll-container::-webkit-scrollbar-thumb {
                        background: rgba(255,255,255,0.1);
                        border-radius: 10px;
                    }
                    .device-scroll-container::-webkit-scrollbar-thumb:hover {
                        background: rgba(248,134,1,0.3);
                    }
                    .device-item-card:hover {
                        background: rgba(255,255,255,0.06) !important;
                        border-color: rgba(255,255,255,0.12) !important;
                        transform: translateX(2px);
                    }
                `}</style>
            </div>
        </ConfigProvider>
    );
};
