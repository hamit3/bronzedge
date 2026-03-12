import React, { useState, useMemo } from "react";
import { useList } from "@refinedev/core";
import { Select, DatePicker, Spin, Typography, Space, Empty, Segmented } from "antd";
import dayjs from "dayjs";
import { PlaybackTab } from "./PlaybackTab";
import { deriveSessions } from "./utils";
import { useOrganization } from "../../contexts/organization";
import { FlipReading } from "./types";
import { PageHeader } from "../../components/PageHeader";
import { FilterContainer } from "../../components/FilterContainer";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

export const LocationPlaybackPage: React.FC = () => {
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

    // Fetch locations from gnss_readings
    const { query: locationsQuery } = useList<any>({
        resource: "gnss_readings",
        filters: [
            { field: "device_id", operator: "eq", value: selectedDevice?.device_id },
            ...(quickFilter !== "all" ? [
                { field: "ts", operator: "gte", value: dateRange[0].toISOString() },
                { field: "ts", operator: "lte", value: dateRange[1].toISOString() },
            ] : []),
        ] as any,
        sorters: [{ field: "ts", order: "asc" }],
        pagination: { pageSize: 15000 },
        queryOptions: { enabled: !!selectedDevice?.device_id && !!activeOrgId },
    });

    // Fetch flip_readings for session highlighting in playback if needed
    const { query: readingsQuery } = useList<FlipReading>({
        resource: "flip_readings",
        filters: [
            { field: "device_id", operator: "eq", value: selectedDevice?.device_id },
            ...(quickFilter !== "all" ? [
                { field: "ts", operator: "gte", value: dateRange[0].toISOString() },
                { field: "ts", operator: "lte", value: dateRange[1].toISOString() },
            ] : []),
        ] as any,
        sorters: [{ field: "ts", order: "asc" }],
        pagination: { pageSize: 15000 },
        queryOptions: { enabled: !!selectedDevice?.device_id && !!activeOrgId },
    });

    const isLoading = locationsQuery.isLoading || readingsQuery.isLoading;
    const locations = locationsQuery.data?.data || [];
    const sessions = useMemo(() => {
        return readingsQuery.data?.data ? deriveSessions(readingsQuery.data.data) : [];
    }, [readingsQuery.data]);

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
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader 
                title="Location Playback" 
                subtitle={`Track and replay historical device movements — ${dayjs().format('DD.MM.YYYY HH:mm')}`} 
            />

            <FilterContainer 
                title="Playback Filters"
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
                            onChange={handleDateChange}
                            value={dateRange}
                            showTime
                            format="YYYY-MM-DD HH:mm"
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
                    placeholder="Select device"
                    style={{ width: 250 }}
                    onChange={handleDeviceChange}
                    loading={isLoadingDevices}
                    value={selectedDevice?.id}
                    className="premium-select"
                >
                    {devices.map((d: any) => (
                        <Option key={d.id} value={d.id}>
                            {d.name || d.device_id}
                        </Option>
                    ))}
                </Select>
            </FilterContainer>

            {selectedDevice && (
                <div style={{ marginBottom: 16 }}>
                    <Space>
                        <Text type="secondary">Status:</Text>
                        {isLoading ? <Spin size="small" /> : <Text strong>{locations.length} movement points found</Text>}
                    </Space>
                </div>
            )}

            {!selectedDevice ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Select a device to view playback"
                    style={{ padding: "60px 0" }}
                />
            ) : isLoading ? (
                <div style={{ padding: "100px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <Spin size="large" />
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>Processing movement data...</span>
                </div>
            ) : (
                <div style={{ marginTop: 24 }}>
                    <PlaybackTab locations={locations} sessions={sessions} />
                </div>
            )}
            <style>{`
                .premium-segmented .ant-segmented-item-label {
                    font-weight: 700;
                    font-size: 11px;
                    padding: 0 16px;
                }
                .premium-select .ant-select-selector {
                    background: rgba(255,255,255,0.03) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
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
        </div>
    );
};
