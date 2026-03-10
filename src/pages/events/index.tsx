import React from "react";
import { Card, Typography } from "antd";
import { EventsTab } from "../rules/EventsTab";

const { Title } = Typography;

export const EventsPage = () => {
    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <Title level={2} style={{ color: "#f88601", marginBottom: 24 }}>
                Events
            </Title>
            <Card variant="borderless" className="shadow-premium">
                <EventsTab />
            </Card>
        </div>
    );
};
