import React, { useState } from "react";
import { Table, Space, Tag, Typography, Badge } from "antd";
import { useUpdate } from "@refinedev/core";
import { useTable } from "@refinedev/antd";
import { useOrganization } from "../../contexts/organization";
import { getRuleTypeDetails } from "./utils";
import dayjs from "dayjs";
import { EventDetailModal } from "./EventDetailModal";

const { Text } = Typography;

interface EventsTabProps {
    selectedDevices: string[];
    selectedTypes: string[];
    dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
    readStatus: string;
}

export const EventsTab: React.FC<EventsTabProps> = ({ 
    selectedDevices, 
    selectedTypes, 
    dateRange, 
    readStatus 
}) => {
    const { activeOrgId } = useOrganization();
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const generateFilters = () => {
        const tableFilters: any[] = [];
        tableFilters.push({ field: "organization_id", operator: "eq", value: activeOrgId });

        if (selectedDevices?.length > 0) {
            tableFilters.push({ field: "device_id", operator: "in", value: selectedDevices });
        }

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
        // Important: manually trigger filter updates when props change
        syncWithLocation: false,
    });

    const { mutate: mutateUpdate } = useUpdate();

    let dataSource = tableProps.dataSource || [];
    if (selectedTypes?.length > 0) {
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

    return (
        <>
            <Table
                {...tableProps}
                dataSource={dataSource}
                rowKey="id"
                loading={tableProps.loading}
                className="account-table shadow-premium"
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: { cursor: "pointer" },
                })}
                pagination={{
                    ...tableProps.pagination,
                    showSizeChanger: true,
                    className: "premium-pagination"
                }}
                columns={[
                    {
                        title: "",
                        dataIndex: "is_read",
                        width: 48,
                        align: "center",
                        render: (isRead: boolean) => (
                            <Badge 
                                status={isRead ? "default" : "processing"} 
                                color={!isRead ? "#f88601" : "rgba(255,255,255,0.2)"} 
                            />
                        ),
                    },
                    {
                        title: "Triggered At",
                        dataIndex: "triggered_at",
                        width: 180,
                        render: (val) => (
                            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                                {dayjs(val).format("YYYY-MM-DD HH:mm:ss")}
                            </Text>
                        ),
                    },
                    {
                        title: "Rule / Device",
                        render: (_, record) => (
                            <Space direction="vertical" size={0}>
                                <Text strong style={{ color: "#fff" }}>{record.rules?.name || "Deleted Rule"}</Text>
                                <Text style={{ fontSize: 12, color: "rgba(248,134,1,0.6)" }}>
                                    {record.devices?.name || "Unknown Device"}
                                </Text>
                            </Space>
                        ),
                    },
                    {
                        title: "Type",
                        dataIndex: ["rules", "rule_type"],
                        width: 120,
                        render: (type: string) => {
                            const { label, color } = getRuleTypeDetails(type);
                            return (
                                <Tag color={color} style={{ borderRadius: 4, fontWeight: 600, border: 'none' }}>
                                    {label?.toUpperCase()}
                                </Tag>
                            );
                        },
                    },
                    {
                        title: "Message",
                        dataIndex: "message",
                        render: (text) => (
                            <Text style={{ color: "rgba(255,255,255,0.85)" }}>{text}</Text>
                        ),
                    },
                    {
                        title: "Location",
                        width: 140,
                        render: (_, record) =>
                            record.latitude && record.longitude ? (
                                <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
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

            <style>{`
                .premium-pagination {
                    margin-top: 24px !important;
                }
            `}</style>
        </>
    );
};

const centeredStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
};
