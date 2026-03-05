import React from "react";
import { Typography, Card, Row, Col, Table, Tag, Badge, Tooltip, Space, Progress } from "antd";
import { DesktopOutlined, EnvironmentOutlined, DashboardOutlined, ThunderboltOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface DeviceData {
    key: string;
    device: string;
    status: "online" | "offline" | "warning";
    lastMessage: string;
    lastMessageDate: string;
    location: string;
    sensorData: {
        temp: number;
        humidity: number;
        power: number;
    };
    health: number;
}

const mockData: DeviceData[] = [
    {
        key: "1",
        device: "Edge-Gate-A1",
        status: "online",
        lastMessage: "Telemetry sync",
        lastMessageDate: "2026-03-05 04:28:10",
        location: "Main Production Floor",
        sensorData: { temp: 24.5, humidity: 42, power: 1.2 },
        health: 98,
    },
    {
        key: "2",
        device: "Sensor-Node-08",
        status: "online",
        lastMessage: "Heartbeat",
        lastMessageDate: "2026-03-05 04:29:45",
        location: "Storage Area B",
        sensorData: { temp: 18.2, humidity: 55, power: 0.8 },
        health: 100,
    },
    {
        key: "3",
        device: "Control-Box-X2",
        status: "warning",
        lastMessage: "Voltage spike detected",
        lastMessageDate: "2026-03-05 04:25:12",
        location: "HVAC System",
        sensorData: { temp: 42.1, humidity: 12, power: 4.5 },
        health: 65,
    },
    {
        key: "4",
        device: "Flow-Meter-G4",
        status: "offline",
        lastMessage: "Connection lost",
        lastMessageDate: "2026-03-05 03:50:00",
        location: "Water Treatment",
        sensorData: { temp: 0, humidity: 0, power: 0 },
        health: 0,
    },
];

export const DashboardPage: React.FC = () => {
    const columns = [
        {
            title: "Device Name",
            dataIndex: "device",
            key: "device",
            render: (text: string) => (
                <Space>
                    <DesktopOutlined style={{ color: '#f88601', opacity: 0.8 }} />
                    <Tooltip title="Unique device identifier in the network">
                        <Text strong style={{ fontSize: '13px', cursor: 'help' }}>{text}</Text>
                    </Tooltip>
                </Space>
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                const config: Record<string, { color: string, label: string, dot: string }> = {
                    online: { color: "#52c41a", label: "ACTIVE", dot: "#52c41a" },
                    warning: { color: "#faad14", label: "ALERT", dot: "#faad14" },
                    offline: { color: "#ff4d4f", label: "DOWN", dot: "#ff4d4f" },
                };

                const currentConfig = config[status] || config.offline;

                return (
                    <Tooltip title={`Device is currently ${status}`}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: `${currentConfig.color}15`,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: `1px solid ${currentConfig.color}30`
                        }}>
                            <Badge status={status === 'online' ? 'processing' : 'default'} color={currentConfig.dot} />
                            <Text style={{ fontSize: '10px', fontWeight: 600, color: currentConfig.color, letterSpacing: '0.5px' }}>{currentConfig.label}</Text>
                        </div>
                    </Tooltip>
                );
            }
        },
        {
            title: "Last Transmission",
            key: "transmission",
            render: (_: any, record: DeviceData) => (
                <Tooltip title={`Message: ${record.lastMessage}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', cursor: 'help' }}>
                        <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{record.lastMessage}</Text>
                        <Text style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{record.lastMessageDate}</Text>
                    </div>
                </Tooltip>
            )
        },
        {
            title: "Location",
            dataIndex: "location",
            key: "location",
            render: (text: string) => (
                <Tooltip title="Physical installation site">
                    <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', cursor: 'help' }}>
                        <EnvironmentOutlined style={{ marginRight: '4px', fontSize: '10px' }} />
                        {text}
                    </Text>
                </Tooltip>
            )
        },
        {
            title: "Metrics",
            key: "metrics",
            render: (_: any, record: DeviceData) => (
                <Space size={12}>
                    <Tooltip title="Temperature / Humidity">
                        <Space size={4} style={{ cursor: 'help' }}>
                            <DashboardOutlined style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }} />
                            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                                <span style={{ color: record.sensorData.temp > 35 ? '#ff4d4f' : 'inherit' }}>{record.sensorData.temp}°C</span>
                                <span style={{ opacity: 0.3, margin: '0 4px' }}>/</span>
                                {record.sensorData.humidity}%
                            </Text>
                        </Space>
                    </Tooltip>
                    <Tooltip title="Power Consumption (kW)">
                        <Space size={4} style={{ cursor: 'help' }}>
                            <ThunderboltOutlined style={{ fontSize: '12px', color: '#faad14', opacity: 0.5 }} />
                            <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{record.sensorData.power}kW</Text>
                        </Space>
                    </Tooltip>
                </Space>
            )
        },
        {
            title: "Health",
            dataIndex: "health",
            key: "health",
            width: 120,
            render: (health: number) => {
                const healthColor = health > 80 ? '#52c41a' : health > 40 ? '#faad14' : '#ff4d4f';
                return (
                    <Tooltip title={`Overall stability: ${health}%`}>
                        <div style={{ width: '100%', cursor: 'help' }}>
                            <Progress
                                percent={health}
                                size="small"
                                strokeColor={`${healthColor}80`}
                                trailColor="rgba(255,255,255,0.05)"
                                showInfo={false}
                            />
                        </div>
                    </Tooltip>
                );
            }
        }
    ];

    return (
        <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: "32px", borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                <Title level={4} style={{ marginBottom: "4px", fontWeight: 500 }}>Global Infrastructure Overview</Title>
                <Text style={{ fontSize: "12px", color: 'rgba(255,255,255,0.45)' }}>Real-time synchronization with edge assets across all active factories.</Text>
            </div>

            <Table
                columns={columns}
                dataSource={mockData}
                pagination={false}
                size="small"
                rowClassName="dashboard-table-row"
                style={{ backgroundColor: 'transparent' }}
            />
        </div>
    );
};

export default DashboardPage;
