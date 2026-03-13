import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NRF_API_KEY = Deno.env.get("NRF_API_KEY")!;
const NRF_DESTINATION_ID = Deno.env.get("NRF_DESTINATION_ID")!;
const ALERT_EMAIL = Deno.env.get("ALERT_EMAIL")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

serve(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let nrf_routing_ok = false;
    let error_detail = null;

    try {
        // Adım 1: nRF Cloud'a test mesajı gönder
        const res = await fetch(
            `https://message-routing.nrfcloud.com/v2/destination/${NRF_DESTINATION_ID}/test`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${NRF_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!res.ok) {
            error_detail = `nRF API hatası: ${res.status} ${await res.text()}`;
            console.log("NRF_TEST_FAILED:", error_detail);
        } else {
            console.log("NRF_TEST_SENT: test mesajı gönderildi, bekleniyor...");

            // Adım 2: 15 saniye bekle
            await new Promise((r) => setTimeout(r, 5000));

            // Adım 3: Son 1 dakikada nrf_routing_ok kaydı var mı?
            const since = new Date(Date.now() - 60 * 1000).toISOString();
            const { data, error } = await supabase
                .from("nrf_health_checks")
                .select("id")
                .eq("nrf_routing_ok", true)
                .gte("checked_at", since)
                .limit(1);

            if (error) {
                error_detail = `DB okuma hatası: ${error.message}`;
            } else if (data && data.length > 0) {
                nrf_routing_ok = true;
                console.log("NRF_ROUTING: OK ✅");
            } else {
                error_detail = "nRF test mesajı 5 saniyede Edge Function'a ulaşmadı";
                console.log("NRF_ROUTING: FAILED ❌");
            }
        }
    } catch (e) {
        error_detail = `nRF bağlantı hatası: ${e.message}`;
    }

    // Adım 4: Sonucu kaydet
    await supabase.from("nrf_health_checks").insert({
        nrf_routing_ok,
        error_detail,
    });

    // Adım 5: Hata varsa e-posta gönder
    if (!nrf_routing_ok) {
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "monitor@yourdomain.com",
                to: ALERT_EMAIL,
                subject: "🔴 nRF Cloud Routing Hatası",
                html: `<h2>nRF Cloud → Supabase hattı çalışmıyor</h2>
               <p><b>Zaman:</b> ${new Date().toISOString()}</p>
               <p><b>Hata:</b> ${error_detail}</p>`,
            }),
        });
    }

    return new Response(
        JSON.stringify({ nrf_routing_ok, error_detail }),
        { headers: { "Content-Type": "application/json" } }
    );
});