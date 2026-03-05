import React from "react";
import { List } from "@refinedev/antd";
import { Typography } from "antd";

const { Text, Title } = Typography;

export const SettingsPage: React.FC = () => {
    return (
        <List title={<Title level={3} style={{ margin: 0 }}>Project Settings</Title>}>
            <div style={{ padding: '16px 0' }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                    Configure global parameters, notification preferences, and system integration keys.
                </Text>
            </div>
        </List>
    );
};
