import React, { useState } from "react";
import { useGetIdentity, useNotification } from "@refinedev/core";
import {
    Card,
    Button,
    Form,
    Input,
    Typography,
    Space,
    Avatar,
    Spin,
    Divider,
    Alert,
} from "antd";
import {
    UserOutlined,
    KeyOutlined,
    SaveOutlined,
    MailOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { supabaseClient } from "../../providers/supabase-client";

const { Title, Text } = Typography;

interface ProfileTabProps {
    currentRole: string | undefined;
}

const roleColors: Record<string, string> = {
    admin: "#ff4d4f",
    operator: "#1890ff",
    viewer: "rgba(255,255,255,0.45)",
};

export const ProfileTab: React.FC<ProfileTabProps> = ({ currentRole }) => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<any>();
    const { open } = useNotification();

    const [nameForm] = Form.useForm();
    const [nameLoading, setNameLoading] = useState(false);
    const [pwResetSent, setPwResetSent] = useState(false);
    const [pwResetLoading, setPwResetLoading] = useState(false);

    const handleUpdateName = async () => {
        try {
            const values = await nameForm.validateFields();
            setNameLoading(true);
            const { error } = await supabaseClient.auth.updateUser({
                data: { full_name: values.full_name },
            });
            if (error) {
                open?.({ type: "error", message: `Update failed: ${error.message}` });
            } else {
                open?.({ type: "success", message: "Display name updated successfully." });
            }
        } catch {
            /* validation */
        } finally {
            setNameLoading(false);
        }
    };

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
    const currentName =
        identity?.user_metadata?.full_name ?? identity?.name ?? "";
    const initials = currentName
        ? currentName
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : email.slice(0, 2).toUpperCase();

    return (
        <div style={{ maxWidth: 560 }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: "#f88601", margin: 0 }}>
                    <UserOutlined style={{ marginRight: 8 }} />
                    My Profile
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Manage your personal account details and security settings.
                </Text>
            </div>

            {/* Avatar & Email */}
            <Card
                bordered={false}
                style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: 16,
                }}
            >
                <Space align="center" size={16}>
                    <Avatar
                        size={56}
                        style={{
                            background: "rgba(248,134,1,0.2)",
                            border: "2px solid rgba(248,134,1,0.4)",
                            color: "#f88601",
                            fontSize: 18,
                            fontWeight: 700,
                        }}
                    >
                        {initials}
                    </Avatar>
                    <div>
                        <Text
                            style={{ fontSize: 16, fontWeight: 600, color: "#fff", display: "block" }}
                        >
                            {currentName || <em style={{ color: "rgba(255,255,255,0.3)" }}>No display name set</em>}
                        </Text>
                        <Space size={6}>
                            <MailOutlined style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                                {email}
                            </Text>
                        </Space>
                        {currentRole && (
                            <div style={{ marginTop: 6 }}>
                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "2px 10px",
                                        borderRadius: 20,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: "0.5px",
                                        background: `${roleColors[currentRole] ?? "#aaa"}20`,
                                        border: `1px solid ${roleColors[currentRole] ?? "#aaa"}50`,
                                        color: roleColors[currentRole] ?? "#aaa",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {currentRole}
                                </span>
                            </div>
                        )}
                    </div>
                </Space>
            </Card>

            {/* Change Display Name */}
            <Card
                bordered={false}
                title={
                    <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                        <UserOutlined style={{ marginRight: 8 }} />
                        Display Name
                    </Text>
                }
                style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: 16,
                }}
                headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                <Form
                    form={nameForm}
                    layout="inline"
                    initialValues={{ full_name: currentName }}
                    style={{ gap: 8 }}
                >
                    <Form.Item
                        name="full_name"
                        rules={[{ required: true, message: "Enter your display name." }]}
                        style={{ flex: 1, marginBottom: 0 }}
                    >
                        <Input
                            placeholder="Your full name"
                            style={{ maxWidth: 280 }}
                            prefix={<UserOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
                        />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={nameLoading}
                            onClick={handleUpdateName}
                        >
                            Save
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* Password Reset */}
            <Card
                bordered={false}
                title={
                    <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                        <KeyOutlined style={{ marginRight: 8 }} />
                        Password
                    </Text>
                }
                style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
                headStyle={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                {pwResetSent ? (
                    <Alert
                        message="Reset email sent!"
                        description={`A password reset link has been sent to ${email}. Check your inbox.`}
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        style={{
                            background: "rgba(82,196,26,0.1)",
                            border: "1px solid rgba(82,196,26,0.25)",
                        }}
                    />
                ) : (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                            We'll send a secure password reset link to{" "}
                            <strong style={{ color: "rgba(255,255,255,0.7)" }}>{email}</strong>.
                        </Text>
                        <Button
                            icon={<KeyOutlined />}
                            loading={pwResetLoading}
                            onClick={handlePasswordReset}
                            style={{
                                background: "rgba(255,77,79,0.1)",
                                borderColor: "rgba(255,77,79,0.3)",
                                color: "#ff4d4f",
                            }}
                        >
                            Send Password Reset Email
                        </Button>
                    </Space>
                )}
            </Card>

            <Divider
                style={{ borderColor: "rgba(255,255,255,0.06)", marginTop: 24 }}
            />
            <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
                Account email cannot be changed from this panel. Contact your administrator.
            </Text>
        </div>
    );
};

const centeredStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
};
