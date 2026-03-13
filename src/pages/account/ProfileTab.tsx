import React, { useState } from "react";
import { useGetIdentity, useNotification } from "@refinedev/core";
import ImgCrop from "antd-img-crop";
import {
    Card,
    Button,
    Typography,
    Space,
    Spin,
    Alert,
    Avatar,
    Upload,
    Divider,
    App,
    Tag,
} from "antd";
import {
    KeyOutlined,
    MailOutlined,
    CheckCircleOutlined,
    UploadOutlined,
    UserOutlined
} from "@ant-design/icons";
import { supabaseClient } from "../../providers/supabase-client";

const { Text, Title } = Typography;

export const ProfileTab: React.FC = () => {
    const { message, notification } = App.useApp();
    const { data: identity, isLoading: identityLoading, refetch } = useGetIdentity<any>();
    const { open } = useNotification();

    const [pwResetSent, setPwResetSent] = useState(false);
    const [pwResetLoading, setPwResetLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

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

    const handleAvatarUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        setUploading(true);
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${identity.realId || identity.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile Table
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', identity.realId || identity.id);

            if (updateError) throw updateError;

            // Cache in local storage for instant loading
            localStorage.setItem(`bronzedge_avatar_${identity.realId || identity.id}`, publicUrl);

            message.success("Profile photo updated successfully!");
            onSuccess("ok");
            refetch(); // Refresh identity to update header
        } catch (error: any) {
            console.error("Upload error:", error);
            message.error(`Upload failed: ${error.message}`);
            onError(error);
        } finally {
            setUploading(false);
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
    const displayName = identity?.full_name || identity?.name || email;

    return (
        <div style={{ maxWidth: 500 }}>
            {/* Profile Brief Section */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 24, 
                marginBottom: 32, 
                padding: '20px', 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16
            }}>
                <div style={{ position: 'relative' }}>
                    <ImgCrop showGrid>
                        <Upload
                            name="avatar"
                            showUploadList={false}
                            customRequest={handleAvatarUpload}
                        >
                            <div style={{ cursor: 'pointer', position: 'relative' }}>
                                <Avatar 
                                    size={100} 
                                    src={identity?.avatar_url} 
                                    icon={<UserOutlined />}
                                    style={{ 
                                        border: '3px solid #f88601',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        background: '#161f33',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    background: '#f88601',
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '3px solid #0d1424'
                                }}>
                                    {uploading ? <Spin size="small" /> : <UploadOutlined style={{ color: '#fff', fontSize: 12 }} />}
                                </div>
                            </div>
                        </Upload>
                    </ImgCrop>
                </div>
                <div>
                    <Title level={4} style={{ margin: 0, color: '#fff' }}>{displayName}</Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Tag 
                            color={identity?.role === 'admin' ? 'volcano' : 'blue'} 
                            style={{ margin: 0, fontSize: 10, fontWeight: 700 }}
                        >
                            {identity?.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'STANDARD USER'}
                        </Tag>
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{email}</span>
                    </div>
                </div>
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* Security Settings */}
            <Card
                variant="borderless"
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
                styles={{
                    header: { borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 20px" },
                    body: { padding: 20 }
                }}
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
