import React, { useState } from "react";
import {
  useList,
  useCreate,
  useUpdate,
  useDelete,
  HttpError,
  usePermissions,
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
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { PageHeader } from "../../components/PageHeader";

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

      <div className="account-card">
        <UsersManager />
      </div>

      <style>{`
        .account-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
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

  const { query } = useList({
    resource: "profiles",
    pagination: { pageSize: 50 },
  });
  const data = query.data;
  const isLoading = query.isLoading;

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

