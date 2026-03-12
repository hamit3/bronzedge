import React, { useState, useEffect, useRef, useMemo } from "react";
import { GoogleMap, Polyline, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Card, Button, Slider, Segmented, Row, Col, Typography, Empty, Space, Spin } from "antd";
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    StepForwardOutlined,
    StepBackwardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { DeviceMessage, Session } from "./types";
import { isMovingAtTime } from "./utils";

import { COMMON_MAP_OPTIONS, MAP_LIBRARIES } from "../../utils/mapUtils";

const { Text } = Typography;

interface PlaybackTabProps {
    locations: DeviceMessage[];
    sessions: Session[];
}

const mapContainerStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: "#f8f9fa",
};

export const PlaybackTab: React.FC<PlaybackTabProps> = ({ locations, sessions }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const mapRef = useRef<google.maps.Map | null>(null);
    const intervalRef = useRef<any>(null);

    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: MAP_LIBRARIES,
    });

    const path = useMemo(() => {
        return locations.map(l => ({
            lat: (l as any).latitude ?? (l as any).lat,
            lng: (l as any).longitude ?? (l as any).lng
        })).filter(p => p.lat != null && p.lng != null);
    }, [locations]);

    const center = useMemo(() => {
        if (path.length > 0) return path[0];
        return { lat: 39.9, lng: 32.8 }; // Default to Turkey if no path
    }, [path]);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = window.setInterval(() => {
                setCurrentIndex((prev) => {
                    if (prev >= locations.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000 / speed);
        }
        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
        };
    }, [isPlaying, speed, locations.length]);

    useEffect(() => {
        if (mapRef.current && path[currentIndex]) {
            mapRef.current.panTo(path[currentIndex]);
        }
    }, [currentIndex, path]);

    const miniChartData = useMemo(() => {
        return locations.map((l, idx) => ({
            index: idx,
            isMoving: isMovingAtTime(l.received_at, sessions) ? 1 : 0,
        }));
    }, [locations, sessions]);

    if (locations.length === 0 || path.length === 0) {
        return <Empty description="No location data for this period" style={{ padding: "40px 0" }} />;
    }

    const currentPoint = path[currentIndex];
    const rawPoint = locations[currentIndex];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Card variant="borderless" styles={{ body: { padding: 0, overflow: 'hidden' } }} className="shadow-premium" style={{ borderRadius: 12 }}>
                <div style={{ width: "100%", height: "600px", position: "relative", backgroundColor: "#f8f9fa" }}>
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={center}
                            zoom={15}
                            onLoad={(map) => { mapRef.current = map; }}
                            options={COMMON_MAP_OPTIONS}
                        >
                        <Polyline
                            path={path}
                            options={{
                                strokeColor: "#1677ff",
                                strokeOpacity: 0.6,
                                strokeWeight: 3,
                            }}
                        />
                        {/* Current Position Marker */}
                        {currentPoint && (
                            <Marker
                                position={currentPoint}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillColor: "#1677ff",
                                    fillOpacity: 1,
                                    strokeColor: "#ffffff",
                                    strokeWeight: 2,
                                    scale: 8,
                                }}
                            />
                        )}
                        {/* Start Marker */}
                        <Marker
                            position={path[0]}
                            label={{ text: "S", color: "white" }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                fillColor: "#52c41a",
                                fillOpacity: 1,
                                strokeWeight: 0,
                                scale: 12,
                            }}
                        />
                        {/* End Marker */}
                        <Marker
                            position={path[path.length - 1]}
                            label={{ text: "E", color: "white" }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                fillColor: "#ff4d4f",
                                fillOpacity: 1,
                                strokeWeight: 0,
                                scale: 12,
                            }}
                        />
                    </GoogleMap>
                    ) : (
                        <div style={{ ...mapContainerStyle, height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
                            <Spin tip="Loading Map..." />
                        </div>
                    )}
                </div>
            </Card>


            <Card variant="borderless">
                <Row gutter={24} align="middle">
                    <Col>
                        <Space>
                            <Button
                                icon={<StepBackwardOutlined />}
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                            />
                            <Button
                                type="primary"
                                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                onClick={() => setIsPlaying(!isPlaying)}
                            />
                            <Button
                                icon={<StepForwardOutlined />}
                                onClick={() => setCurrentIndex(Math.min(locations.length - 1, currentIndex + 1))}
                                disabled={currentIndex === locations.length - 1}
                            />
                        </Space>
                    </Col>
                    <Col flex="auto">
                        <Slider
                            min={0}
                            max={locations.length - 1}
                            value={currentIndex}
                            onChange={(val) => setCurrentIndex(val)}
                            tooltip={{
                                formatter: (val) => val !== undefined ? dayjs(locations[val].received_at).format("HH:mm:ss") : ""
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -8 }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>{dayjs(locations[0].received_at).format("YYYY-MM-DD HH:mm:ss")}</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>{dayjs(locations[locations.length - 1].received_at).format("YYYY-MM-DD HH:mm:ss")}</Text>
                        </div>
                    </Col>
                    <Col>
                        <Segmented
                            options={[{ label: "1x", value: 1 }, { label: "2x", value: 2 }, { label: "4x", value: 4 }]}
                            value={speed}
                            onChange={(val) => setSpeed(val as number)}
                        />
                    </Col>
                </Row>

                <Row style={{ marginTop: 24 }} justify="space-between">
                    <Col>
                        <Text type="secondary">Current Time: </Text>
                        <Text strong>{rawPoint ? dayjs(rawPoint.received_at).format("YYYY-MM-DD HH:mm:ss") : "-"}</Text>
                    </Col>
                    <Col>
                        <Text type="secondary">Point </Text>
                        <Text strong>{currentIndex + 1}</Text>
                        <Text type="secondary"> / {locations.length}</Text>
                    </Col>
                </Row>

                <div style={{ height: 60, width: '100%', marginTop: 24, padding: '0 8px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={miniChartData}>
                            <Area
                                type="monotone"
                                dataKey="isMoving"
                                stroke="none"
                                fill="#52c41a"
                                fillOpacity={0.4}
                            />
                            <XAxis dataKey="index" hide />
                            <YAxis hide domain={[0, 1]} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div style={{
                        height: '100%',
                        width: '2px',
                        background: '#1677ff',
                        position: 'relative',
                        top: '-60px',
                        left: `${(currentIndex / (locations.length - 1)) * 100}%`,
                        zIndex: 2,
                        pointerEvents: 'none'
                    }} />
                </div>
            </Card>
        </div>
    );
};
