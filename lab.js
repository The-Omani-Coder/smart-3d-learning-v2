/* =========================================================
   Smart 3D Learning — lab.js  (المختبر التفاعلي / غرف الـ3D)
   - المعلم/المشرف يرفع مجسم GLB/GLTF من جهازه ويحدد المادة والصف.
   - ملفات المجسمات تُحفظ في IndexedDB (مساحة أكبر من localStorage)،
     وبياناتها (الاسم، المادة، الصف…) في DB.lab داخل قاعدة المنصة.
   - يعتمد على المتغيرات العامة في script.js (DB, t, app, esc, save, render…)
   ========================================================= */
'use strict';

/* ---------- نصوص ---------- */
const LL = {
  ar: {
    lab: '🧪 المختبر التفاعلي', rooms: 'غرف الـ3D', exps: 'تجاربي المحفوظة', search: 'ابحث عن مجسم…', allSubj: 'الكل',
    noModels: 'لا توجد مجسمات بعد. سيظهر هنا ما يرفعه المعلم.', noExps: 'لا توجد تجارب محفوظة بعد. افتح مجسماً واضغط «حفظ التجربة».',
    mgr: '🧪 إدارة المختبر التفاعلي', addModel: '＋ إضافة مجسم جديد', editModel: 'تعديل المجسم', mTitle: 'اسم المجسم (مثال: الخلية الحيوانية)',
    mDesc: 'الوصف / تعليمات التجربة', mFile: 'ملف المجسم (GLB أو GLTF) من جهازك', fileKeep: 'اتركه فارغاً للإبقاء على الملف الحالي',
    mParts: 'أسماء الأجزاء (اختياري) — سطر لكل جزء بالشكل: اسم_الجزء_في_الملف = الاسم_المعروض',
    mVars: 'متغيرات التحكم (اختياري) — سطر لكل متغير: الاسم | الوحدة | الأدنى | الأعلى | الافتراضي | التأثير (speed أو scale أو explode أو glow)',
    mQuiz: 'اختبار قصير (اختياري) — سطر لكل سؤال: السؤال | خيار1 | خيار2 | خيار3 | رقم الجواب الصحيح | الشرح',
    mSubject: 'المادة', mGrade: 'الصف', allGrades: 'كل الصفوف', hidden: 'مخفي', show: 'إظهار', hide: 'إخفاء',
    needFile: 'اختر ملف المجسم أولاً', tooBig: 'الملف أكبر من 60MB', saved: 'تم الحفظ ✓', fmtHelp: 'يُفضّل GLB (ملف واحد). ملفات GLTF التي تعتمد على ملفات خارجية لن تظهر.',
    speed: 'السرعة', size: 'الحجم', explode: 'التفكيك', light: 'الإضاءة', time: 'الزمن (ث)',
    play: '⏸ إيقاف', resume: '▶ تشغيل', reset: '⟲ إعادة', moveMode: '✋ وضع تحريك المجسم', camMode: '🔄 وضع تدوير الكاميرا',
    selected: 'المجسم المحدد', parts: 'الأجزاء (اضغط للتحديد، والمربع للإخفاء)', addToScene: 'إضافة مجسم إلى المشهد',
    addBtn: '＋ إضافة', readings: 'القراءات', record: '📝 تسجيل قراءة', saveExp: 'حفظ التجربة', expName: 'اسم التجربة؟',
    expSaved: 'تم حفظ التجربة ✓', finish: 'إنهاء التجربة', quizTitle: 'اختبار قصير', next: 'التالي', correct: 'إجابة صحيحة ✓', wrong: 'إجابة غير صحيحة ✗',
    score: 'نتيجتك', toGrades: 'أُضيفت النتيجة إلى درجاتك.', close: 'إغلاق', loadErr: 'تعذّر تحميل المجسم. تأكد أن الملف GLB سليم.',
    noThree: 'مكتبة THREE.js لم تُحمّل (تحتاج إنترنت).', hintPick: 'اضغط على أي جزء لمعرفة اسمه', quizOf: 'اختبار', noParts: 'لا أجزاء',
    howto: 'ارفع ملف المجسم، اكتب اسمه وحدد المادة والصف، ثم احفظ — يظهر للطلاب مباشرة.', model: 'المجسم', none: '—',
  },
  en: {
    lab: '🧪 Interactive Lab', rooms: '3D Rooms', exps: 'My saved experiments', search: 'Search models…', allSubj: 'All',
    noModels: 'No models yet. What the teacher uploads will appear here.', noExps: 'No saved experiments yet. Open a model and press “Save experiment”.',
    mgr: '🧪 Interactive Lab manager', addModel: '＋ Add new model', editModel: 'Edit model', mTitle: 'Model name (e.g. Animal cell)',
    mDesc: 'Description / experiment instructions', mFile: 'Model file (GLB or GLTF) from your device', fileKeep: 'Leave empty to keep the current file',
    mParts: 'Part names (optional) — one per line: node_name_in_file = Display name',
    mVars: 'Control variables (optional) — one per line: Name | Unit | Min | Max | Default | Effect (speed, scale, explode or glow)',
    mQuiz: 'Short quiz (optional) — one per line: Question | Option1 | Option2 | Option3 | Correct number | Explanation',
    mSubject: 'Subject', mGrade: 'Grade', allGrades: 'All grades', hidden: 'Hidden', show: 'Show', hide: 'Hide',
    needFile: 'Choose a model file first', tooBig: 'File is over 60MB', saved: 'Saved ✓', fmtHelp: 'GLB (single file) is recommended. GLTF files that depend on external files will not show.',
    speed: 'Speed', size: 'Size', explode: 'Explode', light: 'Light', time: 'Time (s)',
    play: '⏸ Pause', resume: '▶ Play', reset: '⟲ Reset', moveMode: '✋ Move-model mode', camMode: '🔄 Rotate-camera mode',
    selected: 'Selected model', parts: 'Parts (tap to select, checkbox to hide)', addToScene: 'Add a model to the scene',
    addBtn: '＋ Add', readings: 'Readings', record: '📝 Record reading', saveExp: 'Save experiment', expName: 'Experiment name?',
    expSaved: 'Experiment saved ✓', finish: 'Finish experiment', quizTitle: 'Short quiz', next: 'Next', correct: 'Correct ✓', wrong: 'Incorrect ✗',
    score: 'Your score', toGrades: 'The result was added to your grades.', close: 'Close', loadErr: 'Could not load the model. Make sure the GLB file is valid.',
    noThree: 'THREE.js did not load (internet needed).', hintPick: 'Tap any part to see its name', quizOf: 'Quiz', noParts: 'No parts',
    howto: 'Upload the model file, name it, choose subject and grade, then save — students see it immediately.', model: 'Model', none: '—',
  },
};
const lt = k => (LL[lang] && LL[lang][k] != null) ? LL[lang][k] : (LL.en[k] != null ? LL.en[k] : k);

