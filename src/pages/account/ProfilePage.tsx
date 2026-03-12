import React from "react";
import { ProfileTab } from "./ProfileTab";
import { PageHeader } from "../../components/PageHeader";

export const ProfilePage: React.FC = () => {
    return (
        <div style={{ padding: "24px", minHeight: "100vh" }}>
            <PageHeader
                title="My Profile"
                subtitle="Manage your personal information and security."
            />
            <div className="account-card shadow-premium" style={{ maxWidth: 800 }}>
                <ProfileTab />
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
            `}</style>
        </div>
    );
};
