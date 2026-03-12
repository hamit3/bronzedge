import React, { useEffect } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { Spin } from "antd";
import { GeofencesTab } from "./GeofencesTab";
import { useOrganization } from "../../contexts/organization";
import { PageHeader } from "../../components/PageHeader";

export const GeofencingPage: React.FC = () => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<any>();
    const { activeOrgId } = useOrganization();

    const memberListResult = useList({
        resource: "organization_members",
        filters: identity?.id
            ? [{ field: "user_id", operator: "eq", value: identity.id }]
            : [],
        pagination: { pageSize: 100 },
        queryOptions: { enabled: !!identity?.id },
    });
    const memberLoading = memberListResult.query.isLoading;
    const memberships = (memberListResult.query.data?.data ?? []) as any[];

    const activeMembership = memberships.find(
        (m) => m.organization_id === activeOrgId
    );
    const currentRole = activeMembership?.role as string | undefined;
    const isAdmin = currentRole === "admin";
    const isOperator = currentRole === "operator";

    if (identityLoading || memberLoading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
                <Spin size="large" />
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Loading geofences...</span>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <PageHeader
                title="Geofencing"
                subtitle="Define and manage geographical boundaries."
            />
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: "24px" }}>
                <GeofencesTab
                    organizationId={activeOrgId ?? null}
                    isAdmin={isAdmin}
                    isOperator={isOperator}
                />
            </div>
        </div>
    );
};
