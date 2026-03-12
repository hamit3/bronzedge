export const formatConfigSummary = (type: string, config: any, geofenceName?: string) => {
    if (type === "geofence_enter" || type === "geofence_exit") {
        return `Geofence: ${geofenceName || config?.geofence_id || "Unknown"}`;
    }
    if (type === "sensor_threshold") {
        return `${config?.field} ${config?.operator} ${config?.value}`;
    }
    if (type === "night_movement") {
        return `After ${config?.start_hour}:00, before ${config?.end_hour}:00`;
    }
    if (type === "weekend_movement") {
        return "Weekend movement";
    }
    return "Unknown configuration";
};

export const RULE_TYPES = [
    { value: "geofence_enter", label: "Geofence Enter" },
    { value: "geofence_exit", label: "Geofence Exit" },
    { value: "sensor_threshold", label: "Sensor Threshold" },
    { value: "night_movement", label: "Night Movement" },
    { value: "weekend_movement", label: "Weekend Movement" },
];

export const getRuleTypeDetails = (type: string) => {
    const details = RULE_TYPES.find((t) => t.value === type);
    return {
        label: details?.label || type,
        color: "default", // Neutral color for all
    };
};
