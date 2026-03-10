import React, { useMemo, useState } from "react";
import { useList } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Table, Typography, Tag, Space, Card, Spin, Select, DatePicker } from "antd";
import { WarningOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useOrganization } from "../../contexts/organization";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export const AlertsPage: React.FC = () => {
    const { activeOrgId } = useOrganization();

    // Filters
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
        dayjs().subtract(7, "day"),
        dayjs()
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

    // Helper functions for design
    const getSeverityDetails = (type: any) => {
        const t = String(type || "").toLowerCase();
        if (t.includes("critical") || t.includes("error") || t.includes("crash") || t.includes("fall")) {
            return { color: "error", icon: <ExclamationCircleOutlined />, label: "CRITICAL" };
        }
        if (t.includes("warn") || t.includes("high") || t.includes("speed")) {
            return { color: "warning", icon: <WarningOutlined />, label: "WARNING" };
        }
        return { color: "processing", icon: <InfoCircleOutlined />, label: "INFO" };
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
            width: 150,
            render: (value: string) => {
                const { color, icon, label } = getSeverityDetails(value);
                return (
                    <Tag color={color} icon={icon} style={{ borderRadius: 4, padding: "2px 8px", border: "none" }}>
                        {String(value || label).toUpperCase()}
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
        <List title={<Title level={3} style={{ margin: 0 }}>System Alerts</Title>}>
            <Card
                style={{
                    marginBottom: 24,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(20,20,20,0.6)",
                    backdropFilter: "blur(10px)",
                }}
            >
                <Space wrap size="large">
                    <div>
                        <Text type="secondary" style={{ display: "block", marginBottom: 6, fontSize: 12 }}>Filter by Device</Text>
                        <Select
                            placeholder="All Devices"
                            allowClear
                            style={{ width: 250 }}
                            value={selectedDevice}
                            onChange={setSelectedDevice}
                            loading={devicesQuery.isLoading}
                        >
                            {devices.map(d => (
                                <Option key={d.device_id} value={d.device_id}>
                                    {d.name || d.device_id}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Text type="secondary" style={{ display: "block", marginBottom: 6, fontSize: 12 }}>Date Range</Text>
                        <RangePicker
                            showTime
                            value={dateRange}
                            onChange={(dates: any) => setDateRange(dates)}
                            style={{ width: 320 }}
                        />
                    </div>
                </Space>
            </Card>

            <Card
                styles={{ body: { padding: 0 } }}
                style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(20,20,20,0.4)",
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
                .premium-dark-table .ant-table {
                    background: transparent !important;
                }
                .premium-dark-table .ant-table-thead > tr > th {
                    background: rgba(255,255,255,0.02) !important;
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
                    background: rgba(248,134,1,0.04) !important;
                }
                .premium-dark-table .ant-table-pagination {
                    padding: 16px !important;
                    margin: 0 !important;
                    border-top: 1px solid rgba(255,255,255,0.04);
                }
            `}</style>
        </List>
    );
};
