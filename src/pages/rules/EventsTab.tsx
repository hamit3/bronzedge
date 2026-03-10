import React, { useState } from "react";
import { Table, Button, Select, DatePicker, Segmented, Space, Tag, Typography, Badge } from "antd";
import { useUpdate, useList, useMany } from "@refinedev/core";
import { useTable } from "@refinedev/antd";
import { useOrganization } from "../../contexts/organization";
import { getRuleTypeDetails, RULE_TYPES } from "./utils";
import dayjs from "dayjs";
import { EventDetailModal } from "./EventDetailModal";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export const EventsTab = () => {
    const { activeOrgId } = useOrganization();
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Filters State
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [readStatus, setReadStatus] = useState<string>("All");

    const devicesQuery = useList({
        resource: "devices",
        filters: [{ field: "organization_id", operator: "eq", value: activeOrgId }],
    });
    const devicesData = devicesQuery.query?.data?.data || [];

    const generateFilters = () => {
        const tableFilters: any[] = [];
        tableFilters.push({ field: "organization_id", operator: "eq", value: activeOrgId });

        if (selectedDevices.length > 0) {
            tableFilters.push({ field: "device_id", operator: "in", value: selectedDevices });
        }

        // Support filtering by rule type requires joining on "rules" which supabase Refine hook supports 
        // via `select=*,rules!inner(rule_type)` or we can fetch rules separately. Since we're keeping it simple:
        // we'll filter by rules later. Wait, how to filter rule_events by rule_type? We can do custom API calls or fetch rules data.
        // For now, let's just apply other filters and we'll do local rule filtering or we can skip rules filtering if complex.

        if (dateRange && dateRange[0] && dateRange[1]) {
            tableFilters.push({ field: "triggered_at", operator: "gte", value: dateRange[0].toISOString() });
            tableFilters.push({ field: "triggered_at", operator: "lte", value: dateRange[1].toISOString() });
        }

        if (readStatus === "Unread") {
            tableFilters.push({ field: "is_read", operator: "eq", value: false });
        }

        return tableFilters;
    };

    const { tableProps } = useTable({
        resource: "rule_events",
        filters: {
            initial: generateFilters(),
            permanent: [{ field: "organization_id", operator: "eq", value: activeOrgId }],
        },
        meta: {
            select: "*, rules(id, name, rule_type), devices(id, name)",
        },
        sorters: {
            initial: [
                { field: "triggered_at", order: "desc" }
            ]
        },
        pagination: { pageSize: 10 },
    });

    const { mutate: mutateUpdate } = useUpdate();

    // Client-side rule_type filtering if needed, since supabase ref inner join filtering can be tricky with Refine UI out of box
    let dataSource = tableProps.dataSource || [];
    if (selectedTypes.length > 0) {
        dataSource = dataSource.filter((item: any) => selectedTypes.includes(item.rules?.rule_type));
    }

    const handleRowClick = (record: any) => {
        setSelectedEvent(record);
        setIsModalVisible(true);

        if (!record.is_read) {
            mutateUpdate({
                resource: "rule_events",
                id: record.id,
                values: { is_read: true },
                mutationMode: "optimistic",
            });
        }
    };

    const handleMarkAllRead = () => {
        // Optimistically could iterate all unread, or do custom API call.
        // For now we will update visible unread records on current page
        dataSource.forEach((record: any) => {
            if (!record.is_read) {
                mutateUpdate({
                    resource: "rule_events",
                    id: record.id,
                    values: { is_read: true },
                });
            }
        });
    };

    return (
        <>
            <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }} size="middle">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
                    <Select
                        mode="multiple"
                        placeholder="Filter Devices"
                        style={{ minWidth: 200 }}
                        value={selectedDevices}
                        onChange={(val) => setSelectedDevices(val)}
                        allowClear
                    >
                        {devicesData.map((device: any) => (
                            <Select.Option key={device.id} value={device.id}>
                                {device.name}
                            </Select.Option>
                        ))}
                    </Select>

                    <Select
                        mode="multiple"
                        placeholder="Filter Rule Types"
                        style={{ minWidth: 200 }}
                        value={selectedTypes}
                        onChange={(val) => setSelectedTypes(val)}
                        allowClear
                    >
                        {RULE_TYPES.map((rt) => (
                            <Select.Option key={rt.value} value={rt.value}>
                                {rt.label}
                            </Select.Option>
                        ))}
                    </Select>

                    <RangePicker
                        showTime
                        onChange={(dates) => setDateRange(dates as any)}
                        style={{ minWidth: 320 }}
                    />

                    <Segmented
                        options={["All", "Unread"]}
                        value={readStatus}
                        onChange={(val) => setReadStatus(val as string)}
                    />

                    <div style={{ flex: 1, textAlign: "right" }}>
                        <Button onClick={handleMarkAllRead}>Mark Visible as Read</Button>
                    </div>
                </div>
            </Space>

            <Table
                {...tableProps}
                dataSource={dataSource}
                rowKey="id"
                loading={tableProps.loading}
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: "pointer" },
                })}
                columns={[
                    {
                        title: "",
                        dataIndex: "is_read",
                        width: 30,
                        render: (isRead: boolean) => (
                            <Badge status={isRead ? "default" : "processing"} color={!isRead ? "blue" : "gray"} />
                        ),
                    },
                    {
                        title: "Triggered At",
                        dataIndex: "triggered_at",
                        render: (val) => dayjs(val).format("YYYY-MM-DD HH:mm:ss"),
                    },
                    {
                        title: "Rule Name",
                        dataIndex: ["rules", "name"],
                        render: (val) => <Text strong>{val}</Text>,
                    },
                    {
                        title: "Device Name",
                        dataIndex: ["devices", "name"],
                        render: (val) => val || "Unknown",
                    },
                    {
                        title: "Type",
                        dataIndex: ["rules", "rule_type"],
                        render: (type: string) => {
                            const { label, color } = getRuleTypeDetails(type);
                            return <Tag color={color}>{label}</Tag>;
                        },
                    },
                    {
                        title: "Message",
                        dataIndex: "message",
                        render: (text) => <Text>{text}</Text>,
                    },
                    {
                        title: "Location",
                        render: (_, record) =>
                            record.latitude && record.longitude ? (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                                </Text>
                            ) : (
                                "-"
                            ),
                    },
                ]}
            />

            <EventDetailModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                event={selectedEvent}
            />
        </>
    );
};
