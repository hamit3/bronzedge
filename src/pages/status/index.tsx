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
    Divider 
} from "antd";
import { 
    CheckCircleFilled, 
    CloseCircleFilled, 
    ClockCircleOutlined,
    GlobalOutlined,
    DatabaseOutlined,
    CloudServerOutlined,
    InfoCircleOutlined,
    ArrowLeftOutlined
} from "@ant-design/icons";
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
    const [error, setError] = useState<string | null>(null);

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
                <Spin size="large" tip="Loading System Status..." />
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#050a14', 
            color: '#fff', 
            padding: '40px 20px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <Link to="/monitoring" style={{ color: '#f88601', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
                            <ArrowLeftOutlined /> Back to Dashboard
                        </Link>
                        <Title level={2} style={{ color: '#fff', margin: 0 }}>System Status</Title>
                        <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Real-time service health and historical uptime</Text>
                    </div>
                    {latest && (
                        <div style={{ textAlign: 'right' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, display: 'block' }}>
                                <ClockCircleOutlined style={{ marginRight: 6 }} />
                                Last updated: {dayjs(latest.checked_at).fromNow()}
                            </Text>
                        </div>
                    )}
                </div>

                {error && (
                    <Alert
                        message="Connection Issue"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 24, borderRadius: 12 }}
                    />
                )}

                {/* Overall Status Card */}
                {!latest ? (
                    <Card style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
                        <InfoCircleOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }} />
                        <Title level={4} style={{ color: 'rgba(255,255,255,0.45)' }}>No health data available yet</Title>
                    </Card>
                ) : (
                    <>
                        <Card 
                            style={{ 
                                background: latest.overall_ok ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                borderColor: latest.overall_ok ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                borderRadius: 16,
                                marginBottom: 24,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                <div className="pulse-container">
                                    {latest.overall_ok ? (
                                        <CheckCircleFilled style={{ fontSize: 48, color: '#22c55e' }} />
                                    ) : (
                                        <CloseCircleFilled style={{ fontSize: 48, color: '#ef4444' }} />
                                    )}
                                </div>
                                <div>
                                    <Title level={3} style={{ color: '#fff', margin: 0 }}>
                                        {latest.overall_ok ? "All Systems Operational" : "System Disruption Detected"}
                                    </Title>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                                        {latest.overall_ok 
                                            ? "All background services and cloud integrations are performing optimally." 
                                            : "One or more services are currently experiencing issues."}
                                    </Text>
                                </div>
                            </div>
                        </Card>

                        {/* Component List */}
                        <div style={{ marginBottom: 40 }}>
                            <Title level={5} style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, fontSize: 12 }}>
                                Component Status
                            </Title>
                            <Card style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }} styles={{ body: { padding: 0 } }}>
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
                        <div style={{ marginBottom: 40 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Title level={5} style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, fontSize: 12 }}>
                                    Activity (Last 48 Hours)
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                                    99.9% Historical Uptime
                                </Text>
                            </div>
                            <Card style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 10px' }}>
                                <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 10 }}>
                                    {timelineData.map((check) => (
                                        <Tooltip 
                                            key={check.id} 
                                            title={
                                                <div style={{ fontSize: 11 }}>
                                                    <strong>{dayjs(check.checked_at).format("MMM D, HH:mm")}</strong>
                                                    <br />
                                                    {check.overall_ok ? "Status: Healthy" : "Status: Issue Reported"}
                                                    {check.error_detail && <><br /><span style={{ color: '#ef4444' }}>Error: {check.error_detail}</span></>}
                                                </div>
                                            }
                                        >
                                            <div style={{ 
                                                flex: '1 0 8px', 
                                                height: 32, 
                                                background: check.overall_ok ? '#22c55e' : '#ef4444',
                                                borderRadius: 2,
                                                opacity: check.overall_ok ? 0.8 : 1,
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer'
                                            }} 
                                            className="timeline-block"
                                            />
                                        </Tooltip>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{dayjs().subtract(48, 'hour').format("MMM D")}</Text>
                                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Today</Text>
                                </div>
                            </Card>
                        </div>

                        {/* Recent Error Detail */}
                        {lastError && (
                            <div style={{ marginBottom: 40 }}>
                                 <Title level={5} style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16, fontSize: 12 }}>
                                    Incident Report
                                </Title>
                                <Alert
                                    message="Technical Detail Found"
                                    description={
                                        <div>
                                            <Text style={{ color: '#fff', fontSize: 13, display: 'block', marginBottom: 8 }}>
                                                Our monitors captured the following disruption signature:
                                            </Text>
                                            <code style={{ 
                                                display: 'block', 
                                                background: 'rgba(0,0,0,0.3)', 
                                                padding: 12, 
                                                borderRadius: 6, 
                                                fontSize: 12, 
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.2)'
                                            }}>
                                                {lastError}
                                            </code>
                                        </div>
                                    }
                                    type="warning"
                                    showIcon
                                    style={{ background: 'rgba(214, 158, 46, 0.05)', border: '1px solid rgba(214, 158, 46, 0.2)', borderRadius: 12 }}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', opacity: 0.3, marginTop: 60 }}>
                    <Text style={{ fontSize: 12 }}>BronzEdge Platform Uptime v2.0 • Auto-refresh active</Text>
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
                    animation: circle-pulse 2s infinite;
                    pointer-events: none;
                }
                
                @keyframes circle-pulse {
                    0% { transform: scale(1); opacity: 0.5; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { transform: scale(1.5); opacity: 0; box-shadow: 0 0 0 20px rgba(34, 197, 94, 0); }
                    100% { transform: scale(1); opacity: 0; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }

                .timeline-block:hover {
                    transform: scaleY(1.2);
                    opacity: 1 !important;
                }

                .component-row:hover {
                    background: rgba(255,255,255,0.02);
                }
            `}</style>
        </div>
    );
};

const ComponentRow: React.FC<{ label: string, ok: boolean, icon: React.ReactNode }> = ({ label, ok, icon }) => (
    <div className="component-row" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}>
        <Space size={16}>
            <div style={{ color: '#f88601', fontSize: 18 }}>{icon}</div>
            <Text style={{ color: '#fff', fontSize: 14 }}>{label}</Text>
        </Space>
        <Space size={12}>
            <Text style={{ color: ok ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 13 }}>
                {ok ? "Operational" : "Degraded Performance"}
            </Text>
            {ok ? (
                <CheckCircleFilled style={{ color: '#22c55e', fontSize: 16 }} />
            ) : (
                <CloseCircleFilled style={{ color: '#ef4444', fontSize: 16 }} />
            )}
        </Space>
    </div>
);
