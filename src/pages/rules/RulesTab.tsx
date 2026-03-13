import React, { useState, useEffect } from "react";
import { Table, Button, Switch, Tag, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useDelete, useUpdate, useList } from "@refinedev/core";
import { useTable } from "@refinedev/antd";
import { useOrganization } from "../../contexts/organization";
import { RuleForm } from "./RuleForm";
import { getRuleTypeDetails, formatConfigSummary } from "./utils";

export const RulesTab = () => {
    const { activeOrgId } = useOrganization();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);

    // Fetch lists separately to map IDs to names since we have schema relationship issues
    // Fetch geofences to map IDs to names. 
    // We fetch ALL geofences available to the user (Admin will see all)
    // to ensure mapping works even if org filtering is tricky during mimicry.
    const geofencesQuery = useList({
        resource: "geofences",
        pagination: { pageSize: 1000 },
        queryOptions: { enabled: !!activeOrgId },
    });

    const devicesQuery = useList({
        resource: "devices",
        filters: [{ field: "organization_id", operator: "eq", value: activeOrgId }],
        queryOptions: { enabled: !!activeOrgId },
    });

    const deviceMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        devicesQuery.query.data?.data?.forEach((d: any) => {
            map[d.id] = d.name;
        });
        return map;
    }, [devicesQuery.query.data]);

    const geofenceMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        const list = geofencesQuery.query.data?.data || [];
        list.forEach((gf: any) => {
            map[gf.id] = gf.name;
        });
        return map;
    }, [geofencesQuery.query.data]);

    const { tableProps, setFilters } = useTable({
        resource: "rules",
        filters: {
            initial: [
                { field: "organization_id", operator: "eq", value: activeOrgId },
            ],
        },
        pagination: { pageSize: 10 },
        sorters: {
            initial: [{ field: "created_at", order: "desc" }],
        },
        queryOptions: {
            enabled: !!activeOrgId,
        },
        syncWithLocation: false,
    });

    // Explicitly update filters when org changes
    useEffect(() => {
        if (activeOrgId) {
            setFilters([{ field: "organization_id", operator: "eq", value: activeOrgId }]);
        }
    }, [activeOrgId, setFilters]);


    const { mutate: mutateDelete } = useDelete();
    const { mutate: mutateUpdate, mutation: updateMutation } = useUpdate();
    const isUpdating = updateMutation?.isPending || false;

    const handleDelete = (id: string) => {
        mutateDelete({
            resource: "rules",
            id,
        });
    };

    const handleToggleStatus = (record: any) => {
        mutateUpdate({
            resource: "rules",
            id: record.id,
            values: {
                is_active: !record.is_active,
            },
        });
    };

    const handleAddClick = () => {
        setEditingRule(null);
        setIsModalVisible(true);
    };

    const handleEditClick = (rule: any) => {
        setEditingRule(rule);
        setIsModalVisible(true);
    };

    return (
        <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddClick}
                >
                    Add Rule
                </Button>
            </div>

            <Table
                {...tableProps}
                rowKey="id"
                loading={tableProps.loading}
                className="premium-dark-table shadow-premium"
                columns={[
                    {
                        title: "Name",
                        dataIndex: "name",
                        render: (text: string) => <strong>{text}</strong>,
                    },
                    {
                        title: "Type",
                        dataIndex: "rule_type",
                        render: (type: string) => {
                            const { label } = getRuleTypeDetails(type);
                            return (
                                <Tag style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "rgba(255,255,255,0.65)",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    textTransform: "uppercase",
                                    fontWeight: 500
                                }}>
                                    {label}
                                </Tag>
                            );
                        },
                    },
                    {
                        title: "Device",
                        dataIndex: ["device_id"],
                        render: (deviceId: string) => {
                            return deviceId ? (deviceMap[deviceId] || "Specific Device") : "All devices";
                        },
                    },
                    {
                        title: "Condition",
                        render: (_, record) => {
                            try {
                                const gId = record.config?.geofence_id;
                                const gName = gId ? geofenceMap[gId] : undefined;
                                
                                return (
                                    <span>
                                        {formatConfigSummary(
                                            record.rule_type,
                                            record.config,
                                            gName
                                        )}
                                    </span>
                                );
                            } catch (e) {
                                console.error("[RulesTab] Render Error in Condition:", e, record);
                                return <span style={{ color: 'red' }}>Error rendering condition</span>;
                            }
                        },
                    },
                    {
                        title: "Status",
                        dataIndex: "is_active",
                        render: (_, record: any) => (
                            <Switch
                                checked={record.is_active}
                                loading={isUpdating && updateMutation?.variables?.id === record.id}
                                onChange={() => handleToggleStatus(record)}
                            />
                        ),
                    },
                    {
                        title: "Actions",
                        dataIndex: "actions",
                        align: "right" as const,
                        render: (_, record) => (
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditClick(record)}
                                />
                                <Popconfirm
                                    title="Delete this rule?"
                                    onConfirm={() => handleDelete(record.id as string)}
                                >
                                    <Button danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </Space>
                        ),
                    },
                ]}
            />

            {isModalVisible && (
                <RuleForm
                    visible={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    initialValues={editingRule}
                />
            )}
        </>
    );
};
