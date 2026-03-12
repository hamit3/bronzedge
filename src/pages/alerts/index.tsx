import React, { useMemo, useState } from "react";
import { useList } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Table, Typography, Tag, Space, Card, Spin, Select, DatePicker, Segmented, ConfigProvider, theme } from "antd";
import { 
    WarningOutlined, 
    InfoCircleOutlined, 
    ExclamationCircleOutlined, 
    FilterOutlined,
    CheckCircleOutlined,
    ThunderboltOutlined,
    AlertOutlined,
    CloudOutlined,
    HeatMapOutlined,
    MailOutlined,
    StopOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useOrganization } from "../../contexts/organization";
import { PageHeader } from "../../components/PageHeader";
import { FilterContainer } from "../../components/FilterContainer";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * Mapping for Alert Types as requested by USER:
 * 1: ONLINE
 * 2: REBOOT WARNING
 * 3: OFFLINE
 * 4: MSG (General)
 * 5: TEMPERATURE LIMIT
 * 6: HUMIDITY LIMIT
 * 7: LOW BATTERY
 * 8: SHOCK/VIBRATION
 * 9+: CUSTOM
 */
const getAlertTypeDetails = (type: any) => {
    const t = Number(type);
    
    switch (t) {
        case 1:
            return { color: "#52c41a", label: "Online", icon: <CheckCircleOutlined /> };
        case 2:
            return { color: "#faad14", label: "Reboot Warning", icon: <WarningOutlined /> };
        case 3:
            return { color: "#ff4d4f", label: "Going Offline", icon: <StopOutlined /> };
        case 4:
            return { color: "#1890ff", label: "General Message", icon: <MailOutlined /> };
        case 5:
            return { color: "#f5222d", label: "Temp Limit", icon: <HeatMapOutlined /> };
        case 6:
            return { color: "#13c2c2", label: "Humidity Limit", icon: <CloudOutlined /> };
        case 7:
            return { color: "#fadb14", label: "Low Battery", icon: <ThunderboltOutlined /> };
        case 8:
            return { color: "#eb2f96", label: "Shock/Vibration", icon: <AlertOutlined /> };
        default:
            if (t >= 9) return { color: "#722ed1", label: "Custom Alert", icon: <ExclamationCircleOutlined /> };
            return { color: "rgba(255,255,255,0.25)", label: `Type ${type}`, icon: <InfoCircleOutlined /> };
    }
};

