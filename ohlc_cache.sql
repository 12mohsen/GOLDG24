-- ═══════════════════════════════════════════════════════════════
--  جدول الكاش السيرفري المشترك لبيانات الذهب والفضة
--  شغّله مرة واحدة في:  Supabase Dashboard ← SQL Editor ← New query
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.ohlc_cache (
  metal       text primary key,          -- 'gold' أو 'silver'
  data        jsonb not null,            -- {candles, hasVolume, source}
  updated_at  timestamptz not null default now()
);

-- تفعيل حماية الصفوف: الكتابة عبر الدالة السيرفرية فقط (service role يتجاوز RLS)
alter table public.ohlc_cache enable row level security;

-- سماح بالقراءة العامة (بيانات أسعار عامة — غير حساسة). اختياري.
drop policy if exists "read ohlc_cache" on public.ohlc_cache;
create policy "read ohlc_cache"
  on public.ohlc_cache
  for select
  using (true);
