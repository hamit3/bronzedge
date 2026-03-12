import React, { useState, useCallback, useRef, useMemo } from "react";
import { useList, useCreate, useDelete } from "@refinedev/core";
import { GoogleMap, DrawingManager, Polygon, Circle, Rectangle, useJsApiLoader } from "@react-google-maps/api";
import { Button, Space, Typography, Spin, Popconfirm, Modal, Input, message, Form, Tag, Table, Empty, Card, Tooltip } from "antd";
import { 
    DeleteOutlined, 
    GlobalOutlined, 
    EnvironmentOutlined, 
    SearchOutlined, 
    PlusOutlined,
    EditOutlined,
    HeatMapOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Autocomplete } from "@react-google-maps/api";

const { Text, Title } = Typography;

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];

const MAP_CONTAINER_STYLE = { width: "100%", height: "600px", backgroundColor: "#1d2c4d" };

interface GeofencesTabProps {
    organizationId: string | null;
    isAdmin: boolean;
    isOperator: boolean;
}

export const GeofencesTab: React.FC<GeofencesTabProps> = ({ organizationId, isAdmin, isOperator }) => {
    const [isDrawMode, setIsDrawMode] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pendingGeofence, setPendingGeofence] = useState<any>(null);
    const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState({ lat: 39.9, lng: 32.8 });
    const [mapZoom, setMapZoom] = useState(6);
    const [form] = Form.useForm();
    const mapRef = useRef<google.maps.Map | null>(null);

    const { mutate: createGeofence, mutation: createMutation } = useCreate();
    const { mutate: deleteGeofence, mutation: deleteMutation } = useDelete();
    const isCreating = createMutation.isPending;
    const isDeleting = deleteMutation?.isPending;

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ["drawing", "geometry", "places"] as any
    });

    const { query: geofencesQuery } = useList({
        resource: "geofences",
        filters: organizationId ? [{ field: "organization_id", operator: "eq", value: organizationId }] : [],
        pagination: { pageSize: 100 },
        queryOptions: { enabled: !!organizationId },
    });

    const geofences = (geofencesQuery.data?.data || []) as any[];
    const isLoading = geofencesQuery.isLoading;

    const mapOptions = useMemo<google.maps.MapOptions>(() => ({
        styles: DARK_MAP_STYLES,
        disableDefaultUI: false,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        backgroundColor: "#1d2c4d"
    }), []);

    const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
        polygon.setMap(null);
        const path = polygon.getPath().getArray();
        const coordinates = path.map(p => ({ lat: p.lat(), lng: p.lng() }));
        setPendingGeofence({ type: "polygon", coordinates, radius: null });
        setIsModalVisible(true);
        setIsDrawMode(false);
    }, []);

    const onCircleComplete = useCallback((circle: google.maps.Circle) => {
        circle.setMap(null);
        const center = circle.getCenter();
        const radius = circle.getRadius();
        setPendingGeofence({ type: "circle", coordinates: { lat: center?.lat(), lng: center?.lng() }, radius: radius });
        setIsModalVisible(true);
        setIsDrawMode(false);
    }, []);

    const onRectangleComplete = useCallback((rectangle: google.maps.Rectangle) => {
        rectangle.setMap(null);
        const bounds = rectangle.getBounds();
        if (!bounds) return;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const coordinates = [
            { lat: ne.lat(), lng: sw.lng() },
            { lat: ne.lat(), lng: ne.lng() },
            { lat: sw.lat(), lng: ne.lng() },
            { lat: sw.lat(), lng: sw.lng() },
        ];
        setPendingGeofence({ type: "rectangle", coordinates, radius: null });
        setIsModalVisible(true);
        setIsDrawMode(false);
    }, []);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            createGeofence({
                resource: "geofences",
                values: {
                    ...values,
                    organization_id: organizationId,
                    type: pendingGeofence.type,
                    coordinates: pendingGeofence.coordinates,
                    radius: pendingGeofence.radius,
                    is_active: true
                },
            }, {
                onSuccess: () => {
                    message.success("Geofence created successfully");
                    setIsModalVisible(false);
                    form.resetFields();
                    setPendingGeofence(null);
                }
            });
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const handleDelete = (id: string) => {
        deleteGeofence({ resource: "geofences", id }, {
            onSuccess: () => message.success("Geofence deleted"),
        });
    };

    const focusGeofence = (gf: any) => {
        setSelectedGeofenceId(gf.id);
        const newPos = gf.type === 'circle' ? gf.coordinates : gf.coordinates[0];
        setMapCenter(newPos);
        setMapZoom(16);
    };

    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const newPos = { 
                    lat: place.geometry.location.lat(), 
                    lng: place.geometry.location.lng() 
                };
                setMapCenter(newPos);
                setMapZoom(15);
            }
        }
    };

    const columns = [
        { 
            title: "NAME", 
            dataIndex: "name", 
            key: "name", 
            render: (v: string, record: any) => (
                <Space>
                    <Text strong style={{ color: selectedGeofenceId === record.id ? '#f88601' : '#fff' }}>{v}</Text>
                    {selectedGeofenceId === record.id && <Tag color="#f88601" style={{ fontSize: '10px', height: 18, border: 'none' }}>ACTIVE</Tag>}
                </Space>
            )
        },
        { 
            title: "TYPE", 
            dataIndex: "type", 
            key: "type", 
            render: (v: string) => <Tag color="#1a2744" style={{ borderRadius: 4, border: '1px solid rgba(248,134,1,0.2)', fontSize: '10px' }}>{v.toUpperCase()}</Tag> 
        },
        { 
            title: "DESCRIPTION", 
            dataIndex: "description", 
            key: "description", 
            render: (v: string) => <Text type="secondary" style={{ fontSize: '12px' }}>{v || "-"}</Text> 
        },
        {
            title: "ACTIONS",
            key: "actions",
            align: "right" as const,
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="Focus on map">
                        <Button 
                            size="small" 
                            icon={<EnvironmentOutlined />} 
                            onClick={() => focusGeofence(record)}
                            className="premium-btn"
                        >
                            Focus
                        </Button>
                    </Tooltip>
                    {(isAdmin || isOperator) && (
                        <Popconfirm
                            title="Delete boundary area?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <Button 
                                danger 
                                type="text"
                                size="small" 
                                icon={<DeleteOutlined />} 
                                loading={isDeleting && deleteMutation?.variables?.id === record.id} 
                            />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    if (!isLoaded) return <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}><Spin size="large" /></div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Map Card */}
            <div className="geofence-card shadow-premium" style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "600px" }}>
                <div style={{ 
                    padding: "16px 24px", 
                    backgroundColor: "rgba(13, 20, 36, 0.4)", 
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <Space size="large">
                        <Title level={5} style={{ margin: 0, color: "#fff", display: 'flex', alignItems: 'center', gap: 8 }}>
                            <HeatMapOutlined style={{ color: '#f88601' }} /> Visual Workspace
                        </Title>
                        <Autocomplete onLoad={(ac) => setAutocomplete(ac)} onPlaceChanged={onPlaceChanged}>
                            <Input
                                placeholder="Find a location..."
                                prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                                className="search-input"
                                style={{ width: 300 }}
                            />
                        </Autocomplete>
                    </Space>
                    {(isAdmin || isOperator) && (
                        <Button 
                            type={isDrawMode ? "default" : "primary"} 
                            icon={isDrawMode ? null : <PlusOutlined />}
                            onClick={() => setIsDrawMode(!isDrawMode)}
                            className={isDrawMode ? "cancel-btn" : "create-btn"}
                        >
                            {isDrawMode ? "Cancel Drawing" : "Draw New Area"}
                        </Button>
                    )}
                </div>

                <div style={{ position: "relative", height: "600px", backgroundColor: "#1d2c4d" }}>
                    <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={mapCenter}
                        zoom={mapZoom}
                        onDragEnd={() => {
                            if (mapRef.current) {
                                const newCenter = mapRef.current.getCenter();
                                if (newCenter) {
                                    setMapCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
                                }
                            }
                        }}
                        onZoomChanged={() => {
                            if (mapRef.current) {
                                const newZoom = mapRef.current.getZoom();
                                if (newZoom !== undefined && newZoom !== mapZoom) {
                                    setMapZoom(newZoom);
                                }
                            }
                        }}
                        options={mapOptions}
                        onLoad={(map) => { mapRef.current = map; }}
                    >
                        {isDrawMode && (
                            <DrawingManager
                                onPolygonComplete={onPolygonComplete}
                                onCircleComplete={onCircleComplete}
                                onRectangleComplete={onRectangleComplete}
                                options={{
                                    drawingControl: true,
                                    drawingControlOptions: {
                                        position: window.google.maps.ControlPosition.TOP_CENTER,
                                        drawingModes: [
                                            window.google.maps.drawing.OverlayType.POLYGON,
                                            window.google.maps.drawing.OverlayType.CIRCLE,
                                            window.google.maps.drawing.OverlayType.RECTANGLE,
                                        ],
                                    },
                                    polygonOptions: { fillColor: "#f88601", strokeColor: "#f88601", fillOpacity: 0.4, strokeWeight: 2 },
                                    circleOptions: { fillColor: "#f88601", strokeColor: "#f88601", fillOpacity: 0.4, strokeWeight: 2 },
                                    rectangleOptions: { fillColor: "#f88601", strokeColor: "#f88601", fillOpacity: 0.4, strokeWeight: 2 },
                                }}
                            />
                        )}

                        {geofences.map(gf => {
                            const isSelected = selectedGeofenceId === gf.id;
                            const drawOptions = {
                                fillColor: isSelected ? "#f88601" : "#1890ff",
                                fillOpacity: isSelected ? 0.4 : 0.2,
                                strokeColor: isSelected ? "#f88601" : "#1890ff",
                                strokeWeight: isSelected ? 3 : 2,
                                zIndex: isSelected ? 1000 : 1
                            };

                            if (gf.type === 'polygon' || gf.type === 'rectangle') {
                                return <Polygon key={gf.id} paths={gf.coordinates} options={drawOptions} onClick={() => focusGeofence(gf)} />;
                            }
                            if (gf.type === 'circle') {
                                return <Circle key={gf.id} center={gf.coordinates} radius={Number(gf.radius)} options={drawOptions} onClick={() => focusGeofence(gf)} />;
                            }
                            return null;
                        })}
                    </GoogleMap>

                    {isDrawMode && (
                        <div className="drawing-tip">
                            <Text strong style={{ color: '#fff' }}>Drawing active: Select a tool from the top center to define boundaries</Text>
                            <Button type="primary" danger onClick={() => setIsDrawMode(false)} size="small">Cancel</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <div className="geofence-card shadow-premium" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ 
                    padding: "16px 24px", 
                    backgroundColor: "rgba(13, 20, 36, 0.4)", 
                    borderBottom: "1px solid rgba(255,255,255,0.06)"
                }}>
                    <Text strong style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Saved boundary areas ({geofences.length})
                    </Text>
                </div>
                <div style={{ flex: 1, padding: "0 24px 24px", overflowY: "auto" }}>
                    <Table
                        dataSource={geofences}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 5 }}
                        className="account-table premium-table"
                        onRow={(record) => ({
                            onClick: () => focusGeofence(record),
                            style: { cursor: 'pointer' }
                        })}
                    />
                </div>
            </div>

            <Modal
                title={<Space><EditOutlined style={{ color: '#f88601' }} /> <span>Confirm Area Boundaries</span></Space>}
                open={isModalVisible}
                onOk={handleSave}
                onCancel={() => {
                    setIsModalVisible(false);
                    setPendingGeofence(null);
                    form.resetFields();
                }}
                confirmLoading={isCreating}
                centered
                okText="Save Geofence"
                width={400}
                className="geofence-modal"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Area Name" rules={[{ required: true, message: "Please enter a name" }]}>
                        <Input placeholder="e.g. Warehouse A, Main Campus..." />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="Optional description..." rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .geofence-card {
                    background: #0d1424;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                }
                .premium-table .ant-table {
                    background: transparent !important;
                }
                .premium-table .ant-table-thead > tr > th {
                    background: transparent !important;
                    color: rgba(255,255,255,0.3) !important;
                    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
                    font-size: 10px;
                    padding: 16px 8px !important;
                }
                .premium-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                    padding: 12px 8px !important;
                }
                .premium-table .ant-table-tbody > tr:hover > td {
                    background: rgba(248,134,1,0.04) !important;
                }
                .search-input {
                    background: rgba(255,255,255,0.03) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 8px !important;
                    color: #fff !important;
                }
                .drawing-tip {
                    position: absolute;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    background: rgba(13, 20, 36, 0.95);
                    backdropFilter: blur(10px);
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: 1px solid #f88601;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    z-index: 100;
                    alignItems: center;
                    gap: 12px;
                }
                .geofence-modal .ant-modal-content {
                    background: #0d1424 !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
                .geofence-modal .ant-modal-title { color: #fff !important; }
                .geofence-modal .ant-form-item-label label { color: rgba(255,255,255,0.45) !important; }
                .premium-btn {
                    background: rgba(255,255,255,0.05) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    color: rgba(255,255,255,0.85) !important;
                    font-size: 11px !important;
                    border-radius: 4px !important;
                }
                .shadow-premium {
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
                }
            `}</style>
        </div>
    );
};
