/* =========================================================
   Smart 3D Learning — script.js
   كل البيانات تُحفظ في المتصفح (localStorage).
   كلمة مرور المشرف الافتراضية: Admin@3D2026  (غيّرها من لوحة المشرف > الإعدادات)
   ========================================================= */
'use strict';

/* ---------- Storage ---------- */
const KEY = 's3d_db_v1', SESSION = 's3d_session_v1';
const TOTAL_SLOTS = 120;
const DEFAULT_ADMIN = 'Admin@3D2026';

function hash(s) { // بسيط (واجهة فقط) — للإنتاج الحقيقي استخدم خادم
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
let DB = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); return true; }
  catch (e) { alert('Storage full / المساحة ممتلئة — استخدم ملفاً أصغر'); return false; }
}
let session = (() => { try { return JSON.parse(localStorage.getItem(SESSION)); } catch (e) { return null; } })();
function setSession(s) { session = s; try { s ? localStorage.setItem(SESSION, JSON.stringify(s)) : localStorage.removeItem(SESSION); } catch (e) {} }

/* ---------- i18n ---------- */
const T = {
  ar: {
    th_normal: 'الوضع الطبيعي', th_protan: 'عمى أحمر/أخضر', th_tritan: 'عمى أزرق/أصفر', th_mono: 'أبيض وأسود',
    voiceSection: '♿ ذوو الهِمَم (صوتي)', logout: 'خروج',
    voiceHelp: 'اضغط الأزرار الكبيرة. بعد "استماع" قل مثلاً: درجاتي، موادي، اقرأ، خروج.',
    readPage: '🔊 اقرأ الصفحة', listenCmd: '🎤 استماع للأوامر', stopVoice: '⏹ إيقاف', bigText: '🔠 تكبير الخط',
    aiName: '🤖 المساعد الذكي', speakReplies: 'قراءة الردود بصوت', chatPh: 'اكتب أو تحدث…',
    welcome: 'مرحباً بك في المنصة', student: 'طالب', parent: 'ولي أمر', teacher: 'معلم', admin: 'المشرف',
    email: 'البريد الإلكتروني', password: 'كلمة المرور', name: 'الاسم', grade: 'الصف', semester: 'الفصل',
    sem1: 'الفصل الأول', sem2: 'الفصل الثاني', track: 'المسار', sci: 'علمي', arts: 'أدبي / تطبيقي',
    login: 'دخول', register: 'حساب جديد', haveAcc: 'لدي حساب', parentCode: 'رقم ولي الأمر', adminPass: 'كلمة مرور المشرف',
    bad: 'بيانات غير صحيحة', exists: 'البريد مسجل مسبقاً', fill: 'املأ كل الحقول',
    subjects: 'موادي', myGrades: 'درجاتي', parentCodeLbl: 'رقم ولي الأمر الخاص بك (أعطه لولي أمرك)',
    noContent: 'لا يوجد محتوى بعد. سيظهر هنا ما يضيفه المشرف.', noGrades: 'لا توجد درجات بعد',
    level: 'المستوى', avg: 'المعدل', title: 'العنوان', score: 'الدرجة', max: 'من', add: 'إضافة', save: 'حفظ', del: 'حذف', clear: 'تفريغ',
    summary: 'ملخص', video: 'فيديو', room3d: 'غرفة 3D', link: 'رابط', open: 'فتح', back: 'رجوع',
    rooms3d: 'غرف 3D', empty3d: 'الغرفة فارغة — لم يرفع المشرف شيئاً بعد.',
    pickStudent: 'اختر الطالب', subject: 'المادة', date: 'التاريخ', type: 'النوع',
    slotEditor: 'محرر الخانة', content: 'المحتوى / النص', url: 'رابط (فيديو / ملف GLB)', shape: 'شكل 3D', color: 'اللون', allGrades: 'كل الصفوف', allSubjects: 'كل المواد',
    published: 'منشور', teachers: 'المعلمون', users: 'المستخدمون', settings: 'الإعدادات', slots: 'الخانات',
    addTeacher: 'إضافة معلم', changePass: 'تغيير كلمة المرور', export: 'تصدير نسخة احتياطية', import: 'استيراد', reset: 'مسح كل البيانات',
    contentMgr: 'إدارة المحتوى', pickGrade: 'اختر الصف', pickSubject: 'اختر المادة', addItem: '＋ إضافة', edit: 'تعديل', cancel: 'إلغاء', linkOpt: 'رابط (اختياري)', fileOpt: 'أو ارفع ملف من جهازك', allGradesChk: 'عرضه لكل الصفوف', summaries: 'الملخصات', videos: 'الفيديوهات', rooms: 'غرف 3D', nothingYet: 'لا شيء بعد', adv: 'الخانات (متقدم)', fileTooBig: 'الملف أكبر من 3MB — استخدم رابطًا بدل الرفع', download: 'تحميل الملف',
    uploadGlb: 'أو ارفع ملف GLB/GLTF (أقل من 3MB)', saved: 'تم الحفظ ✓',
    ex: ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'يحتاج دعماً'],
    cShape: ['مكعب', 'كرة', 'أسطوانة', 'مخروط', 'حلقة', 'ثماني الأوجه'],
    botHi: 'أهلاً! اسألني عن موادك أو درجاتك أو أي سؤال آخر.',
    botNo: 'لم أجد جواباً محدداً. جرّب كلمات مثل: مواد، درجات، 3D، ولي الأمر، مساعدة. (المساعد محلي دون إنترنت؛ لربطه بنموذج ذكي حقيقي يلزم خادم/مفتاح API.)',
  },
  en: {
    th_normal: 'Normal', th_protan: 'Red/Green blind', th_tritan: 'Blue/Yellow blind', th_mono: 'Monochrome',
    voiceSection: '♿ Accessibility (voice)', logout: 'Logout',
    voiceHelp: 'Use the big buttons. After "Listen" say: my grades, my subjects, read, logout.',
    readPage: '🔊 Read page', listenCmd: '🎤 Listen to commands', stopVoice: '⏹ Stop', bigText: '🔠 Bigger text',
    aiName: '🤖 AI Assistant', speakReplies: 'Speak replies', chatPh: 'Type or speak…',
    welcome: 'Welcome to the platform', student: 'Student', parent: 'Parent', teacher: 'Teacher', admin: 'Admin',
    email: 'Email', password: 'Password', name: 'Name', grade: 'Grade', semester: 'Semester',
    sem1: 'Semester 1', sem2: 'Semester 2', track: 'Track', sci: 'Science', arts: 'Arts / Applied',
    login: 'Login', register: 'Sign up', haveAcc: 'I have an account', parentCode: 'Parent code', adminPass: 'Admin password',
    bad: 'Invalid credentials', exists: 'Email already registered', fill: 'Fill all fields',
    subjects: 'My subjects', myGrades: 'My grades', parentCodeLbl: 'Your parent code (give it to your parent)',
    noContent: 'No content yet. What the admin adds will appear here.', noGrades: 'No grades yet',
    level: 'Level', avg: 'Average', title: 'Title', score: 'Score', max: 'Out of', add: 'Add', save: 'Save', del: 'Delete', clear: 'Clear',
    summary: 'Summary', video: 'Video', room3d: '3D Room', link: 'Link', open: 'Open', back: 'Back',
    rooms3d: '3D Rooms', empty3d: 'Room is empty — nothing uploaded by admin yet.',
    pickStudent: 'Pick student', subject: 'Subject', date: 'Date', type: 'Type',
    slotEditor: 'Slot editor', content: 'Content / text', url: 'URL (video / GLB file)', shape: '3D shape', color: 'Color', allGrades: 'All grades', allSubjects: 'All subjects',
    published: 'Published', teachers: 'Teachers', users: 'Users', settings: 'Settings', slots: 'Slots',
    addTeacher: 'Add teacher', changePass: 'Change password', export: 'Export backup', import: 'Import', reset: 'Erase all data',
    contentMgr: 'Content manager', pickGrade: 'Pick grade', pickSubject: 'Pick subject', addItem: '＋ Add', edit: 'Edit', cancel: 'Cancel', linkOpt: 'Link (optional)', fileOpt: 'or upload a file', allGradesChk: 'Show for all grades', summaries: 'Summaries', videos: 'Videos', rooms: '3D Rooms', nothingYet: 'Nothing yet', adv: 'Slots (advanced)', fileTooBig: 'File over 3MB — use a link instead', download: 'Download file',
    uploadGlb: 'or upload GLB/GLTF (under 3MB)', saved: 'Saved ✓',
    ex: ['Excellent', 'Very good', 'Good', 'Pass', 'Needs support'],
    cShape: ['Cube', 'Sphere', 'Cylinder', 'Cone', 'Torus', 'Octahedron'],
    botHi: 'Hi! Ask me about your subjects, grades or anything else.',
    botNo: 'No specific answer. Try: subjects, grades, 3D, parent, help. (This assistant is local/offline; a real AI model needs a server/API key.)',
  },
  ur: {
    th_normal: 'عام', th_protan: 'سرخ/سبز اندھا پن', th_tritan: 'نیلا/پیلا اندھا پن', th_mono: 'سیاہ و سفید',
    voiceSection: '♿ معذور افراد (آواز)', logout: 'خروج', readPage: '🔊 صفحہ پڑھیں', listenCmd: '🎤 سنیں', stopVoice: '⏹ روکیں', bigText: '🔠 بڑا متن',
    aiName: '🤖 اے آئی اسسٹنٹ', chatPh: 'لکھیں یا بولیں…', welcome: 'پلیٹ فارم میں خوش آمدید',
    student: 'طالب علم', parent: 'والدین', teacher: 'استاد', admin: 'ایڈمن', email: 'ای میل', password: 'پاس ورڈ', name: 'نام', grade: 'جماعت', semester: 'سمسٹر',
    sem1: 'پہلا سمسٹر', sem2: 'دوسرا سمسٹر', track: 'شعبہ', sci: 'سائنس', arts: 'آرٹس', login: 'داخل ہوں', register: 'نیا اکاؤنٹ',
    subjects: 'میرے مضامین', myGrades: 'میرے نمبر', parentCode: 'والدین کا کوڈ', adminPass: 'ایڈمن پاس ورڈ', add: 'شامل کریں', save: 'محفوظ',
  },
  fr: {
    th_normal: 'Normal', th_protan: 'Daltonisme rouge/vert', th_tritan: 'Daltonisme bleu/jaune', th_mono: 'Monochrome',
    voiceSection: '♿ Accessibilité (voix)', logout: 'Quitter', readPage: '🔊 Lire la page', listenCmd: '🎤 Écouter', stopVoice: '⏹ Stop', bigText: '🔠 Texte plus grand',
    aiName: '🤖 Assistant IA', chatPh: 'Écrivez ou parlez…', welcome: 'Bienvenue sur la plateforme',
    student: 'Élève', parent: 'Parent', teacher: 'Enseignant', admin: 'Admin', email: 'E-mail', password: 'Mot de passe', name: 'Nom', grade: 'Classe', semester: 'Semestre',
    sem1: 'Semestre 1', sem2: 'Semestre 2', track: 'Filière', sci: 'Scientifique', arts: 'Lettres', login: 'Connexion', register: "S'inscrire",
    subjects: 'Mes matières', myGrades: 'Mes notes', parentCode: 'Code parent', adminPass: 'Mot de passe admin', add: 'Ajouter', save: 'Enregistrer',
  },
};
let lang = localStorage.getItem('s3d_lang') || 'ar';
const t = k => (T[lang] && T[lang][k] != null) ? T[lang][k] : (T.en[k] != null ? T.en[k] : (T.ar[k] != null ? T.ar[k] : k));
const RTL = ['ar', 'ur'];
const SPEECH = { ar: 'ar-SA', en: 'en-US', ur: 'ur-PK', fr: 'fr-FR' };

