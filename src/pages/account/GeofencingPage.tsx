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
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader
                title="Geofencing"
                subtitle="Define and manage geographical boundaries."
            />
            <div className="account-card shadow-premium" style={{ height: "calc(100vh - 200px)" }}>
                <GeofencesTab
                    organizationId={activeOrgId ?? null}
                    isAdmin={isAdmin}
                    isOperator={isOperator}
                />
            </div>

            <style>{`
                .account-card {
                  background: #0d1424;
                  border: 1px solid rgba(255,255,255,0.06);
                  border-radius: 8px;
                  padding: 24px;
                  overflow: hidden;
                }
                .shadow-premium {
                  box-shadow: 0 4px 24px rgba(0,0,0,0.4) !important;
                }
            `}</style>
        </div>
    );
};
