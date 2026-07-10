// ═══════════════════════════════════════════════════════════════
//  Supabase Edge Function:  ohlc
//  جلب بيانات الذهب والفضة التاريخية من السيرفر مباشرة
//  • بلا CORS  • بلا بروكسي  • بلا أي مفتاح API من المستخدم
//  + كاش سيرفري مشترك في جدول ohlc_cache (يعمل حتى لو تعطّل كل المصادر)
//  الاستدعاء:  /functions/v1/ohlc?metal=gold   أو   ?metal=silver
// ═══════════════════════════════════════════════════════════════

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// متغيرات متوفرة تلقائياً داخل دوال Supabase
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── حفظ آخر بيانات ناجحة في جدول الكاش (upsert) ──
async function saveCache(metal: string, payload: unknown) {
  try {
    await fetch(`${SB_URL}/rest/v1/ohlc_cache`, {
      method: "POST",
      headers: {
        apikey: SB_SERVICE,
        Authorization: `Bearer ${SB_SERVICE}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        metal,
        data: payload,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (_) { /* الكاش اختياري — تجاهل الخطأ */ }
}

// ── قراءة آخر بيانات مخزّنة عند تعطّل كل المصادر الحيّة ──
// deno-lint-ignore no-explicit-any
async function readCache(metal: string): Promise<any | null> {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/ohlc_cache?metal=eq.${metal}&select=data,updated_at`,
      { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } },
    );
    if (r.ok) {
      const rows = await r.json();
      if (rows.length && rows[0].data) return rows[0].data;
    }
  } catch (_) { /* لا يوجد كاش */ }
  return null;
}

// ── Stooq CSV → شموع ──
function parseStooq(txt: string) {
  const rows = txt.trim().split("\n");
  if (rows.length && rows[0].toLowerCase().includes("date")) rows.shift();
  const c: Array<Record<string, number>> = [];
  for (const row of rows) {
    const p = row.split(",");
    if (p.length < 5) continue;
    const o = +p[1], h = +p[2], l = +p[3], cl = +p[4], v = p[5] ? +p[5] : 0;
    if ([o, h, l, cl].some((x) => isNaN(x) || x <= 0)) continue;
    c.push({ o, h, l, c: cl, v: isNaN(v) ? 0 : v });
  }
  return c.slice(-400);
}

// ── Yahoo Finance JSON → شموع ──
// deno-lint-ignore no-explicit-any
function parseYahoo(j: any) {
  const res = j?.chart?.result?.[0];
  if (!res?.timestamp) return [];
  const q = res.indicators.quote[0];
  const c: Array<Record<string, number>> = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    const o = q.open[i], h = q.high[i], l = q.low[i], cl = q.close[i], v = q.volume[i];
    if ([o, h, l, cl].some((x) => x == null || isNaN(x))) continue;
    c.push({ o, h, l, c: cl, v: v == null ? 0 : v });
  }
  return c;
}

Deno.serve(async (req: Request) => {
  // preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const metal = url.searchParams.get("metal") === "silver" ? "silver" : "gold";
  const sSym = metal === "gold" ? "xauusd" : "xagusd";
  const ySym = metal === "gold" ? "GC=F" : "SI=F";

  // 1) Stooq — موثوق جداً من السيرفر
  try {
    const r = await fetch(`https://stooq.com/q/d/l/?s=${sSym}&i=d`);
    if (r.ok) {
      const candles = parseStooq(await r.text());
      if (candles.length >= 60) {
        const payload = { candles, hasVolume: false, source: "Stooq (Supabase)" };
        await saveCache(metal, payload);
        return json(payload);
      }
    }
  } catch (_) { /* جرّب المصدر التالي */ }

  // 2) Yahoo Finance — احتياطي (فيه بيانات حجم التداول)
  for (const host of ["query1", "query2"]) {
    try {
      const r = await fetch(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${ySym}?range=2y&interval=1d`,
        { headers: { "User-Agent": "Mozilla/5.0" } },
      );
      if (r.ok) {
        const candles = parseYahoo(await r.json());
        if (candles.length >= 60) {
          const payload = {
            candles,
            hasVolume: candles.slice(-30).some((x) => x.v > 0),
            source: "Yahoo (Supabase)",
          };
          await saveCache(metal, payload);
          return json(payload);
        }
      }
    } catch (_) { /* جرّب المضيف التالي */ }
  }

  // 3) كل المصادر الحيّة تعطّلت → أعِد آخر نسخة مخزّنة في الجدول
  const cached = await readCache(metal);
  if (cached) {
    cached.source = (cached.source || "Supabase") + " · كاش";
    return json(cached);
  }

  return json({ error: "no data from any source" }, 502);
});