/* ---------- Curriculum (Oman) ---------- */
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
  social: ['🌍', 'الدراسات الاجتماعية / الهوية والمواطنة', 'Social Studies / Identity & Citizenship'],
  watani: ['🇴🇲', 'الدراسات الاجتماعية (هذا وطني)', 'Social Studies (This is my homeland)'],
  ict: ['💻', 'تقنية المعلومات', 'Information Technology'],
  life: ['🧭', 'المهارات الحياتية', 'Life Skills'],
  pe: ['🏃', 'التربية الرياضية', 'Physical Education'],
  art: ['🎨', 'الفنون التشكيلية', 'Visual Arts'],
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
  return track === 'sci' ? [...common, 'bio', 'chem', 'phys', 'env', 'ict']
                         : [...common, 'history', 'geo', 'art', 'music', 'pe'];
}

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
function parentCodeGen() { let c; do { c = 'P-' + Math.floor(100000 + Math.random() * 900000); } while (DB.users.some(u => u.parentCode === c)); return c; }
function levelOf(p) { return p >= 90 ? 0 : p >= 80 ? 1 : p >= 70 ? 2 : p >= 60 ? 3 : 4; }
function gradeLabel(g) { return lang === 'ar' ? 'الصف ' + g : lang === 'fr' ? 'Classe ' + g : lang === 'ur' ? 'جماعت ' + g : 'Grade ' + g; }
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
  return `<div class="panel glass"><b>${t('avg')}: ${avg.toFixed(1)}%</b> — <span class="badge">${t('level')}: ${t('ex')[levelOf(avg)]}</span>
    <div class="bar" style="margin:10px 0"><i style="width:${avg}%"></i></div>
    <table><tr><th>${t('subject')}</th><th>${t('title')}</th><th>${t('score')}</th><th>${t('date')}</th></tr>
    ${gs.slice().reverse().map(g => `<tr><td>${esc(SUBJ[g.subject] ? sName(g.subject) : g.subject)}</td><td>${esc(g.title)}</td><td>${g.score}/${g.max}</td><td>${esc(g.date)}</td></tr>`).join('')}
    </table></div>`;
}

/* ---------- Static text refresh ---------- */
function applyStatic() {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-k]').forEach(e => e.textContent = t(e.dataset.k));
  document.querySelectorAll('[data-kp]').forEach(e => e.placeholder = t(e.dataset.kp));
  $('#logoutBtn').classList.toggle('hidden', !session);
}

