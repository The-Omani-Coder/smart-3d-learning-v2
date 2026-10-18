# Smart 3D Learning — نسخة Supabase

هذه النسخة تنقل الحسابات والدرجات والمحتوى وملفات المختبر من جهاز المستخدم إلى قاعدة بيانات مشتركة في Supabase، مع الإبقاء على الموقع بصيغة HTML/CSS/JavaScript سهلة النشر.

## خطوات التشغيل

1. أنشئ مشروعًا جديدًا في Supabase.
2. ملف `supabase-schema.sql` مهيأ ببريد المشرف الأساسي؛ نفّذه كاملًا مرة واحدة من **SQL Editor** عند إنشاء مشروع جديد.
3. من صفحة **Connect** في Supabase، انسخ Project URL والمفتاح العام Publishable key (أو anon key القديم) إلى `supabase-config.js`.
4. لا تضع أبدًا مفتاح `secret` أو `service_role` داخل ملفات الموقع.
5. شغّل المجلد عبر HTTP/HTTPS، وليس بفتح `index.html` مباشرة بطريقة `file://`.
6. من **Authentication > URL Configuration** في Supabase، ضع رابط الموقع المنشور في Site URL حتى تعود روابط تأكيد البريد إلى الموقع الصحيح.
7. افتح تبويب **المشرف**، اختر **حساب جديد**، وسجّل بالبريد الذي وضعته في قائمة السماح بالخطوة 2.

المشرف ينشئ رمز دعوة من صفحة **المعلمون** ويرسله للمعلم. المعلم يسجل بالبريد المطابق ورمز الدعوة ويختار كلمة مروره بنفسه. الطالب يسجل مباشرة، وولي الأمر يدخل بالرمز الخاص بالطالب.

إذا تُرك `supabase-config.js` فارغًا فسيعمل الموقع في الوضع المحلي القديم لأغراض المعاينة فقط. إذا أُدخلت إعدادات ناقصة أو عنوان غير صالح، يعرض الموقع خطأ واضحًا بدل الرجوع بصمت إلى التخزين المحلي.

## البيانات المشتركة

- حسابات الطلاب والمعلمين والمشرفين عبر Supabase Auth
- ملفات الطلاب ورموز أولياء الأمور
- الدرجات والمحتوى التعليمي
- مجسمات المختبر واختباراته والتجارب المحفوظة
- ملفات GLB/GLTF والملفات المرفوعة عبر Supabase Storage
- تحديثات مباشرة للمحتوى والدرجات والحسابات المسجلة

سياسات Row Level Security الموجودة في `supabase-schema.sql` تفصل صلاحيات الطالب والمعلم والمشرف. ملفات المحتوى العام المرفوعة توضع في حاوية عامة، بينما مجسمات المختبر في حاوية خاصة لا يقرأها إلا المستخدم المسجل.

## English quick setup

Create a Supabase project, configure the primary admin entry in `supabase-schema.sql`, run that SQL file once, then put the public Project URL and publishable/anon key in `supabase-config.js`. Never expose a secret or `service_role` key in browser code. Serve the folder over HTTP/HTTPS and create the first admin account with the allowlisted email.
