import React from "react";
import { Modal, Typography, Descriptions, Space } from "antd";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { getRuleTypeDetails } from "./utils";
import dayjs from "dayjs";

import { COMMON_MAP_OPTIONS } from "../../utils/mapUtils";

const { Text, Title } = Typography;

const mapContainerStyle = {
    width: "100%",
    height: "200px",
    borderRadius: "8px",
    backgroundColor: "#f8f9fa",
};

export const EventDetailModal = ({
    visible,
    event,
    onClose,
}: {
    visible: boolean;
    event: any;
    onClose: () => void;
}) => {
    if (!event) return null;

    const lat = event.latitude;
    const lng = event.longitude;
    const hasLocation = lat != null && lng != null;

    return (
        <Modal
            title="Event Details"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
        >
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Triggered At">
                    {dayjs(event.triggered_at).format("YYYY-MM-DD HH:mm:ss")}
                </Descriptions.Item>
                <Descriptions.Item label="Rule">
                    {event.rules?.name || "Unknown Rule"}
                </Descriptions.Item>
                <Descriptions.Item label="Device">
                    {event.devices?.name || "Unknown Device"}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                    {getRuleTypeDetails(event.rules?.rule_type).label}
                </Descriptions.Item>
                <Descriptions.Item label="Message">{event.message}</Descriptions.Item>
            </Descriptions>

            {event.trigger_payload && (
                <div style={{ marginBottom: 16 }}>
                    <Text strong>Trigger Payload JSON:</Text>
                    <pre
                        style={{
                            background: "rgba(255, 255, 255, 0.04)",
                            padding: "12px",
                            borderRadius: "6px",
                            maxWidth: "100%",
                            overflow: "auto",
                        }}
                    >
                        {JSON.stringify(event.trigger_payload, null, 2)}
                    </pre>
                </div>
            )}

            {hasLocation && (
                <div>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                        Location at time of event:
                    </Text>
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={{ lat, lng }}
                        zoom={14}
                        options={{
                            ...COMMON_MAP_OPTIONS,
                            disableDefaultUI: true,
                            zoomControl: true,
                        }}
                    >
                        <Marker position={{ lat, lng }} />
                    </GoogleMap>
                </div>
            )}
        </Modal>
    );
};

