/* =========================================================
   Smart 3D Learning — script.js (نسخة الدخول المباشر للمشرف)
   ========================================================= */
'use strict';

/* ---------- Storage ---------- */
const KEY = 's3d_db_v1', SESSION = 's3d_session_v1';
const TOTAL_SLOTS = 120;
const DEFAULT_ADMIN = 'Admin@3D2026';
const cloudOn = () => !!(window.S3DCloud && S3DCloud.enabled);

function hash(s) { 
  let h1 = 5381, h2 = 52711;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = (h1 * 33) ^ c; h2 = (h2 * 31 + c) | 0; }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.users) return d;
  } catch (e) {}
  return { users: [], teachers: [], grades: [], slots: {}, adminHash: hash(DEFAULT_ADMIN) };
}
let DB = cloudOn() ? S3DCloud.emptyDB() : load();
function save() {
  if (cloudOn()) {
    S3DCloud.queueSave(DB, session, (e) => {
      console.error(e);
      const target = $('#a_msg') \vert{}\vert{} $('#c_msg') || $('#lb_msg') \vert{}\vert{} $('#s_msg');
      if (target) target.textContent = '⚠ ' + (e.message || e);
      else alert((lang === 'ar' ? 'تعذر حفظ التغييرات: ' : 'Could not save changes: ') + (e.message || e));
    });
    return true;
  }
  try { localStorage.setItem(KEY, JSON.stringify(DB)); return true; }
  catch (e) { alert('Storage full / المساحة ممتلئة'); return false; }
}
let session = (() => { try { return JSON.parse(localStorage.getItem(SESSION)); } catch (e) { return null; } })();
function setSession(s) { session = s; try { s ? localStorage.setItem(SESSION, JSON.stringify(s)) : localStorage.removeItem(SESSION); } catch (e) {} }

