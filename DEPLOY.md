# 🚀 CoachFlow - Deployment Guide

## خطوات الـ Deploy (Step by Step)

---

## الخطوة 1: إعداد Supabase (مجاني 100%)

1. روح على **https://supabase.com** وسجل بـ GitHub
2. اضغط **"New Project"**
3. ادخل اسم المشروع (مثلاً: `coachflow`) وكلمة سر للـ Database
4. اختار أقرب Region (مثلاً: EU West)
5. اضغط **"Create new project"** وانتظر دقيقتين

### تشغيل الـ SQL Schema:
1. من الـ sidebar اضغط **SQL Editor**
2. اضغط **"New query"**
3. افتح ملف `supabase-schema.sql` (موجود في المشروع)
4. انسخ كل المحتوى والصقه في المحرر
5. اضغط **"Run"** (أو Ctrl+Enter)
6. هتشوف رسالة `Schema created successfully! 🎉`

### الحصول على الـ API Keys:
1. من الـ sidebar اضغط **Settings → API**
2. انسخ:
   - **Project URL** → هيبقى `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → هيبقى `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## الخطوة 2: رفع المشروع على GitHub

```bash
# في الـ terminal جوه folder المشروع:
git init
git add .
git commit -m "Initial CoachFlow setup"

# اعمل repo جديد على github.com ثم:
git remote add origin https://github.com/YOUR_USERNAME/coachflow.git
git push -u origin main
```

---

## الخطوة 3: الـ Deploy على Vercel (مجاني)

1. روح على **https://vercel.com** وسجل بـ GitHub
2. اضغط **"New Project"**
3. اختار الـ repo اللي رفعته (`coachflow`)
4. اضغط **"Import"**

### إضافة Environment Variables:
في صفحة الـ Deploy قبل ما تاضغط Deploy:
- اضغط **"Environment Variables"**
- أضف:
  ```
  NEXT_PUBLIC_SUPABASE_URL = [الـ URL اللي نسخته من Supabase]
  NEXT_PUBLIC_SUPABASE_ANON_KEY = [الـ Key اللي نسخته من Supabase]
  ```

5. اضغط **"Deploy"**
6. انتظر ~2 دقيقة ✅

---

## الخطوة 4: بعد الـ Deploy

### إنشاء أول حساب (الكوتش):
1. افتح الـ URL بتاعك على Vercel
2. اضغط **"Create one"** (Register)
3. اختار **"I'm a Coach"**
4. سجل بـ Email وكلمة سر
5. وصلت للـ Dashboard 🎉

### إضافة الكلاينتس:
- اضغط **"Add Client"** من صفحة Clients
- لو الكلاينت عايز يدخل بـ account خاص:
  1. أضف الكلاينت وسجل الـ email بتاعه
  2. الكلاينت يسجل على نفس الـ URL باستخدام نفس الـ email
  3. من الـ Supabase Dashboard → Database → clients → ابحث عن الكلاينت
  4. حط الـ `user_id` بتاع الكلاينت (من profiles table)

---

## الملفات المهمة

```
coaching-app/
├── app/
│   ├── (auth)/          ← Login & Register pages
│   ├── (dashboard)/     ← Coach portal
│   └── (client-portal)/ ← Client portal
├── components/          ← Sidebar components
├── lib/
│   ├── supabase/        ← Supabase clients
│   └── types.ts         ← TypeScript types
├── supabase-schema.sql  ← Run this in Supabase!
└── .env.local.example   ← Copy to .env.local
```

---

## التشغيل المحلي (Development)

```bash
# 1. انسخ ملف الـ environment variables
cp .env.local.example .env.local

# 2. افتح .env.local وحط الـ keys بتاعتك من Supabase

# 3. Install dependencies
npm install

# 4. تشغيل المشروع
npm run dev

# افتح: http://localhost:3000
```

---

## الـ Features الموجودة ✅

| Feature | Coach | Client |
|---------|-------|--------|
| Dashboard overview | ✅ | ✅ |
| Client management (Add/Edit/Delete) | ✅ | - |
| Session notes | ✅ | View only |
| Goal setting & tracking | ✅ | View only |
| Progress logging & charts | ✅ | View only |
| Real-time messaging | ✅ | ✅ |

---

## Supabase Free Tier Limits

| Resource | Free Limit | هيكفيك؟ |
|----------|-----------|---------|
| Database | 500 MB | ✅ أكتر من كافي |
| API Requests | Unlimited | ✅ |
| Auth Users | 50,000 | ✅ |
| Real-time connections | 200 | ✅ |
| Storage | 1 GB | ✅ |

---

## لو حصل أي مشكلة

- **خطأ في Vercel Build**: تأكد إن الـ env variables اتضافت صح
- **خطأ في Auth**: تأكد إن الـ Supabase URL والـ Key صح
- **Real-time مش شغال**: تأكد إنك رنت الـ SQL schema كامل

---

Built with ❤️ using Next.js 14 + Supabase + Tailwind CSS
