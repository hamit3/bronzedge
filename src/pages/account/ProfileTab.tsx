import React, { useState } from "react";
import { useGetIdentity, useNotification } from "@refinedev/core";
import {
    Card,
    Button,
    Typography,
    Space,
    Spin,
    Alert,
} from "antd";
import {
    KeyOutlined,
    MailOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { supabaseClient } from "../../providers/supabase-client";

const { Text } = Typography;

interface ProfileTabProps {
}

export const ProfileTab: React.FC<ProfileTabProps> = () => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<any>();
    const { open } = useNotification();

    const [pwResetSent, setPwResetSent] = useState(false);
    const [pwResetLoading, setPwResetLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (!identity?.email) return;
        setPwResetLoading(true);
        const { error } = await supabaseClient.auth.resetPasswordForEmail(
            identity.email,
            { redirectTo: `${window.location.origin}/update-password` }
        );
        setPwResetLoading(false);
        if (error) {
            open?.({ type: "error", message: `Failed to send reset email: ${error.message}` });
        } else {
            setPwResetSent(true);
            open?.({
                type: "success",
                message: "Password reset email sent. Check your inbox.",
            });
        }
    };

    if (identityLoading) {
        return (
            <div style={centeredStyle}>
                <Spin size="large" />
            </div>
        );
    }

    const email = identity?.email ?? "—";

    return (
        <div style={{ maxWidth: 460 }}>
            {/* Security Settings */}
            <Card
                bordered={false}
                className="profile-section-card"
                title={
                    <Space style={{ color: "#f88601" }}>
                        <KeyOutlined />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Security & Password</span>
                    </Space>
                }
                style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                }}
                headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 20px" }}
                bodyStyle={{ padding: 20 }}
            >
                {pwResetSent ? (
                    <Alert
                        message="Reset email sent!"
                        description="Check your inbox for the secure link."
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        style={{
                            background: "rgba(82,196,26,0.05)",
                            border: "1px solid rgba(82,196,26,0.15)",
                        }}
                    />
                ) : (
                    <div>
                        <div style={{ marginBottom: 20 }}>
                            <Text style={{ display: "block", color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 4 }}>Account Email</Text>
                            <Text style={{ color: "#fff", fontWeight: 600 }}>{email}</Text>
                        </div>
                        
                        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, display: "block", marginBottom: 20 }}>
                            To update your password, we'll send a verification link to your registered email address.
                        </Text>
                        <Button
                            icon={<KeyOutlined />}
                            loading={pwResetLoading}
                            onClick={handlePasswordReset}
                            block
                            style={{
                                height: 40,
                                background: "rgba(248,134,1,0.08)",
                                borderColor: "rgba(248,134,1,0.2)",
                                color: "#f88601",
                                fontWeight: 600,
                            }}
                        >
                            Send Reset Email
                        </Button>
                    </div>
                )}
            </Card>

            <div style={{ marginTop: 24, padding: "0 8px" }}>
                <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
                    <MailOutlined style={{ fontSize: 13 }} />
                    Account email cannot be modified. Contact system support for assistance.
                </Text>
            </div>

            <style>{`
                .profile-section-card {
                    transition: all 0.2s;
                }
                .profile-section-card:hover {
                    border-color: rgba(248,134,1,0.2) !important;
                }
            `}</style>
        </div>
    );
};

const centeredStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
};
