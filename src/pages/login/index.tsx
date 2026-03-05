import React from "react";
import { Form, Input, Button, Typography, Checkbox, notification } from "antd";
import {
    UserOutlined,
    LockOutlined,
    SafetyCertificateOutlined,
    DotChartOutlined,
    CloudServerOutlined,
    ArrowLeftOutlined
} from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import "./style.css";

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
    const { mutate: login, isPending } = useLogin();

    const onFinish = (values: any) => {
        login(values, {
            onError: (error) => {
                notification.error({
                    message: "Login Failed",
                    description: error.message || "Invalid email or password.",
                    placement: "topRight",
                    style: {
                        backgroundColor: "#161d31",
                        border: "1px solid #c29141",
                    },
                });
            },
        });
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

                            <Form.Item style={{ marginBottom: "12px" }}>
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
                                        background: "#c29141",
                                        borderColor: "#c29141"
                                    }}
                                >
                                    Sign In
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