/* ---------- i18n ---------- */
const T = {
  ar: {
    th_normal: 'الوضع الطبيعي', th_protan: 'عمى أحمر/أخضر', th_tritan: 'عمى أزرق/أصفر', th_mono: 'أبيض وأسود',
    voiceSection: '♿ ذوو الهِمَم (صوتي)', logout: 'خروج',
    voiceHelp: 'اضغط الأزرار الكبيرة.',
    readPage: '🔊 اقرأ الصفحة', listenCmd: '🎤 استماع للأوامر', stopVoice: '⏹ إيقاف', bigText: '🔠 تكبير الخط',
    aiName: '🤖 المساعد الذكي', speakReplies: 'قراءة الردود بصوت', chatPh: 'اكتب أو تحدث…',
    welcome: 'مرحباً بك في المنصة', student: 'طالب', parent: 'ولي أمر', teacher: 'معلم', admin: 'المشرف',
    email: 'البريد الإلكتروني', password: 'كلمة المرور', name: 'الاسم', grade: 'الصف', semester: 'الفصل',
    sem1: 'الفصل الأول', sem2: 'الفصل الثاني', track: 'المسار', sci: 'علمي', arts: 'أدبي / تطبيقي',
    login: 'دخول', register: 'حساب جديد', haveAcc: 'لدي حساب', parentCode: 'رقم ولي الأمر', adminPass: 'كلمة مرور المشرف',
    bad: 'بيانات غير صحيحة', exists: 'البريد مسجل مسبقاً', fill: 'املأ كل الحقول',
    subjects: 'موادي', myGrades: 'درجاتي', parentCodeLbl: 'رقم ولي الأمر الخاص بك',
    noContent: 'لا يوجد محتوى بعد.', noGrades: 'لا توجد درجات بعد',
    level: 'المستوى', avg: 'المعدل', title: 'العنوان', score: 'الدرجة', max: 'من', add: 'إضافة', save: 'حفظ', del: 'حذف', clear: 'تفريغ',
    summary: 'ملخص', video: 'فيديو', room3d: 'غرفة 3D', link: 'رابط', open: 'فتح', back: 'رجوع',
    rooms3d: 'غرف 3D', empty3d: 'الغرفة فارغة.',
    pickStudent: 'اختر الطالب', subject: 'المادة', date: 'التاريخ', type: 'النوع',
    slotEditor: 'محرر الخانة', content: 'المحتوى / النص', url: 'رابط', shape: 'شكل 3D', color: 'اللون', allGrades: 'كل الصفوف', allSubjects: 'كل المواد',
    published: 'منشور', teachers: 'المعلمون', users: 'المستخدمون', settings: 'الإعدادات', slots: 'الخانات',
    addTeacher: 'إضافة معلم', changePass: 'تغيير كلمة المرور', export: 'تصدير نسخة احتياطية', import: 'استيراد', reset: 'مسح كل البيانات',
    contentMgr: 'إدارة المحتوى', pickGrade: 'اختر الصف', pickSubject: 'اختر المادة', addItem: '＋ إضافة', edit: 'تعديل', cancel: 'إلغاء', linkOpt: 'رابط', fileOpt: 'أو ارفع ملف', allGradesChk: 'عرضه لكل الصفوف', summaries: 'الملخصات', videos: 'الفيديوهات', rooms: 'غرف 3D', nothingYet: 'لا شيء بعد', adv: 'الخانات (متقدم)', fileTooBig: 'الملف أكبر من 3MB', download: 'تحميل الملف',
    uploadGlb: 'أو ارفع ملف GLB', saved: 'تم الحفظ ✓',
    ex: ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'يحتاج دعماً'],
    cShape: ['مكعب', 'كرة', 'أسطوانة', 'مخروط', 'حلقة', 'ثماني الأوجه'],
    botHi: 'أهلاً!',
    botNo: 'لم أجد جواباً.',
  },
  en: {
    th_normal: 'Normal', th_protan: 'Red/Green blind', th_tritan: 'Blue/Yellow blind', th_mono: 'Monochrome',
    voiceSection: '♿ Accessibility', logout: 'Logout',
    readPage: '🔊 Read page', listenCmd: '🎤 Listen', stopVoice: '⏹ Stop', bigText: '🔠 Bigger text',
    aiName: '🤖 AI Assistant', speakReplies: 'Speak replies', chatPh: 'Type or speak…',
    welcome: 'Welcome', student: 'Student', parent: 'Parent', teacher: 'Teacher', admin: 'Admin',
    email: 'Email', password: 'Password', name: 'Name', grade: 'Grade', semester: 'Semester',
    sem1: 'Semester 1', sem2: 'Semester 2', track: 'Track', sci: 'Science', arts: 'Arts',
    login: 'Login', register: 'Sign up', haveAcc: 'I have an account', parentCode: 'Parent code', adminPass: 'Admin password',
    bad: 'Invalid credentials', exists: 'Email already registered', fill: 'Fill all fields',
    subjects: 'My subjects', myGrades: 'My grades', parentCodeLbl: 'Your parent code',
    noContent: 'No content yet.', noGrades: 'No grades yet',
    level: 'Level', avg: 'Average', title: 'Title', score: 'Score', max: 'Out of', add: 'Add', save: 'Save', del: 'Delete', clear: 'Clear',
    summary: 'Summary', video: 'Video', room3d: '3D Room', link: 'Link', open: 'Open', back: 'Back',
    rooms3d: '3D Rooms', empty3d: 'Room is empty.',
    pickStudent: 'Pick student', subject: 'Subject', date: 'Date', type: 'Type',
    slotEditor: 'Slot editor', content: 'Content', url: 'URL', shape: '3D shape', color: 'Color', allGrades: 'All grades', allSubjects: 'All subjects',
    published: 'Published', teachers: 'Teachers', users: 'Users', settings: 'Settings', slots: 'Slots',
    addTeacher: 'Add teacher', changePass: 'Change password', export: 'Export backup', import: 'Import', reset: 'Erase all data',
    contentMgr: 'Content manager', pickGrade: 'Pick grade', pickSubject: 'Pick subject', addItem: '＋ Add', edit: 'Edit', cancel: 'Cancel', linkOpt: 'Link', fileOpt: 'or upload a file', allGradesChk: 'Show for all grades', summaries: 'Summaries', videos: 'Videos', rooms: '3D Rooms', nothingYet: 'Nothing yet', adv: 'Slots', fileTooBig: 'File over 3MB', download: 'Download file',
    uploadGlb: 'or upload GLB', saved: 'Saved ✓',
    ex: ['Excellent', 'Very good', 'Good', 'Pass', 'Needs support'],
    cShape: ['Cube', 'Sphere', 'Cylinder', 'Cone', 'Torus', 'Octahedron'],
    botHi: 'Hi!',
    botNo: 'No specific answer.',
  },
  ur: { th_normal: 'عام', logout: 'خروج', login: 'داخل ہوں', register: 'نیا اکاؤنٹ' },
  fr: { th_normal: 'Normal', logout: 'Quitter', login: 'Connexion', register: "S'inscrire" },
};
let lang = localStorage.getItem('s3d_lang') || 'ar';
const t = k => (T[lang] && T[lang][k] != null) ? T[lang][k] : (T.en[k] != null ? T.en[k] : (T.ar[k] != null ? T.ar[k] : k));
const RTL = ['ar', 'ur'];
const SPEECH = { ar: 'ar-SA', en: 'en-US', ur: 'ur-PK', fr: 'fr-FR' };