/* ---------- Router ---------- */
let view = {}; // transient UI state
function render() {
  applyStatic();
  if (!session) return renderAuth();
  const r = session.role;
  if (r === 'student') return renderStudent();
  if (r === 'parent') return renderParent();
  if (r === 'teacher') return renderTeacher();
  if (r === 'admin') return renderAdmin();
}

/* ---------- Auth ---------- */
/* نصوص إنشاء حساب المعلم (ur/fr تعود للإنجليزية تلقائياً) */
const TT = {
  ar: { regTeacher: 'إنشاء حساب معلم', pass2: 'تأكيد كلمة المرور', langLbl: 'لغة الواجهة', gradesLbl: 'الصفوف التي تدرّسها', semsLbl: 'الفصول الدراسية',
        subjLbl: 'المواد التي تدرّسها', all: 'تحديد الكل', passShort: 'كلمة المرور يجب ألا تقل عن 6 أحرف', passMis: 'كلمتا المرور غير متطابقتين',
        badEmail: 'البريد الإلكتروني غير صحيح', needGrade: 'اختر صفاً واحداً على الأقل', needSem: 'اختر فصلاً واحداً على الأقل', needSubj: 'اختر مادة واحدة على الأقل',
        myClasses: 'صفوفي', noStudents: 'لا يوجد طلاب مسجلون في صفوفك وفصولك حتى الآن.' },
  en: { regTeacher: 'Create teacher account', pass2: 'Confirm password', langLbl: 'Interface language', gradesLbl: 'Grades you teach', semsLbl: 'Semesters',
        subjLbl: 'Subjects you teach', all: 'Select all', passShort: 'Password must be at least 6 characters', passMis: 'Passwords do not match',
        badEmail: 'Invalid email address', needGrade: 'Pick at least one grade', needSem: 'Pick at least one semester', needSubj: 'Pick at least one subject',
        myClasses: 'My classes', noStudents: 'No students registered in your grades and semesters yet.' },
};
const tt = k => (TT[lang] && TT[lang][k] != null) ? TT[lang][k] : (TT.en[k] != null ? TT.en[k] : k);

function teacherRegForm() {
  const chk = (name, val, label) => `<label class="chk"><input type="checkbox" name="${name}" value="${val}"> ${label}</label>`;
  return `<label>${t('name')}</label><input id="f_name" autocomplete="name">
    <label>${t('email')}</label><input id="f_email" type="email" autocomplete="email">
    <div class="row"><div><label>${t('password')}</label><input id="f_pass" type="password" autocomplete="new-password"></div>
    <div><label>${tt('pass2')}</label><input id="f_pass2" type="password" autocomplete="new-password"></div></div>
    <label>${tt('langLbl')}</label>
    <select id="f_lang"><option value="ar" ${lang === 'ar' ? 'selected' : ''}>العربية</option><option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
      <option value="ur" ${lang === 'ur' ? 'selected' : ''}>اردو</option><option value="fr" ${lang === 'fr' ? 'selected' : ''}>Français</option></select>
    <label>${tt('gradesLbl')} <a href="#" data-all="tg" style="color:var(--a1)">${tt('all')}</a></label>
    <div class="checks">${Array.from({ length: 12 }, (_, i) => chk('tg', i + 1, i + 1)).join('')}</div>
    <label>${tt('semsLbl')}</label>
    <div class="checks">${chk('ts', 1, t('sem1'))}${chk('ts', 2, t('sem2'))}</div>
    <label>${tt('subjLbl')} <a href="#" data-all="tsub" style="color:var(--a1)">${tt('all')}</a></label>
    <div class="checks">${Object.keys(SUBJ).map(k => chk('tsub', k, SUBJ[k][0] + ' ' + esc(sName(k)))).join('')}</div>`;
}
function registerTeacher(v) {
  const name = v('f_name'), email = v('f_email'), pass = $('#f_pass').value, pass2 = $('#f_pass2').value;
  const vals = n => [...document.querySelectorAll(`input[name="${n}"]:checked`)].map(x => x.value);
  const grades = vals('tg').map(Number), sems = vals('ts').map(Number), subjects = vals('tsub');
  if (!name || !email || !pass) authMsg = t('fill');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) authMsg = tt('badEmail');
  else if (pass.length < 6) authMsg = tt('passShort');
  else if (pass !== pass2) authMsg = tt('passMis');
  else if (!grades.length) authMsg = tt('needGrade');
  else if (!sems.length) authMsg = tt('needSem');
  else if (!subjects.length) authMsg = tt('needSubj');
  else if (DB.teachers.some(x => x.email.toLowerCase() === email.toLowerCase())) authMsg = t('exists');
  else {
    const th = { id: uid(), name, email, pass: hash(pass), lang: $('#f_lang').value, grades, sems, subjects, created: Date.now() };
    DB.teachers.push(th); save();
    lang = th.lang; localStorage.setItem('s3d_lang', lang); $('#langSel').value = lang;
    setSession({ role: 'teacher', id: th.id }); view = {}; authMode = 'login'; return render();
  }
  renderAuth();
}
function teacherStudents(th) {
  return DB.users.filter(u => (!th.grades || !th.grades.length || th.grades.includes(u.grade)) && (!th.sems || !th.sems.length || th.sems.includes(u.sem)));
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
  } else if (authTab === 'parent') form = `<label>${t('parentCode')}</label><input id="f_code" placeholder="P-123456">`;
  else if (authTab === 'teacher') form = authMode === 'register' ? teacherRegForm()
    : `<label>${t('email')}</label><input id="f_email" type="email"><label>${t('password')}</label><input id="f_pass" type="password">`;
  else form = `<label>🔐 ${t('adminPass')}</label><input id="f_admin" type="password" autocomplete="current-password">`;

  app.innerHTML = `<div class="auth glass">
    <h1>Smart 3D Learning</h1><div class="muted">${t('welcome')}</div>
    <div class="tabs">${tabs.map(x => `<button class="tab ${x === authTab ? 'on' : ''}" data-tab="${x}">${t(x)}</button>`).join('')}</div>
    ${form}
    <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
      <button class="btn" id="goBtn">${(authTab === 'student' || authTab === 'teacher') && authMode === 'register' ? (authTab === 'teacher' ? tt('regTeacher') : t('register')) : t('login')}</button>
      ${authTab === 'student' || authTab === 'teacher' ? `<button class="btn ghost" id="swapBtn">${authMode === 'login' ? t('register') : t('haveAcc')}</button>` : ''}
    </div>
    ${authMsg ? `<div class="msg">${authMsg}</div>` : ''}
  </div>`;
  app.querySelectorAll('.tab').forEach(b => b.onclick = () => { authTab = b.dataset.tab; authMode = 'login'; authMsg = ''; renderAuth(); });
  app.querySelectorAll('[data-all]').forEach(a => a.onclick = e => {
    e.preventDefault(); const boxes = [...document.querySelectorAll(`input[name="${a.dataset.all}"]`)];
    const on = boxes.some(b => !b.checked); boxes.forEach(b => b.checked = on);
  });
  const sw = $('#swapBtn'); if (sw) sw.onclick = () => { authMode = authMode === 'login' ? 'register' : 'login'; authMsg = ''; renderAuth(); };
  const g = $('#f_grade'); if (g) g.onchange = () => $('#trackBox').classList.toggle('hidden', +g.value < 11);
  $('#goBtn').onclick = doAuth;
  app.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') doAuth(); });
}
function doAuth() {
  const v = id => ($('#' + id)?.value || '').trim();
  authMsg = '';
  if (authTab === 'admin') {
    if (hash(v('f_admin')) === DB.adminHash) { setSession({ role: 'admin' }); view = {}; return render(); }
    authMsg = t('bad');
  } else if (authTab === 'teacher') {
    if (authMode === 'register') return registerTeacher(v);
    const th = DB.teachers.find(x => x.email.toLowerCase() === v('f_email').toLowerCase() && x.pass === hash(v('f_pass')));
    if (th) {
      if (th.lang && th.lang !== lang) { lang = th.lang; localStorage.setItem('s3d_lang', lang); $('#langSel').value = lang; }
      setSession({ role: 'teacher', id: th.id }); view = {}; return render();
    }
    authMsg = t('bad');
  } else if (authTab === 'parent') {
    const u = DB.users.find(x => x.parentCode.toUpperCase() === v('f_code').toUpperCase());
    if (u) { setSession({ role: 'parent', id: u.id }); view = {}; return render(); }
    authMsg = t('bad');
  } else if (authMode === 'login') {
    const u = DB.users.find(x => x.email.toLowerCase() === v('f_email').toLowerCase() && x.pass === hash(v('f_pass')));
    if (u) { setSession({ role: 'student', id: u.id }); view = {}; return render(); }
    authMsg = t('bad');
  } else {
    const name = v('f_name'), email = v('f_email'), pass = v('f_pass');
    if (!name || !email || !pass) authMsg = t('fill');
    else if (DB.users.some(x => x.email.toLowerCase() === email.toLowerCase())) authMsg = t('exists');
    else {
      const grade = +v('f_grade');
      const u = { id: uid(), name, email, pass: hash(pass), grade, sem: +v('f_sem'), track: grade >= 11 ? v('f_track') : null, parentCode: parentCodeGen() };
      DB.users.push(u); save(); setSession({ role: 'student', id: u.id }); view = {}; return render();
    }
  }
  renderAuth();
}

