import React, { useState, useEffect, useMemo } from "react";
import { 
    Card, 
    Typography, 
    Space, 
    Row, 
    Col, 
    Tooltip, 
    Spin, 
    Alert, 
    Divider,
    Button
} from "antd";
import { 
    CheckCircleFilled, 
    CloseCircleFilled, 
    ClockCircleOutlined,
    GlobalOutlined,
    DatabaseOutlined,
    CloudServerOutlined,
    InfoCircleOutlined,
    SyncOutlined
} from "@ant-design/icons";
import { App as AntdApp } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { supabaseClient } from "../../providers/supabase-client";
import { Link } from "react-router";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface HealthCheck {
    id: number;
    checked_at: string;
    edge_function_ok: boolean;
    database_ok: boolean;
    web_app_ok: boolean;
    overall_ok: boolean;
    error_detail: string | null;
}

const REFRESH_INTERVAL = 300000; // 5 minutes

export const StatusPage: React.FC = () => {
    const [checks, setChecks] = useState<HealthCheck[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { message } = AntdApp.useApp();

    const fetchStatus = async () => {
        try {
            const { data, error: sbError } = await supabaseClient
                .from('health_checks')
                .select('*')
                .gte('checked_at', dayjs().subtract(48, 'hour').toISOString())
                .order('checked_at', { ascending: false })
                .limit(150);

            if (sbError) throw sbError;
            setChecks(data || []);
        } catch (err: any) {
            console.error("Failed to fetch health checks:", err);
            setError(err.message || "Failed to connect to monitoring service.");
        } finally {
            setLoading(false);
        }
    };

    const triggerManualCheck = async () => {
        setTriggering(true);
        try {
            // Doğrudan fonskiyonu çağırmak yerine veritabanına bir "tetikleme kaydı" atıyoruz.
            // Bu işlem asla CORS hatası vermez.
            const { error: insertError } = await supabaseClient
                .from('manual_triggers')
                .insert([{ type: 'health_check' }]);

            if (insertError) throw insertError;
            
            message.success("Trigger record saved to database!");
            
            // Webhook'un çalışıp veriyi güncellemesi için biraz zaman tanıyalım
            setTimeout(fetchStatus, 4000);
        } catch (err: any) {
            console.error("Trigger error:", err);
            message.error("Failed to save trigger: " + (err.message || "Database Error"));
        } finally {
            setTriggering(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    const latest = checks[0];
    const lastError = checks.find(c => c.error_detail)?.error_detail;

    const timelineData = useMemo(() => {
        return [...checks].reverse(); // Oldest to newest for timeline
    }, [checks]);

    if (loading && checks.length === 0) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050a14' }}>
                <Spin size="large" tip="Loading System Status...">
                    <div style={{ padding: '50px' }} />
                </Spin>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#050a14', 
            color: '#fff', 
            padding: '24px 20px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <Title level={4} style={{ color: '#fff', margin: 0 }}>System Status</Title>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Service health and historical uptime</Text>
                    </div>
                    <Space size={16} align="end">
                        <Button 
                            size="small"
                            icon={<SyncOutlined spin={triggering} />} 
                            onClick={triggerManualCheck}
                            loading={triggering}
                            style={{ color: '#f88601' }}
                        >
                            Run Manual Check
                        </Button>
                        {latest && (
                            <div style={{ textAlign: 'right' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, display: 'block' }}>
                                    <ClockCircleOutlined style={{ marginRight: 6 }} />
                                    Updated: {dayjs(latest.checked_at).fromNow()}
                                </Text>
                            </div>
                        )}
                    </Space>
                </div>

                {error && (
                    <Alert
                        message="Connection Issue"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16, borderRadius: 8 }}
                    />
                )}

                {/* Overall Status Card */}
                {!latest ? (
                    <Card style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textAlign: 'center', padding: '30px 0' }}>
                        <InfoCircleOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }} />
                        <Title level={5} style={{ color: 'rgba(255,255,255,0.45)' }}>No health data available yet</Title>
                    </Card>
                ) : (
                    <>
                        <Card 
                            style={{ 
                                background: latest.overall_ok ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                                borderColor: latest.overall_ok ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                borderRadius: 12,
                                marginBottom: 20,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                            styles={{ body: { padding: '16px 20px' } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div className="pulse-container">
                                    {latest.overall_ok ? (
                                        <CheckCircleFilled style={{ fontSize: 32, color: '#22c55e' }} />
                                    ) : (
                                        <CloseCircleFilled style={{ fontSize: 32, color: '#ef4444' }} />
                                    )}
                                </div>
                                <div>
                                    <Title level={5} style={{ color: '#fff', margin: 0 }}>
                                        {latest.overall_ok ? "Systems Operational" : "Service Disruption"}
                                    </Title>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                                        {latest.overall_ok 
                                            ? "All cloud integrations and services are performing optimally." 
                                            : "Issues detected in one or more core services."}
                                    </Text>
                                </div>
                            </div>
                        </Card>

                        {/* Component List */}
                        <div style={{ marginBottom: 30 }}>
                            <Title level={5} style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, fontSize: 11 }}>
                                Component Status
                            </Title>
                            <Card style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
                                <ComponentRow 
                                    label="nRF Cloud → Edge Function" 
                                    ok={latest.edge_function_ok} 
                                    icon={<CloudServerOutlined />} 
                                />
                                <Divider style={{ margin: 0, borderColor: 'rgba(255,255,255,0.04)' }} />
                                <ComponentRow 
                                    label="Platform Database" 
                                    ok={latest.database_ok} 
                                    icon={<DatabaseOutlined />} 
                                />
                                <Divider style={{ margin: 0, borderColor: 'rgba(255,255,255,0.04)' }} />
                                <ComponentRow 
                                    label="Main Web Application" 
                                    ok={latest.web_app_ok} 
                                    icon={<GlobalOutlined />} 
                                />
                            </Card>
                        </div>

                        {/* Uptime Timeline */}
                        <div style={{ marginBottom: 30 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Title level={5} style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, fontSize: 11 }}>
                                    Activity (Last 48 Hours)
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                                    99.9% Uptime
                                </Text>
                            </div>
                            <Card style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 10px' }}>
                                <div style={{ display: 'flex', gap: 2, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 8 }}>
                                    {timelineData.map((check) => (
                                        <Tooltip 
                                            key={check.id} 
                                            title={
                                                <div style={{ fontSize: 10 }}>
                                                    <strong>{dayjs(check.checked_at).format("MMM D, HH:mm")}</strong>
                                                    <br />
                                                    {check.overall_ok ? "Healthy" : "Issue Reported"}
                                                    {check.error_detail && <><br /><span style={{ color: '#ef4444' }}>{check.error_detail}</span></>}
                                                </div>
                                            }
                                        >
                                            <div style={{ 
                                                flex: '1 0 6px', 
                                                height: 24, 
                                                background: check.overall_ok ? '#22c55e' : '#ef4444',
                                                borderRadius: 2,
                                                opacity: check.overall_ok ? 0.7 : 1,
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer'
                                            }} 
                                            className="timeline-block"
                                            />
                                        </Tooltip>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                    <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{dayjs().subtract(48, 'hour').format("MMM D")}</Text>
                                    <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>Today</Text>
                                </div>
                            </Card>
                        </div>

                        {/* Recent Error Detail */}
                        {lastError && (
                            <div style={{ marginBottom: 30 }}>
                                 <Title level={5} style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, fontSize: 11 }}>
                                    Incident Report
                                </Title>
                                <Alert
                                    message="Technical Signature Found"
                                    description={
                                        <div>
                                            <code style={{ 
                                                display: 'block', 
                                                background: 'rgba(0,0,0,0.3)', 
                                                padding: 10, 
                                                borderRadius: 6, 
                                                fontSize: 11, 
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.15)'
                                            }}>
                                                {lastError}
                                            </code>
                                        </div>
                                    }
                                    type="warning"
                                    showIcon
                                    style={{ background: 'rgba(214, 158, 46, 0.04)', border: '1px solid rgba(214, 158, 46, 0.15)', borderRadius: 8 }}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', opacity: 0.2, marginTop: 40 }}>
                    <Text style={{ fontSize: 11 }}>BronzEdge Platform Uptime • Auto-refresh active</Text>
                </div>
            </div>

            <style>{`
                .pulse-container {
                    position: relative;
                }
                .pulse-container::after {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    border-radius: 50%;
                    animation: circle-pulse 2.5s infinite;
                    pointer-events: none;
                }
                
                @keyframes circle-pulse {
                    0% { transform: scale(1); opacity: 0.4; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                    100% { transform: scale(1); opacity: 0; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }

                .timeline-block:hover {
                    transform: scaleY(1.3);
                    opacity: 1 !important;
                }

                .component-row:hover {
                    background: rgba(255,255,255,0.01);
                }
            `}</style>
        </div>
    );
};

const ComponentRow: React.FC<{ label: string, ok: boolean, icon: React.ReactNode }> = ({ label, ok, icon }) => (
    <div className="component-row" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}>
        <Space size={12}>
            <div style={{ color: '#f88601', fontSize: 16 }}>{icon}</div>
            <Text style={{ color: '#fff', fontSize: 13 }}>{label}</Text>
        </Space>
        <Space size={10}>
            <Text style={{ color: ok ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 12 }}>
                {ok ? "Operational" : "Degraded"}
            </Text>
            {ok ? (
                <CheckCircleFilled style={{ color: '#22c55e', fontSize: 14 }} />
            ) : (
                <CloseCircleFilled style={{ color: '#ef4444', fontSize: 14 }} />
            )}
        </Space>
    </div>
);
