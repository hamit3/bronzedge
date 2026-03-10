import React from "react";
import { Badge } from "antd";
import { useList } from "@refinedev/core";
import { useOrganization } from "../../contexts/organization";

export const RulesMenuLabel = () => {
    const { activeOrgId } = useOrganization();

    // Fetch unread count for badges
    const unreadQuery = useList({
        resource: "rule_events",
        filters: [
            { field: "organization_id", operator: "eq", value: activeOrgId },
            { field: "is_read", operator: "eq", value: false },
        ],
        pagination: { pageSize: 1 },
    });

    const unreadCount = unreadQuery.query?.data?.total ?? 0;
    const isLoading = unreadQuery.query?.isLoading;

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span>Rules Engine</span>
            {!isLoading && unreadCount > 0 && (
                <Badge count={unreadCount} style={{ backgroundColor: "#1677ff" }} />
            )}
        </div>
    );
};