/* ---------- Content lookup ---------- */
function slotsFor(u, subject) {
  return Object.entries(DB.slots).map(([n, s]) => ({ n, ...s })).filter(s =>
    s.published !== false && s.title &&
    (s.grade === 'all' || +s.grade === u.grade) &&
    (!s.sem || s.sem === 'all' || +s.sem === u.sem) &&
    (s.subject === 'all' || s.subject === subject));
}
const TYPE_ICON = { summary: '📝', video: '🎬', room3d: '🧊', link: '🔗' };

/* ---------- Student ---------- */
function renderStudent() {
  const u = DB.users.find(x => x.id === session.id); if (!u) { setSession(null); return render(); }
  const subs = subjectsFor(u.grade, u.track);
  if (view.subject) return renderRoom(u, view.subject);
  const all3d = subs.flatMap(s => slotsFor(u, s).filter(x => x.type === 'room3d').map(x => ({ ...x, _s: s })));
  app.innerHTML = `
    <div class="page-head"><div><h2>👋 ${esc(u.name)}</h2>
      <span class="badge">${gradeLabel(u.grade)}</span> <span class="badge">${u.sem === 1 ? t('sem1') : t('sem2')}</span>
      ${u.track ? `<span class="badge">${u.track === 'sci' ? t('sci') : t('arts')}</span>` : ''}</div>
      <div><div class="muted">${t('parentCodeLbl')}</div><div class="code-box">${esc(u.parentCode)}</div></div></div>
    <h3 style="margin:10px 0">${t('subjects')}</h3>
    <div class="grid">${subs.map(s => `<div class="card glass" data-sub="${s}"><div class="ic">${SUBJ[s][0]}</div><b>${esc(sName(s))}</b><div class="muted">${slotsFor(u, s).length} 📦</div></div>`).join('')}</div>
    <h3 style="margin:22px 0 10px">${t('rooms3d')}</h3>
    ${all3d.length ? `<div class="grid">${all3d.map(x => `<div class="card glass" data-open="${x.n}"><div class="ic">🧊</div><b>${esc(x.title)}</b><div class="muted">${esc(sName(x._s))}</div></div>`).join('')}</div>` : `<div class="empty">🧊 ${t('empty3d')}</div>`}
    ${labSection(u)}
    <h3 style="margin:22px 0 10px">${t('myGrades')}</h3>${gradesTable(u.id)}`;
  app.querySelectorAll('[data-sub]').forEach(c => c.onclick = () => { view.subject = c.dataset.sub; renderStudent(); });
  app.querySelectorAll('[data-open]').forEach(c => c.onclick = () => openSlot(c.dataset.open));
  bindLab(u);
}
function renderRoom(u, sub) {
  const items = slotsFor(u, sub);
  const sec = (type, label, icon) => {
    const l = items.filter(x => x.type === type);
    return `<h3 style="margin:18px 0 8px">${icon} ${label}</h3>` + (l.length
      ? l.map(x => `<div class="item"><div><b>${esc(x.title)}</b></div><button class="btn sm" data-open="${x.n}">${t('open')}</button></div>`).join('')
      : `<div class="empty">${type === 'room3d' ? t('empty3d') : t('noContent')}</div>`);
  };
  app.innerHTML = `<div class="page-head"><h2>${SUBJ[sub][0]} ${esc(sName(sub))}</h2><button class="btn ghost" id="backBtn">← ${t('back')}</button></div>
    ${sec('summary', t('summaries'), '📝')}${sec('video', t('videos'), '🎬')}${sec('room3d', t('rooms'), '🧊')}
    ${items.filter(x => x.type === 'link').length ? sec('link', t('link'), '🔗') : ''}`;
  $('#backBtn').onclick = () => { view.subject = null; renderStudent(); };
  app.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openSlot(b.dataset.open));
}

