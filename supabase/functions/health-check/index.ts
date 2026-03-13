import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EDGE_FUNCTION_URL = Deno.env.get("TARGET_EDGE_FUNCTION_URL")!; // nRF'den veri alan fn
const WEB_APP_URL = Deno.env.get("WEB_APP_URL")!;
const ALERT_EMAIL = Deno.env.get("ALERT_EMAIL")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

serve(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const results = { edge_function_ok: false, database_ok: false, web_app_ok: false };
    const errors: string[] = [];

    // Test 1: Edge Function erişilebilir mi?
    try {
        const res = await fetch(EDGE_FUNCTION_URL, { method: "HEAD", signal: AbortSignal.timeout(5000) });
        results.edge_function_ok = res.status < 500;
    } catch (e) {
        errors.push(`Edge Function: ${e.message}`);
    }

    // Test 2: Veritabanına yaz/oku
    try {
        const { error } = await supabase.from("health_checks").select("id").limit(1);
        results.database_ok = !error;
        if (error) errors.push(`Database: ${error.message}`);
    } catch (e) {
        errors.push(`Database: ${e.message}`);
    }

    // Test 3: Web uygulaması
    try {
        const res = await fetch(WEB_APP_URL, { method: "HEAD", signal: AbortSignal.timeout(8000) });
        results.web_app_ok = res.status < 500;
    } catch (e) {
        errors.push(`Web App: ${e.message}`);
    }

    const overall_ok = Object.values(results).every(Boolean);

    // Sonucu kaydet
    await supabase.from("health_checks").insert({
        ...results,
        overall_ok,
        error_detail: errors.join(" | ") || null,
    });

    // Hata varsa e-posta gönder
    if (!overall_ok) {
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                from: "monitor@yourdomain.com",
                to: ALERT_EMAIL,
                subject: "🔴 Sistem Hatası Tespit Edildi",
                html: `<h2>Sistem Kontrolü Başarısız</h2>
               <p><b>Zaman:</b> ${new Date().toISOString()}</p>
               <p><b>Hatalar:</b> ${errors.join("<br>")}</p>
               <p>Edge Function: ${results.edge_function_ok ? "✅" : "❌"}<br>
               Database: ${results.database_ok ? "✅" : "❌"}<br>
               Web App: ${results.web_app_ok ? "✅" : "❌"}</p>`,
            }),
        });
    }

    return new Response(JSON.stringify({ overall_ok, ...results }), {
        headers: { "Content-Type": "application/json" },
    });
});