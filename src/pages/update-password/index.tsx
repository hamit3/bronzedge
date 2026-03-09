import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Spin, Alert, Result } from "antd";
import {
    LockOutlined,
    CheckCircleOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { supabaseClient } from "../../providers/supabase-client";
import { useNavigate } from "react-router";

const { Title, Text } = Typography;

type PageState = "loading" | "ready" | "success" | "invalid";

export const UpdatePasswordPage: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [pageState, setPageState] = useState<PageState>("loading");
    const [submitLoading, setSubmitLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Supabase puts the recovery token in the URL hash as a session.
    // When the page loads, we check if there's a valid PASSWORD_RECOVERY session.
    useEffect(() => {
        const { data: listener } = supabaseClient.auth.onAuthStateChange(
            (event) => {
                if (event === "PASSWORD_RECOVERY") {
                    setPageState("ready");
                }
            }
        );

        // Also handle the case where the session is already set
        supabaseClient.auth.getSession().then(({ data }) => {
            if (data.session) {
                setPageState("ready");
            } else {
                // Give it a moment for the hash to be processed
                setTimeout(() => {
                    setPageState((prev) => (prev === "loading" ? "invalid" : prev));
                }, 2000);
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async () => {
        try {
            const { password } = await form.validateFields();
            setSubmitLoading(true);
            setErrorMsg(null);

            const { error } = await supabaseClient.auth.updateUser({ password });

            if (error) {
                setErrorMsg(error.message);
            } else {
                setPageState("success");
            }
        } catch {
            /* form validation */
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)",
                padding: 24,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background glow */}
            <div
                style={{
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 600,
                    height: 400,
                    background: "radial-gradient(ellipse, rgba(248,134,1,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    width: "100%",
                    maxWidth: 420,
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Logo / Brand */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: "rgba(248,134,1,0.15)",
                            border: "1px solid rgba(248,134,1,0.3)",
                            marginBottom: 16,
                            boxShadow: "0 0 40px rgba(248,134,1,0.15)",
                        }}
                    >
                        <SafetyCertificateOutlined style={{ fontSize: 26, color: "#f88601" }} />
                    </div>
                    <Title
                        level={3}
                        style={{ color: "#fff", margin: 0, fontWeight: 700, letterSpacing: "-0.5px" }}
                    >
                        Set New Password
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4, display: "block" }}>
                        BronzEdge · Secure Account Recovery
                    </Text>
                </div>

                {/* Card */}
                <div
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        padding: 32,
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
                    }}
                >
                    {/* Loading state */}
                    {pageState === "loading" && (
                        <div style={{ textAlign: "center", padding: "24px 0" }}>
                            <Spin size="large" />
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.5)",
                                    display: "block",
                                    marginTop: 16,
                                    fontSize: 13,
                                }}
                            >
                                Verifying your reset link…
                            </Text>
                        </div>
                    )}

                    {/* Invalid link */}
                    {pageState === "invalid" && (
                        <Result
                            status="warning"
                            icon={<LockOutlined style={{ color: "#faad14", fontSize: 48 }} />}
                            title={
                                <span style={{ color: "#fff", fontSize: 16 }}>Link Expired or Invalid</span>
                            }
                            subTitle={
                                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                                    This password reset link has expired or already been used.
                                    Please request a new one from your profile page.
                                </span>
                            }
                            extra={
                                <Button
                                    type="primary"
                                    onClick={() => navigate("/login")}
                                    style={{ marginTop: 8 }}
                                >
                                    Back to Login
                                </Button>
                            }
                            style={{ padding: 0 }}
                        />
                    )}

                    {/* Password form */}
                    {pageState === "ready" && (
                        <>
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: 13,
                                    display: "block",
                                    marginBottom: 24,
                                    lineHeight: 1.6,
                                }}
                            >
                                Choose a strong password with at least 8 characters.
                                It will be applied to your BronzEdge account immediately.
                            </Text>

                            {errorMsg && (
                                <Alert
                                    message={errorMsg}
                                    type="error"
                                    showIcon
                                    style={{
                                        background: "rgba(255,77,79,0.1)",
                                        border: "1px solid rgba(255,77,79,0.25)",
                                        marginBottom: 20,
                                    }}
                                    closable
                                    onClose={() => setErrorMsg(null)}
                                />
                            )}

                            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                <Form.Item
                                    name="password"
                                    label={
                                        <span style={{ color: "rgba(255,255,255,0.65)" }}>New Password</span>
                                    }
                                    rules={[
                                        { required: true, message: "Please enter a new password." },
                                        { min: 8, message: "Password must be at least 8 characters." },
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
                                        placeholder="At least 8 characters"
                                        iconRender={(visible) =>
                                            visible ? (
                                                <EyeTwoTone twoToneColor="#f88601" />
                                            ) : (
                                                <EyeInvisibleOutlined style={{ color: "rgba(255,255,255,0.25)" }} />
                                            )
                                        }
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="confirmPassword"
                                    label={
                                        <span style={{ color: "rgba(255,255,255,0.65)" }}>
                                            Confirm New Password
                                        </span>
                                    }
                                    dependencies={["password"]}
                                    rules={[
                                        { required: true, message: "Please confirm your password." },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue("password") === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error("Passwords do not match."));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined style={{ color: "rgba(255,255,255,0.25)" }} />}
                                        placeholder="Repeat new password"
                                        iconRender={(visible) =>
                                            visible ? (
                                                <EyeTwoTone twoToneColor="#f88601" />
                                            ) : (
                                                <EyeInvisibleOutlined style={{ color: "rgba(255,255,255,0.25)" }} />
                                            )
                                        }
                                        size="large"
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={submitLoading}
                                    block
                                    size="large"
                                    style={{
                                        marginTop: 8,
                                        height: 48,
                                        fontWeight: 700,
                                        fontSize: 15,
                                        background: "linear-gradient(135deg, #f88601, #e07800)",
                                        border: "none",
                                        boxShadow: "0 4px 20px rgba(248,134,1,0.35)",
                                    }}
                                >
                                    Update Password
                                </Button>
                            </Form>
                        </>
                    )}

                    {/* Success state */}
                    {pageState === "success" && (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                            <div
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: "50%",
                                    background: "rgba(82,196,26,0.15)",
                                    border: "1px solid rgba(82,196,26,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px",
                                    boxShadow: "0 0 30px rgba(82,196,26,0.2)",
                                }}
                            >
                                <CheckCircleOutlined style={{ fontSize: 32, color: "#52c41a" }} />
                            </div>
                            <Title level={4} style={{ color: "#fff", marginBottom: 8 }}>
                                Password Updated!
                            </Title>
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: 13,
                                    display: "block",
                                    marginBottom: 24,
                                }}
                            >
                                Your password has been changed successfully.
                                You can now log in with your new password.
                            </Text>
                            <Button
                                type="primary"
                                block
                                size="large"
                                onClick={() => navigate("/login")}
                                style={{
                                    height: 44,
                                    fontWeight: 700,
                                    background: "linear-gradient(135deg, #f88601, #e07800)",
                                    border: "none",
                                }}
                            >
                                Go to Login
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <Text
                    style={{
                        display: "block",
                        textAlign: "center",
                        marginTop: 20,
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 11,
                    }}
                >
                    BronzEdge Industrial IoT Platform
                </Text>
            </div>
        </div>
    );
};
