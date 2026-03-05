import React from "react";
import { List } from "@refinedev/antd";
import { Typography } from "antd";

const { Text, Title } = Typography;

export const AlertList: React.FC = () => {
    return (
        <List title={<Title level={3} style={{ margin: 0 }}>Incident Alerts</Title>}>
            <div style={{ padding: '16px 0' }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                    Active and historical alerts related to abnormal sensor values or connectivity issues.
                </Text>
            </div>
        </List>
    );
};
