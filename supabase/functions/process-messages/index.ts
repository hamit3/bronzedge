import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── SIGNATURE DOĞRULAMA ──
async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
    if (!secret || secret.length === 0) return true
    const key = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    )
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")
    console.log("SIGNATURE_MATCH:", hex === signature)
    return hex === signature
}

// ── PARSERLAR ──
function parseTemp(m: any, deviceId: string) {
    return {
        table: "temp_readings",
        row: {
            device_id: deviceId,
            celsius: parseFloat(m.data),
            ts: new Date(m.ts).toISOString(),
        }
    }
}

function parseFlip(m: any, deviceId: string) {
    return {
        table: "flip_readings",
        row: {
            device_id: deviceId,
            orientation: m.data, // NORMAL / UPSIDE_DOWN
            ts: new Date(m.ts).toISOString(),
        }
    }
}

function parseGnss(m: any, deviceId: string) {
    const d = m.data
    return {
        table: "gnss_readings",
        row: {
            device_id: deviceId,
            lat: d.lat, lng: d.lng,
            alt: d.alt, spd: d.spd,
            hdg: d.hdg, acc: d.acc,
            ts: new Date(m.ts).toISOString(),
        }
    }
}

function parseGps(m: any, deviceId: string) {
    return {
        table: "gps_readings",
        row: {
            device_id: deviceId,
            nmea: m.data,
            ts: new Date(m.ts).toISOString(),
        }
    }
}

function parseRsrp(m: any, deviceId: string) {
    return {
        table: "rsrp_readings",
        row: {
            device_id: deviceId,
            rsrp: parseFloat(m.data),
            ts: new Date(m.ts).toISOString(),
        }
    }
}

function parseDevice(m: any, deviceId: string) {
    const d = typeof m.data === "string" ? JSON.parse(m.data) : m.data
    return {
        table: "device_status",
        row: {
            device_id: deviceId,
            band: d["BAND"],
            mode: d["MODE"],
            operator: d["OPERATOR"],
            cell_id: d["CELLID"],
            ip_address: d["IP ADDRESS"],
            sim: d["SIM"],
            battery_mv: d["BATTERY"],
            iccid: d["ICCID"],
            firmware: d["FW"],
            ts: new Date(m.ts).toISOString(),
        }
    }
}

function parseLog(m: any, deviceId: string) {
    return {
        table: "device_logs",
        row: {
            device_id: deviceId,
            level: m.lvl,
            message: m.msg,
            source: m.src,
            sequence: m.seq,
            ts: new Date(m.ts).toISOString(),
        }
    }
}

function parseAlert(m: any, deviceId: string) {
    return {
        table: "device_alerts",
        row: {
            device_id: deviceId,
            type: m.type,
            value: m.value,
            description: m.desc,
            ts: new Date(m.ts).toISOString(),
        }
    }
}

// ── ROUTER ──
const parsers: Record<string, (m: any, deviceId: string) => any> = {
    "TEMP": parseTemp,
    "FLIP": parseFlip,
    "GNSS": parseGnss,
    "GPS": parseGps,
    "RSRP": parseRsrp,
    "DEVICE": parseDevice,
    "LOG": parseLog,
    "ALERT": parseAlert,
}

async function route(supabase: any, deviceId: string, message: any, receivedAt: string) {
    const appId = message?.appId ?? message?.app_id ?? "UNKNOWN"

    // Her zaman raw_messages'a yaz
    await supabase.from("raw_messages").insert({
        device_id: deviceId,
        app_id: appId,
        payload: message,
        received_at: receivedAt,
    })

    // Parser varsa ilgili tabloya da yaz
    const parser = parsers[appId]
    if (!parser) {
        console.log(`UNKNOWN_APP_ID: ${appId} — sadece raw_messages'a kaydedildi`)
        return
    }

    try {
        const parsed = parser(message, deviceId)
        console.log(`PARSED [${appId}]:`, JSON.stringify(parsed.row))
        const { error } = await supabase.from(parsed.table).insert(parsed.row)
        if (error) console.log(`INSERT_ERROR [${appId}]:`, JSON.stringify(error))
    } catch (e) {
        console.log(`PARSE_ERROR [${appId}]:`, e)
    }
}

// ── MAIN ──
serve(async (req) => {
    console.log("=== REQUEST ===")

    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => { headers[key] = value })

    const rawBody = await req.text()

    // User-agent kontrolü
    const userAgent = headers["user-agent"] ?? ""
    if (!userAgent.includes("nRF Cloud Message Routing Service")) {
        console.log("REJECTED: user-agent mismatch")
        return new Response("Unauthorized", { status: 401 })
    }

    // HMAC doğrula
    const signature = headers["x-nrfcloud-signature"] ?? ""
    const secret = Deno.env.get("NRF_SECRET") ?? ""
    const valid = await verifySignature(secret, rawBody, signature)
    if (!valid) {
        console.log("REJECTED: signature mismatch")
        return new Response("Unauthorized", { status: 401 })
    }

    let body: any
    try {
        body = JSON.parse(rawBody)
    } catch (e) {
        return new Response("Bad Request", { status: 400 })
    }

    console.log("BODY_TYPE:", body.type)
    console.log("MESSAGES_COUNT:", body.messages?.length ?? 0)

    // Verification — otomatik
    if (body.verificationToken || body.messages?.[0]?.verificationToken) {
        const token = body.verificationToken ?? body.messages[0].verificationToken
        console.log("VERIFICATION_TOKEN:", token)
        return new Response(
            JSON.stringify({ verificationToken: token }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "x-nrfcloud-team-id": Deno.env.get("NRF_TEAM_ID")!,
                }
            }
        )
    }

    // Supabase client
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Her mesajı route et
    const messages = body.messages ?? []
    await Promise.all(
        messages.map((m: any) =>
            route(supabase, m.deviceId ?? m.topic, m.message, m.receivedAt ?? body.timestamp)
        )
    )

    console.log(`PROCESSED: ${messages.length} messages`)
    return new Response(JSON.stringify({ ok: true, processed: messages.length }), { status: 200 })
})