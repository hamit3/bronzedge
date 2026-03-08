import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
    if (!secret || secret.length === 0) {
        console.log("SIGNATURE_SKIP: no secret configured")
        return true
    }
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")
    console.log("SIGNATURE_EXPECTED:", hex)
    console.log("SIGNATURE_RECEIVED:", signature)
    console.log("SIGNATURE_MATCH:", hex === signature)
    return hex === signature
}

serve(async (req) => {
    console.log("=== REQUEST ===")
    console.log("METHOD:", req.method)
    console.log("URL:", req.url)

    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => { headers[key] = value })
    console.log("HEADERS:", JSON.stringify(headers, null, 2))

    const rawBody = await req.text()
    console.log("RAW_BODY:", rawBody)

    // User-agent kontrolü
    const userAgent = headers["user-agent"] ?? ""
    console.log("USER_AGENT_CHECK:", userAgent.includes("nRF Cloud Message Routing Service") ? "PASS" : "FAIL")
    if (!userAgent.includes("nRF Cloud Message Routing Service")) {
        console.log("REJECTED: user-agent mismatch")
        return new Response("Unauthorized", { status: 401 })
    }

    // HMAC doğrula
    const signature = headers["x-nrfcloud-signature"] ?? ""
    const secret = Deno.env.get("NRF_SECRET") ?? ""
    console.log("SECRET_LENGTH:", secret.length)

    const valid = await verifySignature(secret, rawBody, signature)
    if (!valid) {
        console.log("REJECTED: signature mismatch")
        return new Response("Unauthorized", { status: 401 })
    }

    let body: any
    try {
        body = JSON.parse(rawBody)
    } catch (e) {
        console.log("PARSE_ERROR:", e)
        return new Response("Bad Request", { status: 400 })
    }

    console.log("BODY_TYPE:", body.type)
    console.log("BODY_KEYS:", Object.keys(body))
    console.log("MESSAGES_COUNT:", body.messages?.length ?? 0)

    // ── OTOMATİK VERİFICATION ──
    if (body.verificationToken || body.messages?.[0]?.verificationToken) {
        const token = body.verificationToken ?? body.messages[0].verificationToken
        const teamId = Deno.env.get("NRF_TEAM_ID") ?? ""
        console.log("VERIFICATION_TOKEN:", token)
        console.log("TEAM_ID:", teamId)

        // Önce x-nrfcloud-team-id header ile otomatik verify dene
        console.log("AUTO_VERIFY: returning x-nrfcloud-team-id header for automatic verification")
        return new Response(
            JSON.stringify({ verificationToken: token }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "x-nrfcloud-team-id": teamId,
                }
            }
        )
    }

    // ── MESAJLARI LOGLA ──
    if (body.messages) {
        body.messages.forEach((m: any, i: number) => {
            console.log(`MESSAGE[${i}]:`, JSON.stringify(m, null, 2))
            console.log(`MESSAGE[${i}].topic:`, m.topic)
            console.log(`MESSAGE[${i}].deviceId:`, m.deviceId)
            console.log(`MESSAGE[${i}].message:`, JSON.stringify(m.message))
        })
    }

    // ── SUPABASE'E KAYDET ──
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const rows = (body.messages ?? []).map((m: any) => ({
        device_id: m.deviceId ?? m.topic ?? null,
        app_id: m.message?.appId ?? null,
        message: m.message,
        received_at: m.receivedAt ?? body.timestamp,
    }))

    console.log("ROWS_TO_INSERT:", JSON.stringify(rows, null, 2))

    if (rows.length === 0) {
        console.log("NO_ROWS: nothing to insert")
        return new Response(JSON.stringify({ ok: true, inserted: 0 }), { status: 200 })
    }

    const { data, error } = await supabase
        .from("device_messages")
        .insert(rows)
        .select()

    if (error) {
        console.log("SUPABASE_ERROR:", JSON.stringify(error))
        return new Response(JSON.stringify({ error }), { status: 500 })
    }

    console.log("INSERTED:", JSON.stringify(data))
    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), { status: 200 })
})