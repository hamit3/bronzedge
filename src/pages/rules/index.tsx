import React, { useState } from "react";
import { Tabs, Card, Typography, Badge } from "antd";
import { RulesTab } from "./RulesTab";
import { EventsTab } from "./EventsTab";
import { useList } from "@refinedev/core";
import { useOrganization } from "../../contexts/organization";

const { Title } = Typography;

export const RulesPage = () => {
    const [activeTab, setActiveTab] = useState("rules");
    const { activeOrgId } = useOrganization();

    const unreadQuery = useList({
        resource: "rule_events",
        filters: [
            { field: "organization_id", operator: "eq", value: activeOrgId },
            { field: "is_read", operator: "eq", value: false },
        ],
        pagination: { pageSize: 1 },
    });

    const unreadCount = unreadQuery.query?.data?.total ?? 0;

    return (
        <div style={{ padding: "24px" }}>
            <Title level={2}>Rules Engine</Title>

            <Card>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key)}
                    items={[
                        {
                            label: "Rules",
                            key: "rules",
                            children: <RulesTab />,
                        },
                        {
                            label: (
                                <span>
                                    Events Log{" "}
                                    {unreadCount > 0 && (
                                        <Badge count={unreadCount} style={{ backgroundColor: "#1677ff", marginLeft: 8 }} />
                                    )}
                                </span>
                            ),
                            key: "events",
                            children: <EventsTab />,
                        },
                    ]}
                />
            </Card>
        </div>
    );
};
