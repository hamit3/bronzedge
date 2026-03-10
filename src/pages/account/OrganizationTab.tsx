import React, { useState } from "react";
import {
    useList,
    useUpdate,
    useGetIdentity,
    useNotification,
} from "@refinedev/core";
import {
    Card,
    Typography,
    Button,
    Space,
    Spin,
    Form,
    Input,
    Modal,
    Tag,
    Table,
    Tooltip,
    Badge,
} from "antd";
import {
    BankOutlined,
    PlusOutlined,
    EditOutlined,
    CheckCircleOutlined,
    SwapOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useOrganization } from "../../contexts/organization";
import { supabaseClient } from "../../providers/supabase-client";

const { Title, Text } = Typography;

export const OrganizationTab: React.FC = () => {
    const { data: identity } = useGetIdentity<any>();
    const { activeOrgId, setActiveOrgId } = useOrganization();
    const { open } = useNotification();

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [editModal, setEditModal] = useState<{ open: boolean; org: any | null }>({
        open: false,
        org: null,
    });
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    // All orgs the current user is a member of
    const memberListResult = useList({
        resource: "organization_members",
        filters: identity?.id
            ? [{ field: "user_id", operator: "eq", value: identity.id }]
            : [],
        pagination: { pageSize: 100 },
        queryOptions: { enabled: !!identity?.id },
    });
    const membersLoading = memberListResult.query.isLoading;
    const myMemberships = (memberListResult.query.data?.data ?? []) as any[];
    const myOrgIds = myMemberships.map((m) => m.organization_id);

    // Fetch org details
    const orgsListResult = useList({
        resource: "organizations",
        filters:
            myOrgIds.length > 0
                ? [{ field: "id", operator: "in", value: myOrgIds }]
                : [{ field: "id", operator: "eq", value: "00000000-0000-0000-0000-000000000000" }],
        pagination: { pageSize: 100 },
        queryOptions: { enabled: myOrgIds.length > 0 },
    });
    const orgsLoading = orgsListResult.query.isLoading;
    const orgs = (orgsListResult.query.data?.data ?? []) as any[];

    // useUpdate for renaming (Refine v5)
    const updateOrgResult = useUpdate();
    const updateOrgLoading = updateOrgResult.mutation.isPending;

    // Combined rows with role info
    const rows = orgs.map((org) => {
        const membership = myMemberships.find((m) => m.organization_id === org.id);
        return { ...org, role: membership?.role ?? "viewer", joinedAt: membership?.created_at };
    });

    // -------------------------------------------------------
    // Create org via RPC — bypasses the RETURNING RLS issue
    // -------------------------------------------------------
    const handleCreateOrg = async () => {
        try {
            const values = await createForm.validateFields();
            setCreateLoading(true);

            const { data, error } = await supabaseClient.rpc(
                "create_organization_with_admin",
                { org_name: values.name }
            );

            if (error) {
                open?.({ type: "error", message: `Failed to create: ${error.message}` });
            } else {
                const newOrgId = (data as any)?.id as string;
                open?.({
                    type: "success",
                    message: `Organization "${values.name}" created! You now have full access.`,
                });
                if (newOrgId) setActiveOrgId(newOrgId);
                createForm.resetFields();
                setCreateModalOpen(false);
                // Refetch memberships
                memberListResult.query.refetch();
                orgsListResult.query.refetch();
            }
        } catch {
            /* form validation */
        } finally {
            setCreateLoading(false);
        }
    };

    const handleOpenEdit = (org: any) => {
        setEditModal({ open: true, org });
        editForm.setFieldsValue({ name: org.name });
    };

    const handleSaveEdit = async () => {
        try {
            const values = await editForm.validateFields();
            updateOrgResult.mutate(
                {
                    resource: "organizations",
                    id: editModal.org.id,
                    values: { name: values.name },
                },
                {
                    onSuccess: () => {
                        open?.({ type: "success", message: "Organization name updated." });
                        setEditModal({ open: false, org: null });
                    },
                    onError: (err: any) => {
                        open?.({ type: "error", message: `Update failed: ${err.message}` });
                    },
                }
            );
        } catch {
            /* form validation */
        }
    };

    const roleColor: Record<string, string> = {
        admin: "red",
        operator: "blue",
        viewer: "default",
    };

    const columns = [
        {
            title: "Organization",
            key: "name",
            render: (_: any, record: any) => (
                <Space>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background:
                                record.id === activeOrgId
                                    ? "rgba(248,134,1,0.2)"
                                    : "rgba(255,255,255,0.06)",
                            border:
                                record.id === activeOrgId
                                    ? "1px solid rgba(248,134,1,0.5)"
                                    : "1px solid rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: record.id === activeOrgId ? "#f88601" : "rgba(255,255,255,0.4)",
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                        }}
                    >
                        {(record.name as string)?.[0]?.toUpperCase() ?? "O"}
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Text style={{ color: "#fff", fontWeight: 600 }}>
                                {record.name}
                            </Text>
                            {record.id === activeOrgId && (
                                <Badge
                                    status="processing"
                                    color="#f88601"
                                    text={
                                        <span style={{ color: "#f88601", fontSize: 10, fontWeight: 600 }}>
                                            ACTIVE
                                        </span>
                                    }
                                />
                            )}
                        </div>
                        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "monospace" }}>
                            {record.id}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "Created",
            dataIndex: "created_at",
            key: "created_at",
            width: 140,
            render: (v: string) => (
                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                    {v ? dayjs(v).format("MMM D, YYYY") : "—"}
                </Text>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 170,
            align: "right" as const,
            render: (_: any, record: any) => (
                <Space size="small" style={{ width: '100%', justifyContent: 'flex-end' }}>
                    {record.role === "admin" && (
                        <Tooltip title="Rename organization">
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleOpenEdit(record)}
                                style={{
                                    background: "rgba(24,144,255,0.1)",
                                    borderColor: "rgba(24,144,255,0.3)",
                                    color: "#1890ff",
                                }}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    if (membersLoading || orgsLoading) {
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
                        <BankOutlined style={{ marginRight: 8 }} />
                        My Organizations
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        You are a member of {rows.length} organization{rows.length !== 1 ? "s" : ""}.
                        {activeOrgId && (
                            <span style={{ color: "rgba(248,134,1,0.8)", marginLeft: 6 }}>
                                Active:{" "}
                                <strong>{rows.find((r) => r.id === activeOrgId)?.name ?? "Unknown"}</strong>
                            </span>
                        )}
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                >
                    Create Organization
                </Button>
            </div>

            {/* Empty state */}
            {rows.length === 0 && (
                <Card
                    bordered={false}
                    style={{
                        background: "rgba(248,134,1,0.06)",
                        border: "1px dashed rgba(248,134,1,0.3)",
                        textAlign: "center",
                        padding: 32,
                    }}
                >
                    <BankOutlined style={{ fontSize: 40, color: "rgba(248,134,1,0.4)", marginBottom: 16 }} />
                    <div>
                        <Text style={{ color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 8 }}>
                            You don't belong to any organization yet.
                        </Text>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                            Create My First Organization
                        </Button>
                    </div>
                </Card>
            )}

            {/* Table */}
            {rows.length > 0 && (
                <Table
                    dataSource={rows}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    className="account-table"
                    pagination={false}
                    rowClassName={(record) => (record.id === activeOrgId ? "active-org-row" : "")}
                />
            )}

            {/* Create Modal */}
            <Modal
                title={
                    <span style={{ color: "#f88601" }}>
                        <PlusOutlined style={{ marginRight: 8 }} />
                        Create New Organization
                    </span>
                }
                open={createModalOpen}
                onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
                onOk={handleCreateOrg}
                confirmLoading={createLoading}
                okText="Create Organization"
                width={440}
                styles={{ body: { paddingTop: 16 } }}
            >
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
                    You will automatically have full access to the new organization.
                </Text>
                <Form form={createForm} layout="vertical">
                    <Form.Item
                        label={<span style={{ color: "rgba(255,255,255,0.65)" }}>Organization Name</span>}
                        name="name"
                        rules={[
                            { required: true, message: "Please enter an organization name." },
                            { min: 2, message: "Name must be at least 2 characters." },
                        ]}
                    >
                        <Input placeholder="e.g. Acme Industrial Ltd." autoFocus onPressEnter={handleCreateOrg} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title={
                    <span style={{ color: "#1890ff" }}>
                        <EditOutlined style={{ marginRight: 8 }} />
                        Rename Organization
                    </span>
                }
                open={editModal.open}
                onCancel={() => setEditModal({ open: false, org: null })}
                onOk={handleSaveEdit}
                confirmLoading={updateOrgLoading}
                okText={<span><SaveOutlined style={{ marginRight: 6 }} />Save</span>}
                width={400}
                styles={{ body: { paddingTop: 16 } }}
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item
                        label={<span style={{ color: "rgba(255,255,255,0.65)" }}>Organization Name</span>}
                        name="name"
                        rules={[{ required: true, message: "Please enter a name." }]}
                    >
                        <Input autoFocus onPressEnter={handleSaveEdit} />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
        .active-org-row > td {
          background: rgba(248,134,1,0.05) !important;
          border-left: 2px solid #f88601 !important;
        }
      `}</style>
        </div>
    );
};

const centeredStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
};
