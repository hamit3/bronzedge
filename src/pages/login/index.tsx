import React, { useRef } from "react";
import { Form, Input, Button, Typography, notification } from "antd";
import {
    UserOutlined,
    LockOutlined,
    ArrowLeftOutlined,
    PlayCircleOutlined,
} from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import { supabaseClient } from "../../providers/supabase-client";
import "./style.css";

const { Title, Text } = Typography;

const DEMO_EMAIL = "demo@bronzedge.com";
const DEMO_PASSWORD = "demo2026";

async function logDemoVisitor() {
    try {
        const nav = navigator as any;
        const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

        const payload = {
            user_agent: navigator.userAgent || null,
            language: navigator.language || null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
            screen_width: window.screen?.width || null,
            screen_height: window.screen?.height || null,
            viewport_width: window.innerWidth || null,
            viewport_height: window.innerHeight || null,
            color_depth: window.screen?.colorDepth || null,
            device_memory: nav.deviceMemory || null,
            hardware_concurrency: nav.hardwareConcurrency || null,
            connection_type: conn?.effectiveType || null,
            connection_downlink: conn?.downlink || null,
            referrer: document.referrer || null,
            page_url: window.location.href || null,
            do_not_track: navigator.doNotTrack || null,
            platform: nav.platform || null,
            extra: {
                vendor: nav.vendor || null,
                cookieEnabled: navigator.cookieEnabled,
                pdfViewerEnabled: nav.pdfViewerEnabled ?? null,
                onLine: navigator.onLine,
                maxTouchPoints: nav.maxTouchPoints || 0,
            },
        };

        await supabaseClient.from("demo_visitors").insert(payload);
    } catch {
        // silent fail — never block the login
    }
}

export const LoginPage: React.FC = () => {
    const { mutate: login, isPending } = useLogin();
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        login(values, {
            onError: (error) => {
                notification.error({
                    message: "Login Failed",
                    description: error.message || "Invalid email or password.",
                    placement: "topRight",
                    style: {
                        backgroundColor: "#161d31",
                        border: "1px solid #f88601",
                    },
                });
            },
        });
    };

    const handleDemoLogin = () => {
        logDemoVisitor(); // fire-and-forget, don't await
        login(
            { email: DEMO_EMAIL, password: DEMO_PASSWORD },
            {
                onError: (error) => {
                    notification.error({
                        message: "Demo Login Failed",
                        description: error.message || "Could not log in to the demo account.",
                        placement: "topRight",
                    });
                },
            }
        );
    };

    return (
        <div className="login-container">
            <div className="login-background" />
            <a href="https://bronzedge.com" className="login-back-button">
                <ArrowLeftOutlined style={{ marginRight: "8px" }} />
                Back to Website
            </a>
            <div className="login-content">
                <div className="login-left">
                    <div className="login-left-content">
                        <img src="/BronzEdge_Logo.png" alt="Bronzedge Logo" className="login-logo-img" />
                        <span className="login-tagline">Industrial IoT Management</span>
                    </div>
                </div>
                <div className="login-right">
                    <div className="login-card">
                        <Title level={3} className="login-title">Welcome Back</Title>
                        <Form
                            form={form}
                            name="login"
                            className="login-form"
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                        >
                            <Form.Item
                                name="email"
                                rules={[{ required: true, message: "Please input your email!" }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Email"
                                />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: "Please input your password!" }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Password"
                                />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: "10px" }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="login-button"
                                    block
                                    loading={isPending}
                                    style={{
                                        height: "50px",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        background: "#f88601",
                                        borderColor: "#f88601",
                                    }}
                                >
                                    Sign In
                                </Button>
                            </Form.Item>

                            {/* Demo Account Button */}
                            <Form.Item style={{ marginBottom: "12px" }}>
                                <Button
                                    block
                                    loading={isPending}
                                    icon={<PlayCircleOutlined />}
                                    onClick={handleDemoLogin}
                                    style={{
                                        height: "42px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        background: "rgba(248, 134, 1, 0.08)",
                                        borderColor: "rgba(248, 134, 1, 0.35)",
                                        color: "#f88601",
                                    }}
                                >
                                    Try Demo Account
                                </Button>
                            </Form.Item>

                            <div className="login-footer-text">
                                Forgot your password? Please contact <br />
                                <a href="mailto:hello@bronzedge.com" className="login-contact-link">
                                    hello@bronzedge.com
                                </a>
                            </div>

                            <div className="login-service-note">
                                Currently, we only provide services to registered users.
                                Please contact us for more information or to request a demo.
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
