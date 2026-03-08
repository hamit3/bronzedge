import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    // Sadece nRF Cloud'dan gelen istekleri kabul et
    const userAgent = req.headers.get("user-agent") ?? ""
    if (!userAgent.includes("nRF Cloud Message Routing Service")) {
        return new Response("Unauthorized", { status: 401 })
    }

    const body = await req.json()

    // Verification token gelirse onayla
    if (body.verificationToken) {
        return new Response(
            JSON.stringify({ verificationToken: body.verificationToken }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        )
    }

    // Veriyi Supabase'e kaydet
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { error } = await supabase
        .from("device_messages")
        .insert({
            device_id: body.deviceId ?? body.device_id ?? null,
            app_id: body.appId ?? body.app_id ?? null,
            message: body,
        })

    if (error) return new Response(JSON.stringify({ error }), { status: 500 })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
})