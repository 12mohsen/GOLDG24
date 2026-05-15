# إعداد محفظة الذهب على Supabase
> نظام مستقل تماماً — مرتبط حصراً بتطبيق `gold_wallet`

---

## الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى https://supabase.com وأنشئ مشروعاً جديداً
2. اختر اسم المشروع وكلمة المرور والمنطقة
3. انتظر حتى يكتمل إنشاء المشروع (2–5 دقائق)

---

## الخطوة 2: إنشاء الجداول في SQL Editor

افتح **SQL Editor** من لوحة التحكم وشغّل الأوامر التالية بالترتيب:

```sql
-- ─────────────────────────────────────────────
-- جدول المستخدمين (مع عمود created_from للعزل)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT UNIQUE NOT NULL,
  pass_hash    TEXT NOT NULL,
  hint         TEXT DEFAULT 'لا يوجد تلميح',
  created_from TEXT NOT NULL DEFAULT 'gold_wallet',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس سريع على (user_id + created_from) لاستعلامات Login/Register
CREATE INDEX IF NOT EXISTS idx_users_uid_origin
  ON users (user_id, created_from);

-- ─────────────────────────────────────────────
-- جدول العمليات (id من نوع UUID — سهل الحذف)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gold_operations (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  metal      TEXT NOT NULL CHECK (metal IN ('gold', 'silver')),
  grams      NUMERIC NOT NULL,
  buy_price  NUMERIC NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  date       TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_ops_user_id ON gold_operations (user_id);
CREATE INDEX IF NOT EXISTS idx_ops_metal   ON gold_operations (metal);

-- ─────────────────────────────────────────────
-- جدول الإعدادات
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  user_id          TEXT REFERENCES users(user_id) ON DELETE CASCADE PRIMARY KEY,
  exchange_rate    NUMERIC DEFAULT 3.75,
  dark_mode        BOOLEAN DEFAULT true,
  spread_bank      TEXT DEFAULT 'alahli',
  spread_value     NUMERIC DEFAULT 5.95,
  spread_silver    NUMERIC DEFAULT 0.50,
  storage_fees     NUMERIC DEFAULT 0,
  service_fee_rate NUMERIC DEFAULT 10,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## الخطوة 3: تعطيل RLS (Row Level Security)

في **Authentication → Policies** أو عبر SQL:

```sql
-- السماح بالقراءة والكتابة عبر anon key (التطبيق يتحقق بنفسه)
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE gold_operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings        DISABLE ROW LEVEL SECURITY;
```

> **ملاحظة أمان:** التطبيق يُنفّذ منطق التحقق من `created_from` داخل JavaScript.
> إذا أردت أماناً إضافياً على مستوى قاعدة البيانات، أضف سياسة RLS تُقيّد الكتابة بـ `created_from = 'gold_wallet'`.

---

## الخطوة 4: الحصول على مفاتيح API

1. اذهب إلى **Settings → API**
2. انسخ:
   - **Project URL**: مثل `https://xxxxxxxx.supabase.co`
   - **anon public key**: المفتاح العام (يبدأ بـ `eyJ...`)

ضعهما في أعلى `index.html`:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'eyJ...YOUR_ANON_KEY...';
```

---

## منطق العزل في التطبيق

| الإجراء | السلوك |
|---------|--------|
| **إنشاء حساب** | يتحقق من عدم وجود `user_id` مع `created_from = 'gold_wallet'`، ثم يحفظ `created_from: 'gold_wallet'` |
| **تسجيل دخول** | يرفض أي حساب لا يحمل `created_from = 'gold_wallet'` |
| **إضافة عملية** | تُحفظ في `gold_operations` ويُعاد UUID التلقائي للحذف الدقيق |
| **حذف عملية** | يستخدم `id` (UUID) مباشرة — لا تطابق جزئي |

---

## التحقق من الإعداد

بعد إنشاء الجداول، شغّل في SQL Editor:

```sql
-- تأكيد وجود الأعمدة المطلوبة
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('users', 'gold_operations', 'settings')
ORDER BY table_name, ordinal_position;
```
