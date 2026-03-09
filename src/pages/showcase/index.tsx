import React, { useMemo, useState } from "react";
import { useList, useInvalidate } from "@refinedev/core";
import { useTable } from "@refinedev/antd";
import {
    Row, Col, Card, Statistic, Table, Tag, Typography, Space,
    Spin, Empty, Badge, Tabs, Button, Select, Tooltip
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
    GlobalOutlined
} from "@ant-design/icons";
import {
    XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

export const ShowcasePage: React.FC = () => {
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const invalidate = useInvalidate();

    // --- One week ago boundary (ISO string, computed once per render) ---
    const weekAgo = useMemo(() => dayjs().subtract(7, "day").toISOString(), []);

    // --- Filters ---
    const filters = useMemo(() => {
        const base: any[] = [{ field: "ts", operator: "gte", value: weekAgo }];
        if (selectedDeviceId) base.push({ field: "device_id", operator: "eq", value: selectedDeviceId });
        return base;
    }, [selectedDeviceId, weekAgo]);

    // --- Data Hooks ---
    const devicesQuery = useList({
        resource: "device_status",
        pagination: { pageSize: 500 },
        filters: [{ field: "ts", operator: "gte" as const, value: weekAgo }],
        sorters: [{ field: "ts", order: "desc" }],
    });
    const devicesData = devicesQuery.query.data?.data ?? [];
    const devicesLoading = devicesQuery.query.isLoading;

    const tempQuery = useList({
        resource: "temp_readings",
        filters,
        pagination: { pageSize: 500 },
        sorters: [{ field: "ts", order: "desc" }],
    });
    const tempData = tempQuery.query.data?.data ?? [];
    const tempLoading = tempQuery.query.isLoading;

    const rsrpQuery = useList({
        resource: "rsrp_readings",
        filters,
        pagination: { pageSize: 500 },
        sorters: [{ field: "ts", order: "desc" }],
    });
    const rsrpData = rsrpQuery.query.data?.data ?? [];
    const rsrpLoading = rsrpQuery.query.isLoading;

    const alertsQuery = useList({
        resource: "device_alerts",
        filters,
        pagination: { pageSize: 100 },
        sorters: [{ field: "ts", order: "desc" }],
    });
    const alertCount = alertsQuery.query.data?.total ?? 0;

    const gnssQuery = useList({
        resource: "gnss_readings",
        filters,
        pagination: { pageSize: 500 },
        sorters: [{ field: "ts", order: "desc" }],
    });
    const gnssData = gnssQuery.query.data?.data ?? [];
    const gnssLoading = gnssQuery.query.isLoading;

    const deviceIds = useMemo(() => {
        const ids = new Set(devicesData.map((d: any) => d.device_id));
        return Array.from(ids) as string[];
    }, [devicesData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            invalidate({ resource: "device_status", invalidates: ["list"] }),
            invalidate({ resource: "temp_readings", invalidates: ["list"] }),
            invalidate({ resource: "rsrp_readings", invalidates: ["list"] }),
            invalidate({ resource: "device_alerts", invalidates: ["list"] }),
            invalidate({ resource: "gnss_readings", invalidates: ["list"] }),
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

    const latestTemp = tempData[0]?.celsius ?? "--";
    const latestRsrp = rsrpData[0]?.rsrp ?? "--";

    // --- Table hooks ---
    const { tableProps: logsTableProps } = useTable({
        resource: "device_logs",
        filters: {
            initial: [
                { field: "ts", operator: "gte", value: weekAgo },
                ...filters.filter((f: any) => f.field === "device_id"),
            ],
        },
        sorters: { initial: [{ field: "ts", order: "desc" }] },
        pagination: { pageSize: 20 },
        syncWithLocation: false,
    });

    const { tableProps: rawTableProps } = useTable({
        resource: "raw_messages",
        filters: {
            initial: [
                { field: "received_at", operator: "gte", value: weekAgo },
                ...filters.filter((f: any) => f.field === "device_id"),
            ],
        },
        sorters: { initial: [{ field: "received_at", order: "desc" }] },
        pagination: { pageSize: 20 },
        syncWithLocation: false,
    });



    return (
        <div style={{ padding: "24px", background: "#0a0f1e", minHeight: "100vh" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <Title level={2} style={{ color: "#f88601", margin: 0 }}>
                            System Capabilities Showcase
                        </Title>
                        <Text type="secondary">
                            Live telemetry from your Supabase database — {new Date().toLocaleString('tr-TR')}
                        </Text>
                    </div>
                    <Space size="middle">
                        <Select
                            placeholder="All Devices"
                            style={{ width: 220 }}
                            allowClear
                            onChange={setSelectedDeviceId}
                            value={selectedDeviceId}
                            dropdownStyle={{ background: '#141b2d' }}
                        >
                            {deviceIds.map(id => (
                                <Option key={id} value={id}>{id}</Option>
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
                </header>



                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Card bordered={false} className="dashboard-card">
                            <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.45)" }}>Latest Temperature</span>}
                                value={latestTemp}
                                precision={typeof latestTemp === 'number' ? 1 : 0}
                                suffix={typeof latestTemp === 'number' ? "°C" : ""}
                                prefix={<AimOutlined style={{ color: "#f88601" }} />}
                                valueStyle={{ color: "#fff" }}
                                loading={tempLoading}
                            />
                            {tempData[0]?.device_id && (
                                <Text style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                                    Device: {tempData[0].device_id}
                                </Text>
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card bordered={false} className="dashboard-card">
                            <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.45)" }}>Signal Strength (RSRP)</span>}
                                value={latestRsrp}
                                suffix={typeof latestRsrp === 'number' ? " dBm" : ""}
                                prefix={<SignalFilled style={{ color: "#1890ff" }} />}
                                valueStyle={{ color: "#fff" }}
                                loading={rsrpLoading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card bordered={false} className="dashboard-card">
                            <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.45)" }}>Total Alerts</span>}
                                value={alertCount}
                                prefix={<AlertOutlined style={{ color: alertCount > 0 ? "#ff4d4f" : "#52c41a" }} />}
                                valueStyle={{ color: "#fff" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card bordered={false} className="dashboard-card">
                            <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.45)" }}>Active Devices</span>}
                                value={devicesLoading ? "--" : deviceIds.length}
                                suffix={devicesLoading ? "" : " Nodes"}
                                prefix={<DeploymentUnitOutlined style={{ color: "#52c41a" }} />}
                                valueStyle={{ color: "#52c41a" }}
                                loading={devicesLoading}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card
                            title={<span style={{ color: "#fff" }}>Temperature History <Tag color="orange">{tempData.length} readings</Tag></span>}
                            bordered={false} style={{ background: "#141b2d" }} className="shadow-premium"
                        >
                            <div style={{ height: 300 }}>
                                {tempLoading ? (
                                    <div style={centeredStyle}><Spin size="large" /></div>
                                ) : chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f88601" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f88601" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                                            <XAxis dataKey="time" stroke="#718096" fontSize={10} />
                                            <YAxis stroke="#718096" fontSize={10} domain={['auto', 'auto']} />
                                            <ChartTooltip
                                                contentStyle={{ background: "#1a202c", border: "1px solid #2d3748" }}
                                                labelFormatter={(_: any, items: readonly any[]) => items[0]?.payload?.fullTime ?? ""}
                                                itemStyle={{ color: "#f88601" }}
                                            />
                                            <Area type="monotone" dataKey="temp" name="°C" stroke="#f88601" fillOpacity={1} fill="url(#colorTemp)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={centeredStyle}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No temperature data." /></div>
                                )}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card
                            title={<span style={{ color: "#fff" }}>RSRP Signal <Tag color="blue">{rsrpData.length} readings</Tag></span>}
                            bordered={false} style={{ background: "#141b2d" }} className="shadow-premium"
                        >
                            <div style={{ height: 300 }}>
                                {rsrpLoading ? (
                                    <div style={centeredStyle}><Spin size="large" /></div>
                                ) : signalChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={signalChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                                            <XAxis dataKey="time" stroke="#718096" fontSize={10} />
                                            <YAxis stroke="#718096" fontSize={10} reversed domain={[0, 130]} />
                                            <ChartTooltip
                                                contentStyle={{ background: "#1a202c", border: "1px solid #2d3748" }}
                                                formatter={(_: any, __: any, props: any) => [`${props.payload.raw} dBm`, "RSRP"]}
                                            />
                                            <Bar dataKey="signal" name="RSRP" fill="#1890ff" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={centeredStyle}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No RSRP data." /></div>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* GNSS */}
                <Card
                    title={<span style={{ color: "#fff" }}><GlobalOutlined /> GNSS Trajectory <Tag color="orange">{gnssData.length} points</Tag></span>}
                    bordered={false} style={{ background: "#141b2d" }} className="shadow-premium"
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <div style={{ height: 380, background: '#0a0f1e', borderRadius: 8, padding: 8 }}>
                                {gnssLoading ? (
                                    <div style={centeredStyle}><Spin /></div>
                                ) : mapData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                                            <XAxis type="number" dataKey="x" name="Lng" domain={['auto', 'auto']} hide />
                                            <YAxis type="number" dataKey="y" name="Lat" domain={['auto', 'auto']} hide />
                                            <ZAxis type="category" dataKey="name" name="Time" />
                                            <ChartTooltip contentStyle={{ background: "#1a202c", border: "1px solid #2d3748" }} />
                                            <Scatter data={mapData} fill="#f88601" line={{ stroke: '#f88601', strokeWidth: 1.5, strokeDasharray: '4 2' }} />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={centeredStyle}><Empty description={<span style={{ color: 'rgba(255,255,255,0.4)' }}>No GNSS data.</span>} /></div>
                                )}
                            </div>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>Latest Coordinates</Text>
                            <Table
                                dataSource={gnssData as any[]}
                                loading={gnssLoading}
                                pagination={{ pageSize: 8, simple: true }}
                                size="small"
                                rowKey="id"
                                className="industrial-table"
                                style={{ marginTop: 8 }}
                                columns={[
                                    { title: 'Lat', dataIndex: 'lat', render: (v: any) => parseFloat(v).toFixed(5) },
                                    { title: 'Lng', dataIndex: 'lng', render: (v: any) => parseFloat(v).toFixed(5) },
                                    { title: 'Time', dataIndex: 'ts', width: 90, render: (v: any) => dayjs(v).format("HH:mm:ss") },
                                ]}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Logs, Raw, Status Tabs */}
                <Card bordered={false} style={{ background: "#141b2d" }} className="shadow-premium">
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
                        {
                            key: '2',
                            label: <span><DatabaseOutlined /> Raw Messages</span>,
                            children: (
                                <Table
                                    {...rawTableProps} rowKey="id" size="small" className="industrial-table"
                                    columns={[
                                        { title: "Received", dataIndex: "received_at", width: 130, render: (v: any) => dayjs(v).format("HH:mm:ss.SSS") },
                                        { title: "Device", dataIndex: "device_id", width: 140 },
                                        { title: "App", dataIndex: "app_id", width: 90, render: (v: any) => <Tag style={{ borderColor: '#f88601', color: '#f88601', background: 'transparent' }}>{v}</Tag> },
                                        {
                                            title: "Payload", dataIndex: "payload",
                                            render: (p: any) => (
                                                <Tooltip title="Click to copy">
                                                    <pre onClick={() => navigator.clipboard.writeText(JSON.stringify(p, null, 2))}
                                                        style={{ fontSize: 10, margin: 0, color: '#52c41a', cursor: 'pointer', maxHeight: 80, overflow: 'auto' }}>
                                                        {JSON.stringify(p)}
                                                    </pre>
                                                </Tooltip>
                                            )
                                        },
                                    ]}
                                />
                            ),
                        },
                        {
                            key: '3',
                            label: <span><FileSearchOutlined /> Device Status</span>,
                            children: (
                                <Table
                                    dataSource={devicesData as any[]} loading={devicesLoading}
                                    rowKey="id" size="small" className="industrial-table"
                                    columns={[
                                        { title: "Device ID", dataIndex: "device_id" },
                                        { title: "Firmware", dataIndex: "firmware" },
                                        { title: "Battery", dataIndex: "battery_mv", render: (v: any) => <Text style={{ color: v < 3600 ? '#ff4d4f' : '#52c41a' }}>{v} mV</Text> },
                                        { title: "Operator", dataIndex: "operator" },
                                        { title: "IP", dataIndex: "ip_address", render: (v: any) => <code style={{ color: '#aaa', fontSize: 11 }}>{v}</code> },
                                        { title: "Last Seen", dataIndex: "ts", render: (v: any) => <Badge status="processing" text={dayjs(v).fromNow()} /> },
                                    ]}
                                />
                            ),
                        },
                    ]} />
                </Card>
            </Space>

            <style>{`
                .shadow-premium { box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important; }
                .dashboard-card {
                    background: #141b2d !important;
                    border: 1px solid rgba(255,255,255,0.05) !important;
                    transition: all 0.2s;
                }
                .dashboard-card:hover {
                    border-color: rgba(248,134,1,0.3) !important;
                    transform: translateY(-2px);
                }
                .industrial-table .ant-table { background: transparent !important; }
                .industrial-table .ant-table-thead > tr > th {
                    background: #0f172a !important;
                    color: rgba(255,255,255,0.45) !important;
                    border-bottom: 1px solid #1e293b !important;
                    font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .industrial-table .ant-table-tbody > tr > td { border-bottom: 1px solid #1e293b !important; font-size: 12px; }
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
