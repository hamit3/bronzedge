import React from "react";
import { Card, Typography } from "antd";
import { EventsTab } from "../rules/EventsTab";

import { PageHeader } from "../../components/PageHeader";

export const EventsPage = () => {
    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader 
                title="Events" 
                subtitle={`Global event log for all organizational activity — ${new Date().toLocaleString('tr-TR')}`} 
            />
            <Card variant="borderless" className="shadow-premium">
                <EventsTab />
            </Card>
        </div>
    );
};