/* ---------- Slot viewer / 3D ---------- */
let three = null;
function embedUrl(u) {
  const m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/); if (m) return 'https://www.youtube.com/embed/' + m[1];
  const v = u.match(/vimeo\.com\/(\d+)/); if (v) return 'https://player.vimeo.com/video/' + v[1];
  return null;
}
function openSlot(n) {
  const s = DB.slots[n]; if (!s) return;
  let body = `<h2>${TYPE_ICON[s.type] || ''} ${esc(s.title)}</h2>`;
  if (s.type === 'summary') {
    body += s.body ? `<div class="prose">${esc(s.body)}</div>` : '';
    const f = s.url || '';
    if (f.startsWith('data:image')) body += `<img src="${f}" style="max-width:100%;border-radius:12px;margin-top:10px">`;
    else if (f.startsWith('data:application/pdf')) body += `<iframe class="video" style="aspect-ratio:3/4" src="${f}"></iframe>`;
    else if (f) body += `<p style="margin-top:12px"><a class="btn" target="_blank" rel="noopener" ${f.startsWith('data:') ? 'download="' + esc(s.fileName || 'file') + '"' : ''} href="${esc(f)}">${t('download')}</a></p>`;
  }
  else if (s.type === 'video') {
    const e = embedUrl(s.url || '');
    body += e ? `<iframe class="video" src="${esc(e)}" allowfullscreen></iframe>` : `<video class="video" controls src="${esc(s.url)}"></video>`;
    if (s.body) body += `<p class="prose" style="margin-top:10px">${esc(s.body)}</p>`;
  } else if (s.type === 'link') body += `<p class="prose">${esc(s.body)}</p><a class="btn" target="_blank" rel="noopener" href="${esc(s.url)}">${t('open')}</a>`;
  else if (s.type === 'room3d') body += `<div id="viewer" class="viewer"></div><p class="prose" style="margin-top:10px">${esc(s.body)}</p>`;
  $('#modalBody').innerHTML = body; $('#modal').classList.remove('hidden');
  if (s.type === 'room3d') start3D(s);
  if (voiceOn) speak(s.title + '. ' + (s.body || ''));
}
function closeModal() {
  $('#modal').classList.add('hidden'); $('#modalBody').innerHTML = '';
  if (three) { cancelAnimationFrame(three.raf); three.renderer.dispose(); three = null; }
  stopSpeak();
}
$('#modalClose').onclick = closeModal;
$('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };

function start3D(s) {
  const box = $('#viewer');
  if (!window.THREE) { box.innerHTML = '<div class="empty">THREE.js لم يُحمّل (تحتاج إنترنت)</div>'; return; }
  const W = box.clientWidth, H = box.clientHeight;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050914);
  const cam = new THREE.PerspectiveCamera(50, W / H, .1, 1000); cam.position.set(2.5, 2, 3.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(W, H); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff, .7));
  const dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(3, 5, 4); scene.add(dl);
  scene.add(new THREE.GridHelper(10, 20, 0x22d3ee, 0x1b2450));
  const controls = THREE.OrbitControls ? new THREE.OrbitControls(cam, renderer.domElement) : null;
  if (controls) { controls.enableDamping = true; controls.autoRotate = true; }
  let obj;
  if (s.url) {
    if (THREE.GLTFLoader) new THREE.GLTFLoader().load(s.url, g => {
      obj = g.scene; const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new THREE.Vector3()), k = 2 / Math.max(sz.x, sz.y, sz.z || 1);
      obj.scale.setScalar(k); const c = bb.getCenter(new THREE.Vector3()).multiplyScalar(k); obj.position.sub(c); scene.add(obj);
    }, undefined, () => { box.insertAdjacentHTML('beforeend', '<div class="msg">GLB load error</div>'); });
  } else {
    const geos = [new THREE.BoxGeometry(1.6, 1.6, 1.6), new THREE.SphereGeometry(1, 48, 32), new THREE.CylinderGeometry(.8, .8, 1.8, 48), new THREE.ConeGeometry(1, 1.8, 48), new THREE.TorusGeometry(.9, .35, 24, 64), new THREE.OctahedronGeometry(1.2)];
    obj = new THREE.Mesh(geos[+s.shape || 0], new THREE.MeshStandardMaterial({ color: s.color || '#22d3ee', metalness: .3, roughness: .35 }));
    scene.add(obj);
  }
  const st = { renderer, raf: 0 }; three = st;
  (function loop() { st.raf = requestAnimationFrame(loop); if (controls) controls.update(); else if (obj) obj.rotation.y += .01; renderer.render(scene, cam); })();
}

/* ---------- Parent ---------- */
function renderParent() {
  const u = DB.users.find(x => x.id === session.id); if (!u) { setSession(null); return render(); }
  app.innerHTML = `<div class="page-head"><div><h2>👨‍👩‍👧 ${esc(u.name)}</h2><span class="badge">${gradeLabel(u.grade)}</span> <span class="badge">${u.sem === 1 ? t('sem1') : t('sem2')}</span></div></div>
    ${gradesTable(u.id)}`;
}

/* ---------- Teacher ---------- */
function renderTeacher() {
  const th = DB.teachers.find(x => x.id === session.id); if (!th) { setSession(null); return render(); }
  const list = teacherStudents(th);
  const sid = (view.sid && list.some(x => x.id === view.sid)) ? view.sid : (list[0] && list[0].id);
  const stu = list.find(x => x.id === sid);
  let subs = stu ? subjectsFor(stu.grade, stu.track) : [];
  if (th.subjects && th.subjects.length) { const mine = subs.filter(s => th.subjects.includes(s)); if (mine.length) subs = mine; }
  const prof = (th.grades && th.grades.length) ? `<div class="muted" style="margin-bottom:12px">${tt('myClasses')}: ${th.grades.map(gradeLabel).join('، ')} — ${(th.sems || []).map(s => s === 1 ? t('sem1') : t('sem2')).join('، ')}<br>${(th.subjects || []).filter(k => SUBJ[k]).map(k => SUBJ[k][0] + ' ' + sName(k)).join('، ')}</div>` : '';
  app.innerHTML = `<div class="page-head"><h2>👩‍🏫 ${esc(th.name || th.email)}</h2></div>${prof}
    ${!list.length ? `<div class="empty">${tt('noStudents')}</div>` : `
    <div class="panel glass"><label>${t('pickStudent')}</label>
      <select id="t_stu">${list.map(x => `<option value="${x.id}" ${x.id === sid ? 'selected' : ''}>${esc(x.name)} — ${gradeLabel(x.grade)}</option>`).join('')}</select>
      <div class="row"><div><label>${t('subject')}</label><select id="t_sub">${subs.map(s => `<option value="${s}">${esc(sName(s))}</option>`).join('')}</select></div>
      <div><label>${t('title')}</label><input id="t_title"></div></div>
      <div class="row"><div><label>${t('score')}</label><input id="t_score" type="number" min="0"></div><div><label>${t('max')}</label><input id="t_max" type="number" value="100" min="1"></div></div>
      <button class="btn" id="t_add" style="margin-top:14px">${t('add')}</button><span id="t_msg" class="muted"></span></div>
    ${stu ? gradesTable(stu.id) : ''}`}
    ${labManager()}`;
  bindLabManager();
  const sel = $('#t_stu'); if (sel) sel.onchange = () => { view.sid = sel.value; renderTeacher(); };
  const add = $('#t_add'); if (add) add.onclick = () => {
    const score = parseFloat($('#t_score').value), max = parseFloat($('#t_max').value), title = $('#t_title').value.trim();
    if (!title || isNaN(score) || !max) return $('#t_msg').textContent = ' ' + t('fill');
    DB.grades.push({ id: uid(), studentId: sid, subject: $('#t_sub').value, title, score, max, teacher: th.email, date: new Date().toISOString().slice(0, 10) });
    save(); renderTeacher();
  };
}

