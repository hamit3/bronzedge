import React from "react";
import { List } from "@refinedev/antd";
import { Typography } from "antd";

const { Text, Title } = Typography;

export const DeviceList: React.FC = () => {
    return (
        <List title={<Title level={3} style={{ margin: 0 }}>Assets & Devices</Title>}>
            <div style={{ padding: '16px 0' }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                    Manage and monitor all your industrial edge devices, sensors, and gateway hardware.
                </Text>
            </div>
        </List>
    );
};
