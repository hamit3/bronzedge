import React, { useState, useMemo } from "react";
import { useList } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Tabs, Row, Col, Select, DatePicker, Spin, Typography, Space, Empty, Segmented, Card } from "antd";
import dayjs from "dayjs";
import { ActivityTab } from "./ActivityTab";
import { PlaybackTab } from "./PlaybackTab";
import { deriveSessions } from "./utils";
import { useOrganization } from "../../contexts/organization";
import { FlipReading, DeviceMessage } from "./types";
import { supabaseClient } from "../../providers/supabase-client";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

export const ReportList: React.FC = () => {
    const { activeOrgId } = useOrganization();
    const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
    const [quickFilter, setQuickFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().subtract(30, "day").startOf("day"),
        dayjs().endOf("day"),
    ]);

    // Fetch devices for selector
    const { query: devicesQuery } = useList({
        resource: "devices",
        filters: activeOrgId
            ? [{ field: "organization_id", operator: "eq", value: activeOrgId }]
            : [],
        pagination: { pageSize: 500 },
    });

    const devices = (devicesQuery.data?.data || []) as any[];
    const isLoadingDevices = devicesQuery.isLoading;

    // Fetch flip_readings
    const { query: readingsQuery } = useList<FlipReading>({
        resource: "flip_readings",
        filters: [
            { field: "device_id", operator: "eq", value: selectedDevice?.device_id }, // NRF SERIAL ID
            ...(quickFilter !== "all" ? [
                { field: "ts", operator: "gte", value: dateRange[0].toISOString() },
                { field: "ts", operator: "lte", value: dateRange[1].toISOString() },
            ] : []),
        ] as any,
        sorters: [{ field: "ts", order: "asc" }],
        pagination: { pageSize: 15000 },
        queryOptions: { enabled: !!selectedDevice?.device_id && !!activeOrgId },
    });

    // Fetch locations from gnss_readings (same as activity)
    const { query: locationsQuery } = useList<any>({
        resource: "gnss_readings",
        filters: [
            { field: "device_id", operator: "eq", value: selectedDevice?.device_id }, // NRF SERIAL ID
            ...(quickFilter !== "all" ? [
                { field: "ts", operator: "gte", value: dateRange[0].toISOString() },
                { field: "ts", operator: "lte", value: dateRange[1].toISOString() },
            ] : []),
        ] as any,
        sorters: [{ field: "ts", order: "asc" }],
        pagination: { pageSize: 15000 },
        queryOptions: { enabled: !!selectedDevice?.device_id && !!activeOrgId },
    });

    const isLoadingReadings = readingsQuery.isLoading;
    const isLoadingLocations = locationsQuery.isLoading;
    const isLoading = isLoadingReadings || isLoadingLocations;

    const sessions = useMemo(() => {
        return readingsQuery.data?.data ? deriveSessions(readingsQuery.data.data) : [];
    }, [readingsQuery.data]);

    const locations = locationsQuery.data?.data || [];

    const handleDeviceChange = (id: string) => {
        const device = devices.find(d => d.id === id);
        setSelectedDevice(device || null);
    };

    const handleDateChange = (dates: any) => {
        if (dates && dates[0] && dates[1]) {
            setDateRange([dates[0], dates[1]]);
            setQuickFilter("custom");
        }
    };

    const handleQuickFilter = (value: string) => {
        setQuickFilter(value);
        if (value === "all") return;

        const end = dayjs().endOf("day");
        let start = dayjs().subtract(7, "day").startOf("day");

        if (value === "24h") start = dayjs().subtract(24, "hour");
        else if (value === "7d") start = dayjs().subtract(7, "day").startOf("day");
        else if (value === "30d") start = dayjs().subtract(30, "day").startOf("day");
        else if (value === "90d") start = dayjs().subtract(90, "day").startOf("day");

        setDateRange([start, end]);
    };

    return (
        <List title={<Title level={3} style={{ margin: 0 }}>Equipment Reports</Title>}>
            <div style={{ padding: "0 0 24px 0" }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col>
                        <Select
                            placeholder="Select device"
                            style={{ width: 250 }}
                            onChange={handleDeviceChange}
                            loading={isLoadingDevices}
                            value={selectedDevice?.id}
                        >
                            {devices.map((d: any) => (
                                <Option key={d.id} value={d.id}>
                                    {d.name || d.device_id}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Space>
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
                            />
                            <RangePicker
                                onChange={handleDateChange}
                                value={dateRange}
                                showTime
                                format="YYYY-MM-DD HH:mm"
                                style={{ width: 320 }}
                                disabled={quickFilter === "all"}
                            />
                        </Space>
                    </Col>
                </Row>
            </div>

            {selectedDevice && (
                <div style={{ marginBottom: 16 }}>
                    <Space>
                        <Text type="secondary">Status:</Text>
                        {isLoading ? <Spin size="small" /> : <Text strong>{readingsQuery.data?.total || 0} activity points + {locationsQuery.data?.total || 0} locations found</Text>}
                    </Space>
                </div>
            )}

            {!selectedDevice ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Select a device to view reports"
                    style={{ padding: "60px 0" }}
                />
            ) : isLoading ? (
                <div style={{ padding: "100px 0", textAlign: "center" }}>
                    <Spin size="large" tip="Processing activity data..." />
                </div>
            ) : (
                <>
                    <Tabs
                        defaultActiveKey="1"
                        items={[
                            {
                                key: "1",
                                label: "Activity Analysis",
                                children: <ActivityTab sessions={sessions} />,
                            },
                            {
                                key: "2",
                                label: "Location Playback",
                                children: <PlaybackTab locations={locations} sessions={sessions} />,
                            },
                        ]}
                    />
                </>
            )}
            <style>{`
        .kpi-card {
            border: 1px solid rgba(255,255,255,0.06) !important;
            transition: all 0.2s;
            background: rgba(255,255,255,0.02) !important;
        }
        .kpi-card:hover {
            border-color: rgba(248,134,1,0.3) !important;
            transform: translateY(-2px);
        }
        .ant-tabs-tab { color: rgba(255,255,255,0.4) !important; }
        .ant-tabs-tab-active .ant-tabs-tab-btn { color: #f88601 !important; font-weight: 600 !important; }
        .ant-tabs-ink-bar { background: #f88601 !important; }
        .ant-table { background: transparent !important; }
        .ant-table-thead > tr > th {
            background: rgba(255,255,255,0.02) !important;
            color: rgba(255,255,255,0.45) !important;
            border-bottom: 1px solid rgba(255,255,255,0.08) !important;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .ant-table-tbody > tr > td {
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        }
        .ant-table-tbody > tr:hover > td {
            background: rgba(248,134,1,0.04) !important;
        }
      `}</style>
        </List>
    );
};