/* ---------- Admin ---------- */
let adminTab = 'content', selSlot = 1;
let adm = { grade: 1, track: 'sci', sem: 'all', subject: null, form: null };
function renderAdmin() {
  const tabs = [['content', t('contentMgr')], ['lab', '🧪 ' + lt('lab').replace('🧪 ', '')], ['slots', t('adv')], ['teachers', t('teachers')], ['users', t('users')], ['settings', t('settings')]];
  let body = '';
  if (adminTab === 'content') body = adminContent();
  else if (adminTab === 'lab') body = labManager();
  else if (adminTab === 'slots') body = adminSlots();
  else if (adminTab === 'teachers') body = adminTeachers();
  else if (adminTab === 'users') body = adminUsers();
  else body = adminSettings();
  app.innerHTML = `<div class="page-head"><h2>🛠️ ${t('admin')}</h2></div>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${k === adminTab ? 'on' : ''}" data-at="${k}">${l}</button>`).join('')}</div>${body}`;
  app.querySelectorAll('[data-at]').forEach(b => b.onclick = () => { adminTab = b.dataset.at; renderAdmin(); });
  bindAdmin();
}

function itemsOf(type) {
  return Object.entries(DB.slots).map(([n, x]) => ({ n, ...x })).filter(x => x.type === type && x.subject === adm.subject && (x.grade === 'all' || +x.grade === adm.grade));
}
function adminContent() {
  const subs = subjectsFor(adm.grade, adm.track);
  let h = `<div class="panel glass"><label>${t('pickGrade')}</label>
    <div class="chips">${Array.from({ length: 12 }, (_, i) => `<button class="tab ${adm.grade === i + 1 ? 'on' : ''}" data-cg="${i + 1}">${i + 1}</button>`).join('')}</div>
    <div class="row">${adm.grade >= 11 ? `<div><label>${t('track')}</label><select id="c_track"><option value="sci" ${adm.track === 'sci' ? 'selected' : ''}>${t('sci')}</option><option value="arts" ${adm.track === 'arts' ? 'selected' : ''}>${t('arts')}</option></select></div>` : ''}
    <div><label>${t('semester')}</label><select id="c_sem"><option value="all">—</option><option value="1" ${adm.sem == 1 ? 'selected' : ''}>${t('sem1')}</option><option value="2" ${adm.sem == 2 ? 'selected' : ''}>${t('sem2')}</option></select></div></div></div>
    <h3 style="margin:10px 0">${t('pickSubject')}</h3>
    <div class="grid">${subs.map(k => `<div class="card glass ${adm.subject === k ? 'sel-card' : ''}" data-cs="${k}"><div class="ic">${SUBJ[k][0]}</div><b>${esc(sName(k))}</b></div>`).join('')}</div>`;
  if (!adm.subject || !subs.includes(adm.subject)) return h;
  const sec = (type, label, icon) => {
    const l = itemsOf(type);
    const f = adm.form && adm.form.type === type ? adm.form : null;
    const cur = f && f.n ? DB.slots[f.n] : {};
    const accept = type === 'summary' ? '.pdf,.doc,.docx,.ppt,.pptx,image/*' : type === 'video' ? 'video/*' : '.glb,.gltf';
    return `<div class="panel glass"><div class="page-head" style="margin:0 0 10px"><h3>${icon} ${label}</h3><button class="btn sm" data-cadd="${type}">${t('addItem')}</button></div>
      ${l.length ? l.map(x => `<div class="item"><div><b>${esc(x.title)}</b> ${x.grade === 'all' ? '<span class="badge">∀</span>' : ''}</div>
        <div><button class="btn sm ghost" data-cview="${x.n}">${t('open')}</button> <button class="btn sm ghost" data-cedit="${x.n}">${t('edit')}</button> <button class="btn sm danger" data-cdel="${x.n}">${t('del')}</button></div></div>`).join('') : `<div class="muted">${t('nothingYet')}</div>`}
      ${f ? `<div class="panel" style="border:1px solid var(--a1);border-radius:14px;margin-top:12px">
        <label>${t('title')}</label><input id="c_title" value="${esc(cur.title || '')}">
        <label>${t('content')}</label><textarea id="c_body" rows="4">${esc(cur.body || '')}</textarea>
        <label>${t('linkOpt')}</label><input id="c_url" placeholder="https://…" value="${cur.url && !cur.url.startsWith('data:') ? esc(cur.url) : ''}">
        <label>${t('fileOpt')}</label><input id="c_file" type="file" accept="${accept}">
        ${cur.url && cur.url.startsWith('data:') ? `<div class="muted">📎 ${esc(cur.fileName || 'file')}</div>` : ''}
        ${type === 'room3d' ? `<div class="row"><div><label>${t('shape')}</label><select id="c_shape">${t('cShape').map((n, i) => `<option value="${i}" ${+cur.shape === i ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div><label>${t('color')}</label><input id="c_color" type="color" value="${cur.color || '#22d3ee'}"></div></div>` : ''}
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="c_all" style="width:auto" ${cur.grade === 'all' ? 'checked' : ''}> ${t('allGradesChk')}</label>
        <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" id="c_save">${t('save')}</button><button class="btn ghost" id="c_cancel">${t('cancel')}</button><span id="c_msg" class="muted"></span></div></div>` : ''}</div>`;
  };
  return h + `<h2 style="margin:18px 0 6px">${SUBJ[adm.subject][0]} ${esc(sName(adm.subject))} — ${gradeLabel(adm.grade)}</h2>` +
    sec('summary', t('summaries'), '📝') + sec('video', t('videos'), '🎬') + sec('room3d', t('rooms'), '🧊');
}
function bindContent() {
  app.querySelectorAll('[data-cg]').forEach(b => b.onclick = () => { adm.grade = +b.dataset.cg; adm.form = null; renderAdmin(); });
  const tr = $('#c_track'); if (tr) tr.onchange = () => { adm.track = tr.value; adm.form = null; renderAdmin(); };
  const sm = $('#c_sem'); if (sm) sm.onchange = () => { adm.sem = sm.value; };
  app.querySelectorAll('[data-cs]').forEach(b => b.onclick = () => { adm.subject = b.dataset.cs; adm.form = null; renderAdmin(); });
  app.querySelectorAll('[data-cadd]').forEach(b => b.onclick = () => { adm.form = { type: b.dataset.cadd, n: null }; renderAdmin(); });
  app.querySelectorAll('[data-cedit]').forEach(b => b.onclick = () => { adm.form = { type: DB.slots[b.dataset.cedit].type, n: b.dataset.cedit }; renderAdmin(); });
  app.querySelectorAll('[data-cview]').forEach(b => b.onclick = () => openSlot(b.dataset.cview));
  app.querySelectorAll('[data-cdel]').forEach(b => b.onclick = () => { if (confirm(t('del') + '?')) { delete DB.slots[b.dataset.cdel]; save(); renderAdmin(); } });
  const cc = $('#c_cancel'); if (cc) cc.onclick = () => { adm.form = null; renderAdmin(); };
  const sv = $('#c_save'); if (sv) sv.onclick = () => {
    const title = $('#c_title').value.trim(); if (!title) return $('#c_msg').textContent = t('fill');
    const f = adm.form, old = f.n ? DB.slots[f.n] : {}, file = $('#c_file').files[0];
    const finish = (dataUrl, fname) => {
      let n = f.n; if (!n) { n = 1; while (DB.slots[n]) n++; }
      DB.slots[n] = { type: f.type, title, subject: adm.subject, grade: $('#c_all').checked ? 'all' : adm.grade, sem: adm.sem,
        body: $('#c_body').value, url: dataUrl || $('#c_url').value.trim() || (old.url && old.url.startsWith('data:') ? old.url : ''),
        fileName: fname || old.fileName || '', shape: $('#c_shape') ? $('#c_shape').value : 0, color: $('#c_color') ? $('#c_color').value : '#22d3ee', published: true };
      if (save()) { adm.form = null; renderAdmin(); }
    };
    if (file) { if (file.size > 3e6) return $('#c_msg').textContent = t('fileTooBig'); const r = new FileReader(); r.onload = () => finish(r.result, file.name); r.readAsDataURL(file); }
    else finish('');
  };
}

