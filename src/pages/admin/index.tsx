import React, { useState, useEffect } from "react";
import {
  useList,
  useCreate,
  useUpdate,
  useDelete,
  HttpError,
  usePermissions,
  useInvalidate,
} from "@refinedev/core";
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Tag,
  theme,
  Spin,
  Tooltip,
  Tabs,
  Badge,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  LogoutOutlined,
  TeamOutlined,
  BarChartOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { PageHeader } from "../../components/PageHeader";
import { supabaseClient } from "../../providers/supabase-client";

const { Text, Title } = Typography;

export const AdminPanelPage: React.FC = () => {
  const { data: role, isLoading: roleLoading } = usePermissions<string>({});
  const { token } = theme.useToken();

  // If not admin and finished loading role, we show access denied
  if (!roleLoading && role !== "admin") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "40px",
        }}
      >
        <SafetyCertificateOutlined
          style={{ fontSize: 64, color: token.colorError, marginBottom: 24 }}
        />
        <Title level={2}>Access Denied</Title>
        <Text type="secondary">
          You do not have the necessary permissions to access this page. Only
          administrators are allowed.
        </Text>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <PageHeader
        title="Admin Control Center"
        subtitle="Manage users, assign roles and mimic accounts."
      />

      <div className="account-card shadow-premium">
        <Tabs
          defaultActiveKey="users"
          size="middle"
          tabBarStyle={{ marginBottom: 24 }}
          items={[
            {
              key: "users",
              label: (
                <span><TeamOutlined style={{ marginRight: 6 }} />Users</span>
              ),
              children: <UsersManager />,
            },
            {
              key: "demo-visitors",
              label: (
                <span><BarChartOutlined style={{ marginRight: 6 }} />Demo Visitors</span>
              ),
              children: <DemoVisitorsManager />,
            },
          ]}
        />
      </div>

      <style>{`
        .account-card {
          background: #0d1424;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 24px;
        }
        .shadow-premium {
          box-shadow: 0 4px 24px rgba(0,0,0,0.4) !important;
        }
        .account-table .ant-table {
          background: transparent !important;
        }
        .account-table .ant-table-thead > tr > th {
          background: rgba(255,255,255,0.04) !important;
          color: rgba(255,255,255,0.45) !important;
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .account-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          font-size: 12px;
        }
        .account-table .ant-table-tbody > tr:hover > td {
          background: rgba(248,134,1,0.06) !important;
        }
        .ant-tabs-tab {
          color: rgba(255,255,255,0.4) !important;
        }
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #f88601 !important;
          font-weight: 600 !important;
        }
        .ant-tabs-ink-bar {
          background: #f88601 !important;
        }
        .ant-tabs-nav::before {
          border-bottom-color: rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </div>
  );
};

// --- Users Management ---
const UsersManager: React.FC = () => {
  const { token } = theme.useToken();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [realAdminId, setRealAdminId] = useState<string | null>(null);

  // Get the REAL authenticated user's ID (not the mimicked one)
  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setRealAdminId(data.user.id);
    });
  }, []);

  const { result: profilesResult, query: profilesQuery } = useList({
    resource: "profiles",
    pagination: { pageSize: 50 },
  });
  const data = profilesResult;
  const isLoading = profilesQuery.isLoading;

  const { mutate: update } = useUpdate();

  const handleOpenModal = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      email: record.email,
      full_name: record.full_name,
      role: record.role,
    });
    setIsModalVisible(true);
  };

  const handleFinish = (values: any) => {
    if (editingId) {
      update({
        resource: "profiles",
        id: editingId,
        values,
      });
    }
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: "Name / Email",
      dataIndex: "email",
      key: "email",
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {record.full_name || "No Name"}{" "}
            {record.id === localStorage.getItem("mimic_user_id") && (
              <Tag color="green" style={{ marginLeft: 8 }}>MIMICKING</Tag>
            )}
          </div>
          <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {text}
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (val: string) => (
        <Tag color={val === "admin" ? "volcano" : "blue"}>
          {val?.toUpperCase() || "USER"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space size="middle" style={{ justifyContent: "flex-end", width: "100%" }}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            title="Edit Profile"
          />
          {record.id !== realAdminId ? (
            <Popconfirm
              title="Mimic this user's Identity in UI? Data visibility still depends on your Admin RLS policies."
              onConfirm={() => {
                localStorage.setItem("mimic_user_id", record.id);
                localStorage.setItem("mimic_user_email", record.email);
                localStorage.setItem("mimic_user_name", record.full_name || record.email);
                localStorage.setItem("mimic_user_role", record.role || "user");
                window.location.href = "/monitoring";
              }}
            >
              <Button
                type="text"
                icon={<EyeOutlined />}
                title="Mimic User"
                style={{ color: token.colorInfo }}
              />
            </Popconfirm>
          ) : (
            <Tooltip title="Cannot mimic yourself">
              <Button
                type="text"
                icon={<EyeOutlined />}
                disabled
                style={{ color: "rgba(255,255,255,0.15)" }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
          Users who have signed up appear here. You can edit their roles or mimic their account.
        </Text>
        {localStorage.getItem("mimic_user_id") && (
          <Button
            type="primary"
            danger
            size="small"
            icon={<LogoutOutlined />}
            onClick={() => {
              localStorage.removeItem("mimic_user_id");
              localStorage.removeItem("mimic_user_role");
              window.location.reload();
            }}
          >
            Stop Mimicking
          </Button>
        )}
      </div>
      <Table
        dataSource={data?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        className="account-table"
        pagination={{ pageSize: 10, size: "small" }}
      />

      <Modal
        title={"Edit User"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input type="email" placeholder="user@example.com" disabled />
          </Form.Item>
          <Form.Item name="full_name" label="Full Name">
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="user">
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="user">User</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// --- Demo Visitors ---
const DemoVisitorsManager: React.FC = () => {
  const { token } = theme.useToken();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const invalidate = useInvalidate();

  const { result: visitorsResult, query: visitorsQuery } = useList({
    resource: "demo_visitors",
    pagination: { pageSize: 50 },
    sorters: [{ field: "visited_at", order: "desc" }],
  });

  const visitors = (visitorsResult?.data ?? []) as any[];
  const isLoading = visitorsQuery.isLoading;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await invalidate({
      resource: "demo_visitors",
      invalidates: ["list"],
    });
    setIsRefreshing(false);
  };

  const columns = [
    {
      title: "Visitor ID",
      dataIndex: "visitor_id",
      key: "visitor_id",
      width: 100,
      render: (v: string) => (
        <Tooltip title={v}>
          <Text style={{ color: "#f88601", fontSize: 10, fontFamily: "monospace" }}>
            {v ? v.split("-")[0].toUpperCase() : "—"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Date",
      dataIndex: "visited_at",
      key: "visited_at",
      width: 155,
      render: (v: string) => (
        <Tooltip title={new Date(v).toLocaleString()}>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontFamily: "monospace" }}>
            {new Date(v).toLocaleDateString()}{" "}
            <span style={{ color: "rgba(255,255,255,0.3)" }}>
              {new Date(v).toLocaleTimeString()}
            </span>
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Timezone",
      dataIndex: "timezone",
      key: "timezone",
      width: 160,
      render: (v: string) => (
        <Tag style={{ background: "rgba(248,134,1,0.1)", borderColor: "rgba(248,134,1,0.3)", color: "#f88601", fontSize: 11 }}>
          {v || "—"}
        </Tag>
      ),
    },
    {
      title: "Language",
      dataIndex: "language",
      key: "language",
      width: 80,
      render: (v: string) => <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{v || "—"}</Text>,
    },
    {
      title: "Screen",
      key: "screen",
      width: 110,
      render: (_: any, r: any) => (
        <Text style={{ color: "rgba(255,255,255,0.55)", fontFamily: "monospace", fontSize: 11 }}>
          {r.screen_width && r.screen_height ? `${r.screen_width}×${r.screen_height}` : "—"}
        </Text>
      ),
    },
    {
      title: "Connection",
      dataIndex: "connection_type",
      key: "connection_type",
      width: 90,
      render: (v: string) => {
        const colorMap: Record<string, string> = { "4g": "#52c41a", "3g": "#faad14", "2g": "#ff4d4f", wifi: "#1890ff" };
        const c = colorMap[v];
        return v
          ? <Tag style={{ fontSize: 11, background: c ? `${c}22` : undefined, borderColor: c ? `${c}66` : undefined, color: c }}>{v.toUpperCase()}</Tag>
          : <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>—</Text>;
      },
    },
    {
      title: "CPU",
      dataIndex: "hardware_concurrency",
      key: "hardware_concurrency",
      width: 60,
      render: (v: number) => <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{v ?? "—"} cores</Text>,
    },
    {
      title: "RAM",
      dataIndex: "device_memory",
      key: "device_memory",
      width: 70,
      render: (v: number) => <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>{v ? `${v} GB` : "—"}</Text>,
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 100,
      render: (v: string) => <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{v || "—"}</Text>,
    },
    {
      title: "Referrer",
      dataIndex: "referrer",
      key: "referrer",
      ellipsis: true,
      render: (v: string) => v
        ? <Tooltip title={v}><Text style={{ color: "#1890ff", fontSize: 11 }}>{v}</Text></Tooltip>
        : <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>direct</Text>,
    },
    {
      title: "User Agent",
      dataIndex: "user_agent",
      key: "user_agent",
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "monospace" }}>
            {v ? v.slice(0, 55) + "…" : "—"}
          </Text>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Space size={8}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
            Visitors who clicked "Try Demo Account" on the login page.
          </Text>
          <Badge
            count={visitors.length}
            style={{ backgroundColor: "#f88601", fontSize: 11 }}
          />
        </Space>
        <Button
          size="small"
          icon={<SyncOutlined spin={isRefreshing} />}
          onClick={handleRefresh}
          loading={isRefreshing}
          disabled={isRefreshing}
          style={{ background: "rgba(248,134,1,0.1)", borderColor: "rgba(248,134,1,0.3)", color: "#f88601" }}
        >
          Refresh
        </Button>
      </div>
      <Table
        dataSource={visitors}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        className="account-table"
        pagination={{ pageSize: 20, size: "small" }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "No demo visitors yet." }}
      />
    </div>
  );
};
