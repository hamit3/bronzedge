import React from "react";
import { List } from "@refinedev/antd";
import { Typography } from "antd";

const { Text, Title } = Typography;

export const MonitoringPage: React.FC = () => {
    return (
        <List title={<Title level={3} style={{ margin: 0 }}>System Monitoring</Title>}>
            <div style={{ padding: '16px 0' }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                    Real-time visualization of telemetry data, power consumption, and environmental metrics.
                </Text>
            </div>
        </List>
    );
};
