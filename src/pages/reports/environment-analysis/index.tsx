import React, { useState, useMemo, useEffect } from "react";
import { useList } from "@refinedev/core";
import { 
    Select, 
    DatePicker, 
    Spin, 
    Typography, 
    Space, 
    Empty, 
    Segmented, 
    Row, 
    Col, 
    Card, 
    Table, 
    Tag 
} from "antd";
import { 
    DashboardOutlined, 
    HeatMapOutlined, 
    CloudOutlined, 
    ThunderboltOutlined,
    InfoCircleOutlined,
    BarChartOutlined,
    AreaChartOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from "recharts";
import { useOrganization } from "../../../contexts/organization";
import { PageHeader } from "../../../components/PageHeader";
import { FilterContainer } from "../../../components/FilterContainer";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;

export const EnvironmentAnalysisPage: React.FC = () => {
    const { activeOrgId } = useOrganization();
    const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
    const [quickFilter, setQuickFilter] = useState<string>("24h");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().subtract(24, "hour"),
        dayjs().endOf("day"),
    ]);

    // Fetch devices
    const { query: devicesQuery } = useList({
        resource: "devices",
        filters: activeOrgId ? [{ field: "organization_id", operator: "eq", value: activeOrgId }] : [],
        pagination: { pageSize: 500 },
        queryOptions: { enabled: !!activeOrgId },
    });

    const devices = (devicesQuery.data?.data || []) as any[];
    const isLoadingDevices = devicesQuery.isLoading;

    // Auto-select first device with delay
    useEffect(() => {
        if (!isLoadingDevices && devices.length > 0 && !selectedDevice) {
            const timer = setTimeout(() => {
                React.startTransition(() => {
                    setSelectedDevice(devices[0]);
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoadingDevices, devices.length, !!selectedDevice]);

    // Latest Summary (from view)
    const { query: latestQuery } = useList({
        resource: "v_latest_combined",
        filters: selectedDevice ? [{ field: "device_id", operator: "eq", value: selectedDevice.device_id }] : [],
        queryOptions: { enabled: !!selectedDevice?.device_id },
    });
    const latest = latestQuery.data?.data?.[0];

    // BME688 Readings (Historical)
    const { query: bmeQuery } = useList({
        resource: "bme688_readings",
        filters: [
            { field: "device_id", operator: "eq", value: selectedDevice?.device_id },
            { field: "measured_at", operator: "gte", value: dateRange[0].toISOString() },
            { field: "measured_at", operator: "lte", value: dateRange[1].toISOString() },
        ],
        sorters: [{ field: "measured_at", order: "asc" }],
        pagination: { pageSize: 2000 },
        queryOptions: { enabled: !!selectedDevice?.device_id && quickFilter !== "all" },
    });

    // SCD41 Readings (Historical)
    const { query: scdQuery } = useList({
        resource: "scd41_readings",
        filters: [
            { field: "device_id", operator: "eq", value: selectedDevice?.device_id },
            { field: "measured_at", operator: "gte", value: dateRange[0].toISOString() },
            { field: "measured_at", operator: "lte", value: dateRange[1].toISOString() },
        ],
        sorters: [{ field: "measured_at", order: "asc" }],
        pagination: { pageSize: 2000 },
        queryOptions: { enabled: !!selectedDevice?.device_id && quickFilter !== "all" },
    });

    const isLoading = bmeQuery.isLoading || scdQuery.isLoading;

    const bmeData = (bmeQuery.data?.data || []) as any[];
    const scdData = (scdQuery.data?.data || []) as any[];

    // Table Data (Combined for display)
    const tableData = useMemo(() => {
        return [...bmeData].reverse(); // All available readings, reversed for latest first
    }, [bmeData]);

    const handleQuickFilter = (value: string) => {
        setQuickFilter(value);
        const end = dayjs().endOf("day");
        let start = dayjs().subtract(7, "day").startOf("day");

        if (value === "24h") start = dayjs().subtract(24, "hour");
        else if (value === "7d") start = dayjs().subtract(7, "day").startOf("day");
        else if (value === "30d") start = dayjs().subtract(30, "day").startOf("day");
        
        setDateRange([start, end]);
    };

    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader
                title="Environment Analysis"
                subtitle="Advanced climate and air quality monitoring powered by BME688 AI Gas & SCD41 PAS CO2 sensors."
            />

            <FilterContainer
                title="Analysis Filters"
                extra={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <Segmented
                            options={[
                                { label: '24H', value: '24h' },
                                { label: '7D', value: '7d' },
                                { label: '30D', value: '30d' },
                            ]}
                            value={quickFilter}
                            onChange={(v) => handleQuickFilter(v as string)}
                            className="premium-segmented"
                        />
                        <RangePicker
                            showTime
                            value={dateRange}
                            onChange={(dates: any) => dates && setDateRange([dates[0], dates[1]])}
                            style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                width: 320 
                            }}
                            className="premium-datepicker"
                        />
                    </div>
                }
            >
                <Select
                    placeholder="Select device"
                    style={{ width: 250 }}
                    value={selectedDevice?.id}
                    onChange={(id) => setSelectedDevice(devices.find(d => d.id === id))}
                    loading={isLoadingDevices}
                    className="premium-select"
                >
                    {devices.map(d => (
                        <Option key={d.id} value={d.id}>
                            {d.name || d.device_id}
                        </Option>
                    ))}
                </Select>
            </FilterContainer>

            {selectedDevice ? (
                <>
                    {/* Summary Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} md={6}>
                            <StatusCard 
                                title="Temperature" 
                                value={latest?.bme_temp_c ? `${latest.bme_temp_c}°C` : "—"} 
                                icon={<HeatMapOutlined />} 
                                color="#f88601"
                                subtext="Ambient Sensor"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatusCard 
                                title="CO2 Concentration" 
                                value={latest?.co2_ppm ? `${latest.co2_ppm} ppm` : "—"} 
                                icon={<DashboardOutlined />} 
                                color="#52c41a"
                                subtext="NDIR PAS Technology"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatusCard 
                                title="Air Quality Score" 
                                value={latest?.iaq_score || "—"} 
                                icon={<ThunderboltOutlined />} 
                                color={latest?.iaq_score < 80 ? "#52c41a" : latest?.iaq_score < 150 ? "#faad14" : "#ff4d4f"}
                                subtext={`Acc: ${latest?.iaq_accuracy || 0}/3 Grade`}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatusCard 
                                title="Humidity" 
                                value={latest?.bme_humidity ? `${latest.bme_humidity}%` : "—"} 
                                icon={<CloudOutlined />} 
                                color="#1890ff"
                                subtext="Relative Humidity"
                            />
                        </Col>
                    </Row>

                    {/* Primary Charts */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} lg={12}>
                            <ChartCard title="Temperature & Humidity Trends (BME688)">
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={bmeData}>
                                        <defs>
                                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f88601" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f88601" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis 
                                            dataKey="measured_at" 
                                            tickFormatter={(v) => dayjs(v).format("HH:mm")}
                                            stroke="rgba(255,255,255,0.3)"
                                            fontSize={10}
                                            tick={{ fill: 'rgba(255,255,255,0.45)' }}
                                        />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.45)' }} />
                                        <RechartsTooltip 
                                            contentStyle={{ background: "#161f33", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                                            itemStyle={{ fontSize: 12, padding: "2px 0" }}
                                        />
                                        <Area type="monotone" dataKey="temperature_c" stroke="#f88601" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" name="Temperature °C" />
                                        <Area type="monotone" dataKey="humidity_pct" stroke="#1890ff" strokeWidth={2} fillOpacity={0} name="Humidity %" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </Col>
                        <Col xs={24} lg={12}>
                            <ChartCard title="Carbon Dioxide (CO2) Levels (SCD41)">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={scdData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis 
                                            dataKey="measured_at" 
                                            tickFormatter={(v) => dayjs(v).format("HH:mm")}
                                            stroke="rgba(255,255,255,0.3)"
                                            fontSize={10}
                                            tick={{ fill: 'rgba(255,255,255,0.45)' }}
                                        />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.45)' }} />
                                        <RechartsTooltip 
                                            contentStyle={{ background: "#161f33", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                        <Line type="monotone" dataKey="co2_ppm" stroke="#52c41a" strokeWidth={3} dot={false} name="CO2 ppm" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </Col>
                    </Row>

                    {/* Secondary Metrics */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={24}>
                            <ChartCard title="Indoor Air Quality (IAQ) Index & VOC equivalent">
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={bmeData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis 
                                            dataKey="measured_at" 
                                            tickFormatter={(v) => dayjs(v).format("DD/MM HH:mm")}
                                            stroke="rgba(255,255,255,0.3)"
                                            fontSize={10}
                                            tick={{ fill: 'rgba(255,255,255,0.45)' }}
                                        />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.45)' }} />
                                        <RechartsTooltip 
                                            contentStyle={{ background: "#161f33", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                                        />
                                        <Area type="monotone" dataKey="iaq_score" stroke="#faad14" strokeWidth={2} fill="rgba(250, 173, 20, 0.05)" name="IAQ Score" />
                                        <Area type="monotone" dataKey="voc_equivalent_ppm" stroke="#eb2f96" fill="transparent" name="VOC ppm equiv." />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </Col>
                    </Row>

                    {/* Detailed Log Table */}
                    <Card 
                        title={
                            <Space>
                                <BarChartOutlined />
                                <span>Detailed Reading History (Last 50 Records)</span>
                            </Space>
                        } 
                        className="shadow-premium" 
                        styles={{ body: { padding: 0 } }} 
                        style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}
                    >
                         <Table
                            dataSource={tableData}
                            rowKey="reading_id"
                            pagination={{ pageSize: 15, position: ['bottomCenter'] }}
                            size="middle"
                            className="premium-dark-table account-table"
                            columns={[
                                { 
                                    title: 'Measured At', 
                                    dataIndex: 'measured_at', 
                                    render: (v) => <Text style={{ color: 'rgba(255,255,255,0.85)' }}>{dayjs(v).format("YYYY-MM-DD HH:mm:ss")}</Text> 
                                },
                                { title: 'Temp', dataIndex: 'temperature_c', render: (v) => `${v}°C` },
                                { title: 'Humidity', dataIndex: 'humidity_pct', render: (v) => `${v}%` },
                                { title: 'Pressure', dataIndex: 'pressure_hpa', render: (v) => `${v} hPa` },
                                { title: 'IAQ', dataIndex: 'iaq_score', render: (v) => <Tag color={v < 100 ? "green" : "orange"} bordered={false}>{v}</Tag> },
                                { title: 'Gas Resistance', dataIndex: 'gas_resistance_ohm', render: (v) => <Text type="secondary">{(v/1000).toFixed(1)} kΩ</Text> },
                            ]}
                         />
                    </Card>
                </>
            ) : (
                <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Select a device to start environment analysis" 
                    style={{ marginTop: 100 }} 
                />
            )}

            <style>{`
                .premium-select .ant-select-selector {
                    background: rgba(255,255,255,0.03) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    height: 32px !important;
                }
                .premium-segmented.ant-segmented { 
                    background: rgba(255,255,255,0.03) !important; 
                    padding: 2px !important; 
                }
                .premium-datepicker {
                    background: rgba(255,255,255,0.03) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
                .account-table .ant-table {
                  background: transparent !important;
                }
            `}</style>
        </div>
    );
};

const StatusCard = ({ title, value, icon, color, subtext }: any) => (
    <Card 
        className="shadow-premium" 
        variant="borderless"
        style={{ 
            background: '#0d1424', 
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: 12,
            height: '100%'
        }}
    >
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{title}</Text>
                <div style={{ color: color, fontSize: 20 }}>{icon}</div>
            </div>
            <Title level={4} style={{ margin: '4px 0', color: '#fff', fontWeight: 700 }}>{value}</Title>
            <Text type="secondary" style={{ fontSize: 10, opacity: 0.7 }}>{subtext}</Text>
        </Space>
    </Card>
);

const ChartCard = ({ title, children }: any) => (
    <Card 
        title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AreaChartOutlined style={{ color: '#f88601' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{title}</span>
            </div>
        }
        className="shadow-premium"
        variant="borderless"
        style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}
    >
        {children}
    </Card>
);
