import { OrganizationTab } from "./OrganizationTab";
import { PageHeader } from "../../components/PageHeader";
import { Alert, Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { Link } = Typography;

export const OrganizationsPage: React.FC = () => {
    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader
                title="Organizations"
                subtitle="Manage your organizations and memberships."
            />

            <Alert
                message="Organization Management"
                description={
                    <span>
                        You do not have permission to delete organizations directly. If you need to remove an organization or change its ownership, please contact us at{" "}
                        <Link href="mailto:support@bronzedge.com" style={{ color: "#f88601" }}>
                            support@bronzedge.com
                        </Link>
                    </span>
                }
                type="info"
                showIcon
                icon={<InfoCircleOutlined style={{ color: "#f88601" }} />}
                style={{
                    marginBottom: "24px",
                    background: "rgba(248, 134, 1, 0.05)",
                    border: "1px solid rgba(248, 134, 1, 0.2)",
                    borderRadius: "8px",
                }}
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