/* ---------- حالة الواجهة ---------- */
const labUI = { tab: 'rooms', q: '', sub: 'all', form: null };
const LAB_SUBJECTS = ['phys', 'chem', 'bio', 'science', 'env', 'math'];
function ensureLab() {
  if (!Array.isArray(DB.lab)) DB.lab = [];
  if (!Array.isArray(DB.labSaves)) DB.labSaves = [];
}
const parseLines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);

/* ---------- تخزين الملفات (IndexedDB) ---------- */
const LabFiles = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      if (this.db) return res(this.db);
      const r = indexedDB.open('s3d_lab_files', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('f');
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async put(k, blob) {
    const db = await this.open();
    return new Promise((res, rej) => { const tx = db.transaction('f', 'readwrite'); tx.objectStore('f').put(blob, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
  },
  async get(k) {
    const db = await this.open();
    return new Promise((res, rej) => { const rq = db.transaction('f').objectStore('f').get(k); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
  },
  async del(k) {
    const db = await this.open();
    return new Promise((res, rej) => { const tx = db.transaction('f', 'readwrite'); tx.objectStore('f').delete(k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
  },
};

/* ---------- تحويل النصوص إلى بيانات ---------- */
function parseVars(s) {
  return parseLines(s).map(l => {
    const p = l.split('|').map(x => x.trim());
    const min = isNaN(parseFloat(p[2])) ? 0 : parseFloat(p[2]);
    let max = isNaN(parseFloat(p[3])) ? 100 : parseFloat(p[3]); if (max <= min) max = min + 1;
    let val = parseFloat(p[4]); if (isNaN(val)) val = min; val = Math.min(max, Math.max(min, val));
    const effect = ['speed', 'scale', 'explode', 'glow'].includes((p[5] || '').toLowerCase()) ? p[5].toLowerCase() : 'speed';
    return { name: p[0], unit: p[1] || '', min, max, val, effect };
  }).filter(v => v.name).slice(0, 4);
}
const varsToText = v => (v || []).map(x => [x.name, x.unit, x.min, x.max, x.val, x.effect].join(' | ')).join('\n');
function parseQuiz(s) {
  const out = [];
  parseLines(s).forEach(l => {
    const p = l.split('|').map(x => x.trim());
    if (p.length < 5) return;
    const o = p.slice(1, -2).filter(Boolean), a = parseInt(p[p.length - 2], 10) - 1;
    if (o.length < 2 || !(a >= 0 && a < o.length)) return;
    out.push({ q: p[0], o, a, e: p[p.length - 1] });
  });
  return out;
}
const quizToText = q => (q || []).map(x => [x.q, ...x.o, x.a + 1, x.e].join(' | ')).join('\n');

/* =========================================================
   إدارة المجسمات (للمعلم والمشرف)
   ========================================================= */
function labManager() {
  ensureLab();
  const f = labUI.form;
  const cur = f && f.id ? (DB.lab.find(x => x.id === f.id) || {}) : {};
  const subjName = k => SUBJ[k] ? sName(k) : k;
  const list = DB.lab.length ? DB.lab.map(m => `<div class="item"><div><b>${esc(m.title)}</b>
      <span class="badge">${esc(subjName(m.subject))}</span> <span class="badge">${m.grade === 'all' ? lt('allGrades') : gradeLabel(m.grade)}</span>
      ${m.published === false ? `<span class="badge">${lt('hidden')}</span>` : ''}</div>
      <div><button class="btn sm ghost" data-lab-open="${m.id}">${t('open')}</button>
      <button class="btn sm ghost" data-lab-edit="${m.id}">${t('edit')}</button>
      <button class="btn sm ghost" data-lab-toggle="${m.id}">${m.published === false ? lt('show') : lt('hide')}</button>
      <button class="btn sm danger" data-lab-del="${m.id}">${t('del')}</button></div></div>`).join('')
    : `<div class="muted">${t('nothingYet')}</div>`;
  const form = f ? `<div class="panel" style="border:1px solid var(--a1);border-radius:14px;margin-top:12px">
      <h4>${cur.id ? lt('editModel') : lt('addModel')}</h4>
      <label>${lt('mTitle')}</label><input id="lb_title" value="${esc(cur.title || '')}">
      <div class="row"><div><label>${lt('mSubject')}</label><select id="lb_sub">${LAB_SUBJECTS.map(k => `<option value="${k}" ${cur.subject === k ? 'selected' : ''}>${esc(subjName(k))}</option>`).join('')}</select></div>
      <div><label>${lt('mGrade')}</label><select id="lb_grade"><option value="all">${lt('allGrades')}</option>${gradeOptions(cur.grade)}</select></div></div>
      <label>${lt('mFile')}</label><input id="lb_file" type="file" accept=".glb,.gltf">
      <div class="muted">${cur.id ? '📎 ' + esc(cur.fileName || '') + ' — ' + lt('fileKeep') + '<br>' : ''}${lt('fmtHelp')}</div>
      <label>${lt('mDesc')}</label><textarea id="lb_desc" rows="3">${esc(cur.desc || '')}</textarea>
      <label>${lt('mParts')}</label><textarea id="lb_parts" rows="3" placeholder="Sphere.001 = Nucleus">${esc(cur.partsText || '')}</textarea>
      <label>${lt('mVars')}</label><textarea id="lb_vars" rows="3" placeholder="الحرارة | °C | 0 | 100 | 25 | speed">${esc(varsToText(cur.vars))}</textarea>
      <label>${lt('mQuiz')}</label><textarea id="lb_quiz" rows="4" placeholder="ما وظيفة النواة؟ | التحكم | الطاقة | الحركة | 1 | النواة تتحكم بأنشطة الخلية">${esc(quizToText(cur.quiz))}</textarea>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" id="lb_save">${t('save')}</button><button class="btn ghost" id="lb_cancel">${t('cancel')}</button><span id="lb_msg" class="muted"></span></div></div>` : '';
  return `<div class="panel glass"><div class="page-head" style="margin:0 0 6px"><h3>${lt('mgr')}</h3><button class="btn sm" id="lb_add">${lt('addModel')}</button></div>
    <div class="muted" style="margin-bottom:10px">${lt('howto')}</div>${list}${form}</div>`;
}

async function labSave() {
  const msg = txt => { const e = $('#lb_msg'); if (e) e.textContent = txt; };
  const title = $('#lb_title').value.trim(); if (!title) return msg(t('fill'));
  const f = labUI.form, old = f.id ? (DB.lab.find(x => x.id === f.id) || {}) : {};
  const file = $('#lb_file').files[0];
  if (!old.id && !file) return msg(lt('needFile'));
  if (file && file.size > 60e6) return msg(lt('tooBig'));
  const id = old.id || uid();
  const fileKey = old.fileKey || ('lab_' + id);
  try { if (file) await LabFiles.put(fileKey, file); } catch (e) { return msg('IndexedDB error: ' + e); }
  const rec = {
    id, title, subject: $('#lb_sub').value, grade: $('#lb_grade').value, desc: $('#lb_desc').value.trim(),
    partsText: $('#lb_parts').value, vars: parseVars($('#lb_vars').value), quiz: parseQuiz($('#lb_quiz').value),
    published: old.published !== false, fileKey, fileName: file ? file.name : (old.fileName || ''), size: file ? file.size : (old.size || 0),
    by: session ? (session.role + ':' + (session.id || '')) : '', ts: old.ts || Date.now(),
  };
  ensureLab();
  const i = DB.lab.findIndex(x => x.id === id);
  if (i >= 0) DB.lab[i] = rec; else DB.lab.push(rec);
  if (save()) { labUI.form = null; render(); }
}

function bindLabManager() {
  const each = (s, fn) => app.querySelectorAll(s).forEach(fn);
  each('[data-lab-open]', b => b.onclick = () => openLab(b.dataset.labOpen));
  each('[data-lab-edit]', b => b.onclick = () => { labUI.form = { id: b.dataset.labEdit }; render(); });
  each('[data-lab-toggle]', b => b.onclick = () => {
    const m = DB.lab.find(x => x.id === b.dataset.labToggle); if (!m) return;
    m.published = m.published === false; save(); render();
  });
  each('[data-lab-del]', b => b.onclick = async () => {
    if (!confirm(t('del') + '?')) return;
    const m = DB.lab.find(x => x.id === b.dataset.labDel); if (!m) return;
    try { await LabFiles.del(m.fileKey); } catch (e) {}
    DB.lab = DB.lab.filter(x => x.id !== m.id);
    DB.labSaves = (DB.labSaves || []).filter(x => x.modelId !== m.id);
    save(); render();
  });
  const add = $('#lb_add'); if (add) add.onclick = () => { labUI.form = { id: null }; render(); };
  const c = $('#lb_cancel'); if (c) c.onclick = () => { labUI.form = null; render(); };
  const s = $('#lb_save'); if (s) s.onclick = labSave;
}

/* =========================================================
   قسم الطالب: المختبر التفاعلي
   ========================================================= */
function labVisible(u) {
  ensureLab();
  return DB.lab.filter(m => m.published !== false && (m.grade === 'all' || +m.grade === u.grade));
}
function labGridHTML(u) {
  const q = labUI.q.trim().toLowerCase();
  const l = labVisible(u).filter(m => (labUI.sub === 'all' || m.subject === labUI.sub) && (!q || (m.title + ' ' + (m.desc || '')).toLowerCase().includes(q)));
  return l.length ? l.map(m => `<div class="card glass" data-lab-open="${m.id}"><div class="ic">${SUBJ[m.subject] ? SUBJ[m.subject][0] : '🧊'}</div><b>${esc(m.title)}</b>
      <div class="muted">${esc(SUBJ[m.subject] ? sName(m.subject) : '')}</div><div class="muted">${esc((m.desc || '').slice(0, 70))}</div></div>`).join('')
    : `<div class="empty" style="grid-column:1/-1">🧊 ${lt('noModels')}</div>`;
}
function labBox(u) {
  if (labUI.tab === 'exps') {
    const l = DB.labSaves.filter(x => x.userId === u.id).slice().reverse();
    return l.length ? l.map(x => {
      const m = DB.lab.find(y => y.id === x.modelId);
      return `<div class="item"><div><b>${esc(x.name)}</b><div class="muted">${esc(m ? m.title : '')} — ${new Date(x.ts).toLocaleString()}</div></div>
        <div><button class="btn sm" data-lab-load="${x.id}">${t('open')}</button> <button class="btn sm danger" data-lab-xdel="${x.id}">${t('del')}</button></div></div>`;
    }).join('') : `<div class="empty">${lt('noExps')}</div>`;
  }
  const subs = [...new Set(labVisible(u).map(m => m.subject))];
  return `<input id="labQ" placeholder="${lt('search')}" value="${esc(labUI.q)}">
    <div class="chips"><button class="tab ${labUI.sub === 'all' ? 'on' : ''}" data-labsub="all">${lt('allSubj')}</button>
    ${subs.map(k => `<button class="tab ${labUI.sub === k ? 'on' : ''}" data-labsub="${k}">${esc(SUBJ[k] ? sName(k) : k)}</button>`).join('')}</div>
    <div id="labGrid" class="grid">${labGridHTML(u)}</div>`;
}
function labSection(u) {
  ensureLab();
  return `<h3 style="margin:22px 0 10px">${lt('lab')}</h3>
    <div class="tabs"><button class="tab ${labUI.tab === 'rooms' ? 'on' : ''}" data-labtab="rooms">${lt('rooms')}</button>
    <button class="tab ${labUI.tab === 'exps' ? 'on' : ''}" data-labtab="exps">${lt('exps')}</button></div>
    <div id="labBox">${labBox(u)}</div>`;
}
function bindLabBox(u) {
  const each = (s, fn) => app.querySelectorAll(s).forEach(fn);
  each('#labBox [data-lab-open]', b => b.onclick = () => openLab(b.dataset.labOpen));
  each('[data-lab-load]', b => b.onclick = () => {
    const x = DB.labSaves.find(y => y.id === b.dataset.labLoad); if (x) openLab(x.modelId, x);
  });
  each('[data-lab-xdel]', b => b.onclick = () => {
    if (!confirm(t('del') + '?')) return;
    DB.labSaves = DB.labSaves.filter(y => y.id !== b.dataset.labXdel); save(); $('#labBox').innerHTML = labBox(u); bindLabBox(u);
  });
  each('[data-labsub]', b => b.onclick = () => { labUI.sub = b.dataset.labsub; $('#labBox').innerHTML = labBox(u); bindLabBox(u); });
  const q = $('#labQ');
  if (q) q.oninput = () => {
    labUI.q = q.value; $('#labGrid').innerHTML = labGridHTML(u);
    each('#labGrid [data-lab-open]', b => b.onclick = () => openLab(b.dataset.labOpen));
  };
}
function bindLab(u) {
  app.querySelectorAll('[data-labtab]').forEach(b => b.onclick = () => {
    labUI.tab = b.dataset.labtab;
    app.querySelectorAll('[data-labtab]').forEach(x => x.classList.toggle('on', x === b));
    $('#labBox').innerHTML = labBox(u); bindLabBox(u);
  });
  bindLabBox(u);
}

/* =========================================================
   عارض المختبر (3D) — تدوير، تكبير، تحريك، تفكيك، متغيرات، قراءات
   ========================================================= */
let labV = null;

function closeLab() {
  if (!labV) return;
  cancelAnimationFrame(labV.raf);
  window.removeEventListener('resize', labV.onResize);
  try { labV.renderer.dispose(); } catch (e) {}
  const ov = $('#labView'); if (ov) ov.remove();
  labV = null;
  if (typeof stopSpeak === 'function') stopSpeak();
  if (session && session.role === 'student' && labUI.tab === 'exps') render();
}

function labApply(h) {
  const u = h.userData, s = u.s;
  let sc = s.size, ex = s.explode, glow = 0, spd = s.speed;
  u.model.vars.forEach(v => {
    const n = ((s.vars[v.name] ?? v.val) - v.min) / ((v.max - v.min) || 1);
    if (v.effect === 'scale') sc *= 0.5 + n;
    else if (v.effect === 'explode') ex = Math.min(1.5, ex + n);
    else if (v.effect === 'glow') glow = Math.max(glow, n);
    else spd *= 0.2 + n * 2.8;
  });
  u.speedEff = spd;
  h.scale.setScalar(u.baseScale * sc);
  u.parts.forEach(p => p.position.copy(p.userData.orig).addScaledVector(p.userData.delta, ex));
  u.meshes.forEach(o => {
    const hl = o.userData.hl ? 1 : 0;
    [].concat(o.material).forEach(mt => {
      if (mt && mt.emissive) mt.emissive.setRGB(glow * 0.7, glow * 0.45 + hl * 0.5, glow * 0.1 + hl * 0.6);
    });
  });
}

async function labLoadHolder(st, model, opts = {}) {
  const blob = await LabFiles.get(model.fileKey);
  if (!blob) throw new Error('missing file');
  const url = URL.createObjectURL(blob);
  let gltf;
  try { gltf = await new Promise((res, rej) => new THREE.GLTFLoader().load(url, res, undefined, rej)); }
  finally { URL.revokeObjectURL(url); }

  const holder = new THREE.Group(), root = gltf.scene; holder.add(root);
  const bb = new THREE.Box3().setFromObject(root), sz = bb.getSize(new THREE.Vector3()), ctr = bb.getCenter(new THREE.Vector3());
  const k = 2 / (Math.max(sz.x, sz.y, sz.z) || 1);
  root.position.sub(ctr); holder.scale.setScalar(k);

  const meshes = [];
  root.traverse(o => {
    if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); meshes.push(o); }
  });
  let pr = root; while (pr.children.length === 1 && !pr.children[0].isMesh) pr = pr.children[0];
  const parts = pr.children.length > 1 ? pr.children.slice() : meshes.slice();

  const nm = {};
  parseLines(model.partsText).forEach(l => { const i = l.indexOf('='); if (i > 0) nm[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); });
  parts.forEach((p, i) => { const raw = p.name || ('Part ' + (i + 1)); p.userData.label = nm[raw.toLowerCase()] || raw; });

  holder.userData = { isLabHolder: true, model, baseScale: k, parts, meshes, mixer: null, speedEff: 1, s: { speed: 1, size: 1, explode: 0, vars: {} } };
  model.vars.forEach(v => holder.userData.s.vars[v.name] = v.val);

  st.scene.add(holder); holder.updateMatrixWorld(true);
  const wc = new THREE.Box3().setFromObject(holder).getCenter(new THREE.Vector3());
  parts.forEach(p => {
    const c = new THREE.Box3().setFromObject(p).getCenter(new THREE.Vector3());
    const d = c.clone().sub(wc); if (d.length() < 1e-4) d.set(0, 1, 0);
    d.normalize().multiplyScalar(1.4);
    p.userData.orig = p.position.clone();
    p.userData.delta = p.parent.worldToLocal(c.clone().add(d)).sub(p.parent.worldToLocal(c.clone()));
  });
  if (gltf.animations && gltf.animations.length) {
    const mx = new THREE.AnimationMixer(root); gltf.animations.forEach(a => mx.clipAction(a).play()); holder.userData.mixer = mx;
  }
  const idx = st.holders.length;
  holder.position.set(opts.pos ? opts.pos[0] : idx * 2.8, opts.pos ? opts.pos[1] : (sz.y * k) / 2, opts.pos ? opts.pos[2] : 0);
  st.holders.push(holder);
  if (opts.s) { Object.assign(holder.userData.s, opts.s); holder.userData.s.vars = Object.assign({}, holder.userData.s.vars, (opts.s.vars || {})); }
  if (typeof opts.rotY === 'number') holder.rotation.y = opts.rotY;
  labApply(holder);
  return holder;
}

async function openLab(id, restore) {
  ensureLab();
  const m = DB.lab.find(x => x.id === id); if (!m) return;
  closeLab();
  const canStore = !!(session && session.role === 'student');
  const ov = document.createElement('div'); ov.id = 'labView'; ov.className = 'lab-view';
  ov.innerHTML = `
    <div class="lab-top glass"><b>🧪 ${esc(m.title)}</b>
      <div class="lab-top-btns">
        <button class="btn sm ghost" id="lv_mode">${lt('moveMode')}</button>
        ${canStore ? `<button class="btn sm ghost" id="lv_save">💾 ${lt('saveExp')}</button>` : ''}
        <button class="btn sm" id="lv_finish">🏁 ${lt('finish')}</button>
        <button class="btn sm ghost" id="lv_close" aria-label="${lt('close')}">✖</button>
      </div></div>
    <div class="lab-body">
      <div class="lab-stage"><div id="lv_canvas" class="lab-canvas"></div><div id="lv_label" class="lab-label">${lt('hintPick')}</div><div id="lv_toast" class="lab-label hidden" style="top:auto;bottom:10px"></div></div>
      <div class="lab-side glass">
        <div class="muted prose">${esc(m.desc || '')}</div>
        <h4>${lt('selected')}: <span id="lv_selname">${lt('none')}</span></h4>
        <div class="lab-btns"><button id="lv_play" class="btn sm">${lt('play')}</button><button id="lv_reset" class="btn sm ghost">${lt('reset')}</button></div>
        <div id="lv_sliders"></div>
        <h4>${lt('parts')}</h4><div id="lv_parts"></div>
        <h4>${lt('addToScene')}</h4>
        <div class="lab-btns"><select id="lv_addsel"></select><button id="lv_addbtn" class="btn sm">${lt('addBtn')}</button></div>
        <h4>${lt('readings')}</h4>
        <button id="lv_rec" class="btn sm">${lt('record')}</button>
        <div id="lv_table" style="overflow:auto"></div>
        <canvas id="lv_chart" width="320" height="170" class="hidden" style="width:100%;margin-top:8px"></canvas>
      </div></div>
    <div id="lv_quiz" class="lab-quiz hidden"></div>`;
  document.body.appendChild(ov);

  const box = $('#lv_canvas');
  if (!window.THREE || !THREE.GLTFLoader) { box.innerHTML = `<div class="empty">${lt('noThree')}</div>`; $('#lv_close').onclick = closeLab; return; }

  const W = box.clientWidth || 600, H = box.clientHeight || 400;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050914);
  const cam = new THREE.PerspectiveCamera(50, W / H, .1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(W, H); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.style.touchAction = 'none';
  box.appendChild(renderer.domElement);
  const amb = new THREE.AmbientLight(0xffffff, .8), dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(3, 5, 4);
  scene.add(amb, dl, new THREE.GridHelper(14, 28, 0x22d3ee, 0x1b2450));
  const resetCam = () => { cam.position.set(2.5, 2.2, 4); controls.target.set(0, 1, 0); controls.update(); };
  const controls = new THREE.OrbitControls(cam, renderer.domElement); controls.enableDamping = true; resetCam();

  const st = labV = { m, scene, cam, renderer, controls, holders: [], sel: null, playing: true, moveMode: false, rows: [], clock: 0, raf: 0, light: .8, quizDone: false };
  st.onResize = () => { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  window.addEventListener('resize', st.onResize);

  const toast = txt => { const e = $('#lv_toast'); if (!e) return; e.textContent = txt; e.classList.remove('hidden'); setTimeout(() => e.classList.add('hidden'), 2200); };
  const $v = s => ov.querySelector(s);

  /* ----- واجهة الأدوات الجانبية ----- */
  function drawSliders() {
    const h = st.sel, box2 = $v('#lv_sliders'); if (!h) { box2.innerHTML = ''; return; }
    const s = h.userData.s, vars = h.userData.model.vars;
    const defs = [['speed', lt('speed'), 0, 3, .1], ['size', lt('size'), .3, 2.5, .05], ['explode', lt('explode'), 0, 1, .01]];
    box2.innerHTML = defs.map(([k, l, mn, mx, sp]) => `<label>${l}: <b id="sv_${k}">${(+s[k]).toFixed(2)}</b></label><input type="range" data-sk="${k}" min="${mn}" max="${mx}" step="${sp}" value="${s[k]}">`).join('')
      + vars.map((v, i) => `<label>${esc(v.name)}${v.unit ? ' (' + esc(v.unit) + ')' : ''}: <b id="svv_${i}">${s.vars[v.name]}</b></label><input type="range" data-sv="${i}" min="${v.min}" max="${v.max}" step="${(v.max - v.min) / 100}" value="${s.vars[v.name]}">`).join('')
      + `<label>${lt('light')}: <b id="sv_light">${st.light.toFixed(2)}</b></label><input type="range" data-sl="1" min="0.1" max="2" step="0.05" value="${st.light}">`;
    box2.querySelectorAll('[data-sk]').forEach(inp => inp.oninput = () => { s[inp.dataset.sk] = +inp.value; $v('#sv_' + inp.dataset.sk).textContent = (+inp.value).toFixed(2); labApply(h); });
    box2.querySelectorAll('[data-sv]').forEach(inp => inp.oninput = () => { const v = vars[+inp.dataset.sv]; s.vars[v.name] = +inp.value; $v('#svv_' + inp.dataset.sv).textContent = (+inp.value).toFixed(1); labApply(h); });
    box2.querySelector('[data-sl]').oninput = e => { st.light = +e.target.value; amb.intensity = st.light; dl.intensity = st.light * 1.25; $v('#sv_light').textContent = st.light.toFixed(2); };
  }
  function drawParts() {
    const h = st.sel, box2 = $v('#lv_parts'); if (!h) { box2.innerHTML = ''; return; }
    const parts = h.userData.parts;
    box2.innerHTML = parts.length ? parts.map((p, i) => `<div class="item" style="padding:6px 10px;margin-bottom:4px"><span data-pn="${i}" style="cursor:pointer;flex:1">${esc(p.userData.label)}</span><input type="checkbox" data-pv="${i}" ${p.visible ? 'checked' : ''}></div>`).join('') : `<div class="muted">${lt('noParts')}</div>`;
    box2.querySelectorAll('[data-pn]').forEach(sp => sp.onclick = () => highlight(h, parts[+sp.dataset.pn]));
    box2.querySelectorAll('[data-pv]').forEach(cb => cb.onchange = () => { parts[+cb.dataset.pv].visible = cb.checked; });
  }
  function select(h) {
    st.sel = h; $v('#lv_selname').textContent = h ? h.userData.model.title : lt('none');
    drawSliders(); drawParts();
  }
  function highlight(h, part) {
    st.holders.forEach(x => { x.userData.meshes.forEach(o => o.userData.hl = false); });
    if (part) part.traverse(o => { if (o.isMesh) o.userData.hl = true; });
    st.holders.forEach(labApply);
    const lab = $v('#lv_label');
    if (part) {
      const name = part.userData.label || '';
      lab.textContent = name; if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}
      if (typeof voiceOn !== 'undefined' && voiceOn && typeof speak === 'function') speak(name);
    } else lab.textContent = lt('hintPick');
  }
  function drawAddSel() {
    const l = (session && session.role === 'student') ? labVisible(DB.users.find(x => x.id === session.id) || { grade: 0 }) : DB.lab.filter(x => x.published !== false);
    $v('#lv_addsel').innerHTML = l.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('');
  }

  /* ----- القراءات والرسم البياني ----- */
  function drawRows() {
    const cols = []; st.rows.forEach(r => Object.keys(r).forEach(k => { if (k !== '_m' && !cols.includes(k)) cols.push(k); }));
    $v('#lv_table').innerHTML = st.rows.length ? `<table><tr><th>#</th><th>${lt('model')}</th>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>
      ${st.rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r._m || '')}</td>${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</table>` : '';
    const cv = $v('#lv_chart');
    if (!st.rows.length) { cv.classList.add('hidden'); return; }
    cv.classList.remove('hidden');
    const g = cv.getContext('2d'), w = cv.width, hh = cv.height, pad = 24;
    g.clearRect(0, 0, w, hh); g.strokeStyle = 'rgba(255,255,255,.3)'; g.fillStyle = '#e8eefc'; g.font = '11px sans-serif';
    g.beginPath(); g.moveTo(pad, 8); g.lineTo(pad, hh - pad); g.lineTo(w - 8, hh - pad); g.stroke();
    const series = cols.filter(c => c !== lt('time')), pal = ['#22d3ee', '#fbbf24', '#a78bfa', '#34d399', '#fb7185'], dash = [[], [6, 3], [2, 3], [8, 2, 2, 2], [4, 4]];
    series.forEach((c, si) => {
      const vals = st.rows.map(r => (typeof r[c] === 'number' ? r[c] : null));
      const nums = vals.filter(v => v !== null); if (!nums.length) return;
      const mn = Math.min(...nums), mx = Math.max(...nums), rg = (mx - mn) || 1;
      g.strokeStyle = pal[si % pal.length]; g.fillStyle = pal[si % pal.length]; g.setLineDash(dash[si % dash.length]); g.lineWidth = 2; g.beginPath();
      let first = true;
      vals.forEach((v, i) => {
        if (v === null) return;
        const x = pad + (st.rows.length === 1 ? (w - pad - 8) / 2 : i * (w - pad - 8) / (st.rows.length - 1)), y = hh - pad - ((v - mn) / rg) * (hh - pad - 14);
        if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
        g.fillRect(x - 3, y - 3, 6, 6);
      });
      g.stroke(); g.setLineDash([]);
      g.fillStyle = pal[si % pal.length]; g.fillText(c, pad + 4 + si * 70, hh - 8);
    });
  }
  function record() {
    const h = st.sel; if (!h) return;
    const u = h.userData, s = u.s, row = { _m: u.model.title };
    row[lt('time')] = +st.clock.toFixed(1);
    if (u.model.vars.length) u.model.vars.forEach(v => row[v.name] = +(+s.vars[v.name]).toFixed(2));
    else { row[lt('speed')] = +(+s.speed).toFixed(2); row[lt('explode')] = +(+s.explode).toFixed(2); row[lt('size')] = +(+s.size).toFixed(2); }
    st.rows.push(row); drawRows();
  }

  /* ----- التقاط الأجزاء + التحريك ----- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam);
    const hit = ray.intersectObjects(st.holders.flatMap(h => h.userData.meshes.filter(o => { let p = o, vis = true; while (p) { if (!p.visible) { vis = false; break; } p = p.parent; } return vis; })), false)[0];
    if (!hit) return null;
    let o = hit.object; while (o && !o.userData.isLabHolder) o = o.parent;
    if (!o) return null;
    let part = hit.object; while (part && !o.userData.parts.includes(part)) part = part.parent;
    return { holder: o, part: part || hit.object };
  }
  const dom = renderer.domElement; let down = null, drag = null;
  dom.addEventListener('pointerdown', e => {
    down = { x: e.clientX, y: e.clientY, moved: false };
    if (st.moveMode) {
      const p = pick(e);
      if (p) {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -p.holder.position.y), pt = new THREE.Vector3();
        ray.ray.intersectPlane(plane, pt);
        drag = { h: p.holder, plane, off: pt.sub(p.holder.position) }; controls.enabled = false; if (st.sel !== p.holder) select(p.holder);
      }
    }
  });
  dom.addEventListener('pointermove', e => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.moved = true;
    if (!drag) return;
    const r = dom.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, cam);
    const pt = new THREE.Vector3(); if (ray.ray.intersectPlane(drag.plane, pt)) { drag.h.position.x = pt.x - drag.off.x; drag.h.position.z = pt.z - drag.off.z; }
  });
  const up = e => {
    if (drag) { drag = null; controls.enabled = true; }
    if (down && !down.moved && e.type === 'pointerup') {
      const p = pick(e);
      if (p) { if (st.sel !== p.holder) select(p.holder); highlight(p.holder, p.part); } else highlight(st.sel, null);
    }
    down = null;
  };
  dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);

  /* ----- الأزرار ----- */
  $v('#lv_close').onclick = closeLab;
  $v('#lv_mode').onclick = e => { st.moveMode = !st.moveMode; e.currentTarget.textContent = st.moveMode ? lt('camMode') : lt('moveMode'); };
  $v('#lv_play').onclick = e => { st.playing = !st.playing; e.currentTarget.textContent = st.playing ? lt('play') : lt('resume'); };
  $v('#lv_reset').onclick = () => {
    while (st.holders.length > 1) { const h = st.holders.pop(); st.scene.remove(h); if (st.sel === h) st.sel = st.holders[0]; }
    const h0 = st.holders[0]; if (h0) {
      const u = h0.userData; u.s = { speed: 1, size: 1, explode: 0, vars: {} }; u.model.vars.forEach(v => u.s.vars[v.name] = v.val);
      h0.rotation.set(0, 0, 0); h0.position.set(0, h0.position.y, 0); u.parts.forEach(p => p.visible = true); u.meshes.forEach(o => o.userData.hl = false); labApply(h0); select(h0);
    }
    st.rows = []; drawRows(); st.playing = true; $v('#lv_play').textContent = lt('play'); st.light = .8; amb.intensity = .8; dl.intensity = 1; drawSliders(); resetCam();
    $v('#lv_label').textContent = lt('hintPick');
  };
  $v('#lv_addbtn').onclick = async () => {
    const mm = DB.lab.find(x => x.id === $v('#lv_addsel').value); if (!mm) return;
    try { const h = await labLoadHolder(st, mm); select(h); } catch (e) { toast(lt('loadErr')); }
  };
  $v('#lv_rec').onclick = record;
  const sv = $v('#lv_save');
  if (sv) sv.onclick = () => {
    const name = prompt(lt('expName'), m.title + ' — ' + new Date().toLocaleDateString()); if (!name) return;
    DB.labSaves.push({
      id: uid(), userId: session.id, modelId: m.id, name, ts: Date.now(), rows: st.rows,
      objs: st.holders.map(h => ({ modelId: h.userData.model.id, pos: h.position.toArray(), rotY: h.rotation.y, s: JSON.parse(JSON.stringify(h.userData.s)) })),
    });
    if (save()) toast(lt('expSaved'));
  };
  $v('#lv_finish').onclick = () => startQuiz();

  /* ----- الاختبار القصير ----- */
  function startQuiz() {
    const qs = m.quiz || [];
    if (!qs.length) { closeLab(); return; }
    const box3 = $v('#lv_quiz'); box3.classList.remove('hidden');
    let i = 0, score = 0;
    const showQ = () => {
      if (i >= qs.length) {
        let note = '';
        if (canStore && !st.quizDone) {
          DB.grades.push({ id: uid(), studentId: session.id, subject: SUBJ[m.subject] ? m.subject : 'science', title: lt('quizOf') + ': ' + m.title, score, max: qs.length, teacher: 'lab', date: new Date().toISOString().slice(0, 10) });
          save(); st.quizDone = true; note = `<p class="muted">${lt('toGrades')}</p>`;
        }
        box3.innerHTML = `<h2>${lt('quizTitle')}</h2><h3>${lt('score')}: ${score} / ${qs.length}</h3>${note}<button class="btn" id="lq_end">${lt('close')}</button>`;
        $v('#lq_end').onclick = closeLab; return;
      }
      const q = qs[i];
      box3.innerHTML = `<h3>${lt('quizTitle')} ${i + 1} / ${qs.length}</h3><h2 class="prose" style="text-align:center">${esc(q.q)}</h2>
        <div class="lab-opts">${q.o.map((o, k) => `<button class="btn ghost big" data-o="${k}">${esc(o)}</button>`).join('')}</div><div id="lq_fb"></div>`;
      box3.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
        const k = +b.dataset.o, ok = k === q.a; if (ok) score++;
        box3.querySelectorAll('[data-o]').forEach(x => { x.disabled = true; if (+x.dataset.o === q.a) x.style.outline = '3px solid var(--ok)'; });
        if (!ok) b.style.outline = '3px solid var(--bad)';
        $v('#lq_fb').innerHTML = `<div class="msg ${ok ? 'ok' : ''}"><b>${ok ? lt('correct') : lt('wrong')}</b><div class="prose">${esc(q.e || '')}</div></div><button class="btn" id="lq_next" style="margin-top:10px">${lt('next')}</button>`;
        if (typeof voiceOn !== 'undefined' && voiceOn && typeof speak === 'function') speak((ok ? lt('correct') : lt('wrong')) + '. ' + (q.e || ''));
        $v('#lq_next').onclick = () => { i++; showQ(); };
      });
    };
    showQ();
  }

  /* ----- حلقة العرض ----- */
  const clock = new THREE.Clock();
  (function loop() {
    st.raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .1);
    if (st.playing) {
      st.clock += dt;
      st.holders.forEach(h => {
        const u = h.userData;
        if (u.mixer) { u.mixer.timeScale = u.speedEff; u.mixer.update(dt); }
        else if (!(drag && drag.h === h)) h.rotation.y += dt * 0.6 * u.speedEff;
      });
    }
    controls.update(); renderer.render(scene, cam);
  })();

  /* ----- تحميل المجسم الأول (أو استرجاع تجربة محفوظة) ----- */
  drawAddSel();
  try {
    const first = restore && restore.objs && restore.objs[0] ? restore.objs[0] : null;
    const h0 = await labLoadHolder(st, m, first ? { pos: first.pos, rotY: first.rotY, s: first.s } : {});
    select(h0);
    if (restore) {
      st.rows = restore.rows || [];
      for (const o of (restore.objs || []).slice(1)) {
        const mm = DB.lab.find(x => x.id === o.modelId); if (!mm) continue;
        try { await labLoadHolder(st, mm, { pos: o.pos, rotY: o.rotY, s: o.s }); } catch (e) {}
      }
      select(h0); drawRows();
    }
  } catch (e) { $v('#lv_label').textContent = lt('loadErr'); }
}
