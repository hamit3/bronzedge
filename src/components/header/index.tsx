import React, { useState, useEffect } from "react";
import { useGetIdentity, useList, useLogout, useMenu, usePermissions } from "@refinedev/core";
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
  Button,
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
  SettingOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { useOrganization } from "../../contexts/organization";

const { Text } = Typography;
const { useToken } = theme;

// Simple hook to detect mobile breakpoint
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

export const Header: React.FC = () => {
  const { token } = useToken();
  const { data: user, isLoading: userLoading } = useGetIdentity<any>();
  const { mutate: logout } = useLogout();
  const { menuItems } = useMenu();
  const navigate = useNavigate();
  const { activeOrgId, setActiveOrgId } = useOrganization();
  const isMobile = useIsMobile();
  const { data: role, isLoading: roleLoading } = usePermissions<string>({});
  
  // isAdmin: use the realRole for stable admin power during mimicry
  const isAdmin = user?.realRole === "admin" || (role === "admin");

  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

  // 1. Fetch memberships for the current identity (self or mimicked)
  const memberListResult = useList({
    resource: "organization_members",
    filters: user?.id
      ? [{ field: "user_id", operator: "eq", value: user.id }]
      : [],
    pagination: { pageSize: 200 },
    queryOptions: { enabled: !!user?.id },
  });
  
  const memberships = (memberListResult.result?.data ?? []) as any[];
  const orgIds = memberships.map((m) => m.organization_id);

  // 2. Fetch actual organization details
  const isMembershipsLoading = memberListResult.query.isLoading;

  const orgsListResult = useList({
    resource: "organizations",
    filters: isAdmin
      ? [] // Admins see everything
      : (orgIds.length > 0)
        ? [{ field: "id", operator: "in", value: orgIds }]
        : [{ field: "id", operator: "eq", value: "00000000-0000-0000-0000-000000000000" }],
    pagination: { pageSize: 250 },
    queryOptions: { 
      // If admin, we can fetch all immediately. If not, wait for membership IDs.
      enabled: !!user?.id && (isAdmin || (!isMembershipsLoading && orgIds.length >= 0))
    },
  });
  
  const orgsLoading = orgsListResult.query.isLoading || userLoading || (isMembershipsLoading && !isAdmin);
  const orgs = (orgsListResult.result?.data ?? []) as any[];

  const activeOrg = orgs.find((o) => o.id === activeOrgId);

  // Auto-select first org if none selected or current selection is invalid
  useEffect(() => {
    if (!orgsLoading && orgs.length > 0) {
      const isSelectionValid = orgs.some((o) => o.id === activeOrgId);
      if (!activeOrgId || !isSelectionValid) {
        setActiveOrgId(orgs[0].id);
      }
    }
  }, [orgs, orgsLoading, activeOrgId, setActiveOrgId]);

  // Build org switcher dropdown items
  const orgMenuItems: MenuProps["items"] = [
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
      onClick: () => navigate("/organizations"),
    },
  ];

  // Fetch alerts count
  const { query: orgDevicesQuery } = useList({
    resource: "devices",
    filters: activeOrgId ? [{ field: "organization_id", operator: "eq", value: activeOrgId }] : [],
    pagination: { pageSize: 500 },
    queryOptions: { enabled: !!activeOrgId },
  });

  const orgDevices = (orgDevicesQuery.data?.data || []) as any[];
  const orgDeviceIds = orgDevices.map((d: any) => d.device_id).filter(Boolean);

  // Fetch alerts count - memoize the timestamp to prevent infinite re-fetching loops
  const alertSince = React.useMemo(() => {
    // Round to the nearest minute to stabilize the query and prevent constant re-fetching
    return dayjs().subtract(24, "hour").startOf("minute").toISOString();
  }, [activeOrgId]); // Refresh when org changes, but not on every render

  const { query: alertsQuery } = useList({
    resource: "device_alerts",
    filters: [
      { field: "ts", operator: "gte", value: alertSince },
      ...(orgDeviceIds.length > 0
        ? [{ field: "device_id", operator: "in", value: orgDeviceIds }]
        : [{ field: "device_id", operator: "eq", value: "none" }])
    ] as any,
    pagination: { pageSize: 1 },
    queryOptions: { 
      enabled: orgDeviceIds.length > 0,
    },
  });

  const activeAlertsCount = alertsQuery.data?.total || 0;

  // Search handler (desktop only)
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

  // Stop mimicking helper
  const stopMimicking = () => {
    localStorage.removeItem("mimic_user_id");
    localStorage.removeItem("mimic_user_name");
    localStorage.removeItem("mimic_user_email");
    localStorage.removeItem("mimic_user_role");
    localStorage.removeItem("bronzedge_active_org_id");
    window.location.reload();
  };

  // User profile dropdown
  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "4px 12px" }}>
          <Text strong style={{ display: "block" }}>
            {user?.name || user?.email}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#f88601", fontWeight: 600 }}>
              {memberships.find((m) => m.organization_id === activeOrgId)?.role?.toUpperCase() || "VIEWER"}
            </span>
            <span>•</span>
            <span>Org Member</span>
            {user?.realRole === "admin" && (
              <Tag color="volcano" style={{ margin: 0, fontSize: "9px", lineHeight: "16px" }}>SYSTEM ADMIN</Tag>
            )}
            {user?.isMimicked && (
              <Tag color="green" style={{ margin: 0, fontSize: "10px" }}>MIMICKING</Tag>
            )}
          </Text>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "account",
      label: "My Profile",
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    ...(isAdmin ? [
      {
        key: "admin",
        label: "Admin Panel",
        icon: <SettingOutlined />,
        onClick: () => navigate("/admin"),
      },
      {
        key: "status",
        label: "System Health",
        icon: <HeartOutlined />,
        onClick: () => navigate("/status"),
      }
    ] : []),
    {
      key: "logout",
      label: user?.isMimicked ? "Stop Mimicking" : "Logout",
      icon: <LogoutOutlined />,
      onClick: () => {
        if (user?.isMimicked) {
          stopMimicking();
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
        @media (max-width: 768px) {
          .header-search { display: none !important; }
          .org-switcher-text { display: none !important; }
        }
      `}</style>
      <Layout.Header
        style={{
          backgroundColor: token.colorBgContainer,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isMobile ? "0 12px" : "0 24px",
          height: "64px",
          position: "sticky",
          top: 0,
          zIndex: 999,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {/* Left Side: Organization Switcher */}
        <Space size={8}>
          <Dropdown menu={{ items: orgMenuItems }} trigger={["click"]}>
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: isMobile ? "4px 8px" : "4px 10px",
                backgroundColor: token.colorFillTertiary,
                borderRadius: "6px",
                border: `1px solid ${token.colorBorderSecondary}`,
                minWidth: isMobile ? "auto" : 140,
                maxWidth: isMobile ? 140 : 200,
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
                  {/* Hide text on very small screens */}
                  <Text
                    strong
                    ellipsis
                    className="org-switcher-text"
                    style={{
                      fontSize: "13px",
                      color: token.colorTextHeading,
                      maxWidth: isMobile ? "80px" : "110px",
                      flex: 1,
                      display: isMobile ? "none" : undefined,
                    }}
                  >
                    {activeOrg?.name ?? (orgs.length === 0 ? "No Org" : "Select Org")}
                  </Text>
                  <DownOutlined
                    style={{ fontSize: "8px", color: token.colorTextTertiary, flexShrink: 0 }}
                  />
                </>
              )}
            </div>
          </Dropdown>
        </Space>

        {/* Right Side Tools */}
        <Space size={isMobile ? 8 : 16}>
          {/* Mimic indicator */}
          {user?.isMimicked && (
            <Tooltip title="Stop mimicking — click to return to your account">
              <div
                onClick={stopMimicking}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: isMobile ? "3px 8px" : "3px 10px 3px 8px",
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
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#52c41a",
                  flexShrink: 0,
                  animation: "radar-pulse 1.8s infinite",
                  display: "inline-block",
                }} />
                {!isMobile && (
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
                )}
                <CloseCircleOutlined style={{ color: "rgba(82,196,26,0.6)", fontSize: 11, flexShrink: 0 }} />
              </div>
            </Tooltip>
          )}

          {/* Quick Search — hidden on mobile */}
          {!isMobile && (
            <div className="header-search" style={{ width: "200px" }}>
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
          )}

          {/* Refresh Button */}
          <Tooltip title="Refresh Application">
            <Button
              type="text"
              icon={<SyncOutlined />}
              onClick={() => window.location.reload()}
              className="header-tool-button"
              style={{
                color: "rgba(255,255,255,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
              }}
            />
          </Tooltip>

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
