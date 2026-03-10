import React, { useState } from "react";
import {
    useList,
    useCreate,
    useUpdate,
    useDelete,
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
    Avatar,
} from "antd";
import {
    TeamOutlined,
    UserAddOutlined,
    DeleteOutlined,
    EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface TeamTabProps {
    organizationId: string | undefined;
    isAdmin: boolean;
}

export const TeamTab: React.FC<TeamTabProps> = ({
    organizationId,
    isAdmin,
}) => {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const { open } = useNotification();

    // Refine v5: useList → .query.data / .query.isLoading
    const membersListResult = useList({
        resource: "organization_members",
        filters: organizationId
            ? [{ field: "organization_id", operator: "eq", value: organizationId }]
            : [],
        pagination: { pageSize: 100 },
        queryOptions: { enabled: !!organizationId },
    });
    const membersLoading = membersListResult.query.isLoading;
    const members = membersListResult.query.data?.data ?? [];

    // Refine v5: mutation hooks return { mutation, mutate, ... }
    const createResult = useCreate();
    const createLoading = createResult.mutation.isPending;

    const updateResult = useUpdate();
    const updateLoading = updateResult.mutation.isPending;

    const { mutate: deleteMember } = useDelete();

    const handleAddMember = async () => {
        try {
            const values = await addForm.validateFields();
            createResult.mutate(
                {
                    resource: "organization_members",
                    values: {
                        organization_id: organizationId,
                        user_id: values.user_id,
                        role: values.role,
                    },
                },
                {
                    onSuccess: () => {
                        open?.({ type: "success", message: "Member added successfully." });
                        addForm.resetFields();
                        setAddModalOpen(false);
                    },
                    onError: (err: any) => {
                        open?.({
                            type: "error",
                            message: `Failed to add member: ${err.message}`,
                        });
                    },
                }
            );
        } catch {
            /* validation error */
        }
    };

    const handleEditRole = (member: any) => {
        setEditingMember(member);
        editForm.setFieldsValue({ role: member.role });
        setEditModalOpen(true);
    };

    const handleSaveRole = async () => {
        try {
            const values = await editForm.validateFields();
            updateResult.mutate(
                {
                    resource: "organization_members",
                    id: editingMember.id,
                    values: { role: values.role },
                },
                {
                    onSuccess: () => {
                        open?.({ type: "success", message: "Role updated successfully." });
                        setEditModalOpen(false);
                        setEditingMember(null);
                    },
                    onError: (err: any) => {
                        open?.({
                            type: "error",
                            message: `Failed to update role: ${err.message}`,
                        });
                    },
                }
            );
        } catch {
            /* validation error */
        }
    };

    const handleRemoveMember = (id: string) => {
        deleteMember(
            { resource: "organization_members", id },
            {
                onSuccess: () => {
                    open?.({ type: "success", message: "Member removed." });
                },
                onError: (err: any) => {
                    open?.({
                        type: "error",
                        message: `Failed to remove: ${err.message}`,
                    });
                },
            }
        );
    };

    const roleColor: Record<string, string> = {
        admin: "red",
        operator: "blue",
        viewer: "default",
    };

    const columns = [
        {
            title: "Member",
            key: "member",
            render: (_: any, record: any) => (
                <Space>
                    <Avatar
                        size={30}
                        style={{
                            background: "rgba(248,134,1,0.2)",
                            color: "#f88601",
                            fontSize: 12,
                            border: "1px solid rgba(248,134,1,0.3)",
                        }}
                    >
                        {(record.user_id ?? "?").slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Text
                        style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            color: "rgba(255,255,255,0.6)",
                        }}
                    >
                        {record.user_id}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            width: 110,
            render: (role: string) => (
                <Tag color={roleColor[role] ?? "default"} style={{ fontWeight: 600 }}>
                    {role === "admin" ? "MANAGER" : role?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Joined",
            dataIndex: "created_at",
            key: "created_at",
            width: 160,
            render: (v: string) => (
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                    {v ? dayjs(v).format("MMM D, YYYY") : "—"}
                </Text>
            ),
        },
        ...(isAdmin
            ? [
                {
                    title: "Actions",
                    key: "actions",
                    width: 130,
                    align: "right" as const,
                    render: (_: any, record: any) => (
                        <Space size="small" style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEditRole(record)}
                                style={{
                                    background: "rgba(24,144,255,0.12)",
                                    borderColor: "rgba(24,144,255,0.3)",
                                    color: "#1890ff",
                                }}
                            />
                            <Popconfirm
                                title="Remove this member?"
                                description="This action cannot be undone."
                                onConfirm={() => handleRemoveMember(record.id)}
                                okText="Remove"
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
                        </Space>
                    ),
                },
            ]
            : []),
    ];

    if (!organizationId || membersLoading) {
        return (
            <div style={centeredStyle}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
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
                        <TeamOutlined style={{ marginRight: 8 }} />
                        Team Members
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {(members as any[]).length} member
                        {(members as any[]).length !== 1 ? "s" : ""} in your organization.
                    </Text>
                </div>
                {isAdmin && (
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => setAddModalOpen(true)}
                    >
                        Add Member
                    </Button>
                )}
            </div>

            <Table
                dataSource={members as any[]}
                columns={columns}
                rowKey="id"
                size="small"
                className="account-table"
                pagination={{ pageSize: 10, size: "small" }}
                locale={{ emptyText: "No team members found." }}
            />

            {/* Add Member Modal */}
            <Modal
                title={
                    <span style={{ color: "#f88601" }}>
                        <UserAddOutlined style={{ marginRight: 8 }} />
                        Add Team Member
                    </span>
                }
                open={addModalOpen}
                onCancel={() => {
                    setAddModalOpen(false);
                    addForm.resetFields();
                }}
                onOk={handleAddMember}
                confirmLoading={createLoading}
                okText="Add Member"
                width={460}
                styles={{ body: { paddingTop: 16 } }}
            >
                <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block", marginBottom: 16 }}
                >
                    Enter the user's UUID (from Supabase Auth) and assign a role. For
                    email-based invites, use the Supabase Dashboard or an Edge Function.
                </Text>
                <Form form={addForm} layout="vertical">
                    <Form.Item
                        label={
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>
                                User UUID
                            </span>
                        }
                        name="user_id"
                        rules={[
                            { required: true, message: "Please enter the user UUID." },
                            {
                                pattern:
                                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
                                message: "Must be a valid UUID.",
                            },
                        ]}
                    >
                        <Input
                            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                            style={{ fontFamily: "monospace" }}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>Role</span>
                        }
                        name="role"
                        initialValue="viewer"
                        rules={[{ required: true, message: "Please select a role." }]}
                    >
                        <Select>
                            <Option value="admin">
                                <Tag color="red">Manager</Tag>
                            </Option>
                            <Option value="operator">
                                <Tag color="blue">operator</Tag>
                            </Option>
                            <Option value="viewer">
                                <Tag>viewer</Tag>
                            </Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Role Modal */}
            <Modal
                title={
                    <span style={{ color: "#1890ff" }}>
                        <EditOutlined style={{ marginRight: 8 }} />
                        Change Member Role
                    </span>
                }
                open={editModalOpen}
                onCancel={() => {
                    setEditModalOpen(false);
                    setEditingMember(null);
                }}
                onOk={handleSaveRole}
                confirmLoading={updateLoading}
                okText="Update Role"
                width={380}
                styles={{ body: { paddingTop: 16 } }}
            >
                <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block", marginBottom: 12 }}
                >
                    Member:{" "}
                    <code style={{ color: "#aaa" }}>{editingMember?.user_id ?? "—"}</code>
                </Text>
                <Form form={editForm} layout="vertical">
                    <Form.Item
                        label={
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>New Role</span>
                        }
                        name="role"
                        rules={[{ required: true, message: "Please select a role." }]}
                    >
                        <Select>
                            <Option value="admin">
                                <Tag color="red">Manager</Tag>
                            </Option>
                            <Option value="operator">
                                <Tag color="blue">operator</Tag>
                            </Option>
                            <Option value="viewer">
                                <Tag>viewer</Tag>
                            </Option>
                        </Select>
                    </Form.Item>
                </Form>
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
