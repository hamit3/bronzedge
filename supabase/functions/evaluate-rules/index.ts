import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

const isPointInPolygon = (point: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]) => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;
        const intersect = ((yi > point.lat) !== (yj > point.lat))
            && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

Deno.serve(async (req) => {
    console.log("=== evaluate-rules START ===", new Date().toISOString());

    if (req.method !== 'POST') {
        console.log("REJECTED: method not allowed:", req.method);
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const rawMessage = await req.json();
    console.log("RAW_MESSAGE:", JSON.stringify(rawMessage));

    const messageRecord = rawMessage.record ?? rawMessage;
    console.log("MESSAGE_RECORD:", JSON.stringify(messageRecord));

    if (!messageRecord.device_id) {
        console.log("REJECTED: no device_id in message");
        return new Response(JSON.stringify({ error: "No device_id in message" }), { status: 400 });
    }

    const nrf_device_id = messageRecord.device_id;
    const payload = messageRecord.payload || {};
    const app_id = messageRecord.app_id || payload.appId || "UNKNOWN";
    const latitude = messageRecord.latitude || payload.data?.lat || payload.lat;
    const longitude = messageRecord.longitude || payload.data?.lng || payload.lng;
    const received_at = messageRecord.received_at || messageRecord.ts || new Date().toISOString();

    console.log(`PARSED — nrf_device_id: ${nrf_device_id}, app_id: ${app_id}, lat: ${latitude}, lng: ${longitude}, received_at: ${received_at}`);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // nRF device_id'den internal UUID'yi çöz
    const { data: device, error: deviceError } = await supabase
        .from("devices")
        .select("id")
        .eq("device_id", nrf_device_id)
        .single();

    if (deviceError || !device) {
        console.log(`DEVICE_NOT_FOUND: ${nrf_device_id}`, JSON.stringify(deviceError));
        return new Response(JSON.stringify({ error: "Device not found" }), { status: 404 });
    }

    const internal_device_id = device.id;
    console.log(`DEVICE_RESOLVED: ${nrf_device_id} → ${internal_device_id}`);

    // Rules'ı internal UUID ile çek
    const { data: rules, error: rulesError } = await supabase
        .from("rules")
        .select("*")
        .eq("is_active", true)
        .or(`device_id.eq.${internal_device_id},device_id.is.null`);

    if (rulesError || !rules) {
        console.error("RULES_FETCH_ERROR:", JSON.stringify(rulesError));
        return new Response(JSON.stringify({ error: rulesError }), { status: 500 });
    }

    console.log(`RULES_FETCHED: ${rules.length} active rules found`);

    const responses = [];

    for (const rule of rules) {
        let triggered = false;
        let eventMessage = "";

        console.log(`EVALUATING rule_id: ${rule.id}, type: ${rule.rule_type}, name: ${rule.name}`);

        if (rule.rule_type === "sensor_threshold") {
            const value = getNestedValue(payload, rule.config.field);
            console.log(`  sensor_threshold — field: ${rule.config.field}, value: ${value}, operator: ${rule.config.operator}, threshold: ${rule.config.value}`);
            triggered = evaluate(value, rule.config.operator, rule.config.value);
            if (triggered) {
                eventMessage = `${rule.config.field} ${rule.config.operator} ${rule.config.value} (actual: ${value})`;
            }
        }

        if (rule.rule_type === "geofence_enter" || rule.rule_type === "geofence_exit") {
            console.log(`  geofence — geofence_id: ${rule.config.geofence_id}, lat: ${latitude}, lng: ${longitude}`);

            const { data: geofence } = await supabase
                .from("geofences")
                .select("id, name, geometry, coordinates, radius")
                .eq("id", rule.config.geofence_id)
                .single();

            if (!geofence) {
                console.log(`  geofence NOT FOUND: ${rule.config.geofence_id}`);
            } else if (!latitude || !longitude) {
                console.log(`  geofence SKIPPED: no coordinates in message`);
            } else {
                const { data: prevReadings } = await supabase
                    .from("gnss_readings")
                    .select("lat, lng")
                    .eq("device_id", nrf_device_id)
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

                console.log(`  geofence: ${geofence.name}, isCurrentlyInside: ${isCurrentlyInside}, wasInside: ${wasInside}`);

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
            const isNight = start_hour > end_hour
                ? hour >= start_hour || hour < end_hour
                : hour >= start_hour && hour < end_hour;

            console.log(`  night_movement — hour: ${hour}, start: ${start_hour}, end: ${end_hour}, isNight: ${isNight}, hasCoords: ${latitude !== null}`);
            triggered = isNight && latitude !== null;
            if (triggered) {
                eventMessage = `Movement detected at night (${msgDate.toISOString()})`;
            }
        }

        if (rule.rule_type === "weekend_movement") {
            const day = new Date(received_at).getUTCDay();
            console.log(`  weekend_movement — day: ${day}, hasCoords: ${latitude !== null}`);
            triggered = (day === 0 || day === 6) && latitude !== null;
            if (triggered) {
                eventMessage = `Movement detected on weekend`;
            }
        }

        console.log(`  RESULT — triggered: ${triggered}${triggered ? `, message: ${eventMessage}` : ""}`);

        if (triggered) {
            const { error } = await supabase.from("rule_events").insert({
                rule_id: rule.id,
                device_id: internal_device_id,
                organization_id: rule.organization_id,
                message: `[${rule.name}] ${eventMessage}`,
                trigger_payload: payload,
                latitude: latitude,
                longitude: longitude,
            });
            if (error) {
                console.error(`  RULE_EVENT_INSERT_ERROR rule_id: ${rule.id}:`, JSON.stringify(error));
            } else {
                console.log(`  RULE_EVENT_INSERTED rule_id: ${rule.id}`);
            }
            responses.push({ rule_id: rule.id, eventMessage });
        }
    }

    console.log(`=== evaluate-rules END — ${responses.length} events triggered ===`);
    return new Response(JSON.stringify({ ok: true, events: responses }), {
        headers: { "Content-Type": "application/json" },
    });
});