export const AlertsPage: React.FC = () => {
    const { activeOrgId } = useOrganization();
// ... (rest of the component state unchanged)
    // Filters
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [quickFilter, setQuickFilter] = useState<string>("7d");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
        dayjs().subtract(7, "day").startOf("day"),
        dayjs().endOf("day")
    ]);

    // Fetch Devices for current Org
    const { query: devicesQuery } = useList({
        resource: "devices",
        filters: activeOrgId ? [{ field: "organization_id", operator: "eq", value: activeOrgId }] : [],
        pagination: { pageSize: 500 },
        queryOptions: { enabled: !!activeOrgId },
    });

    const devices = (devicesQuery.data?.data || []) as any[];
    const deviceIds = useMemo(() => devices.map(d => d.device_id).filter(Boolean), [devices]);

    // Fetch Alerts
    const { query: alertsQuery } = useList({
        resource: "device_alerts",
        filters: [
            ...(selectedDevice
                ? [{ field: "device_id", operator: "eq", value: selectedDevice }]
                : deviceIds.length > 0
                    ? [{ field: "device_id", operator: "in", value: deviceIds }]
                    : [{ field: "device_id", operator: "eq", value: "none" }]
            ),
            ...(dateRange ? [
                { field: "ts", operator: "gte", value: dateRange[0].toISOString() },
                { field: "ts", operator: "lte", value: dateRange[1].toISOString() },
            ] : []),
        ] as any,
        sorters: [{ field: "ts", order: "desc" }],
        pagination: { pageSize: 500 },
        queryOptions: { enabled: devices.length > 0 },
    });

    const alerts = (alertsQuery.data?.data || []) as any[];
    const isLoading = alertsQuery.isLoading || devicesQuery.isLoading;

    const handleDateChange = (dates: any) => {
        if (dates && dates[0] && dates[1]) {
            setDateRange([dates[0], dates[1]]);
            setQuickFilter("custom");
        }
    };

    const handleQuickFilter = (value: string) => {
        setQuickFilter(value);
        if (value === "all") {
            setDateRange([dayjs().subtract(10, "year").startOf("day"), dayjs().endOf("day")]);
            return;
        }

        const end = dayjs().endOf("day");
        let start = dayjs().subtract(7, "day").startOf("day");

        if (value === "24h") start = dayjs().subtract(24, "hour");
        else if (value === "7d") start = dayjs().subtract(7, "day").startOf("day");
        else if (value === "30d") start = dayjs().subtract(30, "day").startOf("day");
        else if (value === "90d") start = dayjs().subtract(90, "day").startOf("day");

        setDateRange([start, end]);
    };

    const columns = [
        {
            title: "Time",
            dataIndex: "ts",
            key: "ts",
            width: 180,
            render: (value: string) => (
                <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                    {dayjs(value).format("YYYY-MM-DD HH:mm:ss")}
                </Text>
            )
        },
        {
            title: "Device",
            dataIndex: "device_id",
            key: "device_id",
            width: 200,
            render: (value: string) => {
                const device = devices.find(d => d.device_id === value);
                return (
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ color: "#f88601" }}>{device?.name || "Unknown Device"}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{String(value || "")}</Text>
                    </Space>
                );
            }
        },
        {
            title: "Alert Type",
            dataIndex: "type",
            key: "type",
            width: 180,
            render: (value: any) => {
                const { color, icon, label } = getAlertTypeDetails(value);
                return (
                    <Tag 
                        bordered={false}
                        style={{ 
                            backgroundColor: `${color}15`, 
                            color: color,
                            border: `1px solid ${color}30`,
                            borderRadius: "6px",
                            padding: "2px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontWeight: 600,
                            fontSize: "11px",
                            textTransform: "uppercase"
                        }}
                    >
                        {icon}
                        {label}
                    </Tag>
                );
            }
        },
        {
            title: "Value",
            dataIndex: "value",
            key: "value",
            width: 120,
            render: (value: any) => {
                const displayStr = typeof value === "object" ? JSON.stringify(value) : String(value || "—");
                return (
                    <Text style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 4 }}>
                        {displayStr}
                    </Text>
                );
            }
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (value: any) => {
                const descStr = typeof value === "object" ? JSON.stringify(value) : String(value || "No detailed description provided.");
                return (
                    <Text style={{ color: "rgba(255,255,255,0.65)" }}>{descStr}</Text>
                );
            }
        }
    ];

    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader 
                title="System Alerts" 
                subtitle={`Monitor critical events across your fleet — ${new Date().toLocaleString('tr-TR')}`} 
            />

            <FilterContainer 
                title="Alert Filters"
                extra={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <Segmented
                            options={[
                                { label: '24h', value: '24h' },
                                { label: '7D', value: '7d' },
                                { label: '30D', value: '30d' },
                                { label: '90D', value: '90d' },
                                { label: 'All', value: 'all' },
                                { label: 'Cust', value: 'custom', disabled: true },
                            ]}
                            value={quickFilter}
                            onChange={(value: string | number) => handleQuickFilter(value as string)}
                            className="premium-segmented"
                        />

                        <RangePicker
                            showTime
                            value={dateRange}
                            onChange={handleDateChange}
                            style={{
                                width: 320,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                            disabled={quickFilter === "all"}
                        />
                    </div>
                }
            >
                <Select
                    placeholder="All Devices"
                    allowClear
                    style={{ width: 250 }}
                    value={selectedDevice}
                    onChange={setSelectedDevice}
                    loading={devicesQuery.isLoading}
                    dropdownStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    {devices.map(d => (
                        <Option key={d.device_id} value={d.device_id}>
                            {d.name || d.device_id}
                        </Option>
                    ))}
                </Select>
            </FilterContainer>

            <Card
                variant="borderless"
                className="shadow-premium"
                styles={{ body: { padding: 0 } }}
                style={{
                    background: "#0d1424",
                    border: "1px solid rgba(255,255,255,0.06)",
                    overflow: "hidden"
                }}
            >
                <Table
                    dataSource={alerts}
                    rowKey="id"
                    columns={columns}
                    loading={{
                        spinning: isLoading,
                        indicator: <Spin size="large" />
                    }}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: false,
                        position: ["bottomCenter"]
                    }}
                    className="premium-dark-table"
                />
            </Card>

            <style>{`
                .shadow-premium { 
                    box-shadow: 0 4px 24px rgba(0,0,0,0.3) !important; 
                }
                .premium-segmented .ant-segmented-item-label {
                    font-weight: 700;
                    font-size: 11px;
                    padding: 0 16px;
                }
                .premium-segmented.ant-segmented {
                    padding: 3px;
                }
                .premium-dark-table .ant-table {
                    background: transparent !important;
                }
                .premium-dark-table .ant-table-thead > tr > th {
                    background: rgba(255,255,255,0.04) !important;
                    color: rgba(255,255,255,0.45) !important;
                    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 16px;
                }
                .premium-dark-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid rgba(255,255,255,0.04) !important;
                    padding: 16px;
                    transition: all 0.2s;
                }
                .premium-dark-table .ant-table-tbody > tr:hover > td {
                    background: rgba(248,134,1,0.06) !important;
                }
                .premium-dark-table .ant-table-pagination {
                    padding: 16px !important;
                    margin: 0 !important;
                    border-top: 1px solid rgba(255,255,255,0.04);
                }
            `}</style>
        </div>
    );
};
