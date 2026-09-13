-- شغّل هذا في SQL Editor بعد ملف gold_forecasts.sql
-- يضيف عمود "metal" (ذهب/فضة) للجدول الموجود، ويعبّي توقعات الفضة

ALTER TABLE gold_forecasts
  ADD COLUMN IF NOT EXISTS metal TEXT NOT NULL DEFAULT 'gold' CHECK (metal IN ('gold','silver'));

CREATE INDEX IF NOT EXISTS idx_gold_forecasts_metal ON gold_forecasts(metal);

INSERT INTO gold_forecasts (metal, source, target_price, timeframe, direction, note, source_url, published_at) VALUES
('silver', 'JPMorgan', 85, 'الربع الرابع 2026', 'up',
  'متوسط متوقع 81$ لعام 2026 وهدف الربع الرابع نحو 85$، بسبب تشدد المعروض وقوة الطلب الصناعي',
  'https://www.canadianminingreport.com/blog/major-banks-remain-bullish-on-silver-here-s-what-they-re-predicting', '2026-09-01'),
('silver', 'Citigroup', 110, 'النصف الثاني 2026', 'up',
  'يستهدف 110$ بسبب نقص حاد في المعروض الفعلي (physical shortage) عالمياً',
  'https://www.canadianminingreport.com/blog/major-banks-remain-bullish-on-silver-here-s-what-they-re-predicting', '2026-09-01'),
('silver', 'تحليل فني (مدى قريب)', 59, 'أسابيع', 'down',
  'بعد تصحيح حاد من قمة 121$ في يناير إلى نحو 64$، هناك خطر كسر دعم 60$ نحو 58$ قبل أي استقرار',
  'https://bravenewcoin.com/insights/xag-usd-price-analysis-as-silver-faces-pullback-risk-after-cpi-surge', '2026-09-01');
