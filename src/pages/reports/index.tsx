import React from "react";
import { List } from "@refinedev/antd";
import { Typography } from "antd";

const { Text, Title } = Typography;

export const ReportList: React.FC = () => {
    return (
        <List title={<Title level={3} style={{ margin: 0 }}>Analytics Reports</Title>}>
            <div style={{ padding: '16px 0' }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                    Generate and view historical performance reports and efficiency analytics.
                </Text>
            </div>
        </List>
    );
};
