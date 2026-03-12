import React from "react";
import { OrganizationTab } from "./OrganizationTab";
import { PageHeader } from "../../components/PageHeader";

export const OrganizationsPage: React.FC = () => {
    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader
                title="Organizations"
                subtitle="Manage your organizations and memberships."
            />
            <div className="account-card shadow-premium">
                <OrganizationTab />
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
            `}</style>
        </div>
    );
};
