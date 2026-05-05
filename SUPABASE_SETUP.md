# إعداد التطبيق على Supabase

## الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى https://supabase.com
2. أنشئ حساب جديد أو سجل الدخول
3. اضغط "New Project"
4. أدخل:
   - **Project Name**: gold-portfolio
   - **Database Password**: (اختر كلمة مرور قوية واحفظها)
   - **Region**: اختر المنطقة الأقرب لك (مثلاً Gulf Region)
5. انتظر حتى ينتهي إنشاء المشروع (قد يستغرق 2-5 دقائق)

## الخطوة 2: إنشاء الجداول في قاعدة البيانات

اذهب إلى SQL Editor في Supabase Dashboard وشغل الأوامر التالية:

```sql
-- جدول المستخدمين
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول العمليات
CREATE TABLE operations (
  id BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metal TEXT NOT NULL CHECK (metal IN ('gold', 'silver')),
  grams NUMERIC NOT NULL,
  buy_price NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الإعدادات
CREATE TABLE settings (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  exchange_rate NUMERIC DEFAULT 3.75,
  dark_mode BOOLEAN DEFAULT false,
  spread_bank TEXT DEFAULT 'custom',
  spread_value NUMERIC DEFAULT 0,
  storage_fees NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_operations_user_id ON operations(user_id);
CREATE INDEX idx_operations_metal ON operations(metal);
```

## الخطوة 3: الحصول على مفاتيح API

1. في Supabase Dashboard، اذهب إلى **Settings** > **API**
2. انسخ القيم التالية:
   - **Project URL**: مثل `https://xxxxxxxx.supabase.co`
   - **anon public key**: المفتاح العام

## الخطوة 4: إضافة مكتبة Supabase إلى index.html

أضف هذا السطر في `<head>` قبل `</head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

## الخطوة 5: تعديل الكود

في بداية قسم `<script>`، أضف:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
```

استبدل `YOUR_SUPABASE_URL` و `YOUR_SUPABASE_ANON_KEY` بالقيم من الخطوة 3.

## الخطوة 6: تعديل دوال المصادقة

استبدل دوال `login`, `register`, `logout` لاستخدام Supabase Auth.

## الخطوة 7: تعديل دوال حفظ/تحميل البيانات

استبدل `saveState()` و `loadState()` لاستخدام Supabase بدلاً من localStorage.

---

**ملاحظة**: بعد إكمال هذه الخطوات، سيتم حفظ البيانات في السحابة ويمكن الوصول إليها من أي جهاز.
