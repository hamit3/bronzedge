import React, { useState } from "react";
import { useGetIdentity, useLogout, useMenu } from "@refinedev/core";
import { Layout, Avatar, Typography, Dropdown, MenuProps, theme, AutoComplete, Input, Space, Badge, Tooltip } from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  SearchOutlined,
  BellOutlined,
  SyncOutlined,
  ShopOutlined,
  DownOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router";

const { Text } = Typography;
const { useToken } = theme;

const MOCK_TENANTS = [
  { id: "1", name: "Factory A", icon: <ShopOutlined /> },
  { id: "2", name: "Factory B", icon: <ShopOutlined /> },
  { id: "3", name: "Garden X", icon: <ShopOutlined /> },
];

export const Header: React.FC = () => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<any>();
  const { mutate: logout } = useLogout();
  const { menuItems } = useMenu();
  const navigate = useNavigate();
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedTenant, setSelectedTenant] = useState(MOCK_TENANTS[0]);

  const tenantMenuItems: MenuProps['items'] = MOCK_TENANTS.map((tenant) => ({
    key: tenant.id,
    label: tenant.name,
    icon: tenant.icon,
    onClick: () => setSelectedTenant(tenant),
  }));

  const handleSearch = (value: string) => {
    if (!value) {
      setOptions([]);
      return;
    }

    const filtered = menuItems
      .filter((item) =>
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

  const menuItemsList: MenuProps['items'] = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "4px 12px" }}>
          <Text strong style={{ display: "block" }}>{user?.email}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>Admin</Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: () => logout(),
    },
  ];

  return (
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
      {/* Left Side: Tenant Switcher */}
      <Space size={16}>
        <Dropdown menu={{ items: tenantMenuItems }} trigger={["click"]}>
          <div style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 8px",
            backgroundColor: token.colorFillTertiary,
            borderRadius: "6px",
            border: `1px solid ${token.colorBorderSecondary}`
          }}>
            <Avatar
              size={20}
              icon={selectedTenant.icon}
              style={{ backgroundColor: token.colorPrimary, fontSize: '12px' }}
            />
            <Text strong style={{ fontSize: "13px", color: token.colorTextHeading, maxWidth: "100px" }} ellipsis>
              {selectedTenant.name}
            </Text>
            <DownOutlined style={{ fontSize: "8px", color: token.colorTextTertiary }} />
          </div>
        </Dropdown>
      </Space>

      {/* Right Side Tools */}
      <Space size={16}>
        {/* Quick Search */}
        <div style={{ width: "200px" }}>
          <AutoComplete
            options={options}
            onSearch={handleSearch}
            onSelect={onSelect}
            style={{ width: "100%" }}
          >
            <Input
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary, fontSize: '13px' }} />}
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

        {/* Sync Time */}
        <Tooltip title="Last sync: 14:10">
          <Space size={4} style={{ cursor: 'help' }}>
            <SyncOutlined style={{ fontSize: "12px", color: token.colorTextTertiary }} />
            <Text style={{ fontSize: "11px", color: token.colorTextTertiary }}>14:10</Text>
          </Space>
        </Tooltip>

        {/* Notifications */}
        <Badge count={3} size="small" offset={[-2, 4]} color={token.colorPrimary}>
          <Tooltip title="Alerts">
            <div style={{
              padding: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}>
              <BellOutlined style={{ fontSize: "16px", color: token.colorTextSecondary }} />
            </div>
          </Tooltip>
        </Badge>

        {/* User Profile */}
        <Dropdown menu={{ items: menuItemsList }} trigger={["click"]} placement="bottomRight">
          <Avatar
            shape="circle"
            size="default"
            style={{
              backgroundColor: token.colorPrimary,
              cursor: "pointer",
              border: `1px solid ${token.colorPrimary}4D`
            }}
            icon={<UserOutlined />}
            src={user?.avatar_url}
          />
        </Dropdown>
      </Space>
    </Layout.Header>
  );
};
