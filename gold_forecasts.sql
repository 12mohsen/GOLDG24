-- ═══════════════════════════════════════════════════
-- جدول توقعات البنوك/المحللين لسعر الذهب
-- يُقرأ من التطبيق (index.html) لعرض بطاقة "📊 توقعات البنوك"
-- ويُحدَّث تلقائياً أسبوعياً عبر مهمة مجدولة (Claude scheduled task)
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gold_forecasts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  source       TEXT        NOT NULL,          -- اسم البنك/الجهة، مثل 'JPMorgan'
  target_price NUMERIC,                       -- السعر المستهدف بالدولار
  timeframe    TEXT,                          -- مثل 'Q4 2026' أو 'نهاية 2026'
  direction    TEXT        CHECK (direction IN ('up','down','neutral')),
  note         TEXT,                          -- سطر ملخّص قصير بالعربي
  source_url   TEXT,
  published_at DATE,                          -- تاريخ نشر التوقع إن عُرف
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gold_forecasts_created_at ON gold_forecasts(created_at DESC);

ALTER TABLE gold_forecasts ENABLE ROW LEVEL SECURITY;

-- نفس نمط الأمان المستخدم في بقية الجداول (allow_all + تحكم على مستوى الكود)
CREATE POLICY "allow_all_forecasts" ON gold_forecasts FOR ALL USING (true) WITH CHECK (true);

-- ── تعبئة أولية بالتوقعات الحالية (سبتمبر 2026) ──
INSERT INTO gold_forecasts (source, target_price, timeframe, direction, note, source_url, published_at) VALUES
('JPMorgan', 6000, 'الربع الرابع 2026', 'up',
  'استمرار شراء البنوك المركزية وتدفقات ETF قد تدفع الذهب لـ6000$ بنهاية 2026، مع توقع 6300$ بنهاية 2027',
  'https://www.canadianminingreport.com/blog/jpmorgan-s-latest-gold-forecast-what-the-world-s-largest-bank-is-telling-investors', '2026-09-01'),
('Societe Generale', 6000, 'نهاية 2026', 'up',
  'رفع الهدف من 5000$ إلى 6000$ بسبب تدفقات ETF القوية وضعف الدولار المتوقع وطلب البنوك المركزية',
  'https://www.canadianminingreport.com/blog/gold-heading-to-6000-oz-predicts-societe-generale', '2026-01-26'),
('تحليل فني (مدى قريب)', 4125, '3 أشهر', 'down',
  'محللون حذرون يرون احتمال استمرار التصحيح نحو دعم 4100-4150$ قبل أي تعافٍ، بسبب قوة الدولار وضعف الزخم',
  'https://www.canadianminingreport.com/blog/is-the-gold-correction-over-no-analysts-say-more-pain-lies-ahead', '2026-09-01');
