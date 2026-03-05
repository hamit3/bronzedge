import React, { useState } from "react";
import { useGetIdentity, useLogout, useMenu } from "@refinedev/core";
import { Layout, Avatar, Typography, Dropdown, MenuProps, theme, AutoComplete, Input } from "antd";
import { LogoutOutlined, UserOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";

const { Text } = Typography;
const { useToken } = theme;

export const Header: React.FC = () => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<any>();
  const { mutate: logout } = useLogout();
  const { menuItems } = useMenu();
  const navigate = useNavigate();
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

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
        justifyContent: "flex-end", // Aligned to right
        alignItems: "center",
        padding: "0 24px",
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 999,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        gap: "24px" // Space between search and profile
      }}
    >
      <div style={{ width: "100%", maxWidth: "320px" }}>
        <AutoComplete
          options={options}
          onSearch={handleSearch}
          onSelect={onSelect}
          style={{ width: "100%" }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
            placeholder="Quick search..."
            variant="filled"
            style={{
              backgroundColor: token.colorFillTertiary,
              borderRadius: "8px",
              border: "none",
              padding: "6px 12px"
            }}
          />
        </AutoComplete>
      </div>

      <Dropdown menu={{ items: menuItemsList }} trigger={["click"]} placement="bottomRight">
        <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <Avatar
            shape="circle"
            size="large"
            style={{
              backgroundColor: token.colorPrimary,
              border: `2px solid ${token.colorPrimary}4D`
            }}
            icon={<UserOutlined />}
            src={user?.avatar_url}
          />
        </div>
      </Dropdown>
    </Layout.Header>
  );
};
