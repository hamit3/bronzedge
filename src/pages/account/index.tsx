import React, { useEffect } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { Tabs, Typography, Spin, Tag } from "antd";
import {
    BankOutlined,

    DesktopOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { OrganizationTab } from "./OrganizationTab";
import { DevicesTab } from "./DevicesTab";
import { ProfileTab } from "./ProfileTab";
import { GeofencesTab } from "./GeofencesTab";
import { useOrganization } from "../../contexts/organization";
import { PageHeader } from "../../components/PageHeader";

const { Title, Text } = Typography;

export const AccountPage: React.FC = () => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<any>();
    const { activeOrgId, setActiveOrgId } = useOrganization();

    // Fetch all memberships for this user
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

    // Auto-select first org if no active org is stored
    useEffect(() => {
        if (!activeOrgId && memberships.length > 0) {
            setActiveOrgId(memberships[0].organization_id);
        }
    }, [activeOrgId, memberships, setActiveOrgId]);

    // Find the current user's role in the active org
    const activeMembership = memberships.find(
        (m) => m.organization_id === activeOrgId
    );
    const currentRole = activeMembership?.role as string | undefined;
    const isAdmin = currentRole === "admin";
    const isOperator = currentRole === "operator";

    const roleColor: Record<string, string> = {
        admin: "red",
        operator: "blue",
        viewer: "default",
    };

    if (identityLoading || memberLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                    gap: 12,
                }}
            >
                <Spin size="large" />
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Loading account...</span>
            </div>
        );
    }

    const tabItems = [
        {
            key: "organization",
            label: (
                <span>
                    <BankOutlined />
                    {" Organizations"}
                </span>
            ),
            children: <OrganizationTab />,
        },


        {
            key: "devices",
            label: (
                <span>
                    <DesktopOutlined />
                    {" Devices"}
                </span>
            ),
            children: (
                <DevicesTab
                    organizationId={activeOrgId}
                    isAdmin={isAdmin}
                    isOperator={isOperator}
                />
            ),
        },
        {
            key: "geofences",
            label: (
                <span>
                    <DesktopOutlined />
                    {" Geofencing"}
                </span>
            ),
            children: (
                <GeofencesTab
                    organizationId={activeOrgId ?? null}
                    isAdmin={isAdmin}
                    isOperator={isOperator}
                />
            ),
        },
        {
            key: "profile",
            label: (
                <span>
                    <UserOutlined />
                    {" My Profile"}
                </span>
            ),
            children: <ProfileTab />,
        },
    ];

    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader
                title="Account Management"
                subtitle="Manage your organizations, devices and geofences."
                extra={null}
            />

            <div className="account-card shadow-premium">
                <Tabs
                    defaultActiveKey="organization"
                    items={tabItems}
                    size="middle"
                    tabBarStyle={{ marginBottom: 24 }}
                />
            </div>

            <style>{`
        .account-card {
          background: #0d1424;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 24px;
        }
        .shadow-premium {
          box-shadow: 0 4px 24px rgba(0,0,0,0.4) !important;
        }
        .account-table .ant-table {
          background: transparent !important;
        }
        .account-table .ant-table-thead > tr > th {
          background: rgba(255,255,255,0.04) !important;
          color: rgba(255,255,255,0.45) !important;
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .account-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          font-size: 12px;
        }
        .account-table .ant-table-tbody > tr:hover > td {
          background: rgba(248,134,1,0.06) !important;
        }
        .account-table .ant-table-row {
          transition: background 0.15s;
        }
        .ant-tabs-tab {
          color: rgba(255,255,255,0.4) !important;
        }
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #f88601 !important;
          font-weight: 600 !important;
        }
        .ant-tabs-ink-bar {
          background: #f88601 !important;
        }
        .ant-tabs-nav::before {
          border-bottom-color: rgba(255,255,255,0.08) !important;
        }
        .ant-pagination-item a { color: rgba(255,255,255,0.6) !important; }
        .ant-pagination-item-active {
          border-color: #f88601 !important;
          background: transparent !important;
        }
        .ant-pagination-item-active a { color: #f88601 !important; }
      `}</style>
        </div>
    );
};
