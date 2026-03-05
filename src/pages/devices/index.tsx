import React, { useState } from "react";
import { List, CreateButton } from "@refinedev/antd";
import {
    Typography,
    Table,
    Tag,
    Badge,
    Space,
    Drawer,
    Form,
    Input,
    Select,
    Button,
    Row,
    Col,
    Divider,
    DatePicker,
    Tooltip
} from "antd";
import {
    DesktopOutlined,
    PlusOutlined,
    SettingOutlined,
    ApiOutlined,
    EnvironmentOutlined,
    CloudServerOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { Option } = Select;

interface DeviceAsset {
    key: string;
    assetId: string;
    name: string;
    model: string;
    location: string;
    type: string;
    status: "active" | "maintenance" | "inactive";
    ip: string;
}

const mockAssets: DeviceAsset[] = [
    {
        key: "1",
        assetId: "BRZ-GATE-001",
        name: "Main Gateway A",
        model: "BronzEdge G1",
        location: "Factory A - Section 1",
        type: "Gateway",
        status: "active",
        ip: "192.168.1.10",
    },
    {
        key: "2",
        assetId: "BRZ-SNS-442",
        name: "Temp Sensor B",
        model: "S-Thermal 2.0",
        location: "Storage B",
        type: "Sensor",
        status: "active",
        ip: "192.168.1.45",
    },
    {
        key: "3",
        assetId: "BRZ-CTRL-09",
        name: "HVAC Controller",
        model: "C-Flow Pro",
        location: "Maintenance Yard",
        type: "Actuator",
        status: "maintenance",
        ip: "10.0.4.12",
    },
];

export const DeviceList: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const showDrawer = () => setOpen(true);
    const onClose = () => setOpen(false);

    const onFinish = (values: any) => {
        console.log("Success:", values);
        setOpen(false);
        form.resetFields();
    };

    const columns = [
        {
            title: "Asset ID",
            dataIndex: "assetId",
            key: "assetId",
            render: (text: string) => <Text style={{ fontSize: '12px', fontWeight: 600 }}>{text}</Text>
        },
        {
            title: "Device Name",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: DeviceAsset) => (
                <Space>
                    <DesktopOutlined style={{ color: '#f88601', opacity: 0.8 }} />
                    <div>
                        <Text strong style={{ fontSize: '13px' }}>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '10px' }}>{record.model}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (text: string) => (
                <Tag color="default" bordered={false} style={{ fontSize: '11px', borderRadius: '4px' }}>
                    {text.toUpperCase()}
                </Tag>
            )
        },
        {
            title: "Location",
            dataIndex: "location",
            key: "location",
            render: (text: string) => (
                <Space size={4}>
                    <EnvironmentOutlined style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }} />
                    <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{text}</Text>
                </Space>
            )
        },
        {
            title: "Connectivity",
            dataIndex: "ip",
            key: "ip",
            render: (text: string) => (
                <Space size={4}>
                    <CloudServerOutlined style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }} />
                    <Text style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)' }}>{text}</Text>
                </Space>
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                const config: any = {
                    active: { color: "#52c41a", text: "ACTIVE" },
                    maintenance: { color: "#faad14", text: "SERVICE" },
                    inactive: { color: "#ff4d4f", text: "DEACTIVATED" }
                };
                return (
                    <Badge color={config[status].color} text={
                        <Text style={{ fontSize: '11px', color: config[status].color, fontWeight: 600 }}>{config[status].text}</Text>
                    } />
                );
            }
        },
        {
            title: "Action",
            key: "action",
            render: () => (
                <Button size="small" type="text" icon={<SettingOutlined style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }} />} />
            )
        }
    ];

    return (
        <div style={{ padding: '0px' }}>
            <List
                title={<Title level={3} style={{ margin: 0 }}>Assets & Devices</Title>}
                headerButtons={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showDrawer}
                        style={{ height: '32px', fontSize: '13px' }}
                    >
                        Register Asset
                    </Button>
                }
            >
                <div style={{ marginBottom: '24px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        View and manage the structural hierarchy of your industrial IoT ecosystem.
                    </Text>
                </div>

                <Table
                    columns={columns}
                    dataSource={mockAssets}
                    pagination={false}
                    size="small"
                    style={{ backgroundColor: 'transparent' }}
                />
            </List>

            <Drawer
                title={
                    <Space>
                        <ApiOutlined style={{ color: '#f88601' }} />
                        <Title level={4} style={{ margin: 0 }}>Register New Industrial IoT Device</Title>
                    </Space>
                }
                width={720}
                onClose={onClose}
                open={open}
                styles={{
                    body: { paddingBottom: 80, backgroundColor: '#141414' },
                    header: { borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#141414' }
                }}
                footer={
                    <div style={{ textAlign: "right", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <Space>
                            <Button onClick={onClose} style={{ borderRadius: '4px' }}>Cancel</Button>
                            <Button onClick={() => form.submit()} type="primary" style={{ borderRadius: '4px' }}>
                                Confirm Definition
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Form layout="vertical" form={form} onFinish={onFinish} requiredMark={false}>
                    {/* General Information */}
                    <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <Space><DesktopOutlined /><Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>General Identity</Text></Space>
                    </Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Display Name" rules={[{ required: true }]}>
                                <Input placeholder="e.g. Master Gateway Floor 1" variant="filled" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="assetId" label="Asset Serial / Tag ID" rules={[{ required: true }]}>
                                <Input placeholder="e.g. BRZ-G-2024-X" variant="filled" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label="Device Category" rules={[{ required: true }]}>
                                <Select placeholder="Select type" variant="filled">
                                    <Option value="gateway">Main Gateway</Option>
                                    <Option value="sensor">Sensor Node</Option>
                                    <Option value="actuator">Industrial Actuator</Option>
                                    <Option value="plc">PLC System</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="location" label="Factory / Section">
                                <Select placeholder="Assign location" variant="filled">
                                    <Option value="factory_a">Factory A - Main Hub</Option>
                                    <Option value="factory_b">Factory B - Logistic</Option>
                                    <Option value="garden_x">Garden X - Environmental</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Connectivity Settings */}
                    <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.05)', marginTop: '32px' }}>
                        <Space><CloudServerOutlined /><Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Connectivity & Networking</Text></Space>
                    </Divider>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="connection" label="Connection Protocol">
                                <Select defaultValue="ethernet" variant="filled">
                                    <Option value="ethernet">Ethernet (Wired)</Option>
                                    <Option value="wifi">Wi-Fi (Wireless)</Option>
                                    <Option value="lora">LoRaWAN</Option>
                                    <Option value="cellular">4G/LTE</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="ip" label="Fixed IPv4 / Static IP">
                                <Input placeholder="192.168.1.1" variant="filled" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="mac" label="HW MAC Address">
                                <Input placeholder="00:00:00:00:00:00" variant="filled" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Industrial Logic Settings */}
                    <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.05)', marginTop: '32px' }}>
                        <Space><SafetyCertificateOutlined /><Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase' }}>System Specification</Text></Space>
                    </Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="protocol" label="Data Transmission Protocol">
                                <Select placeholder="Select protocol" variant="filled">
                                    <Option value="mqtt">MQTT (Sparkplug B)</Option>
                                    <Option value="modbus">Modbus TCP/IP</Option>
                                    <Option value="opcua">OPC UA Client</Option>
                                    <Option value="rest">REST API / Webhook</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="installDate" label="Deployment Date">
                                <DatePicker style={{ width: '100%' }} variant="filled" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="notes" label="Technical Documentation / Notes">
                        <Input.TextArea rows={4} placeholder="Critical maintenance cycles, firmware history..." variant="filled" />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
};
