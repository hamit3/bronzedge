import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useList, useInvalidate } from "@refinedev/core";
import { useOrganization } from "../../contexts/organization";
import { useTable } from "@refinedev/antd";
import {
    Row, Col, Card, Statistic, Table, Tag, Typography, Space,
    Spin, Empty, Badge, Tabs, Button, Select, Tooltip, Segmented
} from "antd";
import {
    AimOutlined,
    SignalFilled,
    AlertOutlined,
    DeploymentUnitOutlined,
    ClockCircleOutlined,
    DatabaseOutlined,
    FileSearchOutlined,
    SyncOutlined,
    GlobalOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
} from "@ant-design/icons";
import {
    XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { GoogleMap, useJsApiLoader, Polyline, Marker, InfoWindow } from '@react-google-maps/api';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { PageHeader } from "../../components/PageHeader";
import { FilterContainer } from "../../components/FilterContainer";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

// Google Maps dark theme styles
const darkMapStyles: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
];

export const ShowcasePage: React.FC = () => {
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [mapView, setMapView] = useState<'chart' | 'googlemaps'>('chart');
    const [activeMarker, setActiveMarker] = useState<number | null>(null);
    const [showStatusHover, setShowStatusHover] = useState(false);
    const invalidate = useInvalidate();
    const { activeOrgId } = useOrganization();

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

    const { isLoaded: mapsLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ["drawing", "geometry", "places"] as any,
    });

    // --- One week ago boundary (ISO string, computed once per render) ---
    const weekAgo = useMemo(() => dayjs().subtract(7, "day").toISOString(), []);

    // --- Organisation's devices (for the selector) ---
    const devicesQuery = useList({
        resource: "devices",
        filters: activeOrgId
            ? [{ field: "organization_id", operator: "eq", value: activeOrgId }]
            : [],
        pagination: { pageSize: 200 },
        sorters: [{ field: "name", order: "asc" }],
        queryOptions: { enabled: !!activeOrgId },
    });
    const devicesData = (devicesQuery.query?.data?.data ?? []) as any[];
    const devicesLoading = devicesQuery.query?.isLoading;

    const deviceIds = useMemo(() => devicesData.map((d: any) => d.device_id as string), [devicesData]);

    // --- Filters ---
    const filters = useMemo(() => {
        const base: any[] = [{ field: "ts", operator: "gte", value: weekAgo }];
        if (selectedDeviceId) {
            base.push({ field: "device_id", operator: "eq", value: selectedDeviceId });
        } else if (deviceIds.length > 0) {
            // If no specific device selected, show data for all devices in the org
            base.push({ field: "device_id", operator: "in", value: deviceIds });
        } else {
            // If org has no devices, return a filter that matches nothing
            base.push({ field: "device_id", operator: "eq", value: "00000000-0000-0000-0000-000000000000" });
        }
        return base;
    }, [selectedDeviceId, weekAgo, deviceIds]);

    // --- Device Status (Telemetries like battery, firmware, etc.) ---
    const statusQuery = useList({
        resource: "device_status",
        filters: [
            {
                field: "device_id",
                operator: selectedDeviceId ? "eq" : "in",
                value: selectedDeviceId ? selectedDeviceId : (deviceIds.length > 0 ? deviceIds : ["0"])
            }
        ],
        pagination: { pageSize: 200 },
        queryOptions: { enabled: deviceIds.length > 0 },
    });
    const statusData = (statusQuery.query?.data?.data ?? []) as any[];
    const statusLoading = statusQuery.query?.isLoading;

    // Helper: get friendly name for a device_id
    const getDeviceName = useCallback(
        (did: string) => devicesData.find((d: any) => d.device_id === did)?.name ?? did,
        [devicesData]
    );

    // Auto-select the first device once the list loads
    useEffect(() => {
        if (deviceIds.length > 0 && selectedDeviceId === undefined) {
            setSelectedDeviceId(deviceIds[0]);
        }
    }, [deviceIds, selectedDeviceId]);

    const tempQuery = useList({
        resource: "temp_readings",
        filters,
        pagination: { pageSize: 500 },
        sorters: [{ field: "ts", order: "desc" }],
        queryOptions: { enabled: !devicesLoading && !!activeOrgId },
    });
    const tempData = tempQuery.query?.data?.data ?? [];
    const tempLoading = tempQuery.query?.isLoading;

    const rsrpQuery = useList({
        resource: "rsrp_readings",
        filters,
        pagination: { pageSize: 500 },
        sorters: [{ field: "ts", order: "desc" }],
        queryOptions: { enabled: !devicesLoading && !!activeOrgId },
    });
    const rsrpData = rsrpQuery.query?.data?.data ?? [];
    const rsrpLoading = rsrpQuery.query?.isLoading;

    const alertsQuery = useList({
        resource: "device_alerts",
        filters,
        pagination: { pageSize: 100 },
        sorters: [{ field: "ts", order: "desc" }],
        queryOptions: { enabled: !devicesLoading && !!activeOrgId },
    });
    const alertCount = alertsQuery.query?.data?.total ?? 0;

    const gnssQuery = useList({
        resource: "gnss_readings",
        filters,
        pagination: { pageSize: 500 },
        sorters: [{ field: "ts", order: "desc" }],
        queryOptions: { enabled: !devicesLoading && !!activeOrgId },
    });
    const gnssData = gnssQuery.query?.data?.data ?? [];
    const gnssLoading = gnssQuery.query?.isLoading;

    const flipQuery = useList({
        resource: "flip_readings",
        filters,
        pagination: { pageSize: 500 },
        sorters: [{ field: "ts", order: "desc" }],
        queryOptions: { enabled: !devicesLoading && !!activeOrgId },
    });
    const flipData = flipQuery.query?.data?.data ?? [];
    const flipLoading = flipQuery.query?.isLoading;



    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            invalidate({ resource: "devices", invalidates: ["list"] }),
            invalidate({ resource: "device_status", invalidates: ["list"] }),
            invalidate({ resource: "temp_readings", invalidates: ["list"] }),
            invalidate({ resource: "rsrp_readings", invalidates: ["list"] }),
            invalidate({ resource: "device_alerts", invalidates: ["list"] }),
            invalidate({ resource: "gnss_readings", invalidates: ["list"] }),
            invalidate({ resource: "flip_readings", invalidates: ["list"] }),
            invalidate({ resource: "device_logs", invalidates: ["list"] }),
            invalidate({ resource: "raw_messages", invalidates: ["list"] }),
        ]);
        setIsRefreshing(false);
    };

    // --- Chart Data ---
    const chartData = useMemo(() => {
        return [...tempData].reverse().map((item: any) => ({
            time: dayjs(item.ts).format("HH:mm"),
            fullTime: dayjs(item.ts).format("YYYY-MM-DD HH:mm:ss"),
            temp: parseFloat(item.celsius),
        }));
    }, [tempData]);

    const signalChartData = useMemo(() => {
        return [...rsrpData].reverse().map((item: any) => ({
            time: dayjs(item.ts).format("HH:mm"),
            signal: Math.abs(parseFloat(item.rsrp)),
            raw: parseFloat(item.rsrp),
        }));
    }, [rsrpData]);

    const mapData = useMemo(() => {
        return gnssData.map((item: any) => ({
            x: parseFloat(item.lng),
            y: parseFloat(item.lat),
            name: dayjs(item.ts).format("HH:mm:ss"),
        }));
    }, [gnssData]);

    const activityChartData = useMemo(() => {
        return [...flipData].reverse().map((item: any) => ({
            time: dayjs(item.ts).format("HH:mm"),
            activeValue: item.orientation === "UPSIDE_DOWN" ? 1 : 0,
            status: item.orientation === "UPSIDE_DOWN" ? "Active" : "Idle"
        }));
    }, [flipData]);

    const activeTimeStr = useMemo(() => {
        if (flipData.length === 0) return "--";
        let activeSeconds = 0;
        // flipData sorted desc by ts. previous element is older.
        for (let i = 0; i < flipData.length - 1; i++) {
            const current = flipData[i];    // newer
            const older = flipData[i + 1];    // older
            if (older.orientation === "UPSIDE_DOWN") {
                const diff = dayjs(current.ts).diff(dayjs(older.ts), 'second');
                if (diff > 0 && diff < 3600) {
                    activeSeconds += diff;
                }
            }
        }
        if (activeSeconds === 0) return "0m";
        if (activeSeconds < 60) return `${Math.floor(activeSeconds)}s`;
        const mins = Math.floor(activeSeconds / 60);
        const hrs = Math.floor(mins / 60);
        if (hrs > 0) return `${hrs}h ${mins % 60}m`;
        return `${mins}m`;
    }, [flipData]);

    const latestTemp = tempData[0]?.celsius ?? "--";
    const previousTemp = tempData[1]?.celsius;
    const tempTrendStr = previousTemp != null && latestTemp !== "--" ? (parseFloat(latestTemp) - parseFloat(previousTemp)).toFixed(1) : "0.0";
    const tempTrend = parseFloat(tempTrendStr);

    const latestRsrp = rsrpData[0]?.rsrp ?? "--";
    const previousRsrp = rsrpData[1]?.rsrp;
    const rsrpTrendStr = previousRsrp != null && latestRsrp !== "--" ? (parseFloat(latestRsrp) - parseFloat(previousRsrp)).toFixed(1) : "0.0";
    const rsrpTrend = parseFloat(rsrpTrendStr);

    // --- Table hooks ---
    const { tableProps: logsTableProps } = useTable({
        resource: "device_logs",
        filters: {
            permanent: filters
        },
        sorters: { initial: [{ field: "ts", order: "desc" }] },
        pagination: { pageSize: 20 },
        syncWithLocation: false,
        queryOptions: { enabled: !devicesLoading && !!activeOrgId },
    });


    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>

            <PageHeader 
                title="Monitoring" 
                subtitle={`Live telemetry from your devices — ${new Date().toLocaleString('tr-TR')}`} 
            />

            <FilterContainer 
                title="Telemetry Pipeline"
                extra={
                    <Space size="middle">
                        <Select
                            placeholder={devicesLoading ? "Loading devices…" : deviceIds.length === 0 ? "No devices in org" : "Select device"}
                            style={{ width: 240 }}
                            allowClear
                            onChange={setSelectedDeviceId}
                            value={selectedDeviceId}
                            loading={devicesLoading}
                            disabled={devicesLoading || deviceIds.length === 0}
                            optionLabelProp="label"
                        >
                            {devicesData.map((d: any) => (
                                <Option key={d.device_id} value={d.device_id} label={d.name ?? d.device_id}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#fff' }}>{d.name ?? <em style={{ color: 'rgba(255,255,255,0.35)' }}>Unnamed</em>}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{d.device_id}</div>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                        <Button
                            icon={<SyncOutlined spin={isRefreshing} />}
                            onClick={handleRefresh}
                            loading={isRefreshing}
                            disabled={isRefreshing}
                            style={{ background: 'transparent', color: '#f88601', borderColor: '#f88601' }}
                        >
                            Refresh
                        </Button>
                    </Space>
                }
            >
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
                    Showing telemetry for the last 7 days
                </div>
            </FilterContainer>



                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={6}>
                        <Card variant="borderless" className="dashboard-card" bodyStyle={{ padding: "16px", height: 160, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500, letterSpacing: '0.5px' }}>
                                        LATEST TEMPERATURE
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                                        <div style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                                            {typeof latestTemp === 'number' ? latestTemp.toFixed(1) : latestTemp}
                                            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginLeft: 2 }}>°C</span>
                                        </div>
                                        {tempTrend !== 0 && (
                                            <Tag color={tempTrend > 0 ? "error" : "success"} style={{ border: 0, margin: 0, padding: '0 6px', fontWeight: 600, fontSize: 11 }}>
                                                {tempTrend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(tempTrend)}°C
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, background: 'rgba(248,134,1,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <AimOutlined style={{ fontSize: 20, color: "#f88601" }} />
                                </div>
                            </div>

                            <div style={{ height: 60, width: '100%', marginTop: 'auto' }}>
                                {tempLoading ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="small" /></div> : chartData && chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData.slice(-20)}>
                                            <defs>
                                                <linearGradient id="colorTempMini" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f88601" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#f88601" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="temp" stroke="#f88601" strokeWidth={2} fillOpacity={1} fill="url(#colorTempMini)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={6}>
                        <Card variant="borderless" className="dashboard-card" bodyStyle={{ padding: "16px", height: 160, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500, letterSpacing: '0.5px' }}>
                                        SIGNAL STRENGTH (RSRP)
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                                        <div style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                                            {latestRsrp}
                                            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginLeft: 2 }}>dBm</span>
                                        </div>
                                        {rsrpTrend !== 0 && (
                                            <Tag color={rsrpTrend > 0 ? "success" : "error"} style={{ border: 0, margin: 0, padding: '0 6px', fontWeight: 600, fontSize: 11 }}>
                                                {rsrpTrend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(rsrpTrend)}
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, background: 'rgba(24,144,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <SignalFilled style={{ fontSize: 20, color: "#1890ff" }} />
                                </div>
                            </div>

                            <div style={{ height: 60, width: '100%', marginTop: 'auto' }}>
                                {rsrpLoading ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="small" /></div> : signalChartData && signalChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={signalChartData.slice(-20)}>
                                            <Bar dataKey="signal" fill="#1890ff" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={6}>
                        <Card variant="borderless" className="dashboard-card" bodyStyle={{ padding: "16px", height: 160, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500, letterSpacing: '0.5px' }}>
                                        ACTIVE TIME (24H)
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                                        <div style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                                            {activeTimeStr}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, background: 'rgba(82,196,26,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <ClockCircleOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                                </div>
                            </div>

                            <div style={{ height: 60, width: '100%', marginTop: 'auto' }}>
                                {flipLoading ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="small" /></div> : activityChartData && activityChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={activityChartData.slice(-40)}>
                                            <defs>
                                                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="step" dataKey="activeValue" stroke="#52c41a" strokeWidth={2} fillOpacity={1} fill="url(#colorActivity)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={6}>
                        <Card variant="borderless" className="dashboard-card" bodyStyle={{ padding: 0, height: 160, display: 'flex', flexDirection: 'column' }}>
                            <div
                                style={{ position: 'relative', height: 160, width: '100%', borderRadius: 8, overflow: 'hidden' }}
                                onMouseEnter={() => setShowStatusHover(true)}
                                onMouseLeave={() => setShowStatusHover(false)}
                            >
                                {/* Floating Title Overlay */}
                                <div style={{
                                    position: 'absolute', top: 12, left: 12, zIndex: 10,
                                    background: 'rgba(0,0,0,0.6)', padding: '6px 10px', borderRadius: 6,
                                    backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', boxShadow: '0 0 8px #52c41a' }} />
                                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 600, letterSpacing: '0.5px' }}>
                                        LAST POSITION
                                    </Text>
                                </div>

                                {/* Floating Status Overlay on Card Hover */}
                                {showStatusHover && statusData && statusData.length > 0 && (() => {
                                    const s = statusData.find((sd: any) => sd.device_id === gnssData[0]?.device_id) || statusData[0];
                                    return (
                                        <div style={{
                                            position: 'absolute', top: 12, right: 12, zIndex: 10,
                                            background: 'rgba(29, 29, 29, 0.95)', padding: '8px 12px', borderRadius: 8,
                                            backdropFilter: 'blur(8px)', border: '1px solid rgba(248,134,1,0.3)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                            color: '#fff', fontSize: 11, minWidth: 150
                                        }}>
                                            <strong style={{ fontSize: 12, color: '#f88601' }}>{getDeviceName(s.device_id)}</strong><br />
                                            <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'min-content auto', gap: '4px 8px', whiteSpace: 'nowrap' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Battery:</span> <span>{s.battery_mv ? `${s.battery_mv} mV` : "--"}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Firmware:</span> <span>{s.firmware || "--"}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Operator:</span> <span>{s.operator || "--"}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Network:</span> <span>{s.band || "--"} / {s.mode || "--"}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {gnssLoading ? <Spin size="small" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} /> : (!mapData || mapData.length === 0) ? (
                                    <div style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.2)' }}><AimOutlined /> No GPS Data</Text>
                                    </div>
                                ) : !mapsLoaded ? (
                                    <div style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Spin size="small" />
                                    </div>
                                ) : (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={{ lat: mapData[0].y, lng: mapData[0].x }}
                                        zoom={6}
                                        options={{
                                            mapTypeId: 'roadmap',
                                            disableDefaultUI: true,
                                            draggable: false,
                                            keyboardShortcuts: false,
                                            disableDoubleClickZoom: true,
                                            scrollwheel: false,
                                            styles: darkMapStyles,
                                        }}
                                    >
                                        <Marker
                                            position={{ lat: mapData[0].y, lng: mapData[0].x }}
                                            icon={{
                                                path: window.google?.maps?.SymbolPath?.CIRCLE,
                                                scale: 6,
                                                fillColor: '#52c41a',
                                                fillOpacity: 1,
                                                strokeColor: '#fff',
                                                strokeWeight: 2,
                                            }}
                                        />
                                    </GoogleMap>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>


                {/* Logs, Raw, Status Tabs */}
                <Card variant="borderless" className="shadow-premium">
                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1',
                            label: <span><ClockCircleOutlined /> System Logs</span>,
                            children: (
                                <Table
                                    {...logsTableProps} rowKey="id" size="small" className="industrial-table"
                                    columns={[
                                        { title: "Timestamp", dataIndex: "ts", width: 160, render: (v: any) => dayjs(v).format("MM-DD HH:mm:ss") },
                                        { title: "Device", dataIndex: "device_id", width: 130, render: (v: any) => <Text style={{ fontSize: 11, color: '#aaa' }}>{v}</Text> },
                                        { title: "Level", dataIndex: "level", width: 60, render: (v: any) => { const c = ["#52c41a", "#faad14", "#ff4d4f"]; return <Badge color={c[v] || "#1890ff"} text={v} />; } },
                                        { title: "Source", dataIndex: "source", width: 80 },
                                        { title: "Message", dataIndex: "message" },
                                    ]}
                                />
                            ),
                        },
                    ]} />
                </Card>
            </Space>

            <style>{`
                .shadow-premium { box-shadow: 0 4px 24px rgba(0,0,0,0.3) !important; }
                .dashboard-card {
                    border: 1px solid rgba(255,255,255,0.06) !important;
                    transition: all 0.2s;
                }
                .dashboard-card:hover {
                    border-color: rgba(248,134,1,0.3) !important;
                    transform: translateY(-2px);
                }
                .industrial-table .ant-table { background: transparent !important; }
                .industrial-table .ant-table-thead > tr > th {
                    color: rgba(255,255,255,0.45) !important;
                    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
                    font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .industrial-table .ant-table-tbody > tr > td { border-bottom: 1px solid rgba(255,255,255,0.06) !important; font-size: 12px; }
                .industrial-table .ant-table-tbody > tr:hover > td { background: rgba(248,134,1,0.06) !important; }
                .ant-tabs-tab { color: rgba(255,255,255,0.4) !important; }
                .ant-tabs-tab-active .ant-tabs-tab-btn { color: #f88601 !important; font-weight: 600 !important; }
                .ant-tabs-ink-bar { background: #f88601 !important; }
                .ant-pagination-item a { color: rgba(255,255,255,0.6) !important; }
                .ant-pagination-item-active { border-color: #f88601 !important; background: transparent !important; }
                .ant-pagination-item-active a { color: #f88601 !important; }
            `}</style>
        </div>
    );
};

const centeredStyle: React.CSSProperties = {
    height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'
};
