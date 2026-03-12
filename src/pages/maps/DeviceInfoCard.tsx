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
                    width: 300,
                    background: "rgba(13, 20, 36, 0.95)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "10px",
                    border: "1px solid rgba(248, 134, 1, 0.2)",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
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
                    <div style={{ padding: '12px 0' }}>
                        <Space direction="vertical" size={0}>
                            <Title level={4} style={{ margin: 0, color: "#fff", fontSize: '15px', fontWeight: 600 }}>
                                {device.name || "Device Info"}
                            </Title>
                            <Space size={4}>
                                <Text style={{ fontSize: "10px", color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                                    {device.device_id.slice(0, 8)}...
                                </Text>
                                <Tooltip title="Copy ID">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<CopyOutlined style={{ fontSize: "10px", color: '#f88601' }} />}
                                        onClick={() => navigator.clipboard.writeText(device.device_id)}
                                        style={{ height: '18px', width: '18px', padding: 0 }}
                                    />
                                </Tooltip>
                            </Space>
                        </Space>
                    </div>
                }
            >
                <div style={{ padding: '16px' }}>
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Badge
                                color={device.is_active ? "#52c41a" : "#bfbfbf"}
                                text={<Text style={{ color: device.is_active ? '#52c41a' : 'rgba(255,255,255,0.35)', fontWeight: 600, fontSize: '11px' }}>{device.is_active ? "Active" : "Inactive"}</Text>}
                            />
                            <Text style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                                {formatRelativeTime(device.last_seen)}
                            </Text>
                        </div>

                        <div className="info-section">
                            <Text strong style={{ display: "block", marginBottom: "6px", color: 'rgba(255,255,255,0.45)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                <GlobalOutlined style={{ color: '#f88601', marginRight: '4px' }} /> Last Position
                            </Text>
                            {lastMessage?.latitude ? (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                        <Text style={{ fontSize: "13px", color: '#fff', fontWeight: 500 }}>
                                            {lastMessage.latitude.toFixed(5)}, {lastMessage.longitude?.toFixed(5)}
                                        </Text>
                                    </div>
                                    <Text style={{ fontSize: "10px", color: 'rgba(255,255,255,0.25)', display: 'block' }}>
                                        {formatDateTime(lastMessage.received_at)}
                                    </Text>
                                </div>
                            ) : (
                                <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '11px' }}>No location data</Text>
                            )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <Space size={4} style={{ marginBottom: "4px" }}>
                                    <SignalFilled style={{ color: '#1890ff', fontSize: '10px' }} />
                                    <Text style={{ fontSize: "9px", color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.4px' }}>SIG</Text>
                                </Space>
                                {rsrp !== null ? (
                                    <Text style={{ fontSize: "12px", color: '#fff', fontWeight: 500, display: 'block' }}>{rsrp} <small style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px' }}>dBm</small></Text>
                                ) : <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>N/A</Text>}
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <Space size={4} style={{ marginBottom: "4px" }}>
                                    <ThunderboltOutlined style={{ color: '#fadb14', fontSize: '10px' }} />
                                    <Text style={{ fontSize: "9px", color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.4px' }}>BAT</Text>
                                </Space>
                                {battery !== null ? (
                                    <Text style={{ fontSize: "12px", color: '#fff', fontWeight: 500, display: 'block' }}>
                                        {battery}{battery > 100 ? <small style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', marginLeft: '2px' }}>mV</small> : '%'}
                                    </Text>
                                ) : <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>N/A</Text>}
                            </div>
                        </div>

                        {chartData && chartData.length > 0 && (
                            <div className="chart-section">
                                <Text strong style={{ fontSize: "9px", display: "block", marginBottom: "8px", color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                    Telemetry Trend
                                </Text>
                                <div style={{ height: 72, marginLeft: '-24px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis hide domain={['auto', 'auto']} />
                                            <ChartTooltip
                                                contentStyle={{
                                                    background: "#161f33",
                                                    border: "1px solid rgba(248, 134, 1, 0.2)",
                                                    borderRadius: "4px",
                                                    fontSize: "9px"
                                                }}
                                            />
                                            <Line type="monotone" dataKey="value" stroke="#f88601" strokeWidth={1.5} dot={{ r: 1 }} activeDot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                    </Space>
                </div>


                <style>{`
                    .close-btn-hover:hover {
                        background: rgba(255,255,255,0.04) !important;
                    }
                    .premium-info-card .ant-card-head {
                        border-bottom: 1px solid rgba(248, 134, 1, 0.1);
                        padding: 0 16px;
                        background: rgba(255, 255, 255, 0.02);
                    }
                `}</style>
            </Card>
        </ConfigProvider>
    );
};