function adminSlots() {
  const s = DB.slots[selSlot] || { type: 'summary', title: '', grade: 'all', subject: 'all', sem: 'all', body: '', url: '', shape: 0, color: '#22d3ee', published: true };
  const subOpts = Object.keys(SUBJ).map(k => `<option value="${k}" ${s.subject === k ? 'selected' : ''}>${esc(SUBJ[k][1])}</option>`).join('');
  return `<div class="panel glass"><b>${TOTAL_SLOTS} ${t('slots')}</b> (${Object.keys(DB.slots).length} ✔)
    <div class="slots" style="margin-top:10px">${Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1).map(n => `<button class="slot ${DB.slots[n] ? 'full' : ''} ${n === selSlot ? 'sel' : ''}" data-slot="${n}">${n}</button>`).join('')}</div></div>
  <div class="panel glass"><h3>${t('slotEditor')} #${selSlot}</h3>
    <div class="row"><div><label>${t('type')}</label><select id="a_type">${['summary', 'video', 'room3d', 'link'].map(k => `<option value="${k}" ${s.type === k ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></div>
    <div><label>${t('title')}</label><input id="a_title" value="${esc(s.title)}"></div></div>
    <div class="row"><div><label>${t('grade')}</label><select id="a_grade"><option value="all">${t('allGrades')}</option>${gradeOptions(s.grade)}</select></div>
    <div><label>${t('subject')}</label><select id="a_sub"><option value="all">${t('allSubjects')}</option>${subOpts}</select></div></div>
    <div class="row"><div><label>${t('semester')}</label><select id="a_sem"><option value="all">—</option><option value="1" ${s.sem == 1 ? 'selected' : ''}>${t('sem1')}</option><option value="2" ${s.sem == 2 ? 'selected' : ''}>${t('sem2')}</option></select></div>
    <div><label>${t('published')}</label><select id="a_pub"><option value="1">✔</option><option value="0" ${s.published === false ? 'selected' : ''}>✖</option></select></div></div>
    <label>${t('content')}</label><textarea id="a_body" rows="5">${esc(s.body)}</textarea>
    <label>${t('url')}</label><input id="a_url" value="${s.url && s.url.startsWith('data:') ? '' : esc(s.url)}" placeholder="https://…">
    <label>${t('uploadGlb')}</label><input id="a_file" type="file" accept=".glb,.gltf">
    ${s.url && s.url.startsWith('data:') ? '<div class="muted">📎 file attached</div>' : ''}
    <div class="row"><div><label>${t('shape')}</label><select id="a_shape">${t('cShape').map((n, i) => `<option value="${i}" ${+s.shape === i ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div><label>${t('color')}</label><input id="a_color" type="color" value="${s.color || '#22d3ee'}"></div></div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn" id="a_save">${t('save')}</button><button class="btn danger" id="a_del">${t('clear')}</button><span id="a_msg" class="muted"></span></div></div>`;
}
function adminTeachers() {
  return `<div class="panel glass"><h3>${t('addTeacher')}</h3>
    <div class="row"><div><label>${t('name')}</label><input id="th_name"></div><div><label>${t('email')}</label><input id="th_email" type="email"></div></div>
    <label>${t('password')}</label><input id="th_pass" type="text"><button class="btn" id="th_add" style="margin-top:12px">${t('add')}</button> <span id="th_msg" class="muted"></span></div>
    ${DB.teachers.map(x => `<div class="item"><div>👩‍🏫 ${esc(x.name)} — ${esc(x.email)}${x.grades && x.grades.length ? `<div class="muted">${x.grades.join('، ')} | ${(x.sems || []).join('، ')} | ${(x.subjects || []).filter(k => SUBJ[k]).map(k => sName(k)).join('، ')}</div>` : ''}</div><button class="btn sm danger" data-thdel="${x.id}">${t('del')}</button></div>`).join('')}`;
}
function adminUsers() {
  return DB.users.length ? `<div class="panel glass"><table><tr><th>${t('name')}</th><th>${t('email')}</th><th>${t('grade')}</th><th>${t('parentCode')}</th><th></th></tr>
    ${DB.users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.grade}${u.track ? ' (' + (u.track === 'sci' ? t('sci') : t('arts')) + ')' : ''}</td><td><code>${esc(u.parentCode)}</code></td><td><button class="btn sm danger" data-udel="${u.id}">${t('del')}</button></td></tr>`).join('')}</table></div>` : '<div class="empty">—</div>';
}
function adminSettings() {
  return `<div class="panel glass"><h3>🔐 ${t('changePass')}</h3><label>${t('password')}</label><input id="s_pass" type="password">
    <button class="btn" id="s_chg" style="margin-top:12px">${t('save')}</button> <span id="s_msg" class="muted"></span></div>
    <div class="panel glass"><button class="btn ghost" id="s_exp">⬇ ${t('export')}</button>
    <label>${t('import')}</label><input id="s_imp" type="file" accept=".json">
    <hr style="border-color:var(--line);margin:16px 0"><button class="btn danger" id="s_reset">${t('reset')}</button></div>`;
}
function bindAdmin() {
  if (adminTab === 'content') bindContent();
  if (adminTab === 'lab') bindLabManager();
  const on = (id, fn) => { const e = $('#' + id); if (e) e.onclick = fn; };
  app.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { selSlot = +b.dataset.slot; renderAdmin(); });
  on('a_save', () => {
    const title = $('#a_title').value.trim(); if (!title) return $('#a_msg').textContent = t('fill');
    const old = DB.slots[selSlot] || {};
    const file = $('#a_file').files[0];
    const finish = dataUrl => {
      DB.slots[selSlot] = { type: $('#a_type').value, title, grade: $('#a_grade').value, subject: $('#a_sub').value, sem: $('#a_sem').value,
        body: $('#a_body').value, url: dataUrl || $('#a_url').value.trim() || (old.url && old.url.startsWith('data:') ? old.url : ''),
        shape: $('#a_shape').value, color: $('#a_color').value, published: $('#a_pub').value === '1' };
      if (save()) renderAdmin();
    };
    if (file) { if (file.size > 3e6) return $('#a_msg').textContent = '> 3MB'; const r = new FileReader(); r.onload = () => finish(r.result); r.readAsDataURL(file); }
    else finish('');
  });
  on('a_del', () => { delete DB.slots[selSlot]; save(); renderAdmin(); });
  on('th_add', () => {
    const name = $('#th_name').value.trim(), email = $('#th_email').value.trim(), pass = $('#th_pass').value;
    if (!email || !pass) return $('#th_msg').textContent = t('fill');
    if (DB.teachers.some(x => x.email.toLowerCase() === email.toLowerCase())) return $('#th_msg').textContent = t('exists');
    DB.teachers.push({ id: uid(), name, email, pass: hash(pass) }); save(); renderAdmin();
  });
  app.querySelectorAll('[data-thdel]').forEach(b => b.onclick = () => { DB.teachers = DB.teachers.filter(x => x.id !== b.dataset.thdel); save(); renderAdmin(); });
  app.querySelectorAll('[data-udel]').forEach(b => b.onclick = () => { DB.users = DB.users.filter(x => x.id !== b.dataset.udel); DB.grades = DB.grades.filter(g => g.studentId !== b.dataset.udel); save(); renderAdmin(); });
  on('s_chg', () => { const p = $('#s_pass').value; if (p.length < 6) return $('#s_msg').textContent = '≥ 6'; DB.adminHash = hash(p); save(); $('#s_msg').textContent = t('saved'); });
  on('s_exp', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(DB)], { type: 'application/json' })); a.download = 'smart3d-backup.json'; a.click(); });
  const imp = $('#s_imp'); if (imp) imp.onchange = () => { const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (d.users) { DB = d; save(); renderAdmin(); } } catch (e) { alert('Invalid file'); } }; r.readAsText(imp.files[0]); };
  on('s_reset', () => { if (confirm('?')) { DB = { users: [], teachers: [], grades: [], slots: {}, adminHash: hash(DEFAULT_ADMIN) }; save(); setSession(null); render(); } });
}

/* ---------- Voice (TTS / STT) ---------- */
let voiceOn = false, recog = null;
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).slice(0, 1500)); u.lang = SPEECH[lang]; speechSynthesis.speak(u);
}
function stopSpeak() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
function listenOnce(cb, btn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { setStatus('Speech recognition not supported (use Chrome/Edge)'); return; }
  if (recog) { try { recog.stop(); } catch (e) {} }
  recog = new SR(); recog.lang = SPEECH[lang]; recog.interimResults = false;
  if (btn) btn.classList.add('listening');
  recog.onresult = e => cb(e.results[0][0].transcript);
  recog.onerror = e => setStatus('⚠ ' + e.error);
  recog.onend = () => { if (btn) btn.classList.remove('listening'); };
  recog.start();
}
function setStatus(s) { $('#vStatus').textContent = s; }
function pageText() { return app.innerText.replace(/\s+/g, ' '); }
function voiceCommand(txt) {
  setStatus('🎤 ' + txt);
  const s = txt.toLowerCase();
  const has = (...w) => w.some(x => s.includes(x));
  if (has('درجات', 'grades', 'notes', 'نمبر')) { if (session && session.role === 'student') { view.subject = null; render(); window.scrollTo(0, document.body.scrollHeight); } speak(pageText()); }
  else if (has('مواد', 'subjects', 'matières', 'مضامین')) { view.subject = null; render(); speak(pageText()); }
  else if (has('اقرأ', 'read', 'lire', 'پڑھ')) speak(pageText());
  else if (has('خروج', 'logout', 'quitter')) logout();
  else if (has('رجوع', 'back', 'retour')) { view.subject = null; render(); }
  else speak(lang === 'ar' ? 'لم أفهم الأمر' : 'Command not understood');
}
$('#voiceBtn').onclick = () => { $('#voicePanel').classList.toggle('hidden'); voiceOn = !$('#voicePanel').classList.contains('hidden'); if (voiceOn) speak(t('voiceHelp')); else stopSpeak(); };
$('#vRead').onclick = () => speak(pageText());
$('#vListen').onclick = e => listenOnce(voiceCommand, e.currentTarget);
$('#vStop').onclick = () => { stopSpeak(); if (recog) try { recog.stop(); } catch (e) {} };
$('#vFont').onclick = () => { const r = document.documentElement; const cur = parseFloat(getComputedStyle(r).getPropertyValue('--fs')); r.style.setProperty('--fs', (cur >= 24 ? 16 : cur + 3) + 'px'); };

/* ---------- Chatbot (local assistant) ---------- */
function botReply(q) {
  const s = q.toLowerCase();
  const has = (...w) => w.some(x => s.includes(x));
  const u = session && session.role === 'student' ? DB.users.find(x => x.id === session.id) : null;
  if (has('مرحبا', 'اهلا', 'السلام', 'hello', 'hi', 'bonjour', 'salut', 'سلام')) return t('botHi');
  if (has('درجات', 'درجتي', 'grade', 'marks', 'note', 'نمبر')) {
    if (!u) return lang === 'ar' ? 'سجّل الدخول كطالب لأعرض درجاتك.' : 'Log in as a student to see grades.';
    const { avg, gs } = stats(u.id); return avg == null ? t('noGrades') : `${t('avg')}: ${avg.toFixed(1)}% — ${t('ex')[levelOf(avg)]} (${gs.length})`;
  }
  if (has('مواد', 'subject', 'matière', 'مضامین')) return u ? subjectsFor(u.grade, u.track).map(sName).join('، ') : (lang === 'ar' ? 'سجّل الدخول لأعرض موادك.' : 'Log in to see your subjects.');
  if (has('3d', 'ثلاثي', 'غرفة', 'room')) return t('empty3d').split('—')[0] + ' — ' + (lang === 'ar' ? 'الغرف تظهر في صفحتك الرئيسية عند إضافتها من المشرف.' : 'rooms appear on your home page once the admin adds them.');
  if (has('ولي', 'parent')) return lang === 'ar' ? 'رقم ولي الأمر يظهر في صفحتك الرئيسية. أعطه لولي أمرك ليدخل به.' : 'Your parent code is on your home page. Give it to your parent to log in.';
  if (has('مساعد', 'help', 'aide')) return lang === 'ar' ? 'أستطيع: عرض موادك، درجاتك، شرح استخدام المنصة، والبحث في المحتوى.' : 'I can show your subjects, grades, explain the platform and search content.';
  // search content
  const hits = Object.entries(DB.slots).filter(([, x]) => x.title && (s.includes(x.title.toLowerCase()) || x.title.toLowerCase().split(/\s+/).some(w => w.length > 3 && s.includes(w)))).slice(0, 3);
  if (hits.length) return hits.map(([, x]) => '• ' + x.title).join('\n');
  return t('botNo');
}
function bubble(txt, who) { const d = document.createElement('div'); d.className = 'b ' + who; d.textContent = txt; $('#chatLog').appendChild(d); $('#chatLog').scrollTop = 1e9; }
function chatSend(text) {
  text = (text || $('#chatInput').value).trim(); if (!text) return;
  bubble(text, 'me'); $('#chatInput').value = '';
  const r = botReply(text); bubble(r, 'ai'); if ($('#chatTTS').checked) speak(r);
}
$('#chatFab').onclick = () => { $('#chat').classList.toggle('hidden'); if (!$('#chatLog').children.length) bubble(t('botHi'), 'ai'); };
$('#chatClose').onclick = () => $('#chat').classList.add('hidden');
$('#chatSend').onclick = () => chatSend();
$('#chatInput').onkeydown = e => { if (e.key === 'Enter') chatSend(); };
$('#chatMic').onclick = e => listenOnce(txt => chatSend(txt), e.currentTarget);

/* ---------- Global controls ---------- */
function logout() { setSession(null); view = {}; authMsg = ''; render(); }
$('#logoutBtn').onclick = logout;
$('#langSel').value = lang;
$('#langSel').onchange = e => { lang = e.target.value; localStorage.setItem('s3d_lang', lang); render(); };
const savedTheme = localStorage.getItem('s3d_theme') || 'normal';
document.documentElement.dataset.theme = savedTheme; $('#themeSel').value = savedTheme;
$('#themeSel').onchange = e => { document.documentElement.dataset.theme = e.target.value; localStorage.setItem('s3d_theme', e.target.value); };
render();
