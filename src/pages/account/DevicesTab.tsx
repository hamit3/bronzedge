import React, { useState } from "react";
import {
    useList,
    useCreate,
    useUpdate,
    useDelete,
    useGetIdentity,
    useNotification,
} from "@refinedev/core";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Tag,
    Space,
    Spin,
    Typography,
    Popconfirm,
    Switch,
    Tooltip,
    Badge,
} from "antd";
import {
    DesktopOutlined,
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    CheckCircleOutlined,
    StopOutlined,
    BankOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useOrganization } from "../../contexts/organization";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

interface DevicesTabProps {
    organizationId: string | undefined; // active org (for table filter)
    isAdmin: boolean;
    isOperator: boolean;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
    organizationId,
    isAdmin,
    isOperator,
}) => {
    const canManage = isAdmin || isOperator;
    const { activeOrgId } = useOrganization();
    const { data: identity } = useGetIdentity<any>();

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModal, setEditModal] = useState<{ open: boolean; record: any | null }>({
        open: false,
        record: null,
    });
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const { open } = useNotification();

    // ── Fetch user's memberships to know which orgs they can add devices to ──
    const memberListResult = useList({
        resource: "organization_members",
        filters: identity?.id
            ? [{ field: "user_id", operator: "eq", value: identity.id }]
            : [],
        pagination: { pageSize: 100 },
        queryOptions: { enabled: !!identity?.id },
    });
    const myMemberships = (memberListResult.query.data?.data ?? []) as any[];
    // Only orgs where user is admin or operator (can add devices)
    const manageableOrgIds = myMemberships
        .filter((m) => m.role === "admin" || m.role === "operator")
        .map((m) => m.organization_id);

    // ── Fetch org names for the select dropdown ──
    const orgsListResult = useList({
        resource: "organizations",
        filters:
            manageableOrgIds.length > 0
                ? [{ field: "id", operator: "in", value: manageableOrgIds }]
                : [{ field: "id", operator: "eq", value: "00000000-0000-0000-0000-000000000000" }],
        pagination: { pageSize: 100 },
        queryOptions: { enabled: manageableOrgIds.length > 0 },
    });
    const orgs = (orgsListResult.query.data?.data ?? []) as any[];

    // ── Devices for active org ──
    const devicesListResult = useList({
        resource: "devices",
        filters: organizationId
            ? [{ field: "organization_id", operator: "eq", value: organizationId }]
            : [],
        pagination: { pageSize: 100 },
        sorters: [{ field: "created_at", order: "desc" }],
        queryOptions: { enabled: !!organizationId },
    });
    const devicesLoading = devicesListResult.query.isLoading;
    const devices = (devicesListResult.query.data?.data ?? []) as any[];

    // ── Mutations ──
    const createResult = useCreate();
    const createLoading = createResult.mutation.isPending;

    const updateResult = useUpdate();
    const updateLoading = updateResult.mutation.isPending;

    const { mutate: deleteDevice } = useDelete();

    const handleOpenAdd = () => {
        // Pre-select the active org
        addForm.setFieldsValue({ organization_id: activeOrgId });
        setAddModalOpen(true);
    };

    const handleAddDevice = async () => {
        try {
            const values = await addForm.validateFields();
            createResult.mutate(
                {
                    resource: "devices",
                    values: {
                        device_id: values.device_id,
                        name: values.name,
                        description: values.description || null,
                        organization_id: values.organization_id,
                        is_active: true,
                    },
                },
                {
                    onSuccess: () => {
                        open?.({ type: "success", message: "Device registered successfully." });
                        addForm.resetFields();
                        setAddModalOpen(false);
                    },
                    onError: (err: any) => {
                        open?.({ type: "error", message: `Failed to add device: ${err.message}` });
                    },
                }
            );
        } catch {
            /* validation */
        }
    };

    const handleOpenEdit = (record: any) => {
        setEditModal({ open: true, record });
        editForm.setFieldsValue({ name: record.name, description: record.description });
    };

    const handleSaveEdit = async () => {
        try {
            const values = await editForm.validateFields();
            updateResult.mutate(
                {
                    resource: "devices",
                    id: editModal.record.id,
                    values: { name: values.name, description: values.description || null },
                },
                {
                    onSuccess: () => {
                        open?.({ type: "success", message: "Device updated." });
                        setEditModal({ open: false, record: null });
                    },
                    onError: (err: any) => {
                        open?.({ type: "error", message: `Update failed: ${err.message}` });
                    },
                }
            );
        } catch {
            /* validation */
        }
    };

    const handleToggleActive = (record: any) => {
        updateResult.mutate(
            {
                resource: "devices",
                id: record.id,
                values: { is_active: !record.is_active },
            },
            {
                onSuccess: () => {
                    open?.({
                        type: "success",
                        message: `Device ${record.is_active ? "deactivated" : "activated"}.`,
                    });
                },
                onError: (err: any) => {
                    open?.({ type: "error", message: `Failed: ${err.message}` });
                },
            }
        );
    };

    const handleDelete = (id: string) => {
        deleteDevice(
            { resource: "devices", id },
            {
                onSuccess: () => open?.({ type: "success", message: "Device deleted." }),
                onError: (err: any) =>
                    open?.({ type: "error", message: `Delete failed: ${err.message}` }),
            }
        );
    };

    // Helper: get org name from orgs list
    const getOrgName = (orgId: string) =>
        orgs.find((o) => o.id === orgId)?.name ?? orgId?.slice(0, 8) + "…";

    const columns = [
        {
            title: "Device ID",
            dataIndex: "device_id",
            key: "device_id",
            render: (v: string) => (
                <Text style={{ fontFamily: "monospace", fontSize: 11, color: "#f88601" }}>
                    {v}
                </Text>
            ),
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (v: string) =>
                v ? (
                    <Text style={{ color: "#fff" }}>{v}</Text>
                ) : (
                    <em style={{ color: "rgba(255,255,255,0.3)" }}>Unnamed</em>
                ),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
            render: (v: string) => (
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    {v ?? "—"}
                </Text>
            ),
        },
        {
            title: "Organization",
            dataIndex: "organization_id",
            key: "organization_id",
            render: (orgId: string) => (
                <Space size={4}>
                    <BankOutlined style={{ color: "rgba(248,134,1,0.6)", fontSize: 11 }} />
                    <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                        {getOrgName(orgId)}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Status",
            dataIndex: "is_active",
            key: "is_active",
            width: 100,
            render: (active: boolean) =>
                active ? (
                    <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontWeight: 600 }}>
                        Active
                    </Tag>
                ) : (
                    <Tag icon={<StopOutlined />} color="default" style={{ fontWeight: 600 }}>
                        Inactive
                    </Tag>
                ),
        },
        {
            title: "Last Seen",
            dataIndex: "last_seen",
            key: "last_seen",
            width: 140,
            render: (v: string) =>
                v ? (
                    <Tooltip title={dayjs(v).format("YYYY-MM-DD HH:mm:ss")}>
                        <Badge
                            status={dayjs().diff(dayjs(v), "hour") < 1 ? "processing" : "default"}
                            text={
                                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                                    {dayjs(v).fromNow()}
                                </span>
                            }
                        />
                    </Tooltip>
                ) : (
                    <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Never</Text>
                ),
        },
        ...(canManage
            ? [
                {
                    title: "Actions",
                    key: "actions",
                    width: 140,
                    render: (_: any, record: any) => (
                        <Space size="small">
                            <Tooltip title="Edit">
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleOpenEdit(record)}
                                    style={{
                                        background: "rgba(24,144,255,0.12)",
                                        borderColor: "rgba(24,144,255,0.3)",
                                        color: "#1890ff",
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
                                <Switch
                                    size="small"
                                    checked={record.is_active}
                                    onChange={() => handleToggleActive(record)}
                                    style={{ minWidth: 32 }}
                                />
                            </Tooltip>
                            {isAdmin && (
                                <Popconfirm
                                    title="Delete this device?"
                                    description="All associated messages and events will be removed."
                                    onConfirm={() => handleDelete(record.id)}
                                    okText="Delete"
                                    cancelText="Cancel"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        style={{ background: "rgba(255,77,79,0.08)" }}
                                    />
                                </Popconfirm>
                            )}
                        </Space>
                    ),
                },
            ]
            : []),
    ];

    if (!organizationId || devicesLoading) {
        return (
            <div style={centeredStyle}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 20,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <Title level={4} style={{ color: "#f88601", margin: 0 }}>
                        <DesktopOutlined style={{ marginRight: 8 }} />
                        Devices
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {devices.length} registered device{devices.length !== 1 ? "s" : ""} in the
                        active organization.
                    </Text>
                </div>
                {canManage && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
                        Add Device
                    </Button>
                )}
            </div>

            <Table
                dataSource={devices}
                columns={columns}
                rowKey="id"
                size="small"
                className="account-table"
                pagination={{ pageSize: 10, size: "small" }}
                locale={{ emptyText: "No devices registered yet." }}
                scroll={{ x: "max-content" }}
            />

            {/* ── Add Device Modal ── */}
            <Modal
                title={
                    <span style={{ color: "#f88601" }}>
                        <PlusOutlined style={{ marginRight: 8 }} />
                        Register New Device
                    </span>
                }
                open={addModalOpen}
                onCancel={() => { setAddModalOpen(false); addForm.resetFields(); }}
                onOk={handleAddDevice}
                confirmLoading={createLoading}
                okText="Register Device"
                width={500}
                styles={{ body: { paddingTop: 16 } }}
            >
                <Form form={addForm} layout="vertical">

                    {/* Organization select */}
                    <Form.Item
                        label={
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>
                                <BankOutlined style={{ marginRight: 6 }} />
                                Organization
                            </span>
                        }
                        name="organization_id"
                        rules={[{ required: true, message: "Please select an organization." }]}
                    >
                        <Select
                            placeholder="Select organization"
                            loading={orgsListResult.query.isLoading}
                            popupMatchSelectWidth={false}
                        >
                            {orgs.map((org) => (
                                <Option key={org.id} value={org.id}>
                                    <Space size={6}>
                                        <div
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: 4,
                                                background: org.id === activeOrgId
                                                    ? "rgba(248,134,1,0.25)"
                                                    : "rgba(255,255,255,0.08)",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: org.id === activeOrgId ? "#f88601" : "#aaa",
                                                fontSize: 10,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {(org.name as string)?.[0]?.toUpperCase()}
                                        </div>
                                        {org.name}
                                        {org.id === activeOrgId && (
                                            <Tag color="orange" style={{ fontSize: 9, padding: "0 4px", lineHeight: "16px" }}>
                                                active
                                            </Tag>
                                        )}
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Device ID */}
                    <Form.Item
                        label={
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>
                                Device ID (nRF Cloud ID)
                            </span>
                        }
                        name="device_id"
                        rules={[
                            { required: true, message: "Please enter the nRF Cloud device ID." },
                            {
                                pattern: /^nrf-\d{15}$/,
                                message: 'Must match nRF Cloud format, e.g. "nrf-351358811234567"',
                            },
                        ]}
                        extra={
                            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                E.g. nrf-351358811234567
                            </Text>
                        }
                    >
                        <Input
                            placeholder="nrf-351358811234567"
                            style={{ fontFamily: "monospace" }}
                        />
                    </Form.Item>

                    {/* Name */}
                    <Form.Item
                        label={
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>Device Name</span>
                        }
                        name="name"
                        rules={[{ required: true, message: "Please enter a device name." }]}
                    >
                        <Input placeholder="E.g. Sensor Alpha-1" />
                    </Form.Item>

                    {/* Description */}
                    <Form.Item
                        label={
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>
                                Description (optional)
                            </span>
                        }
                        name="description"
                    >
                        <Input.TextArea
                            placeholder="Brief description of this device or its location..."
                            rows={2}
                            style={{ resize: "none" }}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Edit Device Modal ── */}
            <Modal
                title={
                    <span style={{ color: "#1890ff" }}>
                        <EditOutlined style={{ marginRight: 8 }} />
                        Edit Device
                    </span>
                }
                open={editModal.open}
                onCancel={() => setEditModal({ open: false, record: null })}
                onOk={handleSaveEdit}
                confirmLoading={updateLoading}
                okText="Save Changes"
                width={460}
                styles={{ body: { paddingTop: 16 } }}
            >
                {editModal.record && (
                    <>
                        <Text
                            type="secondary"
                            style={{ fontSize: 12, display: "block", marginBottom: 12 }}
                        >
                            Device ID:{" "}
                            <code style={{ color: "#f88601" }}>{editModal.record.device_id}</code>
                        </Text>
                        <Form form={editForm} layout="vertical">
                            <Form.Item
                                label={
                                    <span style={{ color: "rgba(255,255,255,0.65)" }}>Device Name</span>
                                }
                                name="name"
                                rules={[{ required: true, message: "Please enter a device name." }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label={
                                    <span style={{ color: "rgba(255,255,255,0.65)" }}>Description</span>
                                }
                                name="description"
                            >
                                <Input.TextArea rows={2} style={{ resize: "none" }} />
                            </Form.Item>
                        </Form>
                    </>
                )}
            </Modal>
        </div>
    );
};

const centeredStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
};
