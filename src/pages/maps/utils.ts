import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatRelativeTime = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    return dayjs(date).fromNow();
};

export const formatDateTime = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

export const getDeviceMarkerIcon = (google: any, isActive: boolean) => {
    return {
        path: google?.maps?.SymbolPath?.CIRCLE || 0,
        scale: 8,
        fillColor: isActive ? "#f88601" : "#4b5563",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
    };
};

export const extractPayloadField = (payload: any, fields: string[]) => {
    if (!payload) return null;
    for (const field of fields) {
        if (payload[field] !== undefined) return payload[field];
    }
    return null;
};
