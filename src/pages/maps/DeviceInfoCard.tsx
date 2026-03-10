import React, { useMemo } from "react";
import {
    Card,
    Typography,
    Button,
    Badge,
    Space,
    Divider,
    Progress,
    List,
    Tag,
    Tooltip,
    ConfigProvider,
    theme,
} from "antd";
import {
    CloseOutlined,
    CopyOutlined,
    GlobalOutlined,
    ThunderboltOutlined,
    SignalFilled,
    ClockCircleOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import { formatRelativeTime, formatDateTime, extractPayloadField } from "./utils";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
} from "recharts";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface Device {
    id: string;
    name: string;
    device_id: string;
    is_active: boolean;
    last_seen: string;
}

interface Message {
    id: string;
    received_at: string;
    payload: any;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
}

interface DeviceInfoCardProps {
    device: Device;
    lastMessage: Message | null;
    recentMessages: Message[];
    onClose: () => void;
}

export const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({
    device,
    lastMessage,
    recentMessages,
    onClose,
}) => {
    const battery = useMemo(() => extractPayloadField(lastMessage?.payload, ["battery", "battery_mv"]), [lastMessage]);
    const rsrp = useMemo(() => extractPayloadField(lastMessage?.payload, ["rsrp", "signalQuality"]), [lastMessage]);

    // Chart data: last 10 messages with numeric fields
    const chartData = useMemo(() => {
        const fieldToChart = recentMessages.find(m => extractPayloadField(m.payload, ["temperature"])) ? "temperature" :
            recentMessages.find(m => extractPayloadField(m.payload, ["rsrp"])) ? "rsrp" :
                recentMessages.find(m => extractPayloadField(m.payload, ["battery"])) ? "battery" : null;

        if (!fieldToChart) return null;

        return recentMessages.slice(0, 10).reverse().map(m => ({
            time: dayjs(m.received_at).format("HH:mm"),
            value: extractPayloadField(m.payload, [fieldToChart]),
        })).filter(d => d.value !== null);
    }, [recentMessages]);

    return (
        <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
            <Card
                className="premium-info-card"
                style={{
                    width: 380,
                    background: "rgba(20, 20, 20, 0.85)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                    pointerEvents: "auto",
                    overflow: 'hidden'
                }}
                bodyStyle={{ padding: "0" }}
                extra={
                    <Button
                        type="text"
                        icon={<CloseOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />}
                        onClick={onClose}
                        size="small"
                        className="close-btn-hover"
                    />
                }
                title={
                    <div style={{ padding: '16px 0' }}>
                        <Space direction="vertical" size={2}>
                            <Title level={4} style={{ margin: 0, color: "#fff", fontSize: '18px' }}>
                                {device.name || "Device Info"}
                            </Title>
                            <Space size={8}>
                                <Text style={{ fontSize: "12px", color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                                    {device.device_id}
                                </Text>
                                <Tooltip title="Copy ID">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<CopyOutlined style={{ fontSize: "11px", color: '#f88601' }} />}
                                        onClick={() => navigator.clipboard.writeText(device.device_id)}
                                        style={{ height: '20px', width: '20px', padding: 0 }}
                                    />
                                </Tooltip>
                            </Space>
                        </Space>
                    </div>
                }
            >
                <div style={{ padding: '20px' }}>
                    <Space direction="vertical" style={{ width: "100%" }} size="large">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Badge
                                color={device.is_active ? "#52c41a" : "#bfbfbf"}
                                text={<Text style={{ color: device.is_active ? '#52c41a' : 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{device.is_active ? "Active" : "Inactive"}</Text>}
                            />
                            <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                {formatRelativeTime(device.last_seen)}
                            </Text>
                        </div>

                        <div className="info-section">
                            <Text strong style={{ display: "block", marginBottom: "8px", color: 'rgba(255,255,255,0.85)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <GlobalOutlined style={{ color: '#f88601', marginRight: '6px' }} /> Last Position
                            </Text>
                            {lastMessage?.latitude ? (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <Text style={{ fontSize: "15px", color: '#fff', fontWeight: 500 }}>
                                            {lastMessage.latitude.toFixed(6)}, {lastMessage.longitude?.toFixed(6)}
                                        </Text>
                                        <Tag color="blue" style={{ margin: 0, fontSize: '10px', height: '18px', lineHeight: '16px' }}>±{lastMessage.accuracy || "?"}m</Tag>
                                    </div>
                                    <Text style={{ fontSize: "11px", color: 'rgba(255,255,255,0.35)', display: 'block' }}>
                                        {formatDateTime(lastMessage.received_at)}
                                    </Text>
                                </div>
                            ) : (
                                <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '12px' }}>No location data available</Text>
                            )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Space size={4} style={{ marginBottom: "8px" }}>
                                    <SignalFilled style={{ color: '#1890ff', fontSize: '12px' }} />
                                    <Text style={{ fontSize: "11px", color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>SIGNAL</Text>
                                </Space>
                                {rsrp !== null ? (
                                    <>
                                        <Progress
                                            percent={Math.min(100, Math.max(0, (Number(rsrp) + 140) / 100 * 100))}
                                            showInfo={false}
                                            size="small"
                                            strokeColor={Number(rsrp) > -80 ? "#52c41a" : Number(rsrp) > -100 ? "#f88601" : "#ff4d4f"}
                                            style={{ marginBottom: '4px' }}
                                        />
                                        <Text style={{ fontSize: "13px", color: '#fff', fontWeight: 500 }}>{rsrp} <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>dBm</small></Text>
                                    </>
                                ) : <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>N/A</Text>}
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Space size={4} style={{ marginBottom: "8px" }}>
                                    <ThunderboltOutlined style={{ color: '#fadb14', fontSize: '12px' }} />
                                    <Text style={{ fontSize: "11px", color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>BATTERY</Text>
                                </Space>
                                {battery !== null ? (
                                    <>
                                        <Progress
                                            percent={battery > 100 ? Math.min(100, (battery - 3000) / 1200 * 100) : battery}
                                            showInfo={false}
                                            size="small"
                                            strokeColor={battery > 50 ? "#52c41a" : battery > 20 ? "#f88601" : "#ff4d4f"}
                                            style={{ marginBottom: '4px' }}
                                        />
                                        <Text style={{ fontSize: "13px", color: '#fff', fontWeight: 500 }}>
                                            {battery}{battery > 100 ? <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', marginLeft: '2px' }}>mV</small> : '%'}
                                        </Text>
                                    </>
                                ) : <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>N/A</Text>}
                            </div>
                        </div>

                        {chartData && chartData.length > 0 && (
                            <div className="chart-section">
                                <Text strong style={{ fontSize: "12px", display: "block", marginBottom: "12px", color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <InfoCircleOutlined style={{ color: '#f88601', marginRight: '6px' }} /> Telemetry Trend
                                </Text>
                                <div style={{ height: 120, marginLeft: '-24px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis hide domain={['auto', 'auto']} />
                                            <ChartTooltip
                                                contentStyle={{
                                                    background: "rgba(31, 31, 31, 0.9)",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: "4px",
                                                    fontSize: "10px"
                                                }}
                                            />
                                            <Line type="monotone" dataKey="value" stroke="#f88601" strokeWidth={2} dot={{ r: 2, fill: '#f88601' }} activeDot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <div className="recent-messages-section">
                            <Text strong style={{ fontSize: "12px", display: "block", marginBottom: "12px", color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Recent Stream
                            </Text>
                            <List
                                size="small"
                                dataSource={recentMessages.slice(0, 5)}
                                renderItem={(msg) => (
                                    <div style={{
                                        padding: "8px 0",
                                        borderBottom: "1px solid rgba(255,255,255,0.04)"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: '2px' }}>
                                            <Tag color="cyan" style={{ fontSize: "9px", margin: 0, padding: '0 4px', background: 'transparent', borderColor: 'rgba(0,255,255,0.2)', color: '#00f2fe' }}>
                                                {msg.payload?.type || "TELEMETRY"}
                                            </Tag>
                                            <Text style={{ fontSize: "10px", color: 'rgba(255,255,255,0.25)' }}>{formatRelativeTime(msg.received_at)}</Text>
                                        </div>
                                        <Text ellipsis style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", display: "block" }}>
                                            {JSON.stringify(msg.payload).slice(0, 100)}...
                                        </Text>
                                    </div>
                                )}
                            />
                        </div>
                    </Space>
                </div>

                <style>{`
                    .close-btn-hover:hover {
                        background: rgba(255,255,255,0.08) !important;
                    }
                    .premium-info-card .ant-card-head {
                        border-bottom: 1px solid rgba(255,255,255,0.08);
                        padding: 0 20px;
                        background: rgba(255,255,255,0.01);
                    }
                `}</style>
            </Card>
        </ConfigProvider>
    );
};
