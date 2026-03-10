import React, { useState } from "react";
import { Table, Button, Switch, Tag, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useDelete, useUpdate } from "@refinedev/core";
import { useTable } from "@refinedev/antd";
import { useOrganization } from "../../contexts/organization";
import { RuleForm } from "./RuleForm";
import { getRuleTypeDetails, formatConfigSummary } from "./utils";

export const RulesTab = () => {
    const { activeOrgId } = useOrganization();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);

    const { tableProps } = useTable({
        resource: "rules",
        filters: {
            initial: [
                { field: "organization_id", operator: "eq", value: activeOrgId },
            ],
            permanent: [
                { field: "organization_id", operator: "eq", value: activeOrgId },
            ],
        },
        pagination: { pageSize: 10 },
    });

    const { mutate: mutateDelete } = useDelete();
    const { mutate: mutateUpdate } = useUpdate();

    const rulesData = tableProps.dataSource || [];

    const handleDelete = (id: string) => {
        mutateDelete({
            resource: "rules",
            id,
        });
    };

    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        mutateUpdate({
            resource: "rules",
            id,
            values: {
                is_active: !currentStatus,
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
                            const { label, color } = getRuleTypeDetails(type);
                            return <Tag color={color}>{label}</Tag>;
                        },
                    },
                    {
                        title: "Device",
                        dataIndex: ["device_id"],
                        render: (deviceId: string, record: any) => {
                            return deviceId ? (record.devices?.name || "Specific Device") : "All devices";
                        },
                    },
                    {
                        title: "Condition",
                        render: (_, record) => (
                            <span>
                                {formatConfigSummary(
                                    record.rule_type,
                                    record.config,
                                    record.geofences?.name // assuming related data is fetched if possible, otherwise we may need to fetch geofences separately. We can leave it as ID if not fetched.
                                )}
                            </span>
                        ),
                    },
                    {
                        title: "Status",
                        dataIndex: "is_active",
                        render: (isActive: boolean, record) => (
                            <Switch
                                checked={isActive}
                                onChange={() => handleToggleStatus(record.id as string, isActive)}
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