const SUBJ = {
  islamic: ['📖', 'التربية الإسلامية', 'Islamic Education'],
  arabic: ['✍️', 'اللغة العربية', 'Arabic'],
  english: ['🔤', 'اللغة الإنجليزية', 'English'],
  math: ['➗', 'الرياضيات', 'Mathematics'],
  math_basic: ['➗', 'رياضيات أساسية', 'Basic Mathematics'],
  math_adv: ['📐', 'رياضيات متقدمة', 'Advanced Mathematics'],
  bio: ['🧬', 'الأحياء', 'Biology'],
  chem: ['⚗️', 'الكيمياء', 'Chemistry'],
  phys: ['⚛️', 'الفيزياء', 'Physics'],
  science: ['🔬', 'العلوم', 'Science'],
  env: ['🌿', 'العلوم البيئية', 'Environmental Science'],
  social: ['🌍', 'الدراسات الاجتماعية', 'Social Studies'],
  watani: ['🇴🇲', 'هذا وطني', 'This is my homeland'],
  ict: ['💻', 'تقنية المعلومات', 'IT'],
  life: ['🧭', 'المهارات الحياتية', 'Life Skills'],
  pe: ['🏃', 'التربية الرياضية', 'PE'],
  art: ['🎨', 'الفنون التشكيلية', 'Art'],
  music: ['🎵', 'التربية الموسيقية', 'Music'],
  history: ['🏛️', 'التاريخ', 'History'],
  geo: ['🗺️', 'الجغرافيا', 'Geography'],
};
const sName = id => (lang === 'ar' || lang === 'ur') ? SUBJ[id][1] : SUBJ[id][2];
function subjectsFor(grade, track) {
  grade = +grade;
  if (grade <= 4) return ['islamic', 'arabic', 'english', 'math', 'science', 'social', 'ict', 'life', 'pe', 'art', 'music'];
  if (grade <= 10) return ['islamic', 'arabic', 'english', 'math', 'bio', 'chem', 'phys', 'social', 'ict', 'life', 'pe', 'art', 'music'];
  const common = ['islamic', 'arabic', 'english', 'math_basic', 'math_adv', 'watani'];
  return track === 'sci' ? [...common, 'bio', 'chem', 'phys', 'env', 'ict'] : [...common, 'history', 'geo', 'art', 'music', 'pe'];
}

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
function parentCodeGen() { let c; do { c = 'P-' + Math.floor(100000 + Math.random() * 900000); } while (DB.users.some(u => u.parentCode === c)); return c; }
function levelOf(p) { return p >= 90 ? 0 : p >= 80 ? 1 : p >= 70 ? 2 : p >= 60 ? 3 : 4; }
function gradeLabel(g) { return lang === 'ar' ? 'الصف ' + g : 'Grade ' + g; }
function gradeOptions(sel) { return Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${sel == i + 1 ? 'selected' : ''}>${gradeLabel(i + 1)}</option>`).join(''); }
function stats(studentId) {
  const gs = DB.grades.filter(g => g.studentId === studentId);
  if (!gs.length) return { avg: null, gs };
  const avg = gs.reduce((a, g) => a + (g.score / g.max) * 100, 0) / gs.length;
  return { avg, gs };
}
function gradesTable(studentId) {
  const { avg, gs } = stats(studentId);
  if (!gs.length) return `<div class="empty">${t('noGrades')}</div>`;
  return `<div class="panel glass"><b>${t('avg')}: ${avg.toFixed(1)}%</b>
    <table><tr><th>${t('subject')}</th><th>${t('title')}</th><th>${t('score')}</th><th>${t('date')}</th></tr>
    ${gs.slice().reverse().map(g => `<tr><td>${esc(SUBJ[g.subject] ? sName(g.subject) : g.subject)}</td><td>${esc(g.title)}</td><td>${g.score}/${g.max}</td><td>${esc(g.date)}</td></tr>`).join('')}
    </table></div>`;
}

function applyStatic() {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-k]').forEach(e => e.textContent = t(e.dataset.k));
  document.querySelectorAll('[data-kp]').forEach(e => e.placeholder = t(e.dataset.kp));
  $('#logoutBtn').classList.toggle('hidden', !session);
}

let view = {};
function render() {
  applyStatic();
  if (!session) return renderAuth();
  const r = session.role;
  if (r === 'student') return renderStudent();
  if (r === 'parent') return renderParent();
  if (r === 'teacher') return renderTeacher();
  if (r === 'admin') return renderAdmin();
}

let authTab = 'student', authMode = 'login', authMsg = '';
function renderAuth() {
  const tabs = ['student', 'parent', 'teacher', 'admin'];
  let form = '';
  if (authTab === 'student') {
    form = authMode === 'login'
      ? `<label>${t('email')}</label><input id="f_email" type="email"><label>${t('password')}</label><input id="f_pass" type="password">`
      : `<label>${t('name')}</label><input id="f_name"><label>${t('email')}</label><input id="f_email" type="email"><label>${t('password')}</label><input id="f_pass" type="password">
         <div class="row"><div><label>${t('grade')}</label><select id="f_grade">${gradeOptions(1)}</select></div>
         <div><label>${t('semester')}</label><select id="f_sem"><option value="1">${t('sem1')}</option><option value="2">${t('sem2')}</option></select></div></div>
         <div id="trackBox" class="hidden"><label>${t('track')}</label><select id="f_track"><option value="sci">${t('sci')}</option><option value="arts">${t('arts')}</option></select></div>`;
  } else if (authTab ===
