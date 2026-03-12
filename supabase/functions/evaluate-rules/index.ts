import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// evaluate math operators
const evaluate = (value: any, operator: string, threshold: number): boolean => {
    const numValue = Number(value);
    if (isNaN(numValue)) return false;

    switch (operator) {
        case ">": return numValue > threshold;
        case "<": return numValue < threshold;
        case ">=": return numValue >= threshold;
        case "<=": return numValue <= threshold;
        case "==": return numValue === threshold;
        default: return false;
    }
};

const getNestedValue = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
        if (current === undefined || current === null) return undefined;
        current = current[key];
    }
    return current;
};

// simple point-in-polygon ray casting algorithm
const isPointInPolygon = (point: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]) => {
    let isInside = false;
    // This uses a generalized ray casting algorithm based on coordinates
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;

        // Check if the ray from point.lng intersects the polygon edge
        const intersect = ((yi > point.lat) !== (yj > point.lat))
            && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const rawMessage = await req.json();
    // Support both direct table record and Webhook payload structure
    const messageRecord = rawMessage.record ?? rawMessage;
    
    if (!messageRecord.device_id) {
        return new Response(JSON.stringify({ error: "No device_id in message" }), { status: 400 });
    }

    // Extract values for rule evaluation (handle raw_messages structure)
    // raw_messages has payload: { appId: "GNSS", data: { lat: 1.2, lng: 3.4 } }
    const device_id = messageRecord.device_id;
    const payload = messageRecord.payload || {};
    const app_id = messageRecord.app_id || payload.appId || "UNKNOWN";
    
    // Attempt to find coordinates in various possible locations
    const latitude = messageRecord.latitude || payload.data?.lat || payload.lat;
    const longitude = messageRecord.longitude || payload.data?.lng || payload.lng;
    const received_at = messageRecord.received_at || messageRecord.ts || new Date().toISOString();

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Fetch active rules for this device
    const { data: rules, error: rulesError } = await supabase
        .from("rules")
        .select("*")
        .eq("is_active", true)
        .or(`device_id.eq.${device_id},device_id.is.null`);

    if (rulesError || !rules) {
        console.error("Error fetching rules:", rulesError);
        return new Response(JSON.stringify({ error: rulesError }), { status: 500 });
    }

    const responses = [];

    for (const rule of rules) {
        let triggered = false;
        let eventMessage = "";

        if (rule.rule_type === "sensor_threshold") {
            // Check if rule field matches appId or is a nested path
            const value = getNestedValue(payload, rule.config.field);
            triggered = evaluate(value, rule.config.operator, rule.config.value);
            if (triggered) {
                eventMessage = `${rule.config.field} ${rule.config.operator} ${rule.config.value} (actual: ${value})`;
            }
        }

        if (rule.rule_type === "geofence_enter" || rule.rule_type === "geofence_exit") {
            const { data: geofence } = await supabase
                .from("geofences")
                .select("id, name, geometry, coordinates, radius")
                .eq("id", rule.config.geofence_id)
                .single();

            if (geofence && latitude && longitude) {
                // Find previous message to detect Enter / Exit transitions
                const { data: prevReadings } = await supabase
                    .from("gnss_readings")
                    .select("lat, lng")
                    .eq("device_id", device_id)
                    .lt("ts", received_at)
                    .order("ts", { ascending: false })
                    .limit(1);

                const currentPoint = { lat: Number(latitude), lng: Number(longitude) };
                const coords = geofence.geometry?.coordinates?.[0] || geofence.coordinates || [];
                const polygon = coords.map((c: any) => (Array.isArray(c) ? { lat: c[1], lng: c[0] } : c));

                const isCurrentlyInside = isPointInPolygon(currentPoint, polygon);

                let wasInside = false;
                if (prevReadings && prevReadings.length > 0) {
                    const prevPoint = { lat: Number(prevReadings[0].lat), lng: Number(prevReadings[0].lng) };
                    wasInside = isPointInPolygon(prevPoint, polygon);
                }

                if (rule.rule_type === "geofence_enter" && isCurrentlyInside && !wasInside) {
                    triggered = true;
                    eventMessage = `Entered geofence: ${geofence.name}`;
                } else if (rule.rule_type === "geofence_exit" && !isCurrentlyInside && wasInside) {
                    triggered = true;
                    eventMessage = `Exited geofence: ${geofence.name}`;
                }
            }
        }

        if (rule.rule_type === "night_movement") {
            const msgDate = new Date(received_at);
            const hour = msgDate.getUTCHours();
            const { start_hour, end_hour } = rule.config;
            const isNight =
                start_hour > end_hour
                    ? hour >= start_hour || hour < end_hour
                    : hour >= start_hour && hour < end_hour;

            triggered = isNight && latitude !== null;
            if (triggered) {
                eventMessage = `Movement detected at night (${msgDate.toISOString()})`;
            }
        }

        if (rule.rule_type === "weekend_movement") {
            const day = new Date(received_at).getUTCDay();
            triggered = (day === 0 || day === 6) && latitude !== null;
            if (triggered) {
                eventMessage = `Movement detected on weekend`;
            }
        }

        if (triggered) {
            const { data, error } = await supabase.from("rule_events").insert({
                rule_id: rule.id,
                device_id: device_id,
                organization_id: rule.organization_id,
                message: `[${rule.name}] ${eventMessage}`,
                trigger_payload: payload,
                latitude: latitude,
                longitude: longitude,
            });
            if (error) {
                console.error("Failed to insert rule_event:", error);
            }
            responses.push({ rule_id: rule.id, eventMessage });
        }
    }

    return new Response(JSON.stringify({ ok: true, events: responses }), {
        headers: { "Content-Type": "application/json" },
    });
});
