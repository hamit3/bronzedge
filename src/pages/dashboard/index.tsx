import React from "react";
import { Layout, Typography, Card, theme } from "antd";

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
    const { token } = theme.useToken();

    return (
        <Layout style={{ padding: "24px", minHeight: "100vh", background: token.colorBgContainer }}>
            <Title level={2}>Industrial IoT Dashboard</Title>
            <Text type="secondary">Welcome to the Bronzedge management panel.</Text>

            <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                <Card title="Sensor Data" bordered={false}>
                    <Text>Real-time data stream will appear here.</Text>
                </Card>
                <Card title="Device Status" bordered={false}>
                    <Text>Active devices: 12 / Total: 15</Text>
                </Card>
                <Card title="Alerts" bordered={false}>
                    <Text>No active alerts.</Text>
                </Card>
            </div>
        </Layout>
    );
};

export default DashboardPage;
