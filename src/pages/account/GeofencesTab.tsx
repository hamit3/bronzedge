import React, { useState, useCallback, useRef, useMemo } from "react";
import { useList, useCreate, useDelete } from "@refinedev/core";
import { GoogleMap, DrawingManager, Polygon, Circle, Rectangle, useJsApiLoader } from "@react-google-maps/api";
import { Button, Table, Space, Card, Typography, Spin, Popconfirm, Modal, Input, message, Form, Tag } from "antd";
import { DeleteOutlined, GlobalOutlined, EnvironmentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const mapContainerStyle = {
    width: "100%",
    height: "450px",
    borderRadius: "8px",
};

const darkMapStyles: google.maps.MapTypeStyle[] = [
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];

const libraries: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"];

interface GeofencesTabProps {
    organizationId: string | null;
    isAdmin: boolean;
    isOperator: boolean;
}

export const GeofencesTab: React.FC<GeofencesTabProps> = ({ organizationId, isAdmin, isOperator }) => {
    const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
    const [isDrawMode, setIsDrawMode] = useState(false);

    // For saving new geofence
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pendingGeofence, setPendingGeofence] = useState<any>(null);
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

    const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
        polygon.setMap(null); // Remove temp drawing
        const path = polygon.getPath().getArray();
        const coordinates = path.map(p => ({ lat: p.lat(), lng: p.lng() }));

        setPendingGeofence({
            type: "polygon",
            coordinates,
            radius: null
        });
        setIsModalVisible(true);
        setIsDrawMode(false);
    }, []);

    const onCircleComplete = useCallback((circle: google.maps.Circle) => {
        circle.setMap(null); // Remove temp drawing
        const center = circle.getCenter();
        const radius = circle.getRadius();

        setPendingGeofence({
            type: "circle",
            coordinates: { lat: center?.lat(), lng: center?.lng() },
            radius: radius
        });
        setIsModalVisible(true);
        setIsDrawMode(false);
    }, []);

    const onRectangleComplete = useCallback((rectangle: google.maps.Rectangle) => {
        rectangle.setMap(null); // Remove temp drawing
        const bounds = rectangle.getBounds();
        if (!bounds) return;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const coordinates = [
            { lat: ne.lat(), lng: sw.lng() }, // NW
            { lat: ne.lat(), lng: ne.lng() }, // NE
            { lat: sw.lat(), lng: ne.lng() }, // SE
            { lat: sw.lat(), lng: sw.lng() }, // SW
        ];

        setPendingGeofence({
            type: "rectangle",
            coordinates,
            radius: null
        });
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
        deleteGeofence({
            resource: "geofences",
            id,
        }, {
            onSuccess: () => message.success("Geofence deleted"),
        });
    };

    const columns = [
        { title: "Name", dataIndex: "name", key: "name", render: (v: string) => <Text strong style={{ color: '#fff' }}>{v}</Text> },
        { title: "Type", dataIndex: "type", key: "type", render: (v: string) => <Tag color="blue">{v.toUpperCase()}</Tag> },
        { title: "Description", dataIndex: "description", key: "description", render: (v: string) => <Text type="secondary">{v || "-"}</Text> },
        { title: "Created At", dataIndex: "created_at", key: "created_at", render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm") },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Space>
                    <Button size="small" icon={<EnvironmentOutlined />} onClick={() => {
                        if (mapRef.current) {
                            if (record.type === 'circle') {
                                mapRef.current.panTo(record.coordinates);
                            } else {
                                mapRef.current.panTo(record.coordinates[0]);
                            }
                            mapRef.current.setZoom(14);
                        }
                    }}>Focus</Button>
                    {(isAdmin || isOperator) && (
                        <Popconfirm
                            title="Are you sure you want to delete this geofence?"
                            onConfirm={() => handleDelete(record.id)}
                        >
                            <Button danger size="small" icon={<DeleteOutlined />} loading={isDeleting && deleteMutation?.variables?.id === record.id} />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    if (!isLoaded) return <div style={{ minHeight: 300, display: "flex", justifyContent: "center", alignItems: "center" }}><Spin /></div>;

    return (
        <Card variant="borderless" style={{ background: "transparent" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0, color: "#f88601" }}><GlobalOutlined /> Setup Organization Geofences</Title>
                {(isAdmin || isOperator) && (
                    <Button type={isDrawMode ? "default" : "primary"} onClick={() => setIsDrawMode(!isDrawMode)}>
                        {isDrawMode ? "Cancel Drawing" : "Draw New Area"}
                    </Button>
                )}
            </div>

            <div style={{ position: "relative", marginBottom: 24, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={{ lat: 39.9, lng: 32.8 }}
                    zoom={6}
                    options={{ styles: darkMapStyles, disableDefaultUI: false }}
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
                                polygonOptions: { fillColor: "#f88601", strokeColor: "#f88601", fillOpacity: 0.4 },
                                circleOptions: { fillColor: "#f88601", strokeColor: "#f88601", fillOpacity: 0.4 },
                                rectangleOptions: { fillColor: "#f88601", strokeColor: "#f88601", fillOpacity: 0.4 },
                            }}
                        />
                    )}

                    {geofences.map(gf => {
                        if (gf.type === 'polygon' || gf.type === 'rectangle') {
                            return <Polygon key={gf.id} paths={gf.coordinates} options={{ fillColor: "#1890ff", fillOpacity: 0.3, strokeColor: "#1890ff", strokeWeight: 2 }} />;
                        }
                        if (gf.type === 'circle') {
                            return <Circle key={gf.id} center={gf.coordinates} radius={Number(gf.radius)} options={{ fillColor: "#1890ff", fillOpacity: 0.3, strokeColor: "#1890ff", strokeWeight: 2 }} />;
                        }
                        return null;
                    })}
                </GoogleMap>
            </div>

            <Title level={5} style={{ color: "#fff", marginBottom: 16 }}>Saved Geofences</Title>
            <Table
                dataSource={geofences}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
                className="account-table"
            />

            <Modal
                title="Save Geofence Area"
                open={isModalVisible}
                onOk={handleSave}
                onCancel={() => {
                    setIsModalVisible(false);
                    setPendingGeofence(null);
                    form.resetFields();
                }}
                confirmLoading={isCreating}
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
        </Card>
    );
};
