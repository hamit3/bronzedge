import React, { useState } from "react";
import { useGetIdentity, useList, useLogout, useMenu } from "@refinedev/core";
import dayjs from "dayjs";
import {
  Layout,
  Avatar,
  Typography,
  Dropdown,
  MenuProps,
  theme,
  AutoComplete,
  Input,
  Space,
  Badge,
  Tooltip,
  Spin,
  Tag,
} from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  SearchOutlined,
  BellOutlined,
  SyncOutlined,
  BankOutlined,
  DownOutlined,
  PlusOutlined,
  CheckOutlined,
  EyeOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useOrganization } from "../../contexts/organization";

const { Text } = Typography;
const { useToken } = theme;

export const Header: React.FC = () => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<any>();
  const { mutate: logout } = useLogout();
  const { menuItems } = useMenu();
  const navigate = useNavigate();
  const { activeOrgId, setActiveOrgId } = useOrganization();

  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

  // Fetch all orgs the user belongs to (for switcher)
  const memberListResult = useList({
    resource: "organization_members",
    filters: user?.id
      ? [{ field: "user_id", operator: "eq", value: user.id }]
      : [],
    pagination: { pageSize: 50 },
    queryOptions: { enabled: !!user?.id },
  });
  const memberships = (memberListResult.query.data?.data ?? []) as any[];
  const orgIds = memberships.map((m) => m.organization_id);

  const orgsListResult = useList({
    resource: "organizations",
    filters:
      orgIds.length > 0
        ? [{ field: "id", operator: "in", value: orgIds }]
        : [{ field: "id", operator: "eq", value: "00000000-0000-0000-0000-000000000000" }],
    pagination: { pageSize: 50 },
    queryOptions: { enabled: orgIds.length > 0 },
  });
  const orgsLoading = orgsListResult.query.isLoading;
  const orgs = (orgsListResult.query.data?.data ?? []) as any[];

  const activeOrg = orgs.find((o) => o.id === activeOrgId);

  // Build org switcher dropdown items
  const orgMenuItems: MenuProps["items"] = [
    // Header label
    {
      key: "label",
      label: (
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Switch Organization
        </Text>
      ),
      disabled: true,
    },
    { type: "divider" },
    // Org list
    ...orgs.map((org) => ({
      key: org.id,
      label: (
        <Space>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background:
                org.id === activeOrgId
                  ? "rgba(248,134,1,0.2)"
                  : "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: org.id === activeOrgId ? "#f88601" : "rgba(255,255,255,0.5)",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {(org.name as string)?.[0]?.toUpperCase()}
          </div>
          <Text style={{ color: org.id === activeOrgId ? "#f88601" : "rgba(255,255,255,0.85)" }}>
            {org.name}
          </Text>
          {org.id === activeOrgId && (
            <CheckOutlined style={{ color: "#f88601", fontSize: 11 }} />
          )}
        </Space>
      ),
      onClick: () => {
        setActiveOrgId(org.id);
      },
    })),
    { type: "divider" },
    {
      key: "manage",
      label: (
        <Space>
          <PlusOutlined style={{ fontSize: 11 }} />
          <span>Manage Organizations</span>
        </Space>
      ),
      onClick: () => navigate("/account"),
    },
  ];

  // Fetch alerts for last 24h for active organization's devices
  const { query: orgDevicesQuery } = useList({
    resource: "devices",
    filters: activeOrgId ? [{ field: "organization_id", operator: "eq", value: activeOrgId }] : [],
    pagination: { pageSize: 500 },
    queryOptions: { enabled: !!activeOrgId },
  });

  const orgDevices = (orgDevicesQuery.data?.data || []) as any[];
  const orgDeviceIds = orgDevices.map((d: any) => d.device_id).filter(Boolean);

  const { query: alertsQuery } = useList({
    resource: "device_alerts",
    filters: [
      { field: "ts", operator: "gte", value: dayjs().subtract(24, "hour").toISOString() },
      ...(orgDeviceIds.length > 0
        ? [{ field: "device_id", operator: "in", value: orgDeviceIds }]
        : [{ field: "device_id", operator: "eq", value: "none" }])
    ] as any,
    pagination: { pageSize: 1 }, // We only need the total count
    queryOptions: { enabled: orgDeviceIds.length > 0 },
  });

  const activeAlertsCount = alertsQuery.data?.total || 0;

  // Search handler
  const handleSearch = (value: string) => {
    if (!value) {
      setOptions([]);
      return;
    }
    const filtered = menuItems
      .filter(
        (item) =>
          item.label?.toString().toLowerCase().includes(value.toLowerCase()) ||
          item.name.toLowerCase().includes(value.toLowerCase())
      )
      .map((item) => ({
        label: item.label?.toString() || item.name,
        value: item.route || `/${item.name}`,
      }));
    setOptions(filtered);
  };

  const onSelect = (value: string) => {
    navigate(value);
  };

  // User profile dropdown
  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "4px 12px" }}>
          <Text strong style={{ display: "block" }}>
            {user?.email}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {memberships.find((m) => m.organization_id === activeOrgId)?.role ?? "—"}
            {user?.isMimicked && (
              <Tag color="green" style={{ marginLeft: 8, fontSize: "10px" }}>MIMICKING</Tag>
            )}
          </Text>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "account",
      label: "Account",
      icon: <UserOutlined />,
      onClick: () => navigate("/account"),
    },
    {
      key: "logout",
      label: user?.isMimicked ? "Stop Mimicking" : "Logout",
      icon: <LogoutOutlined />,
      onClick: () => {
        if (user?.isMimicked) {
           localStorage.removeItem("mimic_user_id");
           localStorage.removeItem("mimic_user_name");
           localStorage.removeItem("mimic_user_email");
           localStorage.removeItem("mimic_user_role");
           window.location.reload();
        } else {
           logout();
        }
      },
    },
  ];

  return (
    <>
      <style>{`
        @keyframes radar-pulse {
          0% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(82, 196, 26, 0); }
          100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
        }
      `}</style>
      <Layout.Header
        style={{
          backgroundColor: token.colorBgContainer,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 999,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {/* Left Side: Organization Switcher */}
      <Space size={16}>
        <Dropdown menu={{ items: orgMenuItems }} trigger={["click"]}>
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              backgroundColor: token.colorFillTertiary,
              borderRadius: "6px",
              border: `1px solid ${token.colorBorderSecondary}`,
              minWidth: 140,
            }}
          >
            {orgsLoading ? (
              <Spin size="small" />
            ) : (
              <>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    background: "rgba(248,134,1,0.2)",
                    border: "1px solid rgba(248,134,1,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f88601",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  <BankOutlined />
                </div>
                <Text
                  strong
                  ellipsis
                  style={{
                    fontSize: "13px",
                    color: token.colorTextHeading,
                    maxWidth: "110px",
                    flex: 1,
                  }}
                >
                  {activeOrg?.name ?? (orgs.length === 0 ? "No Organization" : "Select Org")}
                </Text>
                <DownOutlined
                  style={{ fontSize: "8px", color: token.colorTextTertiary }}
                />
              </>
            )}
          </div>
        </Dropdown>
      </Space>

      {/* Right Side Tools */}
      <Space size={16}>
        {user?.isMimicked && (
          <Tooltip title="Stop mimicking — click to return to your account">
            <div
              onClick={() => {
                localStorage.removeItem("mimic_user_id");
                localStorage.removeItem("mimic_user_name");
                localStorage.removeItem("mimic_user_email");
                localStorage.removeItem("mimic_user_role");
                window.location.reload();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "3px 10px 3px 8px",
                borderRadius: 20,
                background: "rgba(82, 196, 26, 0.08)",
                border: "1px solid rgba(82, 196, 26, 0.25)",
                cursor: "pointer",
                userSelect: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(82, 196, 26, 0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(82, 196, 26, 0.08)")}
            >
              {/* Pulsing live dot */}
              <span style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#52c41a",
                flexShrink: 0,
                animation: "radar-pulse 1.8s infinite",
                display: "inline-block",
              }} />
              <span style={{
                color: "#52c41a",
                fontSize: 12,
                fontWeight: 500,
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: "20px",
              }}>
                {user?.name || user?.email || "Mimicking"}
              </span>
              <CloseCircleOutlined style={{ color: "rgba(82,196,26,0.6)", fontSize: 11, flexShrink: 0 }} />
            </div>
          </Tooltip>
        )}

        {/* Quick Search */}
        <div style={{ width: "200px" }}>
          <AutoComplete
            options={options}
            onSearch={handleSearch}
            onSelect={onSelect}
            style={{ width: "100%" }}
          >
            <Input
              prefix={
                <SearchOutlined
                  style={{ color: token.colorTextTertiary, fontSize: "13px" }}
                />
              }
              placeholder="Search..."
              variant="filled"
              size="small"
              style={{
                backgroundColor: token.colorFillTertiary,
                borderRadius: "6px",
                border: "none",
              }}
            />
          </AutoComplete>
        </div>


        {/* User Profile */}
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          {user?.isMimicked ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar
                shape="circle"
                size="default"
                style={{
                  backgroundColor: "#52c41a",
                  cursor: "pointer",
                  border: "2px solid #52c41a",
                  animation: "radar-pulse 1.8s infinite",
                }}
                icon={<UserOutlined />}
                src={user?.avatar_url}
              />
            </div>
          ) : (
            <Avatar
              shape="circle"
              size="default"
              style={{
                backgroundColor: token.colorPrimary,
                cursor: "pointer",
                border: `1px solid ${token.colorPrimary}4D`,
              }}
              icon={<UserOutlined />}
              src={user?.avatar_url}
            />
          )}
        </Dropdown>
      </Space>
    </Layout.Header>
    </>
  );
};
